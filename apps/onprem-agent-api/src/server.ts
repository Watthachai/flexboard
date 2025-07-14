// apps/onprem-agent-api/src/server.ts
import Fastify from "fastify";
import { PrismaClient } from "../src/generated/prisma-client";
import fs from "fs/promises";
import path from "path";

const fastify = Fastify({
  logger: true,
});

const prisma = new PrismaClient();

// Configuration for Control Plane sync - All from Environment Variables
const CONTROL_PLANE_URL =
  process.env.CONTROL_PLANE_URL ||
  (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CONTROL_PLANE_URL environment variable is required in production"
      );
    }
    return "http://localhost:3000"; // Dev fallback
  })();

const API_KEY =
  process.env.FLEXBOARD_API_KEY ||
  (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FLEXBOARD_API_KEY environment variable is required in production"
      );
    }
    return "fxb_demo_key"; // Dev fallback
  })();

const AGENT_VERSION = process.env.AGENT_VERSION || "1.0.0";
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || "300000"); // 5 minutes default
const ENABLE_CACHING = process.env.ENABLE_CACHING !== "false"; // Default true
const CACHE_TTL = parseInt(process.env.CACHE_TTL || "300"); // 5 minutes cache

let currentMetadataVersion = 0;
let configCache: any = null;
let lastSyncTime = 0;

// Type definitions for Control Plane responses
interface SyncResponse {
  success: boolean;
  has_updates: boolean;
  latest_version: number;
  metadata?: {
    version: number;
    config: any;
  };
}

// Register CORS plugin with flexible configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : [process.env.CORS_ORIGIN || "http://localhost:3000"];

fastify.register(import("@fastify/cors"), {
  origin: corsOrigins,
  credentials: true,
});

