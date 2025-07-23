import { useState, useEffect } from "react";
import {
  tenantService,
  Tenant,
  PaginatedResponse,
} from "@/lib/services/tenant.service";

export function useTenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchTenants = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      setError(null);

      const response = await tenantService.getTenants(page, pageSize);

      if (response.success) {
        setTenants(response.data);
        setPagination(response.pagination);
      } else {
        setError("Failed to fetch tenants");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const refetch = () => {
    fetchTenants(pagination.page, pagination.pageSize);
  };

  const goToPage = (page: number) => {
    fetchTenants(page, pagination.pageSize);
  };

  return {
    tenants,
    loading,
    error,
    pagination,
    refetch,
    goToPage,
  };
}

export function useTenant(id: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await tenantService.getTenant(id);

        if (response.success && response.data) {
          setTenant(response.data);
        } else {
          setError(response.error || "Failed to fetch tenant");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTenant();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      const fetchTenant = async () => {
        try {
          setLoading(true);
          const response = await tenantService.getTenant(id);
          if (response.success && response.data) {
            setTenant(response.data);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
          setLoading(false);
        }
      };
      fetchTenant();
    }
  };

  return {
    tenant,
    loading,
    error,
    refetch,
  };
}
