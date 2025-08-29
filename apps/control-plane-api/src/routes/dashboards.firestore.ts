/**
 * Updated Dashboard API Routes สำหรับ Firestore
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  DashboardService,
  WidgetService,
  TenantService,
} from "../services/firestore.service";
import {
  DashboardDocument,
  WidgetDocument,
  WidgetConfig,
} from "../types/firestore";
import { db } from "../config/firebase-real.js";

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/tenants/:tenantId/dashboards - ดึงรายการ dashboards ของ tenant
  fastify.get(
    "/tenants/:tenantId/dashboards",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId } = request.params as { tenantId: string };
        const query = request.query as {
          page?: string;
          pageSize?: string;
        };

        const page = parseInt(query.page || "1", 10);
        const pageSize = parseInt(query.pageSize || "20", 10);

        const result = await DashboardService.getDashboardsByTenant(tenantId, {
          page,
          pageSize,
        });

        return reply.code(200).send(result);
      } catch (error) {
        console.error("Error fetching dashboards:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /api/tenants/:tenantId/dashboards/:dashboardId - ดึงข้อมูล dashboard ตาม ID
  fastify.get(
    "/tenants/:tenantId/dashboards/:dashboardId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };

        // Handle "new" route - return empty dashboard template
        if (dashboardId === "new") {
          // ดึงข้อมูล tenant สำหรับ "new" route
          const tenantResult = await TenantService.getTenant(tenantId);

          return reply.code(200).send({
            success: true,
            data: {
              id: "new",
              name: "New Dashboard",
              slug: "new-dashboard",
              tenantId,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: "admin",
              updatedBy: "admin",
              tenant: tenantResult.success
                ? {
                    id: tenantResult.data?.id,
                    name: tenantResult.data?.name,
                    slug: tenantResult.data?.slug,
                  }
                : null,
              visualConfig: {
                layout: {
                  columns: 24,
                  rows: 16,
                  gridSize: 40,
                },
                widgets: [],
              },
            },
            timestamp: new Date().toISOString(),
          });
        }

        const result = await DashboardService.getDashboard(dashboardId);

        if (!result.success) {
          return reply.code(404).send(result);
        }

        // ตรวจสอบว่า dashboard นี้เป็นของ tenant นี้
        if (result.data?.tenantId !== tenantId) {
          return reply.code(403).send({
            success: false,
            error: "Access denied",
            timestamp: new Date().toISOString(),
          });
        }

        // ดึงข้อมูล tenant เพื่อส่งกลับด้วย
        const tenantResult = await TenantService.getTenant(tenantId);

        // เพิ่ม tenant info ใน response
        const dashboardWithTenant = {
          ...result.data,
          tenant: tenantResult.success
            ? {
                id: tenantResult.data?.id,
                name: tenantResult.data?.name,
                slug: tenantResult.data?.slug,
              }
            : null,
        };

        return reply.code(200).send({
          ...result,
          data: dashboardWithTenant,
        });
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // POST /api/tenants/:tenantId/dashboards - สร้าง dashboard ใหม่
  fastify.post(
    "/tenants/:tenantId/dashboards",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId } = request.params as { tenantId: string };
        const requestBody = request.body as any;

        // TODO: รับ userId จาก JWT token
        const userId = "admin"; // Placeholder

        // ตรวจสอบว่าเป็น dashboard-as-code format หรือไม่
        const isDashboardAsCode =
          requestBody.apiVersion && requestBody.kind === "Dashboard";

        // ตรวจสอบว่าเป็น schema v1.3 format หรือไม่
        const isSchemaV13 = requestBody.schemaVersion === "1.3";

        let dashboardData: Omit<
          DashboardDocument,
          | "id"
          | "tenantId"
          | "createdAt"
          | "updatedAt"
          | "createdBy"
          | "updatedBy"
        >;

        if (isSchemaV13) {
          // Handle schema v1.3 format
          console.log(`🔍 Processing schema v1.3 dashboard:`, {
            name: requestBody.dashboardName || requestBody.name,
            widgets: requestBody.widgets?.length || 0,
            hasTransforms: !!requestBody.transforms,
            hasSettings: !!requestBody.settings,
          });

          const config = requestBody;
          const slug = (config.dashboardName || config.name || "dashboard")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          dashboardData = {
            name:
              config.dashboardName || config.name || "Schema v1.3 Dashboard",
            slug: slug,
            description: config.description || "",
            isPublic: false,
            settings: {
              refreshInterval: 30000,
              theme: "light" as const,
              autoRefresh: true,
            },
            status: "published" as const,
            tags: [],
            // เก็บ schema v1.3 config ใน visualConfig
            visualConfig: {
              layout: {
                columns: config.layout?.columns || 12,
                rows: 10,
                gridSize: config.layout?.rowHeight || 50,
              },
              widgets: config.widgets || [],
            },
            // เก็บ schema v1.3 config ใน manifestContent
            manifestContent: JSON.stringify(config),
          };
        } else if (isDashboardAsCode) {
          // แปลง dashboard-as-code format เป็น DashboardDocument format
          const config = requestBody;
          const slug = config.metadata.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          dashboardData = {
            name: config.metadata.name,
            slug: slug,
            description: config.metadata.description || "",
            isPublic: false,
            settings: {
              refreshInterval: 30000,
              theme: "light" as const,
              autoRefresh: true,
            },
            status: "published" as const,
            tags: [],
            // เก็บ dashboard-as-code config ใน visualConfig
            visualConfig: {
              layout: {
                columns: config.spec.layout?.columns || 12,
                rows: 10,
                gridSize: 50,
              },
              widgets: config.spec.widgets || [],
            },
            // เก็บ dashboard-as-code config ใน manifestContent
            manifestContent: JSON.stringify(config),
          };
        } else {
          // ใช้ format เดิม
          dashboardData = requestBody as Omit<
            DashboardDocument,
            | "id"
            | "tenantId"
            | "createdAt"
            | "updatedAt"
            | "createdBy"
            | "updatedBy"
          >;
        }

        // ดึงข้อมูล tenant เพื่อใช้ชื่อในการสร้าง dashboard ID
        const tenantResult = await TenantService.getTenant(tenantId);
        if (!tenantResult.success) {
          return reply.code(404).send({
            success: false,
            error: "Tenant not found",
            timestamp: new Date().toISOString(),
          });
        }

        const tenantName = tenantResult.data?.name || "unknown";
        const dashboardName = dashboardData.name || "New Dashboard";

        // สร้าง custom ID โดยรวม tenant name กับ dashboard name
        const customId = `${tenantName}-${dashboardName}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // เตรียมข้อมูล dashboard เพื่อบันทึก
        const finalDashboardData = {
          id: customId,
          tenantId,
          ...dashboardData,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        };

        // บันทึกลง Firestore tenant subcollection โดยตรง
        const dashboardRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(customId);

        await dashboardRef.set(finalDashboardData);

        // Return success response
        return reply.code(201).send({
          success: true,
          data: finalDashboardData,
          message: "Dashboard created successfully",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error creating dashboard:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // PUT /api/tenants/:tenantId/dashboards/:dashboardId - อัปเดต dashboard
  fastify.put(
    "/tenants/:tenantId/dashboards/:dashboardId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };
        const updates = request.body as Partial<DashboardDocument>;

        // TODO: รับ userId จาก JWT token
        const userId = "admin"; // Placeholder

        // ตรวจสอบว่า dashboard นี้เป็นของ tenant นี้
        const existingDashboard =
          await DashboardService.getDashboard(dashboardId);
        if (
          !existingDashboard.success ||
          existingDashboard.data?.tenantId !== tenantId
        ) {
          return reply.code(403).send({
            success: false,
            error: "Access denied",
            timestamp: new Date().toISOString(),
          });
        }

        const result = await DashboardService.updateDashboard(
          dashboardId,
          updates,
          userId
        );

        if (!result.success) {
          return reply.code(400).send(result);
        }

        return reply.code(200).send(result);
      } catch (error) {
        console.error("Error updating dashboard:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // DELETE /api/tenants/:tenantId/dashboards/:dashboardId - ลบ dashboard
  fastify.delete(
    "/tenants/:tenantId/dashboards/:dashboardId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };

        // ตรวจสอบว่า dashboard นี้เป็นของ tenant นี้
        const existingDashboard =
          await DashboardService.getDashboard(dashboardId);
        if (
          !existingDashboard.success ||
          existingDashboard.data?.tenantId !== tenantId
        ) {
          return reply.code(403).send({
            success: false,
            error: "Access denied",
            timestamp: new Date().toISOString(),
          });
        }

        const result = await DashboardService.deleteDashboard(dashboardId);

        if (!result.success) {
          return reply.code(404).send(result);
        }

        return reply.code(200).send(result);
      } catch (error) {
        console.error("Error deleting dashboard:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // ===== Widget Management Routes =====

  // GET /api/tenants/:tenantId/dashboards/:dashboardId/widgets - ดึงรายการ widgets ของ dashboard
  fastify.get(
    "/tenants/:tenantId/dashboards/:dashboardId/widgets",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };

        // ตรวจสอบว่า dashboard นี้เป็นของ tenant นี้
        const existingDashboard =
          await DashboardService.getDashboard(dashboardId);
        if (
          !existingDashboard.success ||
          existingDashboard.data?.tenantId !== tenantId
        ) {
          return reply.code(403).send({
            success: false,
            error: "Access denied",
            timestamp: new Date().toISOString(),
          });
        }

        const result = await WidgetService.getWidgetsByDashboard(dashboardId);

        return reply.code(200).send(result);
      } catch (error) {
        console.error("Error fetching widgets:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // ===== Metadata Routes สำหรับ Visual Builder =====

  // GET /api/tenants/:tenantId/dashboards/:dashboardId/metadata - ดึง metadata สำหรับ Visual Builder
  fastify.get(
    "/tenants/:tenantId/dashboards/:dashboardId/metadata",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };

        // Handle "new" route - return empty metadata template
        if (dashboardId === "new") {
          return reply.code(200).send({
            success: true,
            data: {
              id: "new",
              version: 1,
              metadata: {
                dashboard: {
                  id: "new",
                  name: "New Dashboard",
                  slug: "new-dashboard",
                  tenantId,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: "admin",
                  updatedBy: "admin",
                },
                widgets: [],
                config: {
                  layout: {
                    columns: 24,
                    rows: 16,
                    gridSize: 40,
                  },
                },
              },
              status: "draft",
              createdAt: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          });
        }

        // ดึงข้อมูล dashboard
        const dashboardResult =
          await DashboardService.getDashboard(dashboardId);
        if (
          !dashboardResult.success ||
          dashboardResult.data?.tenantId !== tenantId
        ) {
          return reply.code(403).send({
            success: false,
            error: "Access denied",
            timestamp: new Date().toISOString(),
          });
        }

        // ดึงข้อมูล widgets
        const widgetsResult =
          await WidgetService.getWidgetsByDashboard(dashboardId);

        // สร้าง metadata format สำหรับ Visual Builder
        const metadata = {
          dashboard: dashboardResult.data,
          widgets: widgetsResult.success
            ? widgetsResult.data?.map((widget) => ({
                id: widget.id,
                type: widget.type,
                title: widget.displayConfig.title,
                x: widget.position.x,
                y: widget.position.y,
                width: widget.position.width,
                height: widget.position.height,
                config: {
                  dataSourceType: widget.dataConfig.dataSourceType,
                  query: widget.dataConfig.query,
                  params: widget.dataConfig.params,
                  refreshInterval: widget.dataConfig.refreshInterval,
                  displayOptions: widget.displayConfig,
                },
              }))
            : [],
        };

        return reply.code(200).send({
          success: true,
          data: { metadata },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error fetching metadata:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // PUT /api/tenants/:tenantId/dashboards/:dashboardId/metadata - อัปเดต metadata จาก Visual Builder
  fastify.put(
    "/tenants/:tenantId/dashboards/:dashboardId/metadata",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };
        const { metadata, createdBy } = request.body as {
          metadata: any;
          createdBy: string;
        };

        // ตรวจสอบว่า dashboard นี้เป็นของ tenant นี้
        const existingDashboard =
          await DashboardService.getDashboard(dashboardId);
        if (
          !existingDashboard.success ||
          existingDashboard.data?.tenantId !== tenantId
        ) {
          return reply.code(403).send({
            success: false,
            error: "Access denied",
            timestamp: new Date().toISOString(),
          });
        }

        // อัปเดต Dashboard với visual config
        const dashboardUpdate = await DashboardService.updateDashboard(
          dashboardId,
          {
            visualConfig: {
              layout: metadata.config?.layout || {
                columns: 24,
                rows: 16,
                gridSize: 40,
              },
              widgets: metadata.widgets || [],
            },
          },
          createdBy
        );

        if (!dashboardUpdate.success) {
          return reply.code(400).send(dashboardUpdate);
        }

        return reply.code(200).send({
          success: true,
          message: "Metadata updated successfully",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating metadata:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /api/tenants/:tenantId/dashboards/:dashboardId/manifest - Get dashboard manifest สำหรับ onprem-viewer
  fastify.get(
    "/tenants/:tenantId/dashboards/:dashboardId/manifest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };

        // Check for Authorization header (License validation)
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return reply.status(401).send({
            success: false,
            error: "Missing or invalid authorization header",
          });
        }

        const licenseKey = authHeader.replace("Bearer ", "");
        console.log(`License validation for: ${licenseKey}`);

        // ดึงข้อมูลจาก subcollections ที่ถูกต้อง
        const manifestRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId)
          .collection("config")
          .doc("manifest");

        const columnsRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId)
          .collection("metadata")
          .doc("columns");

        // Fetch both documents in parallel
        const [manifestDoc, columnsDoc] = await Promise.all([
          manifestRef.get(),
          columnsRef.get(),
        ]);

        console.log(`🔍 Subcollection manifest exists: ${manifestDoc.exists}`);
        console.log(`🔍 Columns metadata exists: ${columnsDoc.exists}`);

        let manifest;

        if (manifestDoc.exists) {
          // ใช้ข้อมูลจาก subcollection /config/manifest เมื่อมีอยู่
          console.log(`📋 Using data from subcollection /config/manifest`);
          const manifestData = manifestDoc.data();

          if (manifestData?.manifestContent) {
            console.log(
              `🔍 manifestContent from subcollection length:`,
              manifestData.manifestContent.length
            );
            const dashboardConfig = JSON.parse(manifestData.manifestContent);
            console.log(`🔍 GET manifest: Config from subcollection:`, {
              schemaVersion: dashboardConfig.schemaVersion,
              hasTransforms: !!dashboardConfig.transforms,
              transformsLength: dashboardConfig.transforms?.length || 0,
            });

            if (dashboardConfig.schemaVersion === "1.3") {
              console.log(
                `📋 Processing schema v1.3 config from subcollection`
              );
              console.log(
                `🧬 Transforms in subcollection config:`,
                dashboardConfig.transforms?.length || 0
              );

              manifest = {
                schemaVersion: dashboardConfig.schemaVersion,
                dashboardId: dashboardId,
                dashboardName:
                  dashboardConfig.dashboardName || dashboardConfig.name,
                description: dashboardConfig.description,
                version: dashboardConfig.version || 1,
                targetTeams: dashboardConfig.targetTeams || ["default"],
                layout: dashboardConfig.layout || {
                  type: "grid",
                  columns: 12,
                  rowHeight: 50,
                },
                widgets: dashboardConfig.widgets || [],
                dataSources: dashboardConfig.dataSources || [],
                transforms: dashboardConfig.transforms || undefined,
                analytics: dashboardConfig.analytics || undefined,
                settings: dashboardConfig.settings || undefined,
                formatters: dashboardConfig.formatters || undefined,
                theme: dashboardConfig.theme || undefined,
              };
            } else {
              // Handle older format from subcollection
              manifest = {
                schemaVersion: dashboardConfig.apiVersion || "flexboard/v1",
                dashboardId: dashboardId,
                dashboardName: dashboardConfig.metadata?.name,
                description: dashboardConfig.metadata?.description,
                version: 1,
                targetTeams: ["default"],
                layout: {
                  type: "grid",
                  columns: dashboardConfig.spec?.layout?.columns || 12,
                  rowHeight: 50,
                },
                widgets: dashboardConfig.spec?.widgets || [],
                dataSources: dashboardConfig.spec?.dataSources || [],
                transforms: dashboardConfig.transforms || undefined,
              };
            }
          } else {
            // Subcollection exists but no manifestContent - use basic structure
            manifest = {
              schemaVersion: "flexboard/v1",
              dashboardId: dashboardId,
              dashboardName: manifestData?.dashboardName || "Dashboard",
              description: manifestData?.description || "Dashboard description",
              version: 1,
              targetTeams: ["default"],
              layout: { type: "grid", columns: 12, rowHeight: 50 },
              widgets: [],
              dataSources: [],
            };
          }

          console.log(
            `🚀 About to send response from subcollection with transforms:`,
            {
              hasTransforms: !!manifest.transforms,
              transformsCount: manifest.transforms?.length || 0,
              manifestKeys: Object.keys(manifest),
            }
          );

          return reply.send({
            success: true,
            data: manifest,
          });
        } else if (!manifestDoc.exists) {
          // ถ้าไม่มี subcollection manifest ให้ลองดึงจาก document หลัก
          const dashboardRef = db
            .collection("tenants")
            .doc(tenantId)
            .collection("dashboards")
            .doc(dashboardId);

          const dashboardDoc = await dashboardRef.get();

          if (!dashboardDoc.exists) {
            return reply.status(404).send({
              success: false,
              error: "Dashboard not found",
            });
          }

          const dashboardData = dashboardDoc.data();

          console.log(
            `📊 Dashboard data keys:`,
            Object.keys(dashboardData || {})
          );
          console.log(
            `📋 Has manifestContent:`,
            !!dashboardData?.manifestContent
          );

          // สร้าง manifest จากข้อมูลใน document หลัก
          if (dashboardData?.manifestContent) {
            console.log(
              `🔍 manifestContent length:`,
              dashboardData.manifestContent.length
            );
            // ถ้ามี manifestContent (dashboard-as-code format)
            const dashboardConfig = JSON.parse(dashboardData.manifestContent);
            console.log(`🔍 GET manifest: Detected config format:`, {
              schemaVersion: dashboardConfig.schemaVersion,
              apiVersion: dashboardConfig.apiVersion,
              hasSpec: !!dashboardConfig.spec,
              hasWidgets: !!dashboardConfig.widgets,
              hasTransforms: !!dashboardConfig.transforms,
              transformsLength: dashboardConfig.transforms?.length || 0,
            });

            // Check if this is schema v1.3 format
            if (dashboardConfig.schemaVersion === "1.3") {
              console.log(`📋 GET manifest: Processing schema v1.3 config`);
              console.log(
                `🧬 Transforms in config:`,
                dashboardConfig.transforms?.length || 0
              );

              // For schema v1.3, return the config directly as manifest
              manifest = {
                schemaVersion: dashboardConfig.schemaVersion,
                dashboardId: dashboardId,
                dashboardName:
                  dashboardConfig.dashboardName ||
                  dashboardConfig.name ||
                  dashboardData.name,
                description:
                  dashboardConfig.description || dashboardData.description,
                version: dashboardConfig.version || 1,
                targetTeams: dashboardConfig.targetTeams || ["default"],
                layout: dashboardConfig.layout || {
                  type: "grid",
                  columns: 12,
                  rowHeight: 50,
                },
                widgets: dashboardConfig.widgets || [],
                dataSources: dashboardConfig.dataSources || [],
                transforms: dashboardConfig.transforms || undefined,
                analytics: dashboardConfig.analytics || undefined,
                settings: dashboardConfig.settings || undefined,
                formatters: dashboardConfig.formatters || undefined,
                theme: dashboardConfig.theme || undefined,
              };

              console.log(
                `🎯 Final manifest transforms:`,
                manifest.transforms?.length || 0
              );
            } else {
              // Handle older dashboard-as-code format
              manifest = {
                schemaVersion: dashboardConfig.apiVersion || "flexboard/v1",
                dashboardId: dashboardId,
                dashboardName:
                  dashboardConfig.metadata?.name || dashboardData.name,
                description:
                  dashboardConfig.metadata?.description ||
                  dashboardData.description,
                version: 1,
                targetTeams: ["default"],
                layout: {
                  type: "grid",
                  columns: dashboardConfig.spec?.layout?.columns || 12,
                  rowHeight: 50,
                },
                widgets: dashboardConfig.spec?.widgets || [],
                dataSources: dashboardConfig.spec?.dataSources || [],
              };
            }
          } else {
            // ถ้าเป็น format เดิม
            manifest = {
              schemaVersion: "flexboard/v1",
              dashboardId: dashboardId,
              dashboardName: dashboardData?.name || "Dashboard",
              description:
                dashboardData?.description || "Dashboard description",
              version: 1,
              targetTeams: ["default"],
              layout: {
                type: "grid",
                columns: dashboardData?.visualConfig?.layout?.columns || 12,
                rowHeight: 50,
              },
              widgets: dashboardData?.visualConfig?.widgets || [],
              dataSources: [],
            };
          }

          console.log(`🚀 About to send response with transforms:`, {
            hasTransforms: !!manifest.transforms,
            transformsCount: manifest.transforms?.length || 0,
            manifestKeys: Object.keys(manifest),
          });

          return reply.send({
            success: true,
            data: manifest,
          });
        }

        // ถ้ามี subcollection manifest ให้ใช้ข้อมูลจากนั้น
        const manifestData = manifestDoc.data();
        const columnsData = columnsDoc.exists ? columnsDoc.data() : null;

        // Extract data from the nested 'data' field in the manifest document
        const manifestConfig = manifestData?.data || manifestData;

        // Generate layout for all widgets if missing
        const generateLayout = (widgets: any[]) => {
          const existingLayout = manifestConfig?.layout?.desktop || [];
          const existingWidgetIds = new Set(
            existingLayout.map((item: any) => item.widgetId)
          );

          let currentY = 0;
          const generatedLayout = [...existingLayout];

          // Find max Y from existing layout
          if (existingLayout.length > 0) {
            currentY = Math.max(
              ...existingLayout.map((item: any) => item.y + item.height)
            );
          }

          // Add missing widgets to layout
          widgets.forEach((widget: any) => {
            if (!existingWidgetIds.has(widget.id)) {
              const widgetType = widget.type;
              let width = 12,
                height = 8;

              // Set appropriate size based on widget type
              switch (widgetType) {
                case "kpi":
                  width = 6;
                  height = 4;
                  break;
                case "bar":
                case "line":
                  width = 12;
                  height = 8;
                  break;
                case "pareto":
                case "stackedBar":
                  width = 12;
                  height = 10;
                  break;
                case "table":
                  width = 12;
                  height = 12;
                  break;
                case "actionBar":
                  width = 12;
                  height = 2;
                  break;
                default:
                  width = 12;
                  height = 8;
              }

              generatedLayout.push({
                widgetId: widget.id,
                x: 0,
                y: currentY,
                width,
                height,
              });

              currentY += height;
            }
          });

          return generatedLayout;
        };

        // Extract manifest data
        manifest = {
          schemaVersion: manifestConfig?.schemaVersion || "1.0",
          dashboardId: dashboardId,
          dashboardName: manifestConfig?.dashboardName || "Dashboard",
          description: manifestConfig?.description || "Dashboard description",
          version: manifestConfig?.version || 1,
          targetTeams: manifestConfig?.targetTeams || ["default"],
          layout: {
            type: "grid",
            columns: manifestConfig?.layout?.columns || 12,
            rowHeight: manifestConfig?.layout?.rowHeight || 50,
            desktop: generateLayout(manifestConfig?.widgets || []),
          },
          widgets: manifestConfig?.widgets || [],
          dataSources: manifestConfig?.dataSources || [],
          // Add available columns for file upload validation
          availableColumns: columnsData?.columns || [],
        };

        return reply.send({
          success: true,
          data: manifest,
        });
      } catch (error) {
        console.error("Error fetching dashboard manifest:", error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch dashboard manifest",
        });
      }
    }
  );

  // GET /api/tenants/:tenantId/dashboards/:dashboardId/config/manifest - Get dashboard manifest for Control Plane UI
  fastify.get(
    "/tenants/:tenantId/dashboards/:dashboardId/config/manifest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };

        console.log(
          `🔍 Control Plane UI GET manifest for: ${tenantId}/${dashboardId}`
        );

        // ดึงข้อมูลจาก subcollections
        const manifestRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId)
          .collection("config")
          .doc("manifest");

        const manifestDoc = await manifestRef.get();

        if (!manifestDoc.exists) {
          console.log(
            `❌ No manifest found in subcollection for ${tenantId}/${dashboardId}`
          );
          return reply.status(404).send({
            success: false,
            error: "Dashboard manifest not found",
          });
        }

        const manifestData = manifestDoc.data();
        console.log(`✅ Found manifest in subcollection:`, {
          hasManifestContent: !!manifestData?.manifestContent,
          keys: Object.keys(manifestData || {}),
        });

        // Return raw manifest content for the editor
        const manifestContent = manifestData?.manifestContent;

        if (!manifestContent) {
          console.log(
            `❌ No manifestContent field found in ${tenantId}/${dashboardId}`
          );
          return reply.status(404).send({
            success: false,
            error: "Manifest content not found",
          });
        }

        return reply.status(200).send({
          success: true,
          data: {
            manifestContent: manifestContent,
          },
        });
      } catch (error) {
        console.error(
          "❌ Error fetching dashboard manifest for Control Plane UI:",
          error
        );
        return reply.status(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // PUT /api/tenants/:tenantId/dashboards/:dashboardId/config/manifest - Update dashboard manifest
  fastify.put(
    "/tenants/:tenantId/dashboards/:dashboardId/config/manifest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };
        const { manifestContent } = request.body as {
          manifestContent: string;
        };

        if (!manifestContent) {
          return reply.status(400).send({
            success: false,
            error: "manifestContent is required",
          });
        }

        // Parse and validate the manifest
        let parsedManifest;
        try {
          parsedManifest = JSON.parse(manifestContent);
        } catch (parseError) {
          return reply.status(400).send({
            success: false,
            error: "Invalid JSON in manifestContent",
          });
        }

        // Check if this is schema v1.3 format
        const isSchemaV13 = parsedManifest.schemaVersion === "1.3";

        // Always save to config/manifest subcollection for proper Firestore structure
        const manifestRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId)
          .collection("config")
          .doc("manifest");

        await manifestRef.set({
          data: parsedManifest,
          manifestContent: manifestContent,
          schemaVersion: parsedManifest.schemaVersion || "1.0",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "system",
          updatedBy: "admin", // TODO: Get from JWT
        });

        // Also update main dashboard document with manifestContent for backward compatibility
        if (isSchemaV13) {
          const dashboardRef = db
            .collection("tenants")
            .doc(tenantId)
            .collection("dashboards")
            .doc(dashboardId);

          const dashboardDoc = await dashboardRef.get();
          if (dashboardDoc.exists) {
            await dashboardRef.update({
              manifestContent: manifestContent,
              updatedAt: new Date(),
              updatedBy: "admin", // TODO: Get from JWT
            });
          }
        }

        console.log(
          `✅ Saved manifest to config/manifest subcollection for dashboard: ${dashboardId}`
        );

        return reply.send({
          success: true,
          message: "Dashboard manifest updated successfully",
        });
      } catch (error) {
        console.error("Error updating dashboard manifest:", error);
        return reply.status(500).send({
          success: false,
          error: "Failed to update dashboard manifest",
        });
      }
    }
  );
}
