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

// Import routes
import tenantRoutes from "./routes/tenants.firestore";
import dashboardRoutes from "./routes/dashboards.firestore";
import dashboardManifestRoutes from "./routes/dashboards.manifest";
import dashboardColumnsRoutes from "./routes/dashboard-columns.firestore";
import {
  generateLicense,
  listLicenses,
  getLicensePermissions,
  updateLicenseSessions,
} from "./routes/onprem-licenses";
import { userManagementRoutes } from "./routes/user-management.routes";

const fastify = Fastify({
  logger: envConfig.isProduction ? true : { level: "info" },
});

// Register CORS with environment configuration
fastify.register(require("@fastify/cors"), {
  origin: envConfig.corsOrigins,
  credentials: true,
});

// Register Cookie plugin for session management
fastify.register(require("@fastify/cookie"), {
  secret:
    envConfig.sessionSecret || "flexboard-secret-key-change-in-production",
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

// Register routes
fastify.register(tenantRoutes, { prefix: "/api" });
fastify.register(dashboardRoutes, { prefix: "/api" });
fastify.register(dashboardManifestRoutes, { prefix: "/api/manifest" });
fastify.register(dashboardColumnsRoutes, { prefix: "/api" });

// Firebase Authentication routes
// fastify.register(firebaseAuthRoutes, { prefix: "/api/auth" }); // Deprecated, use Next Auth Service

// User Management routes
fastify.register(userManagementRoutes, { prefix: "/api" });

// OnPrem License Management routes
fastify.post("/api/tenants/:tenantId/onprem-licenses", generateLicense);
fastify.get("/api/tenants/:tenantId/onprem-licenses", listLicenses);
fastify.post("/api/onprem-licenses/permissions", getLicensePermissions);
fastify.patch(
  "/api/onprem-licenses/:licenseKey/sessions",
  updateLicenseSessions
);

// License validation endpoint for OnPrem Agent
fastify.post("/api/license/validate", async (request, reply) => {
  try {
    const { licenseKey } = request.body as { licenseKey: string };

    if (!licenseKey) {
      return reply.status(400).send({
        success: false,
        message: "License key is required",
      });
    }

    // Search for license across all tenants
    let licenseData = null;
    let tenantId = null;

    const tenantsSnapshot = await db.collection("tenants").get();

    for (const tenantDoc of tenantsSnapshot.docs) {
      const licenseDoc = await db
        .collection("tenants")
        .doc(tenantDoc.id)
        .collection("licenses")
        .doc(licenseKey)
        .get();

      if (licenseDoc.exists) {
        licenseData = licenseDoc.data();
        tenantId = tenantDoc.id;
        break;
      }
    }

    if (!licenseData) {
      return reply.status(404).send({
        success: false,
        message: "License not found",
      });
    }

    // Check if license is active
    if (!licenseData?.isActive) {
      return reply.status(403).send({
        success: false,
        message: "License is inactive",
      });
    }

    // Check if license is expired
    const expiryDate = new Date(licenseData.expiryDate);
    if (expiryDate < new Date()) {
      return reply.status(403).send({
        success: false,
        message: "License has expired",
      });
    }

    console.log("✅ License validated:", {
      licenseKey,
      tenantId: tenantId,
    });

    return reply.send({
      success: true,
      license: {
        licenseKey,
        tenantId: tenantId,
        companyName: licenseData.companyName,
        features: licenseData.features,
        maxConcurrentUsers: licenseData.maxConcurrentUsers,
        expiryDate: licenseData.expiryDate,
        authorizedEmails: licenseData.authorizedEmails || [licenseData.email],
      },
    });
  } catch (error) {
    console.error("❌ License validation error:", error);
    return reply.status(500).send({
      success: false,
      message: "License validation failed",
    });
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
