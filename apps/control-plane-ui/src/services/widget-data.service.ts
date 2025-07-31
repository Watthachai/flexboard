/**
 * Widget Data Service
 * Handles fetching real data for widgets from various sources
 */

export interface WidgetDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  category?: string;
}

export interface WidgetData {
  id: string;
  type: string;
  data: WidgetDataPoint[] | any;
  lastUpdated: string;
  isLoading: boolean;
  error?: string;
}

export class WidgetDataService {
  private static instance: WidgetDataService;
  private cache: Map<string, WidgetData> = new Map();
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): WidgetDataService {
    if (!WidgetDataService.instance) {
      WidgetDataService.instance = new WidgetDataService();
    }
    return WidgetDataService.instance;
  }

  async fetchWidgetData(
    widgetId: string,
    widgetType: string,
    config: any
  ): Promise<WidgetData> {
    const cacheKey = `${widgetId}_${widgetType}`;

    // Return cached data if available and not expired
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isExpired(cached.lastUpdated)) {
      return cached;
    }

    const widgetData: WidgetData = {
      id: widgetId,
      type: widgetType,
      data: [],
      lastUpdated: new Date().toISOString(),
      isLoading: true,
    };

    this.cache.set(cacheKey, widgetData);

    try {
      let data;

      switch (widgetType) {
        case "kpi":
          data = await this.fetchKPIData(config);
          break;
        case "line-chart":
        case "line":
          data = await this.fetchTimeSeriesData(config);
          break;
        case "bar-chart":
        case "bar":
          data = await this.fetchBarChartData(config);
          break;
        case "pie-chart":
        case "pie":
          data = await this.fetchPieChartData(config);
          break;
        case "table":
          data = await this.fetchTableData(config);
          break;
        default:
          data = await this.fetchGenericData(config);
      }

      widgetData.data = data;
      widgetData.isLoading = false;
      widgetData.lastUpdated = new Date().toISOString();

      this.cache.set(cacheKey, widgetData);

      return widgetData;
    } catch (error) {
      widgetData.isLoading = false;
      widgetData.error =
        error instanceof Error ? error.message : "Unknown error";
      this.cache.set(cacheKey, widgetData);
      return widgetData;
    }
  }

  private async fetchKPIData(config: any): Promise<any> {
    // Check if data source is uploaded XML data
    if (
      (config.dataSource === "uploaded-data" ||
        config.dataSource === "uploadedData") &&
      config.tenantId
    ) {
      try {
        const response = await fetch(
          `/api/tenants/${config.tenantId}/data?columns=${config.column || config.yAxis || ""}&limit=1000`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            // Calculate KPI value from uploaded data
            const column =
              config.column || config.yAxis || result.availableColumns[0];
            if (column && result.data[0][column] !== undefined) {
              const values = result.data
                .map((record: any) => parseFloat(record[column]) || 0)
                .filter((val: number) => !isNaN(val));

              if (values.length > 0) {
                let kpiValue;
                switch (config.calculation || "sum") {
                  case "avg":
                  case "average":
                    kpiValue =
                      values.reduce((a: number, b: number) => a + b, 0) /
                      values.length;
                    break;
                  case "max":
                    kpiValue = Math.max(...values);
                    break;
                  case "min":
                    kpiValue = Math.min(...values);
                    break;
                  case "count":
                    kpiValue = result.data.length;
                    break;
                  default: // sum
                    kpiValue = values.reduce(
                      (a: number, b: number) => a + b,
                      0
                    );
                }

                return {
                  value: kpiValue,
                  label:
                    config.title ||
                    `${config.calculation || "Total"} ${column}`,
                  timestamp: new Date().toISOString(),
                  source: "uploaded-xml",
                };
              }
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch XML data for KPI:", error);
      }
    }

    // Try to fetch from our API first
    try {
      const response = await fetch(
        `/api/widgets/${config.widgetId || "temp"}/data?type=kpi&tenantId=${config.tenantId || "default"}`
      );
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.warn("Failed to fetch from API, using mock data:", error);
    }

    // Fallback to mock data
    return {
      value: Math.floor(Math.random() * 1000),
      change: Math.floor(Math.random() * 20) - 10,
      trend: Math.random() > 0.5 ? "up" : "down",
      unit: "%",
    };
  }

  private async fetchTimeSeriesData(config: any): Promise<WidgetDataPoint[]> {
    // Check if data source is uploaded XML data
    if (
      (config.dataSource === "uploaded-data" ||
        config.dataSource === "uploadedData") &&
      config.tenantId
    ) {
      try {
        const response = await fetch(
          `/api/tenants/${config.tenantId}/data?limit=1000`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            const xAxis =
              config.xAxis ||
              result.availableColumns.find(
                (col: string) =>
                  col.toLowerCase().includes("date") ||
                  col.toLowerCase().includes("time")
              ) ||
              result.availableColumns[0];
            const yAxis = config.yAxis || result.availableColumns[1];

            if (xAxis && yAxis) {
              return result.data
                .map((record: any) => ({
                  name: String(record[xAxis] || ""), // Recharts uses 'name' for X-axis
                  value: parseFloat(record[yAxis]) || 0, // Standard value field
                  [yAxis]: parseFloat(record[yAxis]) || 0, // Keep original column name
                  [xAxis]: record[xAxis], // Keep original column name
                  timestamp: record[xAxis] || new Date().toISOString(),
                  label: String(record[xAxis] || ""),
                }))
                .filter((item: any) => !isNaN(item.value))
                .slice(0, 50); // Limit to 50 points for performance
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch XML data for line chart:", error);
      }
    }

    // Try to fetch from our API first
    try {
      const response = await fetch(
        `/api/widgets/${config.widgetId || "temp"}/data?type=line-chart&tenantId=${config.tenantId || "default"}`
      );
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.warn("Failed to fetch from API, using mock data:", error);
    }

    // Fallback to mock data
    const now = new Date();
    const data: WidgetDataPoint[] = [];

    for (let i = 29; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.floor(Math.random() * 100) + 50,
        label: timestamp.toLocaleDateString(),
      });
    }

    return data;
  }

  private async fetchBarChartData(config: any): Promise<WidgetDataPoint[]> {
    console.log("fetchBarChartData called with config:", config);

    // Check if data source is uploaded XML data
    if (
      (config.dataSource === "uploaded-data" ||
        config.dataSource === "uploadedData") &&
      config.tenantId
    ) {
      try {
        const url = `/api/tenants/${config.tenantId}/data?limit=1000`;
        console.log("Fetching data from:", url);

        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          console.log("API response:", result);

          if (result.success && result.data && result.data.length > 0) {
            const xAxis = config.xAxis || result.availableColumns[0];
            const yAxis = config.yAxis || result.availableColumns[1];

            console.log("Using xAxis:", xAxis, "yAxis:", yAxis);

            if (xAxis && yAxis) {
              // Group data by xAxis and sum yAxis values
              const grouped: { [key: string]: number } = {};

              result.data.forEach((record: any) => {
                const category = String(record[xAxis] || "Unknown");
                const value = parseFloat(record[yAxis]) || 0;

                if (!isNaN(value)) {
                  grouped[category] = (grouped[category] || 0) + value;
                }
              });

              console.log("Grouped data:", grouped);

              const transformedData = Object.entries(grouped)
                .slice(0, 10) // Limit to top 10 categories
                .map(([category, value]) => ({
                  name: category, // Recharts uses 'name' for X-axis labels
                  value: value, // Standard value field
                  [yAxis]: value, // Keep original column name for flexibility
                  [xAxis]: category, // Keep original column name
                  timestamp: new Date().toISOString(),
                  label: category,
                  category: category,
                }));

              console.log("Transformed data for bar chart:", transformedData);
              return transformedData;
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch XML data for bar chart:", error);
      }
    }

    // Try to fetch from our API first
    try {
      const response = await fetch(
        `/api/widgets/${config.widgetId || "temp"}/data?type=bar-chart&tenantId=${config.tenantId || "default"}`
      );
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.warn("Failed to fetch from API, using mock data:", error);
    }

    // Fallback to mock data
    const categories = [
      "Product A",
      "Product B",
      "Product C",
      "Product D",
      "Product E",
    ];
    return categories.map((category) => ({
      timestamp: new Date().toISOString(),
      value: Math.floor(Math.random() * 100) + 10,
      label: category,
      category,
    }));
  }

  private async fetchPieChartData(config: any): Promise<WidgetDataPoint[]> {
    // Check if data source is uploaded XML data
    if (
      (config.dataSource === "uploaded-data" ||
        config.dataSource === "uploadedData") &&
      config.tenantId
    ) {
      try {
        const columnsParam = config.columns ? config.columns.join(",") : "";
        const response = await fetch(
          `/api/tenants/${config.tenantId}/data?columns=${columnsParam}&limit=${config.limit || 100}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            // For pie charts, group by the first column and count occurrences
            const valueField =
              config.columns && config.columns[0]
                ? config.columns[0]
                : Object.keys(result.data[0])[0];

            // Group by value and count
            const grouped = result.data.reduce((acc: any, record: any) => {
              const key = String(record[valueField] || "Unknown");
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {});

            return Object.entries(grouped).map(([key, count]) => ({
              name: key, // Recharts uses 'name' for pie segment labels
              value: count, // Standard value field
              label: key, // Additional label field
              count: count, // Keep count for backwards compatibility
              timestamp: new Date().toISOString(),
              category: key,
            }));
          }
        }
      } catch (error) {
        console.warn("Failed to fetch XML data for pie chart:", error);
      }
    }

    // Try to fetch from our API first
    try {
      const response = await fetch(
        `/api/widgets/${config.widgetId || "temp"}/data?type=pie-chart&tenantId=${config.tenantId || "default"}`
      );
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.warn("Failed to fetch from API, using mock data:", error);
    }

    // Fallback to mock data
    const segments = [
      { label: "Desktop", value: 65 },
      { label: "Mobile", value: 25 },
      { label: "Tablet", value: 10 },
    ];

    return segments.map((segment) => ({
      name: segment.label, // Recharts uses 'name' for pie segment labels
      value: segment.value, // Standard value field
      label: segment.label, // Additional label field
      timestamp: new Date().toISOString(),
      category: segment.label,
    }));
  }

  private async fetchTableData(config: any): Promise<any[]> {
    // Check if data source is uploaded XML data
    if (
      (config.dataSource === "uploaded-data" ||
        config.dataSource === "uploadedData") &&
      config.tenantId
    ) {
      try {
        const columnsParam = config.columns ? config.columns.join(",") : "";
        const response = await fetch(
          `/api/tenants/${config.tenantId}/data?columns=${columnsParam}&limit=${config.limit || 100}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            return result.data;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch XML data for table:", error);
      }
    }

    // Try to fetch from our API first
    try {
      const response = await fetch(
        `/api/widgets/${config.widgetId || "temp"}/data?type=table&tenantId=${config.tenantId || "default"}`
      );
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.warn("Failed to fetch from API, using mock data:", error);
    }

    // Fallback to mock data
    return [
      { id: 1, name: "Product A", sales: 1200, growth: 15 },
      { id: 2, name: "Product B", sales: 980, growth: -5 },
      { id: 3, name: "Product C", sales: 1500, growth: 25 },
      { id: 4, name: "Product D", sales: 750, growth: 8 },
    ];
  }

  private async fetchGenericData(config: any): Promise<any> {
    if (config.dataSource === "api" && config.apiEndpoint) {
      const response = await fetch(config.apiEndpoint);
      return await response.json();
    }

    return { message: "No data available" };
  }

  private isExpired(lastUpdated: string): boolean {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMinutes = (now.getTime() - updated.getTime()) / (1000 * 60);
    return diffMinutes > 5; // Consider data stale after 5 minutes
  }

  setupAutoRefresh(
    widgetId: string,
    widgetType: string,
    config: any,
    interval: number = 30000
  ): void {
    const existingInterval = this.refreshIntervals.get(widgetId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const refreshInterval = setInterval(() => {
      this.fetchWidgetData(widgetId, widgetType, config);
    }, interval);

    this.refreshIntervals.set(widgetId, refreshInterval);
  }

  clearAutoRefresh(widgetId: string): void {
    const interval = this.refreshIntervals.get(widgetId);
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(widgetId);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const widgetDataService = WidgetDataService.getInstance();
