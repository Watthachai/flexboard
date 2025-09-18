/**
 * Local Data Service for OnPrem Viewer
 * Handles fetching data from local Prisma APIs
 */

const DEBUG_LOGS = false; // Disabled for performance

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = Record<string, any>;

export interface DataSourceConfig {
  id: string;
  type: "api" | "local";
  url?: string;
  method?: "GET" | "POST";
  fieldTypes?: Record<string, string>;
  dateParsing?: Record<string, string>;
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    loadAll?: boolean;
  };
}

export class LocalDataService {
  private static instance: LocalDataService;
  private cache: Map<string, { data: DataRecord[]; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 30000000; // 30 seconds

  static getInstance(): LocalDataService {
    if (!LocalDataService.instance) {
      LocalDataService.instance = new LocalDataService();
    }
    return LocalDataService.instance;
  }

  /**
   * Fetch data from a configured data source
   */
  async fetchData(dataSource: DataSourceConfig): Promise<DataRecord[]> {
    if (DEBUG_LOGS)
      console.log("🔄 LocalDataService.fetchData called:", dataSource);

    // Check cache first
    const cached = this.cache.get(dataSource.id);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      if (DEBUG_LOGS)
        console.log("📦 Returning cached data for:", dataSource.id);
      return cached.data;
    }

    try {
      let data: DataRecord[] = [];

      if (dataSource.type === "api" && dataSource.url) {
        // Build URL with pagination parameters
        let apiUrl = dataSource.url;
        if (dataSource.pagination?.enabled) {
          const urlParams = new URLSearchParams();
          if (dataSource.pagination.loadAll) {
            urlParams.set("noPagination", "true");
            if (DEBUG_LOGS)
              console.log("🔄 Using noPagination=true for full data load");
          } else {
            urlParams.set(
              "pageSize",
              String(dataSource.pagination.pageSize || 1000)
            );
            urlParams.set("page", "1");
            if (DEBUG_LOGS)
              console.log(
                "🔄 Using pagination with pageSize:",
                dataSource.pagination.pageSize || 1000
              );
          }
          apiUrl += `?${urlParams.toString()}`;
        }

        if (DEBUG_LOGS) console.log("📡 Final API URL:", apiUrl);

        // Fetch from API endpoint
        const response = await fetch(apiUrl, {
          method: dataSource.method || "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        // Handle different response formats
        if (result.success && result.rows) {
          // For inventory API: {success: true, count: X, rows: [...]}
          data = Array.isArray(result.rows) ? result.rows : [result.rows];
        } else if (result.success && result.data) {
          // For other APIs: {success: true, data: [...]}
          data = Array.isArray(result.data) ? result.data : [result.data];
        } else if (result.inventory) {
          // Legacy format
          data = result.inventory;
        } else if (Array.isArray(result)) {
          // Direct array response
          data = result;
        } else {
          console.error("❌ Unexpected API response format:", result);
          throw new Error("Invalid API response format");
        }

        if (DEBUG_LOGS)
          console.log("✅ Fetched data from API:", {
            url: dataSource.url,
            recordCount: data.length,
            sampleRecord: data[0],
          });
      } else if (dataSource.type === "local") {
        // Fallback to localStorage for compatibility
        const savedData = localStorage.getItem("uploadedData");
        if (savedData) {
          data = JSON.parse(savedData);
          if (DEBUG_LOGS)
            console.log("📦 Loaded data from localStorage:", {
              recordCount: data.length,
            });
        } else {
          console.warn("⚠️ No data found in localStorage");
          data = [];
        }
      }

      // Cache the data
      this.cache.set(dataSource.id, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error("❌ LocalDataService.fetchData error:", error);

      // Fallback to localStorage if API fails
      try {
        const savedData = localStorage.getItem("uploadedData");
        if (savedData) {
          const fallbackData = JSON.parse(savedData);
          if (DEBUG_LOGS)
            console.log("🔄 Using localStorage fallback data:", {
              recordCount: fallbackData.length,
            });
          return fallbackData;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback data loading failed:", fallbackError);
      }

      throw error;
    }
  }

  /**
   * Clear cache for a specific data source or all caches
   */
  clearCache(dataSourceId?: string): void {
    if (dataSourceId) {
      this.cache.delete(dataSourceId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Check if data source has cached data
   */
  hasCachedData(dataSourceId: string): boolean {
    const cached = this.cache.get(dataSourceId);
    return !!(cached && Date.now() - cached.timestamp < this.CACHE_DURATION);
  }
}

export const localDataService = LocalDataService.getInstance();
