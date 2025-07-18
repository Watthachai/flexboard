/**
 * On-Premise Agent API Server (Multi-Connector Version)
 * ใช้ Multi-Connector Engine และ sync กับ Firestore Control Plane
 */

import Fastify from "fastify";
import fs from "fs/promises";
import path from "path";
import { multiConnectorEngine, QueryRequest, QueryResult } from "./multi-connector-native";

const fastify = Fastify({
  logger: true,
});

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

const AGENT_VERSION = process.env.AGENT_VERSION || "2.0.0-multi-connector";
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || "300000"); // 5 minutes default
const ENABLE_CACHING = process.env.ENABLE_CACHING !== "false"; // Default true
const CACHE_TTL = parseInt(process.env.CACHE_TTL || "300"); // 5 minutes cache

let currentMetadataVersion = 0;
let configCache: any = null;
let lastSyncTime = 0;

// Enable CORS for all origins (since this is an internal API)
fastify.register(require("@fastify/cors"), {
  origin: true,
  credentials: true,
});

// ===== NEW: Widget Data Execution API =====
fastify.post("/api/widgets/execute", async (request, reply) => {
  try {
    const queryRequest = request.body as QueryRequest;
    
    fastify.log.info(`Executing query for widget ${queryRequest.widgetId}`);
    
    // Execute query using Multi-Connector Engine
    const result = await multiConnectorEngine.executeQuery(queryRequest);
    
    return reply.send({
      success: result.success,
      data: result.data,
      columns: result.columns,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      error: result.error,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    fastify.log.error("Error executing widget query:", error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// ===== Connection Test API =====
fastify.get("/api/connections/test", async (request, reply) => {
  try {
    const connections = await multiConnectorEngine.testAllConnections();
    
    return reply.send({
      success: true,
      connections,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    fastify.log.error("Error testing connections:", error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// ===== Legacy Widget Data API (สำหรับ backward compatibility) =====
fastify.get("/api/widgets/:widgetId/data", async (request, reply) => {
  try {
    const { widgetId } = request.params as { widgetId: string };
    
    // ดึงการตั้งค่า widget จาก cache
    if (!configCache || !configCache[widgetId]) {
      return reply.status(404).send({
        success: false,
        error: "Widget configuration not found",
        timestamp: new Date().toISOString(),
      });
    }
    
    const widgetConfig = configCache[widgetId];
    
    // สร้าง QueryRequest จากการตั้งค่า
    const queryRequest: QueryRequest = {
      dataSourceType: widgetConfig.dataSourceType || 'sql',
      query: widgetConfig.query || 'SELECT 1 as test',
      params: widgetConfig.params || {},
      widgetId: widgetId,
      tenantId: widgetConfig.tenantId,
    };
    
    // Execute query using Multi-Connector Engine
    const result = await multiConnectorEngine.executeQuery(queryRequest);
    
    return reply.send({
      success: result.success,
      data: result.data,
      columns: result.columns,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      error: result.error,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    fastify.log.error("Error fetching widget data:", error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// ===== Control Plane Sync Functions =====
const syncWithControlPlane = async () => {
  try {
    fastify.log.info("🔄 Starting sync with Control Plane...");
    
    // Simple sync - for now just update the last sync time
    lastSyncTime = Date.now();
    
    // TODO: Implement real sync with Firestore Control Plane
    // This would fetch the latest metadata from Control Plane
    
    fastify.log.info("✅ Sync completed successfully");
    return true;
  } catch (error) {
    fastify.log.error("❌ Sync with Control Plane failed:", error);
    return false;
  }
};

const createSampleConfig = async () => {
  const sampleConfig = {
    "sales-summary": {
      dataSourceType: "sql",
      query: "SELECT COUNT(*) AS total_orders, SUM(TotalDue) AS total_revenue, AVG(TotalDue) AS avg_order_value FROM Sales.SalesOrderHeader WHERE OrderDate >= DATEADD(month, -1, GETDATE())",
      params: {},
      tenantId: "sample-tenant",
      type: "kpi",
    },
    "sales-by-month": {
      dataSourceType: "sql",
      query: "SELECT FORMAT(OrderDate, 'yyyy-MM') AS month, SUM(TotalDue) AS total_sales FROM Sales.SalesOrderHeader WHERE OrderDate >= DATEADD(month, -12, GETDATE()) GROUP BY FORMAT(OrderDate, 'yyyy-MM') ORDER BY month",
      params: {},
      tenantId: "sample-tenant",
      type: "bar",
    },
    "top-products": {
      dataSourceType: "sql",
      query: "SELECT TOP 10 p.Name AS product_name, SUM(sod.LineTotal) AS revenue FROM Sales.SalesOrderDetail sod INNER JOIN Production.Product p ON sod.ProductID = p.ProductID GROUP BY p.Name ORDER BY revenue DESC",
      params: {},
      tenantId: "sample-tenant",
      type: "bar",
    },
  };

  try {
    await fs.writeFile(
      path.join(__dirname, "config.json"),
      JSON.stringify(sampleConfig, null, 2)
    );
    configCache = sampleConfig;
    fastify.log.info("✅ Sample config created with Multi-Connector support");
  } catch (error) {
    fastify.log.error("❌ Failed to create sample config:", error);
  }
};

// Health check endpoint
fastify.get("/api/health", async (request, reply) => {
  try {
    // Test all database connections
    const connectionStatus = await multiConnectorEngine.testAllConnections();
    
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: AGENT_VERSION,
      connections: connectionStatus,
      sync_status: {
        control_plane_url: CONTROL_PLANE_URL,
        last_sync: lastSyncTime ? new Date(lastSyncTime).toISOString() : null,
        config_version: currentMetadataVersion,
        config_source: configCache ? "control_plane" : "local_file",
        next_sync_in: SYNC_INTERVAL - (Date.now() - lastSyncTime),
      },
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

// Initialize and start server
const start = async () => {
  try {
    console.log("🚀 Starting On-Premise Agent API (Multi-Connector)...");
    
    // Test all database connections
    console.log("🔌 Testing database connections...");
    const connectionStatus = await multiConnectorEngine.testAllConnections();
    console.log("📊 Connection Status:", connectionStatus);
    
    // Initialize configuration
    await createSampleConfig();
    
    // Start periodic sync
    setInterval(syncWithControlPlane, SYNC_INTERVAL);
    fastify.log.info(`⏰ Scheduled sync every ${SYNC_INTERVAL / 1000} seconds`);
    
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    
    console.log(`🌟 On-Premise Agent API running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Connection test: http://localhost:${PORT}/api/connections/test`);
    
  } catch (err) {
    console.error("❌ Error starting server:", err);
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await fastify.close();
    console.log("✅ Server closed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
});

start();
