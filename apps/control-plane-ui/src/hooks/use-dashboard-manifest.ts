/**
 * Dashboard Manifest Management Hooks
 * Custom hooks for dashboard manifest operations with state management
 */

import { useState, useEffect, useCallback } from "react";
import {
  DashboardManifestService,
  DashboardManifestListItem,
  CreateManifestRequest,
  UpdateManifestRequest,
} from "@/services/dashboard-manifest.service";
import { DashboardManifest } from "@/types/dashboard-manifest";

interface UseDashboardManifestListOptions {
  tenantId: string;
  autoFetch?: boolean;
  filters?: {
    search?: string;
    isActive?: boolean;
    team?: string;
  };
}

interface UseDashboardManifestListReturn {
  manifests: DashboardManifestListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createManifest: (data: CreateManifestRequest) => Promise<void>;
  updateManifest: (id: string, data: UpdateManifestRequest) => Promise<void>;
  deleteManifest: (id: string) => Promise<void>;
  toggleManifestStatus: (id: string, isActive: boolean) => Promise<void>;
}

/**
 * Hook for managing dashboard manifest list with CRUD operations
 */
export function useDashboardManifestList(
  options: UseDashboardManifestListOptions
): UseDashboardManifestListReturn {
  const { tenantId, autoFetch = true, filters } = options;

  const [manifests, setManifests] = useState<DashboardManifestListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManifests = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await DashboardManifestService.getAllManifests(
        tenantId,
        filters
      );

      if (response.success && response.data) {
        setManifests(response.data);
      } else {
        throw new Error(
          response.error || "Failed to fetch dashboard manifests"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch dashboard manifests";
      setError(errorMessage);
      console.error("Error fetching dashboard manifests:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);

  const createManifest = useCallback(
    async (data: CreateManifestRequest) => {
      if (!tenantId) return;

      try {
        setError(null);

        const response = await DashboardManifestService.createManifest(
          tenantId,
          data
        );

        if (response.success && response.data) {
          setManifests((prev) => [response.data!, ...prev]);
        } else {
          throw new Error(
            response.error || "Failed to create dashboard manifest"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create dashboard manifest";
        setError(errorMessage);
        throw err; // Re-throw for form handling
      }
    },
    [tenantId]
  );

  const updateManifest = useCallback(
    async (id: string, data: UpdateManifestRequest) => {
      if (!tenantId) return;

      try {
        setError(null);

        const response = await DashboardManifestService.updateManifest(
          tenantId,
          id,
          data
        );

        if (response.success && response.data) {
          setManifests((prev) =>
            prev.map((manifest) =>
              manifest.id === id ? { ...manifest, ...response.data } : manifest
            )
          );
        } else {
          throw new Error(
            response.error || "Failed to update dashboard manifest"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update dashboard manifest";
        setError(errorMessage);
        throw err;
      }
    },
    [tenantId]
  );

  const deleteManifest = useCallback(
    async (id: string) => {
      if (!tenantId) return;

      try {
        setError(null);

        const response = await DashboardManifestService.deleteManifest(
          tenantId,
          id
        );

        if (response.success) {
          setManifests((prev) => prev.filter((manifest) => manifest.id !== id));
        } else {
          throw new Error(
            response.error || "Failed to delete dashboard manifest"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to delete dashboard manifest";
        setError(errorMessage);
        throw err;
      }
    },
    [tenantId]
  );

  const toggleManifestStatus = useCallback(
    async (id: string, isActive: boolean) => {
      if (!tenantId) return;

      try {
        setError(null);

        const response = await DashboardManifestService.toggleManifestStatus(
          tenantId,
          id,
          isActive
        );

        if (response.success) {
          setManifests((prev) =>
            prev.map((manifest) =>
              manifest.id === id ? { ...manifest, isActive } : manifest
            )
          );
        } else {
          throw new Error(
            response.error || "Failed to update dashboard manifest status"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update dashboard manifest status";
        setError(errorMessage);
        throw err;
      }
    },
    [tenantId]
  );

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch && tenantId) {
      fetchManifests();
    }
  }, [fetchManifests, autoFetch, tenantId]);

  return {
    manifests,
    loading,
    error,
    refresh: fetchManifests,
    createManifest,
    updateManifest,
    deleteManifest,
    toggleManifestStatus,
  };
}

interface UseDashboardManifestDetailOptions {
  tenantId: string;
  dashboardId: string;
  autoFetch?: boolean;
}

interface UseDashboardManifestDetailReturn {
  manifest: DashboardManifest | null;
  manifestContent: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateManifest: (data: UpdateManifestRequest) => Promise<void>;
  createManifest: (data: CreateManifestRequest) => Promise<void>;
  saveManifest: (manifestContent: string) => Promise<void>;
  getTemplate: () => Promise<string>;
}

/**
 * Hook for managing single dashboard manifest details
 */
export function useDashboardManifestDetail(
  options: UseDashboardManifestDetailOptions
): UseDashboardManifestDetailReturn {
  const { tenantId, dashboardId, autoFetch = true } = options;

  const [manifest, setManifest] = useState<DashboardManifest | null>(null);
  const [manifestContent, setManifestContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManifest = useCallback(async () => {
    if (!tenantId || !dashboardId) return;

    try {
      setLoading(true);
      setError(null);

      // Try to fetch both parsed manifest and raw content
      const [manifestResponse, contentResponse] = await Promise.all([
        DashboardManifestService.getManifestById(tenantId, dashboardId).catch(
          (err) => ({
            success: false,
            error: err.message,
            data: null,
          })
        ),
        DashboardManifestService.getManifestContent(
          tenantId,
          dashboardId
        ).catch((err) => ({
          success: false,
          error: err.message,
          data: null,
        })),
      ]);

      // If manifest exists, use it
      if (manifestResponse.success && manifestResponse.data) {
        setManifest(manifestResponse.data);
      }

      if (contentResponse.success && contentResponse.data) {
        setManifestContent(contentResponse.data);
      } else {
        // If no manifest exists, provide a default template
        const defaultTemplate =
          await DashboardManifestService.getTemplate("basic");
        // Parse and update the template with dashboard info
        const parsedTemplate = JSON.parse(defaultTemplate);
        parsedTemplate.dashboardId = dashboardId;
        parsedTemplate.dashboardName = `Dashboard ${dashboardId}`;

        const updatedTemplate = JSON.stringify(parsedTemplate, null, 2);
        setManifestContent(updatedTemplate);
        setManifest(parsedTemplate);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch dashboard manifest";
      setError(errorMessage);
      console.error("Error fetching dashboard manifest:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, dashboardId]);

  const updateManifest = useCallback(
    async (data: UpdateManifestRequest) => {
      if (!tenantId || !dashboardId) return;

      try {
        setError(null);

        const response = await DashboardManifestService.updateManifest(
          tenantId,
          dashboardId,
          data
        );

        if (response.success) {
          // Refresh the manifest after update
          await fetchManifest();
        } else {
          throw new Error(
            response.error || "Failed to update dashboard manifest"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update dashboard manifest";
        setError(errorMessage);
        throw err;
      }
    },
    [tenantId, dashboardId, fetchManifest]
  );

  const createManifest = useCallback(
    async (data: CreateManifestRequest) => {
      if (!tenantId) return;

      try {
        setError(null);

        const response = await DashboardManifestService.createManifest(
          tenantId,
          data
        );

        if (response.success) {
          // Refresh the manifest after creation
          await fetchManifest();
        } else {
          throw new Error(
            response.error || "Failed to create dashboard manifest"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create dashboard manifest";
        setError(errorMessage);
        throw err;
      }
    },
    [tenantId, fetchManifest]
  );

  const saveManifest = useCallback(
    async (manifestContent: string) => {
      if (!tenantId || !dashboardId) return;

      try {
        setError(null);

        // Parse the manifest to get name and description
        const parsedManifest = JSON.parse(manifestContent);
        const manifestName =
          parsedManifest.dashboardName || `Dashboard ${dashboardId}`;
        const manifestDescription = parsedManifest.description || "";

        // Check if manifest exists by trying to update first
        try {
          const response = await DashboardManifestService.updateManifest(
            tenantId,
            dashboardId,
            { manifestContent }
          );

          if (response.success) {
            await fetchManifest();
            return;
          }
        } catch (updateError) {
          // If update fails, try to create new manifest
          console.log("Update failed, trying to create new manifest");
        }

        // If update failed, create new manifest
        const createResponse = await DashboardManifestService.createManifest(
          tenantId,
          {
            name: manifestName,
            description: manifestDescription,
            targetTeams: parsedManifest.targetTeams || ["default"],
            manifestContent,
          }
        );

        if (createResponse.success) {
          await fetchManifest();
        } else {
          throw new Error(
            createResponse.error || "Failed to save dashboard manifest"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to save dashboard manifest";
        setError(errorMessage);
        throw err;
      }
    },
    [tenantId, dashboardId, fetchManifest]
  );

  const getTemplate = useCallback(async () => {
    return await DashboardManifestService.getTemplate();
  }, []);

  useEffect(() => {
    if (autoFetch && tenantId && dashboardId) {
      fetchManifest();
    }
  }, [fetchManifest, autoFetch, tenantId, dashboardId]);

  return {
    manifest,
    manifestContent,
    loading,
    error,
    refresh: fetchManifest,
    updateManifest,
    createManifest,
    saveManifest,
    getTemplate,
  };
}
