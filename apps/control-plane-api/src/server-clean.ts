import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "../node_modules/.prisma/client";
import { tenantRoutes } from "./routes/tenants";

const fastify = Fastify({
  logger: process.env.NODE_ENV === "production" ? true : { level: "info" },
});

// Register CORS
fastify.register(require("@fastify/cors"), {
  origin: true, // Allow all origins in development
  credentials: true,
});

// Register routes
fastify.register(tenantRoutes);

const prisma = new PrismaClient();

// Type definitions
interface AuthenticatedRequest extends FastifyRequest {
  tenant?: any;
}

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

// Authentication middleware for Agent API
async function authenticate(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      reply.status(401).send({ error: "Missing authorization header" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");

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

// Agent Sync API - Core functionality for on-premise agents
fastify.get(
  "/api/agent/sync",
  { preHandler: authenticate },
  async (request: AuthenticatedRequest, reply) => {
    try {
      const tenant = request.tenant;
      const syncBody = request.query as {
        current_version?: string;
        agent_version?: string;
      };

      // Log sync attempt
      const syncStart = Date.now();

      // Get latest published metadata for this tenant
      const latestVersion = await prisma.metadataVersion.findFirst({
        where: {
          tenantId: tenant.id,
          status: "published",
        },
        orderBy: {
          version: "desc",
        },
      });

      if (!latestVersion) {
        // Create default metadata if none exists
        const defaultMetadata = {
          dashboards: [],
          widgets: [],
          config: {
            theme: "light",
            refreshInterval: 300000, // 5 minutes
          },
        };

        const newVersion = await prisma.metadataVersion.create({
          data: {
            tenantId: tenant.id,
            version: 1,
            metadata: defaultMetadata,
            status: "published",
            publishedAt: new Date(),
            createdBy: "system",
          },
        });

        // Log successful sync
        await prisma.syncLog.create({
          data: {
            tenantId: tenant.id,
            agentVersion: syncBody.agent_version || "unknown",
            syncStatus: "success",
            metadataVersion: newVersion.version,
            syncDurationMs: Date.now() - syncStart,
          },
        });

        return {
          version: newVersion.version,
          metadata: defaultMetadata,
          last_updated: newVersion.publishedAt,
          sync_status: "success",
        };
      }

      const currentVersion = parseInt(syncBody.current_version || "0");

      // If agent is up to date, return minimal response
      if (currentVersion >= latestVersion.version) {
        await prisma.syncLog.create({
          data: {
            tenantId: tenant.id,
            agentVersion: syncBody.agent_version || "unknown",
            syncStatus: "success",
            metadataVersion: latestVersion.version,
            syncDurationMs: Date.now() - syncStart,
          },
        });

        return {
          version: latestVersion.version,
          up_to_date: true,
          sync_status: "success",
        };
      }

      // Return updated metadata
      await prisma.syncLog.create({
        data: {
          tenantId: tenant.id,
          agentVersion: syncBody.agent_version || "unknown",
          syncStatus: "success",
          metadataVersion: latestVersion.version,
          syncDurationMs: Date.now() - syncStart,
        },
      });

      return {
        version: latestVersion.version,
        metadata: latestVersion.metadata,
        last_updated: latestVersion.publishedAt,
        sync_status: "success",
      };
    } catch (error) {
      request.log.error(error);

      // Log failed sync
      try {
        await prisma.syncLog.create({
          data: {
            tenantId: request.tenant?.id,
            agentVersion: (request.query as any)?.agent_version || "unknown",
            syncStatus: "error",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            syncDurationMs: 0,
          },
        });
      } catch (logError) {
        request.log.error("Failed to log sync error:", logError);
      }

      reply.status(500);
      return {
        error: "Sync failed",
        sync_status: "error",
      };
    }
  }
);

// Server startup
const start = async () => {
  try {
    const HOST = process.env.HOST || "0.0.0.0";
    const PORT = parseInt(process.env.PORT || "3001");

    await fastify.listen({ port: PORT, host: HOST });

    fastify.log.info(`🚀 Control Plane API running on http://${HOST}:${PORT}`);
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
