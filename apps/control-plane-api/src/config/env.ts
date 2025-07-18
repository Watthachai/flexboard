import { FastifyInstance } from "fastify";

// Environment configuration helper
export const envConfig = {
  // Server configuration
  port: parseInt(process.env.PORT || "3000"),
  host: process.env.HOST || "localhost",
  nodeEnv: process.env.NODE_ENV || "development",

  // API configuration
  apiPrefix: process.env.API_PREFIX || "/api",
  apiVersion: process.env.API_VERSION || "v1",

  // Database (Legacy - สำหรับ backward compatibility)
  databaseUrl: process.env.DATABASE_URL,

  // Firebase configuration
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID!,
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,

  // Security
  jwtSecret: process.env.JWT_SECRET!,
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3003",
  ],

  // Rate limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),

  // Other services
  onpremAgentApiUrl:
    process.env.ONPREM_AGENT_API_URL || "http://localhost:3001",
  onpremViewerUiUrl:
    process.env.ONPREM_VIEWER_UI_URL || "http://localhost:3002",
  controlPlaneUiUrl:
    process.env.CONTROL_PLANE_UI_URL || "http://localhost:3003",

  // Feature flags
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

// Export as 'config' for backward compatibility
export const config = envConfig;

// Validate required environment variables
export function validateEnvConfig() {
  const required = [
    { key: "FIREBASE_PROJECT_ID", value: envConfig.firebaseProjectId },
    { key: "JWT_SECRET", value: envConfig.jwtSecret },
  ];

  for (const { key, value } of required) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

// Server configuration helper
export function createServerConfig(fastify: FastifyInstance) {
  return {
    host: envConfig.host,
    port: envConfig.port,
  };
}
