// Control Plane API for Railway Deployment
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const fastify = Fastify({
  logger: process.env.NODE_ENV === "production" ? true : { level: "info" },
});

const prisma = new PrismaClient();

// Environment Variables Configuration
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET environment variable is required in production"
      );
    }
    return "dev-jwt-secret-change-this";
  })();

const API_VERSION = process.env.API_VERSION || "v1";
const MAX_SYNC_LOG_RETENTION_DAYS = parseInt(
  process.env.MAX_SYNC_LOG_RETENTION_DAYS || "30"
);

// Type definitions
interface AuthenticatedRequest extends FastifyRequest {
  tenant?: any;
}

interface TenantBody {
  name: string;
  slug: string;
  license_type?: string;
}

interface SyncBody {
  current_version?: number;
  agent_version?: string;
}

// CORS configuration for Railway
fastify.register(import("@fastify/cors"), {
  origin: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  credentials: true,
});

// Health check endpoint for Railway
fastify.get("/health", async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      database: "connected",
    };
  } catch (error) {
    reply.status(503);
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
});

// Authentication middleware
async function authenticate(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      reply.status(401).send({ error: "Missing authorization header" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");

    // For Phase 1: Simple API key validation
    // Later: JWT token validation
    const tenant = await prisma.tenant.findUnique({
      where: { apiKey: token },
    });

    if (!tenant || !tenant.isActive) {
      reply.status(401).send({ error: "Invalid or inactive API key" });
      return;
    }

    request.tenant = tenant;
  } catch (error) {
    reply.status(401).send({ error: "Authentication failed" });
  }
}

// Agent Sync API - หัวใจสำคัญของ Phase 2
fastify.post(
  "/api/agent/sync",
  {
    preHandler: authenticate,
  },
  async (request: any, reply) => {
    const startTime = Date.now();

    try {
      const { current_version, agent_version } = request.body;
      const tenant = request.tenant;

      fastify.log.info(
        `Sync request from tenant: ${tenant.name}, current_version: ${current_version}`
      );

      // Get latest published metadata version
      const latestVersion = await prisma.metadataVersion.findFirst({
        where: {
          tenantId: tenant.id,
          status: "published",
        },
        orderBy: {
          version: "desc",
        },
      });

      const hasUpdates =
        !latestVersion ||
        !current_version ||
        latestVersion.version > current_version;

      let responseData: any = {
        success: true,
        has_updates: hasUpdates,
        latest_version: latestVersion?.version || 0,
      };

      if (hasUpdates && latestVersion) {
        // Include metadata in response
        responseData.metadata = {
          version: latestVersion.version,
          config: latestVersion.metadata,
        };

        fastify.log.info(
          `Sending updates to ${tenant.name}: v${current_version || 0} → v${latestVersion.version}`
        );
      }

      // Log sync operation
      await prisma.syncLog.create({
        data: {
          tenantId: tenant.id,
          agentVersion: agent_version || "unknown",
          syncStatus: "success",
          metadataVersion: latestVersion?.version,
          syncDurationMs: Date.now() - startTime,
        },
      });

      return responseData;
    } catch (error) {
      fastify.log.error("Sync error:", error);

      // Log failed sync
      await prisma.syncLog.create({
        data: {
          tenantId: request.tenant?.id || "unknown",
          syncStatus: "error",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          syncDurationMs: Date.now() - startTime,
        },
      });

      reply.status(500);
      return {
        success: false,
        error: "Sync operation failed",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      };
    }
  }
);

// Tenant Management APIs
fastify.get("/api/tenants", async (request, reply) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            dashboards: true,
            syncLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      licenseType: tenant.licenseType,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      dashboardCount: tenant._count.dashboards,
      lastSync: tenant.updatedAt,
    }));
  } catch (error) {
    reply.status(500);
    return { error: "Failed to fetch tenants" };
  }
});

