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
        const dashboardData = request.body as Omit<
          DashboardDocument,
          | "id"
          | "tenantId"
          | "createdAt"
          | "updatedAt"
          | "createdBy"
          | "updatedBy"
        >;

        // TODO: รับ userId จาก JWT token
        const userId = "admin"; // Placeholder

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

        const result = await DashboardService.createDashboard(
          {
            ...dashboardData,
            tenantId,
          },
          userId,
          customId // ส่ง custom ID ไปด้วย
        );

        if (!result.success) {
          return reply.code(400).send(result);
        }

        return reply.code(201).send(result);
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
}
