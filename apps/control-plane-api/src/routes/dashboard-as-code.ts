/**
 * Dashboard as Code API Route
 * Create dashboards using JSON configuration
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../config/firebase-real.js";

interface CreateDashboardRequest {
  name: string;
  slug?: string;
  description?: string;
  visualConfig: {
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
      // Widget-specific properties
      value?: string;
      change?: string;
      trend?: string;
      chartType?: string;
      data?: any[];
      columns?: string[];
    }>;
  };
}

export default async function dashboardAsCodeRoutes(fastify: FastifyInstance) {
  // POST /api/dashboard-as-code/tenants/:tenantId/dashboards - Create dashboard as code
  fastify.post(
    "/tenants/:tenantId/dashboards",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { tenantId } = request.params as { tenantId: string };
        const dashboardConfig = request.body as CreateDashboardRequest;

        // Validate required fields
        if (!dashboardConfig.name || !dashboardConfig.visualConfig) {
          return reply.status(400).send({
            success: false,
            message: "Dashboard name and visualConfig are required",
          });
        }

        // Generate slug if not provided
        const slug =
          dashboardConfig.slug ||
          dashboardConfig.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        // Create dashboard ID
        const dashboardId = `${slug}-${Date.now()}`;

        // Prepare dashboard data
        const dashboardData = {
          id: dashboardId,
          name: dashboardConfig.name,
          slug,
          description: dashboardConfig.description || "",
          tenantId,
          isActive: true,
          createdBy: "dashboard-as-code",
          updatedBy: "dashboard-as-code",
          // Store visualConfig as JSON string to avoid Firestore nested object issues
          visualConfig: JSON.stringify(dashboardConfig.visualConfig),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save to Firestore subcollection
        const dashboardRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards")
          .doc(dashboardId);

        await dashboardRef.set(dashboardData);

        // Return success response with parsed visualConfig
        return reply.send({
          success: true,
          data: {
            ...dashboardData,
            visualConfig: dashboardConfig.visualConfig, // Return as object
          },
          message: "Dashboard created successfully",
        });
      } catch (error) {
        console.error("Error creating dashboard:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
          error: error instanceof Error ? error.message : "Unknown error",
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
            // Parse visualConfig if it's a string
            visualConfig:
              typeof data?.visualConfig === "string"
                ? JSON.parse(data.visualConfig)
                : data?.visualConfig,
            createdAt: data?.createdAt?.toDate().toISOString(),
            updatedAt: data?.updatedAt?.toDate().toISOString(),
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
        const updates = request.body as Partial<CreateDashboardRequest>;

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
          updatedAt: new Date(),
          updatedBy: "dashboard-as-code",
        };

        if (updates.name) updateData.name = updates.name;
        if (updates.description !== undefined)
          updateData.description = updates.description;
        if (updates.visualConfig) {
          updateData.visualConfig = JSON.stringify(updates.visualConfig);
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
}
