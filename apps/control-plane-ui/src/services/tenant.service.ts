/**
 * Tenant Service
 * Business logic for tenant operations
 */

import {
  ApiResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
} from "@/types/api";
import { Tenant } from "@/types/tenant";
import { apiClient } from "@/lib/api/client";

export class TenantService {
  /**
   * Fetch all tenants with optional filtering
   */
  static async getAllTenants(filters?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Tenant[]>> {
    try {
      const queryParams = new URLSearchParams();

      if (filters?.search) queryParams.set("search", filters.search);
      if (filters?.isActive !== undefined)
        queryParams.set("isActive", String(filters.isActive));
      if (filters?.page) queryParams.set("page", String(filters.page));
      if (filters?.limit) queryParams.set("limit", String(filters.limit));

      const response = await apiClient.get<Tenant[]>(
        `/tenants?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      throw new Error("Failed to fetch tenants");
    }
  }

  /**
   * Fetch single tenant by ID
   */
  static async getTenantById(id: string): Promise<ApiResponse<Tenant>> {
    try {
      const response = await apiClient.get<Tenant>(`/tenants/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch tenant ${id}:`, error);
      throw new Error("Failed to fetch tenant");
    }
  }

  /**
   * Create new tenant
   */
  static async createTenant(
    data: CreateTenantRequest
  ): Promise<ApiResponse<Tenant>> {
    try {
      // Validate input data
      if (!data.name?.trim()) {
        throw new Error("Tenant name is required");
      }

      const response = await apiClient.post<Tenant>("/tenants", data);
      return response;
    } catch (error) {
      console.error("Failed to create tenant:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to create tenant");
    }
  }

  /**
   * Update existing tenant
   */
  static async updateTenant(
    id: string,
    data: UpdateTenantRequest
  ): Promise<ApiResponse<Tenant>> {
    try {
      const response = await apiClient.put<Tenant>(`/tenants/${id}`, data);
      return response;
    } catch (error) {
      console.error(`Failed to update tenant ${id}:`, error);
      throw new Error("Failed to update tenant");
    }
  }

  /**
   * Delete tenant
   */
  static async deleteTenant(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>(`/tenants/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete tenant ${id}:`, error);
      throw new Error("Failed to delete tenant");
    }
  }

  /**
   * Toggle tenant active status
   */
  static async toggleTenantStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<Tenant>> {
    try {
      const response = await apiClient.patch<Tenant>(`/tenants/${id}/status`, {
        isActive,
      });
      return response;
    } catch (error) {
      console.error(`Failed to toggle tenant ${id} status:`, error);
      throw new Error("Failed to update tenant status");
    }
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(id: string): Promise<
    ApiResponse<{
      dashboardCount: number;
      userCount: number;
      lastActivity: string;
      storageUsed: number;
    }>
  > {
    try {
      const response = await apiClient.get<{
        dashboardCount: number;
        userCount: number;
        lastActivity: string;
        storageUsed: number;
      }>(`/tenants/${id}/stats`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch tenant ${id} stats:`, error);
      throw new Error("Failed to fetch tenant statistics");
    }
  }
}
