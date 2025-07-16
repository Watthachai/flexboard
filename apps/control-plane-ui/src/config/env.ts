// Environment configuration for Control Plane UI
export const envConfig = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  apiPrefix: process.env.NEXT_PUBLIC_API_PREFIX || "/api",
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || "v1",

  // Service URLs
  controlPlaneApiUrl:
    process.env.NEXT_PUBLIC_CONTROL_PLANE_API_URL || "http://localhost:3000",
  onpremAgentApiUrl:
    process.env.NEXT_PUBLIC_ONPREM_AGENT_API_URL || "http://localhost:3001",
  onpremViewerUiUrl:
    process.env.NEXT_PUBLIC_ONPREM_VIEWER_UI_URL || "http://localhost:3002",

  // Application Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Flexboard Dashboard Builder",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",

  // Debug Configuration
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || "info",

  // Feature Flags
  enableDashboardBuilder:
    process.env.NEXT_PUBLIC_ENABLE_DASHBOARD_BUILDER !== "false",
  enableWidgetTemplates:
    process.env.NEXT_PUBLIC_ENABLE_WIDGET_TEMPLATES !== "false",
  enableRealTimeData: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_DATA === "true",

  // Helper methods
  isDevelopment: process.env.NEXT_PUBLIC_ENVIRONMENT === "development",
  isProduction: process.env.NEXT_PUBLIC_ENVIRONMENT === "production",

  // API URL builder
  getApiUrl: (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const prefix = process.env.NEXT_PUBLIC_API_PREFIX || "/api";
    return `${baseUrl}${prefix}${endpoint}`;
  },

  // Local API proxy URL builder (for Next.js API routes)
  getProxyApiUrl: (endpoint: string) => {
    return `/api${endpoint}`;
  },
};

// Log configuration in development
if (typeof window !== "undefined" && envConfig.debugMode) {
  console.log("🔧 Environment Configuration:", {
    apiUrl: envConfig.apiUrl,
    environment: envConfig.environment,
    features: {
      dashboardBuilder: envConfig.enableDashboardBuilder,
      widgetTemplates: envConfig.enableWidgetTemplates,
      realTimeData: envConfig.enableRealTimeData,
    },
  });
}
