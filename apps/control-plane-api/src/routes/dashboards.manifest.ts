/**
 * Dashboard Manifest Routes (Dashboard as Code)
 * API endpoints for managing dashboard manifests using Fastify
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { DashboardService } from "../services/firestore.service";

interface DashboardManifestParams {
  tenantId: string;
  dashboardId?: string;
}

interface DashboardQuerystring {
  search?: string;
  isActive?: string;
  team?: string;
}

interface CreateDashboardBody {
  name: string;
  description?: string;
  targetTeams: string[];
  manifestContent: string;
}

interface UpdateDashboardBody {
  name?: string;
  description?: string;
  targetTeams?: string[];
  manifestContent?: string;
}

interface ToggleStatusBody {
  isActive: boolean;
}

export default async function dashboardManifestRoutes(
  fastify: FastifyInstance
) {
  /**
   * GET /api/manifest/tenants/:tenantId/dashboards/manifests
   * Get all dashboard manifests for a tenant
   */
  fastify.get<{
    Params: DashboardManifestParams;
    Querystring: DashboardQuerystring;
  }>("/tenants/:tenantId/dashboards/manifests", async (request, reply) => {
    try {
      const { tenantId } = request.params;
      const { search, isActive, team } = request.query;

      // Get dashboards for the tenant using DashboardService
      const response = await DashboardService.getDashboardsByTenant(tenantId);

      if (!response.success || !response.data) {
        return reply.code(500).send({
          success: false,
          error: "Failed to fetch dashboards",
        });
      }

      let dashboards = response.data;

      // Apply filters
      if (isActive !== undefined) {
        const activeStatus = isActive === "true";
        dashboards = dashboards.filter((dashboard) =>
          activeStatus
            ? dashboard.status === "published"
            : dashboard.status !== "published"
        );
      }

      // Apply search filter
      if (search) {
        const searchTerm = search.toLowerCase();
        dashboards = dashboards.filter(
          (dashboard) =>
            dashboard.name.toLowerCase().includes(searchTerm) ||
            (dashboard.description &&
              dashboard.description.toLowerCase().includes(searchTerm))
        );
      }

      // Apply team filter
      if (team) {
        dashboards = dashboards.filter(
          (dashboard) => dashboard.tags && dashboard.tags.includes(team)
        );
      }

      return reply.code(200).send({
        success: true,
        data: dashboards,
      });
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch dashboards",
      });
    }
  });

  /**
   * GET /api/manifest/tenants/:tenantId/dashboards/:dashboardId/manifest
   * Get dashboard manifest content
   */
  fastify.get<{
    Params: DashboardManifestParams;
  }>(
    "/tenants/:tenantId/dashboards/:dashboardId/manifest",
    async (request, reply) => {
      try {
        const { tenantId, dashboardId } = request.params;

        if (!dashboardId) {
          return reply.code(400).send({
            success: false,
            error: "Dashboard ID is required",
          });
        }

        const response = await DashboardService.getDashboard(dashboardId);

        if (!response.success || !response.data) {
          return reply.code(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        // Verify the dashboard belongs to the correct tenant
        if (response.data.tenantId !== tenantId) {
          return reply.code(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        return reply.code(200).send({
          success: true,
          data: {
            manifestContent: response.data.manifestContent || "{}",
          },
        });
      } catch (error) {
        console.error("Error fetching dashboard manifest:", error);
        return reply.code(500).send({
          success: false,
          error: "Failed to fetch dashboard manifest",
        });
      }
    }
  );

  /**
   * POST /api/manifest/tenants/:tenantId/dashboards/manifests
   * Create new dashboard manifest
   */
  fastify.post<{
    Params: DashboardManifestParams;
    Body: CreateDashboardBody;
  }>("/tenants/:tenantId/dashboards/manifests", async (request, reply) => {
    try {
      const { tenantId } = request.params;
      const { name, description, targetTeams, manifestContent } = request.body;

      // Validate required fields
      if (!name || !manifestContent) {
        return reply.code(400).send({
          success: false,
          error: "Name and manifestContent are required",
        });
      }

      // Parse manifest to get dashboard info
      let parsedManifest;
      try {
        parsedManifest = JSON.parse(manifestContent);
      } catch (error) {
        return reply.code(400).send({
          success: false,
          error: "Invalid JSON format in manifestContent",
        });
      }

      const dashboardData = {
        tenantId,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: description || "",
        isPublic: false,
        settings: {
          refreshInterval: 30,
          theme: "light" as const,
          autoRefresh: false,
        },
        status: "draft" as const,
        tags: targetTeams || ["default"],
        manifestContent,
      };

      // Create dashboard using DashboardService
      const response = await DashboardService.createDashboard(
        dashboardData,
        "system" // Using system as the creator for manifest-created dashboards
      );

      if (!response.success || !response.data) {
        return reply.code(500).send({
          success: false,
          error: "Failed to create dashboard",
        });
      }

      // Update the manifest with the generated ID
      const updatedManifest = {
        ...parsedManifest,
        dashboardId: response.data.id,
      };

      await DashboardService.updateDashboard(
        response.data.id,
        {
          manifestContent: JSON.stringify(updatedManifest, null, 2),
        },
        "system"
      );

      return reply.code(201).send({
        success: true,
        data: response.data,
      });
    } catch (error) {
      console.error("Error creating dashboard:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create dashboard",
      });
    }
  });

  /**
   * PUT /api/manifest/tenants/:tenantId/dashboards/:dashboardId
   * Update dashboard manifest
   */
  fastify.put<{
    Params: DashboardManifestParams;
    Body: UpdateDashboardBody;
  }>("/tenants/:tenantId/dashboards/:dashboardId", async (request, reply) => {
    try {
      const { tenantId, dashboardId } = request.params;
      const { name, description, targetTeams, manifestContent } = request.body;

      if (!dashboardId) {
        return reply.code(400).send({
          success: false,
          error: "Dashboard ID is required",
        });
      }

      // Check if dashboard exists and belongs to tenant
      const existingResponse = await DashboardService.getDashboard(dashboardId);

      if (!existingResponse.success || !existingResponse.data) {
        return reply.code(404).send({
          success: false,
          error: "Dashboard not found",
        });
      }

      if (existingResponse.data.tenantId !== tenantId) {
        return reply.code(404).send({
          success: false,
          error: "Dashboard not found",
        });
      }

      const updateData: any = {};

      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (targetTeams) updateData.tags = targetTeams;

      if (manifestContent) {
        // Validate JSON format
        try {
          const parsedManifest = JSON.parse(manifestContent);
          // Ensure dashboardId is set
          parsedManifest.dashboardId = dashboardId;
          updateData.manifestContent = JSON.stringify(parsedManifest, null, 2);
        } catch (error) {
          return reply.code(400).send({
            success: false,
            error: "Invalid JSON format in manifestContent",
          });
        }
      }

      // Update using DashboardService
      const updateResponse = await DashboardService.updateDashboard(
        dashboardId,
        updateData,
        "system"
      );

      if (!updateResponse.success) {
        return reply.code(500).send({
          success: false,
          error: "Failed to update dashboard",
        });
      }

      return reply.code(200).send({
        success: true,
        data: updateResponse.data,
      });
    } catch (error) {
      console.error("Error updating dashboard:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update dashboard",
      });
    }
  });

  /**
   * DELETE /api/manifest/tenants/:tenantId/dashboards/:dashboardId
   * Delete dashboard
   */
  fastify.delete<{
    Params: DashboardManifestParams;
  }>("/tenants/:tenantId/dashboards/:dashboardId", async (request, reply) => {
    try {
      const { tenantId, dashboardId } = request.params;

      if (!dashboardId) {
        return reply.code(400).send({
          success: false,
          error: "Dashboard ID is required",
        });
      }

      // Check if dashboard exists and belongs to tenant
      const existingResponse = await DashboardService.getDashboard(dashboardId);

      if (!existingResponse.success || !existingResponse.data) {
        return reply.code(404).send({
          success: false,
          error: "Dashboard not found",
        });
      }

      if (existingResponse.data.tenantId !== tenantId) {
        return reply.code(404).send({
          success: false,
          error: "Dashboard not found",
        });
      }

      // Delete using DashboardService
      const deleteResponse =
        await DashboardService.deleteDashboard(dashboardId);

      if (!deleteResponse.success) {
        return reply.code(500).send({
          success: false,
          error: "Failed to delete dashboard",
        });
      }

      return reply.code(200).send({
        success: true,
        data: null,
      });
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete dashboard",
      });
    }
  });

  /**
   * PATCH /api/manifest/tenants/:tenantId/dashboards/:dashboardId/status
   * Toggle dashboard active status
   */
  fastify.patch<{
    Params: DashboardManifestParams;
    Body: ToggleStatusBody;
  }>(
    "/tenants/:tenantId/dashboards/:dashboardId/status",
    async (request, reply) => {
      try {
        const { tenantId, dashboardId } = request.params;
        const { isActive } = request.body;

        if (!dashboardId) {
          return reply.code(400).send({
            success: false,
            error: "Dashboard ID is required",
          });
        }

        if (typeof isActive !== "boolean") {
          return reply.code(400).send({
            success: false,
            error: "isActive must be a boolean",
          });
        }

        // Check if dashboard exists and belongs to tenant
        const existingResponse =
          await DashboardService.getDashboard(dashboardId);

        if (!existingResponse.success || !existingResponse.data) {
          return reply.code(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        if (existingResponse.data.tenantId !== tenantId) {
          return reply.code(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        // Update status using DashboardService
        const updateResponse = await DashboardService.updateDashboard(
          dashboardId,
          {
            status: isActive ? "published" : "draft",
          },
          "system"
        );

        if (!updateResponse.success) {
          return reply.code(500).send({
            success: false,
            error: "Failed to update dashboard status",
          });
        }

        return reply.code(200).send({
          success: true,
          data: updateResponse.data,
        });
      } catch (error) {
        console.error("Error toggling dashboard status:", error);
        return reply.code(500).send({
          success: false,
          error: "Failed to toggle dashboard status",
        });
      }
    }
  );
}
