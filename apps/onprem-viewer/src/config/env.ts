// Environment configuration for OnPrem Viewer
export const envConfig = {
  // API Configuration
  controlPlaneApiUrl: getApiUrl(),

  // Application Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Flexboard OnPrem Viewer",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",

  // Viewer Configuration
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  refreshInterval: parseInt(
    process.env.NEXT_PUBLIC_REFRESH_INTERVAL || "30000"
  ),

  // OnPrem Network Configuration
  xmlDataPath: process.env.XML_DATA_PATH || getDefaultXmlPath(),
  hostname: process.env.HOSTNAME || "0.0.0.0",
  port: parseInt(process.env.PORT || "3002"),
  allowExternalAccess: true,
  syncIntervalMs: 5 * 60 * 1000, // 5 minutes
  isOnPrem: true,

  // Debug Configuration
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || "info",

  // Feature Flags
  enableRealTime: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME !== "false",
  enableExport: process.env.NEXT_PUBLIC_ENABLE_EXPORT !== "false",

  // Helper methods
  isDevelopment: process.env.NEXT_PUBLIC_ENVIRONMENT === "development",
  isProduction: process.env.NEXT_PUBLIC_ENVIRONMENT === "production",
  isSandbox: process.env.NEXT_PUBLIC_ENVIRONMENT === "sandbox",

  // API URL builder
  getControlPlaneApiUrl: (endpoint: string) => {
    const baseUrl = getApiUrl();
    return `${baseUrl}/api${endpoint}`;
  },
};

// Platform-specific XML data paths
function getDefaultXmlPath(): string {
  return process.platform === "win32"
    ? "C:\\flexboard\\xml-data"
    : "/opt/flexboard/xml-data";
}

// Helper function to determine API URL based on environment
function getApiUrl(): string {
  // If explicitly set via environment variable, use that
  if (process.env.NEXT_PUBLIC_CONTROL_PLANE_API_URL) {
    return process.env.NEXT_PUBLIC_CONTROL_PLANE_API_URL;
  }

  // Otherwise, determine based on environment
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "sandbox";

  switch (environment) {
    case "production":
      return "https://api-flexboard.fittcoreai.com";
    case "sandbox":
    default:
      return "https://sandbox.api-flexboard.fittcoreai.com";
  }
}
