/**
 * High Performance Data Service - Uses SQL Pushdown APIs
 * Replaces frontend filtering with database-level queries for better performance
 */

export interface FilterParams {
  corps?: string[];
  branches?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  noPagination?: boolean;
}

export interface KPIData {
  value_0_90: number;
  value_91_180: number;
  value_181_365: number;
  value_365_plus: number;
  qty_0_90: number;
  qty_91_180: number;
  qty_181_365: number;
  qty_365_plus: number;
  count_0_90: number;
  count_91_180: number;
  count_181_365: number;
  count_365_plus: number;
  totalValue: number;
  totalQty: number;
  totalRecords: number;
  percent_0_90: number;
  percent_91_180: number;
  percent_181_365: number;
  percent_365_plus: number;
}

export interface SummaryData {
  prod: string;
  unitName: string;
  totalQty: number;
  totalValue: number;
  qty_0_90: number;
  val_0_90: number;
  qty_91_180: number;
  val_91_180: number;
  qty_181_365: number;
  val_181_365: number;
  qty_365_plus: number;
  val_365_plus: number;
}

export interface RawDataResponse {
  success: boolean;
  count: number;
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  rows: Record<string, unknown>[];
  performanceMode: string;
  queryTimeMs: number;
  isInitialLoad?: boolean;
  hasMoreData?: boolean;
}

export class HighPerformanceDataService {
  private baseUrl = "";

  private buildQueryString(params: FilterParams): string {
    const queryParams = new URLSearchParams();

    if (params.corps && params.corps.length > 0) {
      queryParams.set("corps", params.corps.join(","));
    }

    if (params.branches && params.branches.length > 0) {
      queryParams.set("branches", params.branches.join(","));
    }

    if (params.dateFrom) {
      queryParams.set("dateFrom", params.dateFrom);
    }

    if (params.dateTo) {
      queryParams.set("dateTo", params.dateTo);
    }

    if (params.page) {
      queryParams.set("page", params.page.toString());
    }

    if (params.pageSize) {
      queryParams.set("pageSize", params.pageSize.toString());
    }

    if (params.sortBy) {
      queryParams.set("sortBy", params.sortBy);
    }

    if (params.sortOrder) {
      queryParams.set("sortOrder", params.sortOrder);
    }

    if (params.noPagination) {
      queryParams.set("noPagination", "true");
    }

    return queryParams.toString();
  }

  async fetchKPI(filters: FilterParams = {}): Promise<KPIData> {
    const queryString = this.buildQueryString(filters);
    const url = `/api/inventory/kpi${queryString ? "?" + queryString : ""}`;

    console.log(`[HighPerf] Fetching KPI data: ${url}`);

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch KPI data");
    }

    console.log(`[HighPerf] KPI data fetched successfully`, result.data);
    return result.data;
  }

  async fetchSummary(filters: FilterParams = {}): Promise<SummaryData[]> {
    const queryString = this.buildQueryString(filters);
    const url = `/api/inventory/summary${queryString ? "?" + queryString : ""}`;

    console.log(`[HighPerf] Fetching summary data: ${url}`);

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch summary data");
    }

    console.log(`[HighPerf] Summary data fetched: ${result.count} products`);
    return result.rows;
  }

  async fetchRawData(filters: FilterParams = {}): Promise<RawDataResponse> {
    // First load: Get first 500 records for fast initial display
    const initialFilters = {
      ...filters,
      page: 1,
      pageSize: 500,
    };
    const queryString = this.buildQueryString(initialFilters);
    const url = `/api/inventory/raw${queryString ? "?" + queryString : ""}`;

    console.log(`[HighPerf] Fetching raw data (initial 500): ${url}`);

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch raw data");
    }

    console.log(
      `[HighPerf] Raw data fetched: ${result.count}/${result.totalRecords} records (page ${result.page}/${result.totalPages}) in ${result.queryTimeMs}ms`
    );

    // Mark that this is initial load, more data available
    result.isInitialLoad = true;
    result.hasMoreData = result.totalRecords > result.count;

    return result;
  }

  // Method to load ALL remaining data in background
  async fetchAllRawData(filters: FilterParams = {}): Promise<RawDataResponse> {
    // Load ALL data without pagination
    const allDataFilters = { ...filters, noPagination: true };
    const queryString = this.buildQueryString(allDataFilters);
    const url = `/api/inventory/raw${queryString ? "?" + queryString : ""}`;

    console.log(`[HighPerf] Fetching ALL raw data: ${url}`);

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch all raw data");
    }

    console.log(
      `[HighPerf] ALL raw data fetched: ${result.count}/${result.totalRecords} records in ${result.queryTimeMs}ms`
    );
    return result;
  }

  // Method to load more raw data (next page)
  async loadMoreRawData(
    currentData: Record<string, unknown>[],
    currentPage: number,
    filters: FilterParams = {}
  ): Promise<RawDataResponse> {
    const nextPage = currentPage + 1;
    const filtersWithNextPage = {
      ...filters,
      page: nextPage,
      pageSize: filters.pageSize || 1000,
    };

    console.log(`[HighPerf] Loading more raw data - Page ${nextPage}`);
    const result = await this.fetchRawData(filtersWithNextPage);

    // Merge with existing data
    result.rows = [...currentData, ...result.rows];
    result.count = result.rows.length;

    return result;
  }

  // Helper method to check if large dataset should use high-performance mode
  async shouldUseHighPerformanceMode(): Promise<boolean> {
    try {
      const kpi = await this.fetchKPI();
      const threshold = 50000; // 50k records threshold
      return kpi.totalRecords > threshold;
    } catch {
      console.warn(
        "[HighPerf] Failed to check dataset size, defaulting to normal mode"
      );
      return false;
    }
  }

  // Helper to convert filters to old format for backward compatibility
  static convertGlobalFiltersToParams(
    globalFilters: Record<string, unknown>
  ): FilterParams {
    const params: FilterParams = {};

    if (
      globalFilters?.Corp &&
      Array.isArray(globalFilters.Corp) &&
      globalFilters.Corp.length > 0
    ) {
      params.corps = globalFilters.Corp as string[];
    }

    if (
      globalFilters?.Branch &&
      Array.isArray(globalFilters.Branch) &&
      globalFilters.Branch.length > 0
    ) {
      params.branches = globalFilters.Branch as string[];
    }

    if (
      globalFilters?.dateRange &&
      typeof globalFilters.dateRange === "object" &&
      globalFilters.dateRange !== null
    ) {
      const dateRange = globalFilters.dateRange as Record<string, unknown>;
      if (dateRange.from && typeof dateRange.from === "string") {
        params.dateFrom = dateRange.from;
      }
      if (dateRange.to && typeof dateRange.to === "string") {
        params.dateTo = dateRange.to;
      }
    }

    return params;
  }
}

export const highPerformanceDataService = new HighPerformanceDataService();
