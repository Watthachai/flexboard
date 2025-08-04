/**
 * Tenant Context - Provides tenant configuration and API key management
 */
"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface TenantConfig {
  id: string;
  name: string;
  apiKey: string;
  theme: string;
  refreshInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TenantContextValue {
  tenant: TenantConfig | null;
  loading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: true,
  error: null,
  refreshTenant: async () => {},
});

export function TenantProvider({
  children,
  tenantId,
}: {
  children: React.ReactNode;
  tenantId: string;
}) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call Control Plane API to get tenant configuration
      const response = await fetch(`/api/tenants/${tenantId}`);
      const result = await response.json();

      if (result.success && (result.tenant || result.data)) {
        // Handle both response formats: result.tenant or result.data
        const tenantData = result.tenant || result.data;
        setTenant(tenantData);
      } else {
        throw new Error(
          result.message || result.error || "Failed to fetch tenant"
        );
      }
    } catch (err) {
      console.error("Error fetching tenant:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tenant");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTenant();
    }
  }, [tenantId]);

  const value: TenantContextValue = {
    tenant,
    loading,
    error,
    refreshTenant: fetchTenant,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

export type { TenantConfig };
