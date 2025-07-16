import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "../../node_modules/.prisma/client";

const prisma = new PrismaClient();

interface DashboardCreateBody {
  name: string;
  slug?: string;
  description?: string;
}

interface DashboardUpdateBody extends Partial<DashboardCreateBody> {}

interface TenantParams {
  tenantId: string;
}

interface DashboardParams extends TenantParams {
  dashboardId: string;
}

interface MetadataUpdateBody {
  metadata: any;
  createdBy?: string;
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/tenants/:tenantId/dashboards - Get all dashboards for a tenant
  fastify.get<{ Params: TenantParams }>(
    "/api/tenants/:tenantId/dashboards",
    async (request, reply) => {
      try {
        const { tenantId } = request.params;

        // Verify tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenant) {
          return reply.status(404).send({
            success: false,
            error: "Tenant not found",
          });
        }

        const dashboards = await prisma.dashboard.findMany({
          where: { tenantId },
          include: {
            _count: {
              select: { widgets: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.send({
          success: true,
          data: dashboards.map((dashboard) => ({
            id: dashboard.id,
            name: dashboard.name,
            slug: dashboard.slug,
            description: dashboard.description,
            widgetCount: dashboard._count.widgets,
            createdAt: dashboard.createdAt,
            updatedAt: dashboard.updatedAt,
          })),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch dashboards",
        });
      }
    }
  );

  // GET /api/tenants/:tenantId/dashboards/:dashboardId - Get single dashboard
  fastify.get<{ Params: DashboardParams }>(
    "/api/tenants/:tenantId/dashboards/:dashboardId",
    async (request, reply) => {
      try {
        const { tenantId, dashboardId } = request.params;

        const dashboard = await prisma.dashboard.findFirst({
          where: {
            tenantId,
            OR: [{ id: dashboardId }, { slug: dashboardId }],
          },
          include: {
            widgets: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        if (!dashboard) {
          return reply.status(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        return reply.send({
          success: true,
          data: dashboard,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch dashboard",
        });
      }
    }
  );

  // POST /api/tenants/:tenantId/dashboards - Create new dashboard
  fastify.post<{ Params: TenantParams; Body: DashboardCreateBody }>(
    "/api/tenants/:tenantId/dashboards",
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const { name, slug, description } = request.body;

        if (!name) {
          return reply.status(400).send({
            success: false,
            error: "Dashboard name is required",
          });
        }

        // Verify tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenant) {
          return reply.status(404).send({
            success: false,
            error: "Tenant not found",
          });
        }

        // Generate slug if not provided
        const dashboardSlug =
          slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-");

        // Check if slug already exists for this tenant
        const existingDashboard = await prisma.dashboard.findFirst({
          where: {
            tenantId,
            slug: dashboardSlug,
          },
        });

        if (existingDashboard) {
          return reply.status(409).send({
            success: false,
            error: "Dashboard with this slug already exists for this tenant",
          });
        }

        const dashboard = await prisma.dashboard.create({
          data: {
            tenantId,
            name,
            slug: dashboardSlug,
            description,
          },
        });

        return reply.status(201).send({
          success: true,
          data: dashboard,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to create dashboard",
        });
      }
    }
  );

  // PUT /api/tenants/:tenantId/dashboards/:dashboardId - Update dashboard
  fastify.put<{ Params: DashboardParams; Body: DashboardUpdateBody }>(
    "/api/tenants/:tenantId/dashboards/:dashboardId",
    async (request, reply) => {
      try {
        const { tenantId, dashboardId } = request.params;
        const { name, slug, description } = request.body;

        // Check if dashboard exists
        const existingDashboard = await prisma.dashboard.findFirst({
          where: {
            id: dashboardId,
            tenantId,
          },
        });

        if (!existingDashboard) {
          return reply.status(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        // Check slug uniqueness if changing
        if (slug && slug !== existingDashboard.slug) {
          const slugExists = await prisma.dashboard.findFirst({
            where: {
              tenantId,
              slug,
              id: { not: dashboardId },
            },
          });

          if (slugExists) {
            return reply.status(409).send({
              success: false,
              error: "Dashboard with this slug already exists for this tenant",
            });
          }
        }

        const dashboard = await prisma.dashboard.update({
          where: { id: dashboardId },
          data: {
            ...(name && { name }),
            ...(slug && { slug }),
            ...(typeof description === "string" && { description }),
          },
        });

        return reply.send({
          success: true,
          data: dashboard,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to update dashboard",
        });
      }
    }
  );

  // DELETE /api/tenants/:tenantId/dashboards/:dashboardId - Delete dashboard
  fastify.delete<{ Params: DashboardParams }>(
    "/api/tenants/:tenantId/dashboards/:dashboardId",
    async (request, reply) => {
      try {
        const { tenantId, dashboardId } = request.params;

        // Check if dashboard exists
        const existingDashboard = await prisma.dashboard.findFirst({
          where: {
            id: dashboardId,
            tenantId,
          },
        });

        if (!existingDashboard) {
          return reply.status(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        // Delete dashboard (this will cascade delete widgets)
        await prisma.dashboard.delete({
          where: { id: dashboardId },
        });

        return reply.send({
          success: true,
          message: "Dashboard deleted successfully",
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to delete dashboard",
        });
      }
    }
  );

  // GET /api/dashboards/:dashboardId/metadata - Get latest metadata for dashboard
  fastify.get<{ Params: { dashboardId: string } }>(
    "/api/dashboards/:dashboardId/metadata",
    async (request, reply) => {
      try {
        const { dashboardId } = request.params;

        // Get dashboard to find tenant
        const dashboard = await prisma.dashboard.findFirst({
          where: {
            OR: [{ id: dashboardId }, { slug: dashboardId }],
          },
          include: {
            tenant: true,
          },
        });

        if (!dashboard) {
          return reply.status(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        // Get latest metadata version
        const latestVersion = await prisma.metadataVersion.findFirst({
          where: {
            tenantId: dashboard.tenantId,
          },
          orderBy: {
            version: "desc",
          },
        });

        if (!latestVersion) {
          // Return default metadata structure
          const defaultMetadata = {
            dashboards: [
              {
                id: dashboardId,
                name: dashboard.name,
                slug: dashboard.slug,
                tabs: [],
                widgets: [],
              },
            ],
            widgets: [],
            config: {
              theme: "light",
              refreshInterval: 300000,
            },
          };

          return reply.send({
            success: true,
            data: {
              version: 0,
              metadata: defaultMetadata,
              status: "draft",
              createdAt: new Date(),
            },
          });
        }

        return reply.send({
          success: true,
          data: {
            id: latestVersion.id,
            version: latestVersion.version,
            metadata: latestVersion.metadata,
            status: latestVersion.status,
            createdAt: latestVersion.createdAt,
            publishedAt: latestVersion.publishedAt,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch metadata",
        });
      }
    }
  );

  // PUT /api/dashboards/:dashboardId/metadata - Save metadata (as draft)
  fastify.put<{ Params: { dashboardId: string }; Body: MetadataUpdateBody }>(
    "/api/dashboards/:dashboardId/metadata",
    async (request, reply) => {
      try {
        const { dashboardId } = request.params;
        const { metadata, createdBy = "admin" } = request.body;

        // Get dashboard to find tenant
        const dashboard = await prisma.dashboard.findFirst({
          where: {
            OR: [{ id: dashboardId }, { slug: dashboardId }],
          },
        });

        if (!dashboard) {
          return reply.status(404).send({
            success: false,
            error: "Dashboard not found",
          });
        }

        // Get next version number
        const latestVersion = await prisma.metadataVersion.findFirst({
          where: {
            tenantId: dashboard.tenantId,
          },
          orderBy: {
            version: "desc",
          },
        });

        const nextVersion = (latestVersion?.version || 0) + 1;

        // Create new metadata version
        const newVersion = await prisma.metadataVersion.create({
          data: {
            tenantId: dashboard.tenantId,
            version: nextVersion,
            metadata,
            status: "draft",
            createdBy,
          },
        });

        return reply.send({
          success: true,
          data: {
            id: newVersion.id,
            version: newVersion.version,
            status: newVersion.status,
            createdAt: newVersion.createdAt,
          },
          message: "Metadata saved as draft",
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to save metadata",
        });
      }
    }
  );

  // POST /api/metadata/:versionId/publish - Publish metadata version
  fastify.post<{ Params: { versionId: string } }>(
    "/api/metadata/:versionId/publish",
    async (request, reply) => {
      try {
        const { versionId } = request.params;

        // Get the version to publish
        const version = await prisma.metadataVersion.findUnique({
          where: { id: versionId },
        });

        if (!version) {
          return reply.status(404).send({
            success: false,
            error: "Metadata version not found",
          });
        }

        // Archive current published version
        await prisma.metadataVersion.updateMany({
          where: {
            tenantId: version.tenantId,
            status: "published",
          },
          data: {
            status: "archived",
          },
        });

        // Publish new version
        const publishedVersion = await prisma.metadataVersion.update({
          where: { id: versionId },
          data: {
            status: "published",
            publishedAt: new Date(),
          },
        });

        return reply.send({
          success: true,
          data: {
            id: publishedVersion.id,
            version: publishedVersion.version,
            status: publishedVersion.status,
            publishedAt: publishedVersion.publishedAt,
          },
          message: "Metadata version published successfully",
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to publish metadata version",
        });
      }
    }
  );
}
