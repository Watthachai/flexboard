/**
 * Control Plane API Server with Real Firebase
 * ใช้ Firebase Admin SDK จริงแทน Mock
 */

// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import Fastify, { FastifyRequest, FastifyReply } from "fastify";
// Import Real Firebase
import { db, testFirebaseConnection } from "./config/firebase-real";

// Validate environment variables after loading
import { envConfig, validateEnvConfig } from "./config/env";
validateEnvConfig();

const fastify = Fastify({
  logger: envConfig.isProduction ? true : { level: "info" },
});

// Register CORS with environment configuration
fastify.register(require("@fastify/cors"), {
  origin: envConfig.corsOrigins,
  credentials: true,
});

// Type definitions
interface AuthenticatedRequest extends FastifyRequest {
  tenant?: any;
}

// Health check endpoint
fastify.get("/api/health", async (request, reply) => {
  try {
    // Test Firebase connection
    const firebaseConnected = await testFirebaseConnection();

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.0.0-firebase",
      firebase: firebaseConnected ? "connected" : "disconnected",
      environment: envConfig.nodeEnv,
      project: envConfig.firebaseProjectId,
    };
  } catch (error) {
    reply.status(503);
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      firebase: "disconnected",
    };
  }
});

// Simple tenants endpoint
fastify.get("/api/tenants", async (request, reply) => {
  try {
    const tenantsSnapshot = await db.collection("tenants").get();
    const tenants = tenantsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      data: tenants,
      count: tenants.length,
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Create sample tenant
fastify.post("/api/tenants", async (request, reply) => {
  try {
    const sampleTenant = {
      name: "Sample Tenant",
      slug: "sample-tenant",
      apiKey: "demo-api-key-123",
      isActive: true,
      createdAt: new Date(),
      config: {
        theme: "light",
        refreshInterval: 300000,
      },
    };

    const docRef = await db.collection("tenants").add(sampleTenant);

    return {
      success: true,
      id: docRef.id,
      data: sampleTenant,
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Simple dashboards endpoint
fastify.get("/api/dashboards", async (request, reply) => {
  try {
    const dashboardsSnapshot = await db.collection("dashboards").get();
    const dashboards = dashboardsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      data: dashboards,
      count: dashboards.length,
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Create sample dashboard with widgets
fastify.post("/api/dashboards", async (request, reply) => {
  try {
    const sampleDashboard = {
      name: "Sample Dashboard",
      slug: "sample-dashboard",
      tenantId: "sample-tenant-id",
      isActive: true,
      createdAt: new Date(),
      widgets: [
        {
          id: "widget-1",
          type: "kpi",
          title: "Total Sales",
          dataSourceType: "sql",
          query:
            "SELECT COUNT(*) as total_orders, SUM(TotalDue) as total_revenue FROM Sales.SalesOrderHeader",
          x: 0,
          y: 0,
          width: 4,
          height: 2,
        },
        {
          id: "widget-2",
          type: "chart",
          title: "Sales by Month",
          dataSourceType: "sql",
          query:
            "SELECT FORMAT(OrderDate, 'yyyy-MM') as month, SUM(TotalDue) as sales FROM Sales.SalesOrderHeader GROUP BY FORMAT(OrderDate, 'yyyy-MM')",
          x: 4,
          y: 0,
          width: 8,
          height: 4,
        },
      ],
    };

    const docRef = await db.collection("dashboards").add(sampleDashboard);

    return {
      success: true,
      id: docRef.id,
      data: sampleDashboard,
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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

    // Find tenant by API key in Firestore
    const tenantsSnapshot = await db
      .collection("tenants")
      .where("apiKey", "==", token)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (tenantsSnapshot.empty) {
      reply.status(401).send({ error: "Invalid or inactive API key" });
      return;
    }

    const tenantDoc = tenantsSnapshot.docs[0];
    const tenant = { id: tenantDoc.id, ...tenantDoc.data() };

    request.tenant = tenant;
  } catch (error) {
    reply.status(401).send({ error: "Authentication failed" });
  }
}

// Agent Sync API
fastify.get(
  "/api/agent/sync",
  { preHandler: authenticate },
  async (request: AuthenticatedRequest, reply) => {
    try {
      const tenant = request.tenant;

      // Return sample metadata for now
      const sampleMetadata = {
        dashboards: [
          {
            id: "sample-dashboard",
            name: "Sample Dashboard",
            widgets: [
              {
                id: "sales-summary",
                type: "kpi",
                title: "Sales Summary",
                dataSourceType: "sql",
                query:
                  "SELECT COUNT(*) as total_orders, SUM(TotalDue) as total_revenue FROM Sales.SalesOrderHeader",
              },
              {
                id: "sales-by-month",
                type: "chart",
                title: "Sales by Month",
                dataSourceType: "sql",
                query:
                  "SELECT FORMAT(OrderDate, 'yyyy-MM') as month, SUM(TotalDue) as sales FROM Sales.SalesOrderHeader GROUP BY FORMAT(OrderDate, 'yyyy-MM')",
              },
            ],
          },
        ],
        config: {
          theme: "light",
          refreshInterval: 300000,
        },
      };

      return {
        version: 1,
        metadata: sampleMetadata,
        sync_status: "success",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      reply.status(500);
      return {
        error: "Sync failed",
        sync_status: "error",
        timestamp: new Date().toISOString(),
      };
    }
  }
);

// Server startup
const start = async () => {
  try {
    console.log("🚀 Starting Control Plane API with Real Firebase...");

    // Test Firebase connection
    const firebaseConnected = await testFirebaseConnection();
    if (!firebaseConnected) {
      console.warn("⚠️  Firebase connection test failed, but continuing...");
    }

    const serverConfig = {
      port: envConfig.port,
      host: envConfig.host || "0.0.0.0",
    };

    await fastify.listen(serverConfig);

    console.log(
      `🚀 Control Plane API running on http://${serverConfig.host}:${serverConfig.port}`
    );
    console.log(
      `📊 Health check: http://${serverConfig.host}:${serverConfig.port}/api/health`
    );
    console.log(
      `🔄 Sync endpoint: http://${serverConfig.host}:${serverConfig.port}/api/agent/sync`
    );
    console.log(
      `🏢 Tenants API: http://${serverConfig.host}:${serverConfig.port}/api/tenants`
    );
    console.log(
      `📱 Dashboards API: http://${serverConfig.host}:${serverConfig.port}/api/dashboards`
    );
    console.log(`🔑 Demo API Key: demo-api-key-123`);

    if (envConfig.isProduction) {
      console.log(`🌐 Production mode enabled`);
    }
  } catch (err) {
    console.error("❌ Error starting server:", err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
