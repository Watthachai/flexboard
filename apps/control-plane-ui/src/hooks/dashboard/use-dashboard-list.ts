/**
 * Dashboard List Hook
 * Hook for managing dashboard list with CRUD operations
 */

import { useState, useEffect, useCallback } from "react";
import { DashboardService } from "@/services/dashboard.service";
import { Dashboard } from "@/types/dashboard";
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

export type { UseDashboardListOptions, UseDashboardListReturn };

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
