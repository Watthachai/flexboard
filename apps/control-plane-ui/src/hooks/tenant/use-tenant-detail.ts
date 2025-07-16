/**
 * Tenant Detail Hook
 * Hook for managing single tenant details
 */

import { useState, useEffect, useCallback } from "react";
import { TenantService } from "@/services/tenant.service";
import { Tenant } from "@/types/tenant";
import { UpdateTenantRequest } from "@/types/api";

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

export type { UseTenantDetailOptions, UseTenantDetailReturn };

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
