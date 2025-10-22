/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Manifest Sync Service - Handles dashboard configuration synchronization
 */

import { envConfig } from "@/config/env";

export interface DashboardManifest {
  schemaVersion: string;
  dashboardId: string;
  dashboardName: string;
  description: string;
  version: number;
  targetTeams: string[];
  layout: {
    type: string;
    columns: number;
    rowHeight: number;
  };
  widgets: any[];
  dataSources: any[];
  transforms?: { as: string; expr: string }[];
  globalFilters?: Array<{
    type: "date" | "dropdown" | "search" | "monthYearPicker" | "dateRange";
    field?: string;
    label?: string;
    options?: any[];
    config?: {
      startYear?: number;
      endYear?: number;
      defaultValue?: string;
      startDateLabel?: string;
      endDateLabel?: string;
    };
  }>;
}

export interface SyncConfig {
  controlPlaneUrl: string;
  licenseKey: string;
  tenantId: string;
  syncInterval: number;
}

class ManifestSyncService {
  private config: SyncConfig | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private cachedTenantId: string | null = null;
  private tenantIdCacheExpiry: number = 0;
  private readonly TENANT_CACHE_DURATION = 10 * 60 * 1000; // Cache for 10 minutes

  constructor() {
    this.loadConfig();
  }

  private async getSessionTenantId(): Promise<string | null> {
    // Return cached tenant ID if still valid
    if (this.cachedTenantId && Date.now() < this.tenantIdCacheExpiry) {
      return this.cachedTenantId;
    }

    try {
      // Get tenant ID from current session
      const response = await fetch("/api/auth/validate");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.license?.tenantId) {
          // Cache the tenant ID
          this.cachedTenantId = result.license.tenantId;
          this.tenantIdCacheExpiry = Date.now() + this.TENANT_CACHE_DURATION;
          return this.cachedTenantId;
        }
      }
      return null;
    } catch (error) {
      console.warn("Failed to get session tenant ID:", error);
      return null;
    }
  }

  private async getCurrentConfig(): Promise<SyncConfig> {
    // Start with saved config or defaults
    const config = this.config || {
      controlPlaneUrl: envConfig.controlPlaneApiUrl,
      licenseKey: "demo-license-key",
      tenantId: "test-company", // Default fallback
      syncInterval: 15,
    };

    console.log("Current config before session check:", {
      controlPlaneUrl: config.controlPlaneUrl,
      tenantId: config.tenantId,
      hasLicenseKey: !!config.licenseKey,
    });

    // Try to get real tenant ID from session
    const sessionTenantId = await this.getSessionTenantId();
    if (sessionTenantId) {
      config.tenantId = sessionTenantId;
      console.log(`Using tenant ID from session: ${sessionTenantId}`);
    } else {
      console.warn(
        "Could not get tenant ID from session, using config default"
      );
    }

    return config;
  }

  private loadConfig() {
    try {
      // ตรวจสอบว่าเรากำลังรันใน browser หรือไม่ (client-side)
      if (typeof window !== "undefined" && window.localStorage) {
        const savedConfig = localStorage.getItem("onprem-manifest-config");
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);

          // Fix old incorrect URLs
          if (
            parsed.controlPlaneUrl &&
            parsed.controlPlaneUrl.includes("your-control-plane.com")
          ) {
            console.warn("Fixing old incorrect Control Plane URL");
            parsed.controlPlaneUrl = envConfig.controlPlaneApiUrl;
          }

          this.config = {
            controlPlaneUrl:
              parsed.controlPlaneUrl || envConfig.controlPlaneApiUrl,
            licenseKey: parsed.licenseKey || "demo-license-key",
            tenantId: parsed.tenantId || "test-company", // Changed default
            syncInterval: parsed.syncInterval || 15,
          };

          console.log("Loaded config from localStorage:", {
            controlPlaneUrl: this.config.controlPlaneUrl,
            tenantId: this.config.tenantId,
            hasLicenseKey: !!this.config.licenseKey,
          });
        } else {
          console.log("No saved config found, using defaults");
        }
      } else {
        // สำหรับ SSR ใช้ default config
        console.log("Running in SSR mode, using default config");
      }
    } catch (error) {
      console.error("Failed to load sync config:", error);
    }
  }

  async syncManifests(): Promise<{
    success: boolean;
    manifests?: DashboardManifest[];
    error?: string;
  }> {
    try {
      // Get current config with session tenant ID
      const config = await this.getCurrentConfig();

      console.log("🔄 Syncing dashboard manifests from Control Plane...");
      console.log(`Connecting to: ${config.controlPlaneUrl}`);
      console.log(`Tenant ID: ${config.tenantId}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Use the correct API endpoint to get all dashboards for the tenant
      const response = await fetch(
        `${config.controlPlaneUrl}/api/dashboard-as-code/tenants/${config.tenantId}/dashboards`,
        {
          headers: {
            Authorization: `Bearer ${config.licenseKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Control Plane API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();

      if (result.success && result.data && Array.isArray(result.data)) {
        // Convert API response to manifest format
        const manifests: DashboardManifest[] = result.data.map(
          (dashboard: any) => ({
            schemaVersion: "1.0",
            dashboardId: dashboard.dashboardId,
            dashboardName: dashboard.name || dashboard.dashboardName,
            description:
              dashboard.description || "Dashboard from Control Plane",
            version: dashboard.version || 1,
            targetTeams: dashboard.targetTeams || ["default"],
            layout: dashboard.layout || {
              type: "grid",
              columns: 12,
              rowHeight: 50,
            },
            widgets: dashboard.widgets || [],
            dataSources: dashboard.dataSources || [],
          })
        );

        // Cache manifests locally (only in browser)
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(
            "onprem-cached-manifests",
            JSON.stringify(manifests)
          );
          localStorage.setItem("onprem-last-sync", new Date().toISOString());
        }

        console.log(
          `✅ Successfully synced ${manifests.length} dashboard manifests`
        );
        return { success: true, manifests };
      }

      return {
        success: false,
        error: "No dashboard data received from Control Plane",
      };
    } catch (error) {
      console.error("❌ Manifest sync failed:", error);

      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Connection timeout - Control Plane not responding";
        } else if (error.message.includes("fetch")) {
          errorMessage = "Network error - Cannot connect to Control Plane";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Method to fetch specific dashboard manifest with license validation
  async fetchDashboardManifest(dashboardId: string): Promise<{
    success: boolean;
    manifest?: DashboardManifest;
    error?: string;
  }> {
    try {
      const config = await this.getCurrentConfig();

      console.log(`🔄 Fetching manifest for dashboard: ${dashboardId}`);
      console.log(`Tenant ID: ${config.tenantId}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Fetch specific dashboard manifest from control-plane-api
      const response = await fetch(
        `${config.controlPlaneUrl}/api/tenants/${config.tenantId}/dashboards/${dashboardId}/manifest`,
        {
          headers: {
            Authorization: `Bearer ${config.licenseKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Access denied - Invalid license or dashboard not authorized"
          );
        } else if (response.status === 404) {
          throw new Error("Dashboard not found");
        }

        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Control Plane API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();

      console.log("🔍 Raw API Response:", {
        success: result.success,
        hasData: !!result.data,
        hasManifestContent: !!result.data?.manifestContent,
        dataKeys: result.data ? Object.keys(result.data) : [],
        manifestContentLength: result.data?.manifestContent?.length || 0,
      });

      if (result.success && result.data) {
        // Parse manifestContent if it exists (Firebase format)
        let manifestData = result.data;
        if (result.data.manifestContent) {
          try {
            const parsedManifest = JSON.parse(result.data.manifestContent);
            console.log("📋 Parsed manifestContent successfully:", {
              hasTransforms: !!parsedManifest.transforms,
              transformsLength: parsedManifest.transforms?.length || 0,
              hasGlobalFilters: !!parsedManifest.globalFilters,
              globalFiltersLength: parsedManifest.globalFilters?.length || 0,
              globalFilters: parsedManifest.globalFilters,
            });
            manifestData = parsedManifest;
          } catch (error) {
            console.error("Failed to parse manifestContent:", error);
            // Fall back to using result.data as-is
          }
        } else {
          // Direct API format - data is already in the right structure
          console.log("📋 Using direct API format:", {
            hasTransforms: !!manifestData.transforms,
            transformsLength: manifestData.transforms?.length || 0,
            hasGlobalFilters: !!manifestData.globalFilters,
            globalFiltersLength: manifestData.globalFilters?.length || 0,
            globalFilters: manifestData.globalFilters,
          });

          // If no globalFilters in direct API, try to fetch from Firebase
          if (
            !manifestData.globalFilters ||
            manifestData.globalFilters.length === 0
          ) {
            try {
              console.log(
                "🔥 Trying to fetch manifestContent from Firebase..."
              );
              const firebaseUrl = `${config.controlPlaneUrl}/api/tenants/${config.tenantId}/dashboards/${dashboardId}/config/manifest`;
              const firebaseResponse = await fetch(firebaseUrl, {
                headers: {
                  Authorization: `Bearer ${config.licenseKey}`,
                  "Content-Type": "application/json",
                },
              });

              if (firebaseResponse.ok) {
                const firebaseResult = await firebaseResponse.json();
                if (
                  firebaseResult.success &&
                  firebaseResult.data?.manifestContent
                ) {
                  const firebaseManifest = JSON.parse(
                    firebaseResult.data.manifestContent
                  );
                  console.log(
                    "🔥 Found globalFilters in Firebase:",
                    firebaseManifest.globalFilters
                  );
                  manifestData.globalFilters =
                    firebaseManifest.globalFilters || [];
                }
              }
            } catch (firebaseError) {
              console.log("🔥 Firebase fallback failed:", firebaseError);
            }
          }
        }

        const manifest: DashboardManifest = {
          schemaVersion: manifestData.schemaVersion || "1.0",
          dashboardId: manifestData.dashboardId,
          dashboardName: manifestData.dashboardName || manifestData.name,
          description:
            manifestData.description || "Dashboard from Control Plane",
          version: manifestData.version || 1,
          targetTeams: manifestData.targetTeams || ["default"],
          layout: manifestData.layout || {
            type: "grid",
            columns: 12,
            rowHeight: 50,
          },
          widgets: manifestData.widgets || [],
          dataSources: manifestData.dataSources || [],
          transforms: manifestData.transforms || [], // Now correctly parsed from manifestContent
          globalFilters: manifestData.globalFilters || [], // Include globalFilters from API
        };

        console.log("📋 Final manifest object:", {
          dashboardId: manifest.dashboardId,
          hasGlobalFilters: !!manifest.globalFilters,
          globalFiltersCount: manifest.globalFilters?.length || 0,
          globalFilters: manifest.globalFilters,
          manifestDataGlobalFilters: manifestData.globalFilters,
        });

        console.log(`✅ Successfully fetched manifest for ${dashboardId}`);
        return { success: true, manifest };
      }

      return {
        success: false,
        error: "No manifest data received from Control Plane",
      };
    } catch (error) {
      console.error(`❌ Failed to fetch manifest for ${dashboardId}:`, error);

      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Connection timeout - Control Plane not responding";
        } else if (error.message.includes("fetch")) {
          errorMessage = "Network error - Cannot connect to Control Plane";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private convertWidgetsFromAPI(apiWidgets: any[]): any[] {
    return apiWidgets.map((widget, index) => {
      // Convert API widget format to manifest format
      const baseWidget = {
        id: widget.id || `widget-${Date.now()}-${index}`,
        type: widget.type || "chart",
        title: widget.title || `Chart ${index + 1}`,
        dataSource: "uploaded-data",
        config: {
          ...widget.config,
          dataSource: "uploaded-data",
        },
        layout: {
          x: (index % 4) * 3,
          y: Math.floor(index / 4) * 4,
          width: 6,
          height: 4,
        },
      };

      return baseWidget;
    });
  }

  getCachedManifests(): DashboardManifest[] {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const cached = localStorage.getItem("onprem-cached-manifests");
        return cached ? JSON.parse(cached) : [];
      }
      return [];
    } catch (error) {
      console.error("Failed to load cached manifests:", error);
      return [];
    }
  }

  getLastSyncTime(): string | null {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("onprem-last-sync");
    }
    return null;
  }

  async startAutoSync() {
    // Use default config for auto-sync interval, actual sync will get real tenant ID
    // Changed from 15 minutes to 120 minutes (2 hours) to reduce API calls
    const config = this.config || { syncInterval: 120 };
    if (this.syncTimer) return;

    const intervalMs = config.syncInterval * 60 * 1000; // Convert to milliseconds

    this.syncTimer = setInterval(async () => {
      console.log("🕐 Auto-syncing dashboard manifests...");
      await this.syncManifests();
    }, intervalMs);

    console.log(
      `⏰ Auto-sync started with ${config.syncInterval} minute interval`
    );
  }

  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log("⏹️ Auto-sync stopped");
    }
  }

  updateConfig(newConfig: Partial<SyncConfig>) {
    this.config = { ...this.config!, ...newConfig };

    // Save to localStorage (only in browser)
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(
        "onprem-manifest-config",
        JSON.stringify({
          controlPlaneUrl: this.config.controlPlaneUrl,
          licenseKey: this.config.licenseKey,
          tenantId: this.config.tenantId,
          syncInterval: this.config.syncInterval,
        })
      );
    }

    // Restart auto-sync with new config
    this.stopAutoSync();
    this.startAutoSync();
  }

  clearConfig() {
    // Clear localStorage config
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("onprem-manifest-config");
      localStorage.removeItem("onprem-cached-manifests");
      localStorage.removeItem("onprem-last-sync");
      console.log("Cleared all saved configuration");
    }

    // Reset to defaults
    this.config = {
      controlPlaneUrl: envConfig.controlPlaneApiUrl,
      licenseKey: "demo-license-key",
      tenantId: "test-company",
      syncInterval: 15,
    };
  }
}

export const manifestSyncService = new ManifestSyncService();
