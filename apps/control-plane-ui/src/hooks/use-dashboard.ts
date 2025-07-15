/**
 * Dashboard Management Hooks
 * Custom hooks for dashboard operations with state management
 */

import { useState, useEffect, useCallback } from "react";
import { DashboardService } from "@/services/dashboard.service";
import {
  Dashboard,
  DashboardWidget,
  DashboardAnalytics,
} from "@/types/dashboard";
import { CreateDashboardRequest, UpdateDashboardRequest } from "@/types/api";

interface UseDashboardListOptions {
  autoFetch?: boolean;
  filters?: {
    tenantId?: string;
    search?: string;
    isPublic?: boolean;
  };
}

interface UseDashboardListReturn {
  dashboards: Dashboard[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createDashboard: (data: CreateDashboardRequest) => Promise<Dashboard | null>;
  updateDashboard: (
    id: string,
    data: UpdateDashboardRequest
  ) => Promise<Dashboard | null>;
  deleteDashboard: (id: string) => Promise<void>;
  cloneDashboard: (id: string, newName?: string) => Promise<Dashboard | null>;
}

/**
 * Hook for managing dashboard list with CRUD operations
 */
export function useDashboardList(
  options: UseDashboardListOptions = {}
): UseDashboardListReturn {
  const { autoFetch = true, filters } = options;

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await DashboardService.getDashboards(filters);

      if (response.success && response.data) {
        setDashboards(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch dashboards");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboards";
      setError(errorMessage);
      console.error("Error fetching dashboards:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createDashboard = useCallback(
    async (data: CreateDashboardRequest): Promise<Dashboard | null> => {
      try {
        setError(null);

        const response = await DashboardService.createDashboard(data);

        if (response.success && response.data) {
          setDashboards((prev) => [response.data!, ...prev]);
          return response.data;
        } else {
          throw new Error(response.error || "Failed to create dashboard");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create dashboard";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const updateDashboard = useCallback(
    async (
      id: string,
      data: UpdateDashboardRequest
    ): Promise<Dashboard | null> => {
      try {
        setError(null);

        const response = await DashboardService.updateDashboard(id, data);

        if (response.success && response.data) {
          setDashboards((prev) =>
            prev.map((dashboard) =>
              dashboard.id === id
                ? { ...dashboard, ...response.data! }
                : dashboard
            )
          );
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update dashboard");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update dashboard";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const deleteDashboard = useCallback(async (id: string) => {
    try {
      setError(null);

      const response = await DashboardService.deleteDashboard(id);

      if (response.success) {
        setDashboards((prev) =>
          prev.filter((dashboard) => dashboard.id !== id)
        );
      } else {
        throw new Error(response.error || "Failed to delete dashboard");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete dashboard";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const cloneDashboard = useCallback(
    async (id: string, newName?: string): Promise<Dashboard | null> => {
      try {
        setError(null);

        const response = await DashboardService.cloneDashboard(id, newName);

        if (response.success && response.data) {
          setDashboards((prev) => [response.data!, ...prev]);
          return response.data;
        } else {
          throw new Error(response.error || "Failed to clone dashboard");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to clone dashboard";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetch) {
      fetchDashboards();
    }
  }, [fetchDashboards, autoFetch]);

  return {
    dashboards,
    loading,
    error,
    refresh: fetchDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    cloneDashboard,
  };
}

interface UseDashboardDetailOptions {
  dashboardId: string;
  autoFetch?: boolean;
}

interface UseDashboardDetailReturn {
  dashboard: Dashboard | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateDashboard: (data: UpdateDashboardRequest) => Promise<Dashboard | null>;
  addWidget: (
    widget: Omit<DashboardWidget, "id" | "dashboardId">
  ) => Promise<DashboardWidget | null>;
  updateWidget: (
    widgetId: string,
    updates: Partial<DashboardWidget>
  ) => Promise<DashboardWidget | null>;
  removeWidget: (widgetId: string) => Promise<void>;
  updateWidgetPositions: (
    positions: Array<{ id: string; position: DashboardWidget["position"] }>
  ) => Promise<void>;
}

/**
 * Hook for managing single dashboard with widget operations
 */
export function useDashboardDetail(
  options: UseDashboardDetailOptions
): UseDashboardDetailReturn {
  const { dashboardId, autoFetch = true } = options;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!dashboardId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await DashboardService.getDashboardById(dashboardId);

      if (response.success && response.data) {
        setDashboard(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch dashboard");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboard";
      setError(errorMessage);
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [dashboardId]);

  const updateDashboard = useCallback(
    async (data: UpdateDashboardRequest): Promise<Dashboard | null> => {
      if (!dashboardId) return null;

      try {
        setError(null);

        const response = await DashboardService.updateDashboard(
          dashboardId,
          data
        );

        if (response.success && response.data) {
          setDashboard((prev) =>
            prev ? { ...prev, ...response.data! } : response.data!
          );
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update dashboard");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update dashboard";
        setError(errorMessage);
        throw err;
      }
    },
    [dashboardId]
  );

  const addWidget = useCallback(
    async (
      widget: Omit<DashboardWidget, "id" | "dashboardId">
    ): Promise<DashboardWidget | null> => {
      if (!dashboardId) return null;

      try {
        setError(null);

        const response = await DashboardService.addWidget(dashboardId, widget);

        if (response.success && response.data) {
          setDashboard((prev) =>
            prev
              ? {
                  ...prev,
                  widgets: [...prev.widgets, response.data!],
                }
              : prev
          );
          return response.data;
        } else {
          throw new Error(response.error || "Failed to add widget");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add widget";
        setError(errorMessage);
        throw err;
      }
    },
    [dashboardId]
  );

  const updateWidget = useCallback(
    async (
      widgetId: string,
      updates: Partial<DashboardWidget>
    ): Promise<DashboardWidget | null> => {
      if (!dashboardId) return null;

      try {
        setError(null);

        const response = await DashboardService.updateWidget(
          dashboardId,
          widgetId,
          updates
        );

        if (response.success && response.data) {
          setDashboard((prev) =>
            prev
              ? {
                  ...prev,
                  widgets: prev.widgets.map((widget) =>
                    widget.id === widgetId
                      ? { ...widget, ...response.data! }
                      : widget
                  ),
                }
              : prev
          );
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update widget");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update widget";
        setError(errorMessage);
        throw err;
      }
    },
    [dashboardId]
  );

  const removeWidget = useCallback(
    async (widgetId: string) => {
      if (!dashboardId) return;

      try {
        setError(null);

        const response = await DashboardService.removeWidget(
          dashboardId,
          widgetId
        );

        if (response.success) {
          setDashboard((prev) =>
            prev
              ? {
                  ...prev,
                  widgets: prev.widgets.filter(
                    (widget) => widget.id !== widgetId
                  ),
                }
              : prev
          );
        } else {
          throw new Error(response.error || "Failed to remove widget");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove widget";
        setError(errorMessage);
        throw err;
      }
    },
    [dashboardId]
  );

  const updateWidgetPositions = useCallback(
    async (
      positions: Array<{ id: string; position: DashboardWidget["position"] }>
    ) => {
      if (!dashboardId) return;

      try {
        setError(null);

        const response = await DashboardService.updateWidgetPositions(
          dashboardId,
          positions
        );

        if (response.success) {
          // Update local state with new positions
          setDashboard((prev) =>
            prev
              ? {
                  ...prev,
                  widgets: prev.widgets.map((widget) => {
                    const newPosition = positions.find(
                      (p) => p.id === widget.id
                    );
                    return newPosition
                      ? { ...widget, position: newPosition.position }
                      : widget;
                  }),
                }
              : prev
          );
        } else {
          throw new Error(
            response.error || "Failed to update widget positions"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update widget positions";
        setError(errorMessage);
        throw err;
      }
    },
    [dashboardId]
  );

  useEffect(() => {
    if (autoFetch && dashboardId) {
      fetchDashboard();
    }
  }, [fetchDashboard, autoFetch, dashboardId]);

  return {
    dashboard,
    loading,
    error,
    refresh: fetchDashboard,
    updateDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    updateWidgetPositions,
  };
}

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
