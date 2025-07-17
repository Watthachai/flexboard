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
          data = await this.fetchTimeSeriesData(config);
          break;
        case "bar-chart":
          data = await this.fetchBarChartData(config);
          break;
        case "pie-chart":
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
      timestamp: new Date().toISOString(),
      value: segment.value,
      label: segment.label,
      category: segment.label,
    }));
  }

  private async fetchTableData(config: any): Promise<any[]> {
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
