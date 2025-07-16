/**
 * Tenant Management Hooks
 * Custom hooks for tenant operations with state management
 */

import { useState, useEffect, useCallback } from "react";
import { TenantService } from "@/services/tenant.service";
import { Tenant } from "@/types/tenant";
import { CreateTenantRequest, UpdateTenantRequest } from "@/types/api";

interface UseTenantListOptions {
  autoFetch?: boolean;
  filters?: {
    search?: string;
    isActive?: boolean;
  };
}

interface UseTenantListReturn {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTenant: (data: CreateTenantRequest) => Promise<void>;
  updateTenant: (id: string, data: UpdateTenantRequest) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  toggleTenantStatus: (id: string, isActive: boolean) => Promise<void>;
}

/**
 * Hook for managing tenant list with CRUD operations
 */
export function useTenantList(
  options: UseTenantListOptions = {}
): UseTenantListReturn {
  const { autoFetch = true, filters } = options;

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await TenantService.getAllTenants(filters);

      if (response.success && response.data) {
        setTenants(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch tenants");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tenants";
      setError(errorMessage);
      console.error("Error fetching tenants:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createTenant = useCallback(async (data: CreateTenantRequest) => {
    try {
      setError(null);

      const response = await TenantService.createTenant(data);

      if (response.success && response.data) {
        setTenants((prev) => [response.data!, ...prev]);
      } else {
        throw new Error(response.error || "Failed to create tenant");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create tenant";
      setError(errorMessage);
      throw err; // Re-throw for form handling
    }
  }, []);

  const updateTenant = useCallback(
    async (id: string, data: UpdateTenantRequest) => {
      try {
        setError(null);

        const response = await TenantService.updateTenant(id, data);

        if (response.success && response.data) {
          setTenants((prev) =>
            prev.map((tenant) =>
              tenant.id === id ? { ...tenant, ...response.data } : tenant
            )
          );
        } else {
          throw new Error(response.error || "Failed to update tenant");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update tenant";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const deleteTenant = useCallback(async (id: string) => {
    try {
      setError(null);

      const response = await TenantService.deleteTenant(id);

      if (response.success) {
        setTenants((prev) => prev.filter((tenant) => tenant.id !== id));
      } else {
        throw new Error(response.error || "Failed to delete tenant");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete tenant";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const toggleTenantStatus = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        setError(null);

        const response = await TenantService.toggleTenantStatus(id, isActive);

        if (response.success) {
          setTenants((prev) =>
            prev.map((tenant) =>
              tenant.id === id ? { ...tenant, isActive } : tenant
            )
          );
        } else {
          throw new Error(response.error || "Failed to update tenant status");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update tenant status";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchTenants();
    }
  }, [fetchTenants, autoFetch]);

  return {
    tenants,
    loading,
    error,
    refresh: fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    toggleTenantStatus,
  };
}

interface UseTenantDetailOptions {
  tenantId: string;
  autoFetch?: boolean;
}

interface UseTenantDetailReturn {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateTenant: (data: UpdateTenantRequest) => Promise<void>;
}

/**
 * Hook for managing single tenant details
 */
export function useTenantDetail(
  options: UseTenantDetailOptions
): UseTenantDetailReturn {
  const { tenantId, autoFetch = true } = options;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await TenantService.getTenantById(tenantId);

      if (response.success && response.data) {
        setTenant(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch tenant");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tenant";
      setError(errorMessage);
      console.error("Error fetching tenant:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const updateTenant = useCallback(
    async (data: UpdateTenantRequest) => {
      if (!tenantId) return;

      try {
        setError(null);

        const response = await TenantService.updateTenant(tenantId, data);

        if (response.success && response.data) {
          setTenant((prev) =>
            prev ? { ...prev, ...response.data! } : response.data!
          );
        } else {
          throw new Error(response.error || "Failed to update tenant");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update tenant";
        setError(errorMessage);
        throw err;
      }
    },
    [tenantId]
  );

  useEffect(() => {
    if (autoFetch && tenantId) {
      fetchTenant();
    }
  }, [fetchTenant, autoFetch, tenantId]);

  return {
    tenant,
    loading,
    error,
    refresh: fetchTenant,
    updateTenant,
  };
}
