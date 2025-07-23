// API Service for Tenants
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  apiKey: string;
  isActive: boolean;
  config: {
    theme: "light" | "dark";
    refreshInterval: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  description?: string;
  apiKey: string;
  isActive: boolean;
  config: {
    theme: "light" | "dark";
    refreshInterval: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

class TenantService {
  async getTenants(
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<Tenant>> {
    const response = await fetch(
      `${API_BASE_URL}/api/tenants?page=${page}&pageSize=${pageSize}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getTenant(id: string): Promise<ApiResponse<Tenant>> {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createTenant(
    tenantData: CreateTenantRequest
  ): Promise<ApiResponse<Tenant>> {
    const response = await fetch(`${API_BASE_URL}/api/tenants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tenantData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async updateTenant(
    id: string,
    updates: Partial<CreateTenantRequest>
  ): Promise<ApiResponse<Tenant>> {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteTenant(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const tenantService = new TenantService();