// Control Plane Sync Function
const syncWithControlPlane = async () => {
  try {
    fastify.log.info(`🔄 Syncing with Control Plane: ${CONTROL_PLANE_URL}`);

    const response = await fetch(`${CONTROL_PLANE_URL}/api/agent/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        current_version: currentMetadataVersion,
        agent_version: AGENT_VERSION,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as SyncResponse;

    if (data.success && data.has_updates && data.metadata) {
      fastify.log.info(
        `📦 Received metadata update: v${currentMetadataVersion} → v${data.latest_version}`
      );

      // Update local configuration
      currentMetadataVersion = data.latest_version;
      configCache = data.metadata.config;
      lastSyncTime = Date.now();

      // Save to local file for persistence
      await fs.writeFile(
        path.join(__dirname, "synced_config.json"),
        JSON.stringify(data.metadata.config, null, 2),
        "utf8"
      );

      fastify.log.info(
        `✅ Configuration updated successfully to version ${data.latest_version}`
      );
    } else {
      fastify.log.info(
        `✅ Configuration is up to date (v${currentMetadataVersion})`
      );
    }

    return data;
  } catch (error) {
    fastify.log.error(`❌ Control Plane sync failed:`, error);

    // Fall back to local config if sync fails
    try {
      const localConfig = await fs.readFile(
        path.join(__dirname, "synced_config.json"),
        "utf8"
      );
      configCache = JSON.parse(localConfig);
      fastify.log.info(`📂 Using cached configuration from local file`);
    } catch (localError) {
      fastify.log.warn(
        `⚠️ No cached configuration available, using sample config`
      );
    }

    throw error;
  }
};

// Initialize sync on startup
const initializeSync = async () => {
  try {
    // Try to load cached config first
    try {
      const cachedConfig = await fs.readFile(
        path.join(__dirname, "synced_config.json"),
        "utf8"
      );
      configCache = JSON.parse(cachedConfig);
      fastify.log.info(`📂 Loaded cached configuration`);
    } catch (error) {
      fastify.log.info(
        `📝 No cached configuration found, will sync with Control Plane`
      );
    }

    // Attempt initial sync
    await syncWithControlPlane();

    // Set up periodic sync
    setInterval(syncWithControlPlane, SYNC_INTERVAL);
    fastify.log.info(`⏰ Scheduled sync every ${SYNC_INTERVAL / 1000} seconds`);
  } catch (error) {
    fastify.log.error(`❌ Failed to initialize sync:`, error);

    // Fall back to sample config if all else fails
    await createSampleConfig();
    fastify.log.info(`🔧 Using sample configuration for development`);
  }
};

// สร้างไฟล์ config.json ตัวอย่างสำหรับการทดสอบ (fallback)
const createSampleConfig = async () => {
  const sampleConfig = {
    "sales-by-month": {
      query:
        "SELECT FORMAT(OrderDate, 'yyyy-MM') AS month, SUM(TotalDue) AS total_sales FROM Sales.SalesOrderHeader WHERE OrderDate >= DATEADD(month, -12, GETDATE()) GROUP BY FORMAT(OrderDate, 'yyyy-MM') ORDER BY month",
      type: "bar",
    },
    "top-products": {
      query:
        "SELECT TOP 10 p.Name AS product_name, SUM(sod.LineTotal) AS revenue FROM Sales.SalesOrderDetail sod INNER JOIN Production.Product p ON sod.ProductID = p.ProductID GROUP BY p.Name ORDER BY revenue DESC",
      type: "bar",
    },
    "sales-summary": {
      query:
        "SELECT COUNT(*) AS total_orders, SUM(TotalDue) AS total_revenue, AVG(TotalDue) AS avg_order_value FROM Sales.SalesOrderHeader WHERE OrderDate >= DATEADD(month, -1, GETDATE())",
      type: "kpi",
    },
  };

  try {
    await fs.writeFile(
      path.join(__dirname, "config.json"),
      JSON.stringify(sampleConfig, null, 2)
    );
    fastify.log.info("Sample config.json created with multiple widgets.");
  } catch (error) {
    fastify.log.error(error, "Failed to create sample config.json");
  }
};

// API Endpoint หลัก - Updated to use synced configuration
fastify.get("/api/data/:widgetId", async (request, reply) => {
  try {
    const { widgetId } = request.params as { widgetId: string };

    // 1. Use cached config from Control Plane sync, fallback to local config.json
    let config: any;

    if (configCache) {
      config = configCache;
      fastify.log.info(`📊 Using synced configuration for widget: ${widgetId}`);
    } else {
      // Fallback to local config file
      try {
        const configPath = path.join(__dirname, "config.json");
        const configFile = await fs.readFile(configPath, "utf-8");
        config = JSON.parse(configFile);
        fastify.log.info(`📁 Using local config file for widget: ${widgetId}`);
      } catch (configError) {
        return reply.status(503).send({
          error: "Configuration not available",
          details: "Neither synced config nor local config file is available",
        });
      }
    }

    const widgetConfig = config[widgetId];
    if (!widgetConfig || !widgetConfig.query) {
      return reply
        .status(404)
        .send({ error: `Widget configuration not found for: ${widgetId}` });
    }

    fastify.log.info(
      `🔍 Executing query for widget ${widgetId}: ${widgetConfig.query.substring(0, 100)}...`
    );

    // 2. รัน Raw Query ด้วย Prisma
    const data = await prisma.$queryRawUnsafe(widgetConfig.query);

    // 3. ส่งข้อมูลกลับไป with metadata
    return reply.send({
      data,
      metadata: {
        widget_id: widgetId,
        type: widgetConfig.type,
        config_source: configCache ? "control_plane" : "local_file",
        last_sync: lastSyncTime ? new Date(lastSyncTime).toISOString() : null,
        config_version: currentMetadataVersion,
      },
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({
      error: "Internal Server Error",
      widget_id: (request.params as any).widgetId,
    });
  }
});

// Health check with sync status
fastify.get("/api/health", async (request, reply) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return reply.send({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: AGENT_VERSION,
      sync_status: {
        control_plane_url: CONTROL_PLANE_URL,
        last_sync: lastSyncTime ? new Date(lastSyncTime).toISOString() : null,
        config_version: currentMetadataVersion,
        config_source: configCache ? "control_plane" : "local_file",
        next_sync_in: SYNC_INTERVAL - (Date.now() - lastSyncTime),
      },
    });
  } catch (error) {
    reply.status(503);
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
});

// Manual sync trigger endpoint
fastify.post("/api/sync", async (request, reply) => {
  try {
    fastify.log.info("🔄 Manual sync triggered");
    await syncWithControlPlane();

    return reply.send({
      success: true,
      message: "Sync completed successfully",
      config_version: currentMetadataVersion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    fastify.log.error("❌ Manual sync failed:", error);
    reply.status(500);
    return {
      success: false,
      error: "Sync failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
});

const start = async () => {
  try {
    // Initialize sync with Control Plane first
    await initializeSync();

    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port: PORT, host: "0.0.0.0" }); // Agent API รันที่ Port จาก ENV หรือ 3001

    fastify.log.info(`🚀 Agent API is running on port ${PORT}`);
    fastify.log.info(`🔗 Control Plane: ${CONTROL_PLANE_URL}`);
    fastify.log.info(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
    fastify.log.info(`⏰ Sync interval: ${SYNC_INTERVAL / 1000} seconds`);
    fastify.log.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
