/**
 import { apiClient } from '@/lib/api/client'; Dashboard Service
 * Business logic for dashboard operations and data management
 */

import { apiClient } from "@/lib/api/client";
import {
  ApiResponse,
  CreateDashboardRequest,
  UpdateDashboardRequest,
} from "@/types/api";
import {
  Dashboard,
  DashboardWidget,
  DashboardAnalytics,
} from "@/types/dashboard";

export class DashboardService {
  private static readonly ENDPOINT = "/api/dashboards";

  /**
   * Get all dashboards for the current user/tenant
   */
  static async getDashboards(filters?: {
    tenantId?: string;
    search?: string;
    isPublic?: boolean;
  }): Promise<ApiResponse<Dashboard[]>> {
    try {
      const params = new URLSearchParams();

      if (filters?.tenantId) params.append("tenantId", filters.tenantId);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.isPublic !== undefined)
        params.append("isPublic", filters.isPublic.toString());

      const queryString = params.toString();
      const url = queryString
        ? `${this.ENDPOINT}?${queryString}`
        : this.ENDPOINT;

      return await apiClient.get<Dashboard[]>(url);
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch dashboards",
        data: [],
      };
    }
  }

  /**
   * Get dashboard by ID
   */
  static async getDashboardById(id: string): Promise<ApiResponse<Dashboard>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
          data: {} as Dashboard,
        };
      }

      return await apiClient.get<Dashboard>(`${this.ENDPOINT}/${id}`);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch dashboard",
        data: {} as Dashboard,
      };
    }
  }

  /**
   * Create new dashboard
   */
  static async createDashboard(
    data: CreateDashboardRequest
  ): Promise<ApiResponse<Dashboard>> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        return {
          success: false,
          error: "Dashboard name is required",
          data: {} as Dashboard,
        };
      }

      if (!data.tenantId?.trim()) {
        return {
          success: false,
          error: "Tenant ID is required",
          data: {} as Dashboard,
        };
      }

      return await apiClient.post<Dashboard>(this.ENDPOINT, data);
    } catch (error) {
      console.error("Error creating dashboard:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create dashboard",
        data: {} as Dashboard,
      };
    }
  }

  /**
   * Update existing dashboard
   */
  static async updateDashboard(
    id: string,
    data: UpdateDashboardRequest
  ): Promise<ApiResponse<Dashboard>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
          data: {} as Dashboard,
        };
      }

      return await apiClient.put<Dashboard>(`${this.ENDPOINT}/${id}`, data);
    } catch (error) {
      console.error("Error updating dashboard:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update dashboard",
        data: {} as Dashboard,
      };
    }
  }

  /**
   * Delete dashboard
   */
  static async deleteDashboard(id: string): Promise<ApiResponse<void>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
        };
      }

      return await apiClient.delete<void>(`${this.ENDPOINT}/${id}`);
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete dashboard",
      };
    }
  }

  /**
   * Clone dashboard
   */
  static async cloneDashboard(
    id: string,
    newName?: string
  ): Promise<ApiResponse<Dashboard>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
          data: {} as Dashboard,
        };
      }

      const body = newName ? { name: newName } : {};
      return await apiClient.post<Dashboard>(
        `${this.ENDPOINT}/${id}/clone`,
        body
      );
    } catch (error) {
      console.error("Error cloning dashboard:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to clone dashboard",
        data: {} as Dashboard,
      };
    }
  }

  /**
   * Add widget to dashboard
   */
  static async addWidget(
    dashboardId: string,
    widget: Omit<DashboardWidget, "id" | "dashboardId">
  ): Promise<ApiResponse<DashboardWidget>> {
    try {
      if (!dashboardId?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
          data: {} as DashboardWidget,
        };
      }

      if (!widget.type || !widget.position) {
        return {
          success: false,
          error: "Widget type and position are required",
          data: {} as DashboardWidget,
        };
      }

      return await apiClient.post<DashboardWidget>(
        `${this.ENDPOINT}/${dashboardId}/widgets`,
        widget
      );
    } catch (error) {
      console.error("Error adding widget:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add widget",
        data: {} as DashboardWidget,
      };
    }
  }

  /**
   * Update widget
   */
  static async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Promise<ApiResponse<DashboardWidget>> {
    try {
      if (!dashboardId?.trim() || !widgetId?.trim()) {
        return {
          success: false,
          error: "Dashboard ID and Widget ID are required",
          data: {} as DashboardWidget,
        };
      }

      return await apiClient.put<DashboardWidget>(
        `${this.ENDPOINT}/${dashboardId}/widgets/${widgetId}`,
        updates
      );
    } catch (error) {
      console.error("Error updating widget:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update widget",
        data: {} as DashboardWidget,
      };
    }
  }

  /**
   * Remove widget from dashboard
   */
  static async removeWidget(
    dashboardId: string,
    widgetId: string
  ): Promise<ApiResponse<void>> {
    try {
      if (!dashboardId?.trim() || !widgetId?.trim()) {
        return {
          success: false,
          error: "Dashboard ID and Widget ID are required",
        };
      }

      return await apiClient.delete<void>(
        `${this.ENDPOINT}/${dashboardId}/widgets/${widgetId}`
      );
    } catch (error) {
      console.error("Error removing widget:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to remove widget",
      };
    }
  }

  /**
   * Update widget positions (bulk update for drag & drop)
   */
  static async updateWidgetPositions(
    dashboardId: string,
    positions: Array<{ id: string; position: DashboardWidget["position"] }>
  ): Promise<ApiResponse<void>> {
    try {
      if (!dashboardId?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
        };
      }

      if (!positions || positions.length === 0) {
        return {
          success: false,
          error: "Widget positions are required",
        };
      }

      return await apiClient.put<void>(
        `${this.ENDPOINT}/${dashboardId}/widgets/positions`,
        { positions }
      );
    } catch (error) {
      console.error("Error updating widget positions:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update widget positions",
      };
    }
  }

  /**
   * Get dashboard analytics/metrics
   */
  static async getDashboardAnalytics(
    dashboardId: string,
    timeRange?: "24h" | "7d" | "30d"
  ): Promise<ApiResponse<DashboardAnalytics>> {
    try {
      if (!dashboardId?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
          data: {} as DashboardAnalytics,
        };
      }

      const params = timeRange ? `?timeRange=${timeRange}` : "";
      return await apiClient.get<DashboardAnalytics>(
        `${this.ENDPOINT}/${dashboardId}/analytics${params}`
      );
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard analytics",
        data: {} as DashboardAnalytics,
      };
    }
  }

  /**
   * Share dashboard (generate public link)
   */
  static async shareDashboard(
    dashboardId: string,
    isPublic: boolean
  ): Promise<ApiResponse<{ shareUrl?: string }>> {
    try {
      if (!dashboardId?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
          data: {},
        };
      }

      return await apiClient.post<{ shareUrl?: string }>(
        `${this.ENDPOINT}/${dashboardId}/share`,
        { isPublic }
      );
    } catch (error) {
      console.error("Error sharing dashboard:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to share dashboard",
        data: {},
      };
    }
  }

  /**
   * Export dashboard configuration
   */
  static async exportDashboard(
    dashboardId: string
  ): Promise<ApiResponse<{ config: object }>> {
    try {
      if (!dashboardId?.trim()) {
        return {
          success: false,
          error: "Dashboard ID is required",
          data: { config: {} },
        };
      }

      return await apiClient.get<{ config: object }>(
        `${this.ENDPOINT}/${dashboardId}/export`
      );
    } catch (error) {
      console.error("Error exporting dashboard:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to export dashboard",
        data: { config: {} },
      };
    }
  }

  /**
   * Import dashboard configuration
   */
  static async importDashboard(
    tenantId: string,
    config: object,
    name?: string
  ): Promise<ApiResponse<Dashboard>> {
    try {
      if (!tenantId?.trim()) {
        return {
          success: false,
          error: "Tenant ID is required",
          data: {} as Dashboard,
        };
      }

      if (!config || typeof config !== "object") {
        return {
          success: false,
          error: "Valid dashboard configuration is required",
          data: {} as Dashboard,
        };
      }

      return await apiClient.post<Dashboard>(`${this.ENDPOINT}/import`, {
        tenantId,
        config,
        name,
      });
    } catch (error) {
      console.error("Error importing dashboard:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to import dashboard",
        data: {} as Dashboard,
      };
    }
  }
}
