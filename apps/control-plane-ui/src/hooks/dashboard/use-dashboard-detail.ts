/**
 * Dashboard Detail Hook
 * Hook for managing single dashboard with widget operations
 */

import { useState, useEffect, useCallback } from "react";
import { DashboardService } from "@/services/dashboard.service";
import { Dashboard, DashboardWidget } from "@/types/dashboard";
import { UpdateDashboardRequest } from "@/types/api";

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

export type { UseDashboardDetailOptions, UseDashboardDetailReturn };

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
