/**
 * Dashboard as Code API Route
 * Create dashboards using JSON configuration
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../config/firebase-real.js";

interface DashboardAsCodeRequest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    slug?: string;
    description?: string;
    template?: string;
    dataSource?: {
      type: string;
      mysql?: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        table: string;
      };
      sampleData?: any;
    };
  };
  spec: {
    layout: {
      columns: number;
      rows: number;
      gridSize: number;
    };
    widgets: Array<{
      id: string;
      type: "metric" | "chart" | "table";
      title: string;
      position: {
        x: number;
        y: number;
        w: number;
        h: number;
      };
      config?: any;
    }>;
    dataSources?: Array<{
      id: string;
      type: string;
      config: any;
      queries?: any;
    }>;
  };
}

export default async function dashboardAsCodeRoutes(fastify: FastifyInstance) {
  // POST /tenants/:tenantId/dashboard-as-code - Create dashboard as code (Frontend compatible)
  fastify.post(
    "/tenants/:tenantId/dashboard-as-code",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId } = request.params as { tenantId: string };
        const dashboardConfig = request.body as DashboardAsCodeRequest;

        // Validate required fields
        if (!dashboardConfig.metadata?.name || !dashboardConfig.spec) {
          return reply.status(400).send({
            success: false,
            message: "Dashboard metadata.name and spec are required",
          });
        }

        // Generate dashboard ID
        const dashboardId =
          dashboardConfig.metadata.slug ||
          dashboardConfig.metadata.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");

        // Prepare dashboard document
        const dashboardData = {
          id: dashboardId,
          tenantId,
          name: dashboardConfig.metadata.name,
          description: dashboardConfig.metadata.description || "",
          template: dashboardConfig.metadata.template || "blank",
          dashboardAsCode: JSON.stringify(dashboardConfig),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "system",
          updatedBy: "system",
        };

        // Save to Firestore
        await db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId)
          .set(dashboardData);

        return reply.send({
          success: true,
          message: "Dashboard as code created successfully",
          data: {
            id: dashboardId,
            tenantId,
            name: dashboardConfig.metadata.name,
            template: dashboardConfig.metadata.template,
          },
        });
      } catch (error) {
        console.error("Error creating dashboard as code:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // GET /api/dashboard-as-code/tenants/:tenantId/dashboards - List all dashboards for tenant
  fastify.get(
    "/tenants/:tenantId/dashboards",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId } = request.params as { tenantId: string };

        const dashboardsRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards");

        const snapshot = await dashboardsRef.get();

        if (snapshot.empty) {
          return reply.send({
            success: true,
            data: [],
            message: "No dashboards found for tenant",
          });
        }

        const dashboards = snapshot.docs.map((doc: any) => ({
          dashboardId: doc.id,
          ...doc.data(),
        }));

        return reply.send({
          success: true,
          data: dashboards,
          count: dashboards.length,
        });
      } catch (error) {
        console.error("Error listing dashboards:", error);
        return reply.status(500).send({
          success: false,
          error: "Failed to list dashboards",
        });
      }
    }
  );

  // GET /api/dashboard-as-code/tenants/:tenantId/dashboards/:dashboardId - Get specific dashboard
  fastify.get(
    "/tenants/:tenantId/dashboards/:dashboardId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };

        const dashboardRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId);

        const doc = await dashboardRef.get();

        if (!doc.exists) {
          return reply.status(404).send({
            success: false,
            message: "Dashboard not found",
          });
        }

        const data = doc.data();
        return reply.send({
          success: true,
          data: {
            id: doc.id,
            ...data,
            // Parse dashboardAsCode if it's a string
            dashboardAsCode:
              typeof data?.dashboardAsCode === "string"
                ? JSON.parse(data.dashboardAsCode)
                : data?.dashboardAsCode,
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
          },
        });
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // PUT /api/dashboard-as-code/tenants/:tenantId/dashboards/:dashboardId - Update dashboard
  fastify.put(
    "/tenants/:tenantId/dashboards/:dashboardId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };
        const updates = request.body as Partial<DashboardAsCodeRequest>;

        const dashboardRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId);

        // Check if dashboard exists
        const doc = await dashboardRef.get();
        if (!doc.exists) {
          return reply.status(404).send({
            success: false,
            message: "Dashboard not found",
          });
        }

        // Prepare update data
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        if (updates.metadata?.name) updateData.name = updates.metadata.name;
        if (updates.metadata?.description !== undefined)
          updateData.description = updates.metadata.description;
        if (updates.spec) {
          updateData.dashboardAsCode = JSON.stringify(updates);
        }

        // Update in Firestore
        await dashboardRef.update(updateData);

        return reply.send({
          success: true,
          message: "Dashboard updated successfully",
        });
      } catch (error) {
        console.error("Error updating dashboard:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // DELETE /api/dashboard-as-code/tenants/:tenantId/dashboards/:dashboardId - Delete dashboard
  fastify.delete(
    "/tenants/:tenantId/dashboards/:dashboardId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId, dashboardId } = request.params as {
          tenantId: string;
          dashboardId: string;
        };

        const dashboardRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId);

        // Check if dashboard exists
        const doc = await dashboardRef.get();
        if (!doc.exists) {
          return reply.status(404).send({
            success: false,
            message: "Dashboard not found",
          });
        }

        // Delete from Firestore
        await dashboardRef.delete();

        return reply.send({
          success: true,
          message: "Dashboard deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting dashboard:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // GET /api/dashboard-as-code/tenants/:tenantId/dashboards/:dashboardId/manifest - Get dashboard manifest
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

        // TODO: Add proper license validation here
        // For now, accept demo-license-key or any license key for testing
        console.log(`License validation for: ${licenseKey}`);

        // Fetch manifest from config/manifest document
        const manifestRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId)
          .collection("config")
          .doc("manifest");

        // Fetch columns metadata from metadata/columns document
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

        if (!manifestDoc.exists) {
          return reply.status(404).send({
            success: false,
            error: "Dashboard manifest not found",
          });
        }

        const manifestData = manifestDoc.data();
        const columnsData = columnsDoc.exists ? columnsDoc.data() : null;

        // Extract data from the nested 'data' field in the manifest document
        const manifestConfig = manifestData?.data || manifestData;

        // Extract manifest data
        const manifest = {
          schemaVersion: manifestConfig?.schemaVersion || "1.0",
          dashboardId: dashboardId,
          dashboardName: manifestConfig?.dashboardName || "Dashboard",
          description: manifestConfig?.description || "Dashboard description",
          version: manifestConfig?.version || 1,
          targetTeams: manifestConfig?.targetTeams || ["default"],
          layout: manifestConfig?.layout || {
            type: "grid",
            columns: 12,
            rowHeight: 50,
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
}
