import { useState, useEffect } from "react";
import { TenantService } from "@/services/tenant.service";
import { Tenant } from "@/types/tenant";
import { ApiResponse } from "@/types/api";

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

      const response = await TenantService.getAllTenants({
        page,
        limit: pageSize,
      });

      if (response.success) {
        setTenants(response.data || []);
        // The TenantService may not return pagination info in the same format
        // Creating a compatible object from available data
        setPagination({
          total: response.pagination?.total || 0,
          page: page,
          pageSize: pageSize,
          totalPages: response.pagination?.totalPages || 0,
          hasNext: response.pagination?.hasNext || false,
          hasPrev: response.pagination?.hasPrev || false,
        });
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

        const response = await TenantService.getTenantById(id);

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
          const response = await TenantService.getTenantById(id);
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
