/**
 * Dashboard Analytics Hook
 * Hook for dashboard analytics data
 */

import { useState, useEffect, useCallback } from "react";
import { DashboardService } from "@/services/dashboard.service";
import { DashboardAnalytics } from "@/types/dashboard";

interface UseDashboardAnalyticsOptions {
  dashboardId: string;
  timeRange?: "24h" | "7d" | "30d";
  autoFetch?: boolean;
}

interface UseDashboardAnalyticsReturn {
  analytics: DashboardAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export type { UseDashboardAnalyticsOptions, UseDashboardAnalyticsReturn };

/**
 * Hook for dashboard analytics data
 */
export function useDashboardAnalytics(
  options: UseDashboardAnalyticsOptions
): UseDashboardAnalyticsReturn {
  const { dashboardId, timeRange = "7d", autoFetch = true } = options;

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!dashboardId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await DashboardService.getDashboardAnalytics(
        dashboardId,
        timeRange
      );

      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch analytics");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch analytics";
      setError(errorMessage);
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [dashboardId, timeRange]);

  useEffect(() => {
    if (autoFetch && dashboardId) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, autoFetch, dashboardId]);

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics,
  };
}
