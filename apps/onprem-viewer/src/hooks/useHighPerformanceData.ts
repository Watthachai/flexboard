/**
 * React Hook for High Performance Data Service
 * Automatically switches between SQL pushdown and frontend filtering based on dataset size
 */

import { useState, useEffect, useCallback } from "react";
import {
  highPerformanceDataService,
  FilterParams,
  KPIData,
  SummaryData,
  RawDataResponse,
} from "../services/highPerformanceDataService";

export interface UseHighPerformanceDataOptions {
  autoDetect?: boolean; // Auto-detect if high-performance mode should be used
  forceHighPerformance?: boolean; // Force high-performance mode
  initialFilters?: FilterParams;
}

export interface UseHighPerformanceDataReturn {
  // Data
  kpiData: KPIData | null;
  summaryData: SummaryData[];
  rawData: RawDataResponse | null;

  // Loading states
  kpiLoading: boolean;
  summaryLoading: boolean;
  rawLoading: boolean;

  // Error states
  kpiError: string | null;
  summaryError: string | null;
  rawError: string | null;

  // Methods
  refreshKPI: (filters?: FilterParams) => Promise<void>;
  refreshSummary: (filters?: FilterParams) => Promise<void>;
  refreshRawData: (filters?: FilterParams) => Promise<void>;
  refreshAll: (filters?: FilterParams) => Promise<void>;
  loadAllRawData: () => Promise<void>;

  // State
  isHighPerformanceMode: boolean;
  totalRecords: number;
  isLoadingAllData: boolean;
  hasAllData: boolean;
}

export function useHighPerformanceData(
  options: UseHighPerformanceDataOptions = {}
): UseHighPerformanceDataReturn {
  const {
    autoDetect = true,
    forceHighPerformance = false,
    initialFilters = {},
  } = options;

  // Data states
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [rawData, setRawData] = useState<RawDataResponse | null>(null);

  // Loading states
  const [kpiLoading, setKpiLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [rawLoading, setRawLoading] = useState(false);

  // Error states
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);

  // Performance mode state
  const [isHighPerformanceMode, setIsHighPerformanceMode] =
    useState(forceHighPerformance);
  const [totalRecords, setTotalRecords] = useState(0);

  // Pagination states
  const [isLoadingAllData, setIsLoadingAllData] = useState(false);
  const [hasAllData, setHasAllData] = useState(false);

  // Detect if high-performance mode should be used
  useEffect(() => {
    if (forceHighPerformance) {
      setIsHighPerformanceMode(true);
      return;
    }

    if (autoDetect) {
      highPerformanceDataService
        .shouldUseHighPerformanceMode()
        .then((shouldUse: boolean) => {
          console.log(
            `[useHighPerf] Auto-detect high-performance mode: ${shouldUse}`
          );
          setIsHighPerformanceMode(shouldUse);
        })
        .catch((error: unknown) => {
          console.warn(
            "[useHighPerf] Failed to auto-detect performance mode:",
            error
          );
          setIsHighPerformanceMode(false);
        });
    }
  }, [autoDetect, forceHighPerformance]);

  // Refresh KPI data
  const refreshKPI = useCallback(
    async (filters: FilterParams = {}) => {
      if (!isHighPerformanceMode) return;

      setKpiLoading(true);
      setKpiError(null);

      try {
        const data = await highPerformanceDataService.fetchKPI(filters);
        setKpiData(data);
        setTotalRecords(data.totalRecords);
        console.log(
          `[useHighPerf] KPI refreshed: ${data.totalRecords} total records`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch KPI data";
        setKpiError(errorMessage);
        console.error("[useHighPerf] KPI error:", error);
      } finally {
        setKpiLoading(false);
      }
    },
    [isHighPerformanceMode]
  );

  // Refresh summary data
  const refreshSummary = useCallback(
    async (filters: FilterParams = {}) => {
      if (!isHighPerformanceMode) return;

      setSummaryLoading(true);
      setSummaryError(null);

      try {
        const data = await highPerformanceDataService.fetchSummary(filters);
        setSummaryData(data);
        console.log(`[useHighPerf] Summary refreshed: ${data.length} products`);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch summary data";
        setSummaryError(errorMessage);
        console.error("[useHighPerf] Summary error:", error);
      } finally {
        setSummaryLoading(false);
      }
    },
    [isHighPerformanceMode]
  );

  // Refresh raw data
  const refreshRawData = useCallback(
    async (filters: FilterParams = {}) => {
      if (!isHighPerformanceMode) return;

      setRawLoading(true);
      setRawError(null);

      try {
        const data = await highPerformanceDataService.fetchRawData(filters);
        setRawData(data);
        setHasAllData(!data.hasMoreData); // If no more data, we have all
        console.log(
          `[useHighPerf] Raw data refreshed: ${data.count}/${data.totalRecords} records (initial load: ${data.isInitialLoad})`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch raw data";
        setRawError(errorMessage);
        console.error("[useHighPerf] Raw data error:", error);
      } finally {
        setRawLoading(false);
      }
    },
    [isHighPerformanceMode]
  );

  // Load ALL raw data in background
  const loadAllRawData = useCallback(async () => {
    if (!isHighPerformanceMode || hasAllData || isLoadingAllData) return;

    setIsLoadingAllData(true);
    try {
      const allData = await highPerformanceDataService.fetchAllRawData({});
      setRawData(allData);
      setHasAllData(true);
      console.log(
        `[useHighPerf] ALL raw data loaded: ${allData.count}/${allData.totalRecords} total records`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load all data";
      setRawError(errorMessage);
      console.error("[useHighPerf] Load all data error:", error);
    } finally {
      setIsLoadingAllData(false);
    }
  }, [isHighPerformanceMode, hasAllData, isLoadingAllData]);

  // Refresh all data
  const refreshAll = useCallback(
    async (filters: FilterParams = {}) => {
      if (!isHighPerformanceMode) return;

      console.log("[useHighPerf] Refreshing all data with filters:", filters);
      await Promise.all([
        refreshKPI(filters),
        refreshSummary(filters),
        refreshRawData(filters),
      ]);
    },
    [isHighPerformanceMode, refreshKPI, refreshSummary, refreshRawData]
  );

  // Initial data load when high-performance mode is enabled
  useEffect(() => {
    if (isHighPerformanceMode) {
      console.log(
        "[useHighPerf] High-performance mode enabled, loading initial data"
      );
      refreshAll(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHighPerformanceMode]); // Only trigger when mode changes

  // Auto-load all data in background after initial load
  useEffect(() => {
    if (
      isHighPerformanceMode &&
      rawData &&
      rawData.hasMoreData &&
      !hasAllData &&
      !isLoadingAllData
    ) {
      console.log("[useHighPerf] Auto-loading all data in background...");
      // Delay to not block UI
      setTimeout(() => {
        loadAllRawData();
      }, 2000);
    }
  }, [
    isHighPerformanceMode,
    rawData,
    hasAllData,
    isLoadingAllData,
    loadAllRawData,
  ]);

  return {
    // Data
    kpiData,
    summaryData,
    rawData,

    // Loading states
    kpiLoading,
    summaryLoading,
    rawLoading,

    // Error states
    kpiError,
    summaryError,
    rawError,

    // Methods
    refreshKPI,
    refreshSummary,
    refreshRawData,
    refreshAll,
    loadAllRawData,

    // State
    isHighPerformanceMode,
    totalRecords,
    isLoadingAllData,
    hasAllData,
  };
}
