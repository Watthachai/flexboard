import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "../../node_modules/.prisma/client";

const prisma = new PrismaClient();

interface TenantCreateBody {
  name: string;
  slug?: string;
  licenseType?: string;
}

interface TenantUpdateBody extends Partial<TenantCreateBody> {
  isActive?: boolean;
}

interface TenantParams {
  id: string;
}

export async function tenantRoutes(fastify: FastifyInstance) {
  console.log("Setting up tenant routes...");

  // GET /api/tenants - Get all tenants
  fastify.get(
    "/api/tenants",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenants = await prisma.tenant.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: {
                dashboards: true,
                metadataVersions: true,
              },
            },
          },
        });

        return reply.send({
          success: true,
          data: tenants,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch tenants",
        });
      }
    }
  );

  // GET /api/tenants/:id - Get single tenant
  fastify.get<{ Params: TenantParams }>(
    "/api/tenants/:id",
    async (request, reply) => {
      try {
        const { id } = request.params;

        const tenant = await prisma.tenant.findUnique({
          where: { id },
          include: {
            dashboards: {
              orderBy: { createdAt: "desc" },
            },
            _count: {
              select: {
                metadataVersions: true,
                syncLogs: true,
              },
            },
          },
        });

        if (!tenant) {
          return reply.status(404).send({
            success: false,
            error: "Tenant not found",
          });
        }

        return reply.send({
          success: true,
          data: tenant,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch tenant",
        });
      }
    }
  );

  // POST /api/tenants - Create new tenant
  fastify.post<{ Body: TenantCreateBody }>(
    "/api/tenants",
    async (request, reply) => {
      try {
        const { name, slug, licenseType = "basic" } = request.body;

        if (!name) {
          return reply.status(400).send({
            success: false,
            error: "Tenant name is required",
          });
        }

        // Generate slug if not provided
        const tenantSlug =
          slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-");

        // Generate unique API key
        const apiKey = `fxb_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;

        // Check if slug already exists
        const existingTenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
        });

        if (existingTenant) {
          return reply.status(409).send({
            success: false,
            error: "Tenant with this slug already exists",
          });
        }

        const tenant = await prisma.tenant.create({
          data: {
            name,
            slug: tenantSlug,
            licenseType,
            apiKey,
          },
        });

        return reply.status(201).send({
          success: true,
          data: tenant,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to create tenant",
        });
      }
    }
  );

  // PUT /api/tenants/:id - Update tenant
  fastify.put<{ Params: TenantParams; Body: TenantUpdateBody }>(
    "/api/tenants/:id",
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { name, slug, licenseType, isActive } = request.body;

        // Check if tenant exists
        const existingTenant = await prisma.tenant.findUnique({
          where: { id },
        });

        if (!existingTenant) {
          return reply.status(404).send({
            success: false,
            error: "Tenant not found",
          });
        }

        // Check slug uniqueness if changing
        if (slug && slug !== existingTenant.slug) {
          const slugExists = await prisma.tenant.findUnique({
            where: { slug },
          });

          if (slugExists) {
            return reply.status(409).send({
              success: false,
              error: "Tenant with this slug already exists",
            });
          }
        }

        const tenant = await prisma.tenant.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(slug && { slug }),
            ...(licenseType && { licenseType }),
            ...(typeof isActive === "boolean" && { isActive }),
          },
        });

        return reply.send({
          success: true,
          data: tenant,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to update tenant",
        });
      }
    }
  );

  // DELETE /api/tenants/:id - Delete tenant (soft delete by marking as inactive)
  fastify.delete<{ Params: TenantParams }>(
    "/api/tenants/:id",
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Check if tenant exists
        const existingTenant = await prisma.tenant.findUnique({
          where: { id },
        });

        if (!existingTenant) {
          return reply.status(404).send({
            success: false,
            error: "Tenant not found",
          });
        }

        // Soft delete by marking as inactive
        const tenant = await prisma.tenant.update({
          where: { id },
          data: { isActive: false },
        });

        return reply.send({
          success: true,
          data: tenant,
          message: "Tenant deactivated successfully",
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to delete tenant",
        });
      }
    }
  );
}