fastify.post("/api/tenants", async (request: any, reply) => {
  try {
    const { name, slug, license_type = "basic" } = request.body;

    // Generate API key
    const apiKeyPrefix = process.env.API_KEY_PREFIX || "fxb";
    const apiKey = `${apiKeyPrefix}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        licenseType: license_type,
        apiKey,
      },
    });

    // Create initial metadata version
    await prisma.metadataVersion.create({
      data: {
        tenantId: tenant.id,
        version: 1,
        metadata: {
          dashboards: [],
          widgets: [],
          config: {},
        },
        status: "published",
        createdBy: "system",
      },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        licenseType: tenant.licenseType,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
      },
      api_key: apiKey, // Only returned on creation
    };
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      reply.status(400);
      return { error: "Tenant slug already exists" };
    }

    reply.status(500);
    return { error: "Failed to create tenant" };
  }
});

// Dashboard Management APIs
fastify.get(
  "/api/tenants/:tenantId/dashboards",
  async (request: any, reply) => {
    try {
      const { tenantId } = request.params;

      const dashboards = await prisma.dashboard.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { widgets: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return dashboards.map((dashboard) => ({
        id: dashboard.id,
        name: dashboard.name,
        slug: dashboard.slug,
        description: dashboard.description,
        widgetCount: dashboard._count.widgets,
        createdAt: dashboard.createdAt,
        updatedAt: dashboard.updatedAt,
      }));
    } catch (error) {
      reply.status(500);
      return { error: "Failed to fetch dashboards" };
    }
  }
);

// Metadata Version Management
fastify.get("/api/tenants/:tenantId/versions", async (request: any, reply) => {
  try {
    const { tenantId } = request.params;

    const versions = await prisma.metadataVersion.findMany({
      where: { tenantId },
      orderBy: { version: "desc" },
      take: 20, // Limit to recent versions
    });

    return versions.map((version) => ({
      id: version.id,
      version: version.version,
      status: version.status,
      createdAt: version.createdAt,
      publishedAt: version.publishedAt,
      createdBy: version.createdBy,
    }));
  } catch (error) {
    reply.status(500);
    return { error: "Failed to fetch versions" };
  }
});

fastify.post(
  "/api/tenants/:tenantId/versions/:versionId/publish",
  async (request: any, reply) => {
    try {
      const { tenantId, versionId } = request.params;

      // Archive current published version
      await prisma.metadataVersion.updateMany({
        where: {
          tenantId,
          status: "published",
        },
        data: {
          status: "archived",
        },
      });

      // Publish the specified version
      const publishedVersion = await prisma.metadataVersion.update({
        where: {
          id: versionId,
          tenantId,
        },
        data: {
          status: "published",
          publishedAt: new Date(),
        },
      });

      fastify.log.info(
        `Published version ${publishedVersion.version} for tenant ${tenantId}`
      );

      return {
        success: true,
        published_version: publishedVersion.version,
        published_at: publishedVersion.publishedAt,
      };
    } catch (error) {
      reply.status(500);
      return { error: "Failed to publish version" };
    }
  }
);

// Sync Status Dashboard
fastify.get("/api/sync/status", async (request, reply) => {
  try {
    const recentSyncs = await prisma.syncLog.findMany({
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        syncedAt: "desc",
      },
      take: 50,
    });

    const stats = await prisma.syncLog.groupBy({
      by: ["syncStatus"],
      _count: {
        syncStatus: true,
      },
      where: {
        syncedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return {
      recent_syncs: recentSyncs.map((log) => ({
        id: log.id,
        tenant: log.tenant?.name || "Unknown",
        status: log.syncStatus,
        version: log.metadataVersion,
        duration: log.syncDurationMs,
        synced_at: log.syncedAt,
        error: log.errorMessage,
      })),
      stats: stats.reduce(
        (acc, stat) => {
          acc[stat.syncStatus] = stat._count.syncStatus;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  } catch (error) {
    reply.status(500);
    return { error: "Failed to fetch sync status" };
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info("Shutting down gracefully...");
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const start = async () => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const HOST =
      process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

    await fastify.listen({ port: PORT, host: HOST });

    fastify.log.info(`🚀 Control Plane API running on ${HOST}:${PORT}`);
    fastify.log.info(`📊 Health check: http://${HOST}:${PORT}/health`);
    fastify.log.info(`🔄 Sync endpoint: http://${HOST}:${PORT}/api/agent/sync`);

    if (process.env.NODE_ENV === "production") {
      fastify.log.info(`🌐 Deployed on Railway`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
