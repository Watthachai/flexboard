/**
 * Dashboard Synchronization Service
 * Handles conversion between visual dashboard data and code-based manifests
 */

import { Dashboard, DashboardWidget } from "@/types/dashboard";
import { DashboardManifest } from "@/types/dashboard-manifest";
import { DashboardService } from "./dashboard.service";
import { DashboardManifestService } from "./dashboard-manifest.service";

export class DashboardSyncService {
  /**
   * Convert visual dashboard to code manifest
   */
  static async convertVisualToManifest(
    dashboard: Dashboard
  ): Promise<DashboardManifest> {
    const manifest: DashboardManifest = {
      schemaVersion: "1.0",
      dashboardId: dashboard.id,
      dashboardName: dashboard.name,
      description: dashboard.description || "",
      version: 1,
      targetTeams: ["default"],
      layout: {
        type: "grid",
        columns: dashboard.layout?.cols || 12,
        rowHeight: dashboard.layout?.rowHeight || 50,
      },
      widgets:
        dashboard.widgets?.map((widget) => ({
          id: widget.id,
          title: widget.config?.title || widget.type,
          type: this.mapVisualTypeToManifestType(widget.type),
          position: {
            x: widget.position.x,
            y: widget.position.y,
            w: widget.position.w,
            h: widget.position.h,
          },
          dataSourceId: widget.config?.dataSource || `${widget.id}_data`,
          config: (widget.config as Record<string, unknown>) || {},
        })) || [],
      dataSources:
        dashboard.widgets?.map((widget) => ({
          id: widget.config?.dataSource || `${widget.id}_data`,
          type: "sql", // Default type
          connectionId: "main_db",
          query: `-- Query for ${widget.config?.title || widget.type}\nSELECT * FROM data WHERE id = '${widget.id}'`,
          mappings: {
            value: "value",
          },
        })) || [],
    };

    return manifest;
  }

  /**
   * Map visual dashboard widget types to manifest widget types
   */
  private static mapVisualTypeToManifestType(
    visualType: "chart" | "metric" | "table" | "text" | "image"
  ):
    | "kpi-card"
    | "line-chart"
    | "bar-chart"
    | "pie-chart"
    | "table"
    | "gauge"
    | "text"
    | "image" {
    const typeMapping = {
      chart: "line-chart" as const,
      metric: "kpi-card" as const,
      table: "table" as const,
      text: "text" as const,
      image: "image" as const,
    };

    return typeMapping[visualType] || "line-chart";
  }

  /**
   * Map manifest widget types to visual dashboard widget types
   */
  private static mapManifestTypeToVisualType(
    manifestType:
      | "kpi-card"
      | "line-chart"
      | "bar-chart"
      | "pie-chart"
      | "table"
      | "gauge"
      | "text"
      | "image"
  ): "chart" | "metric" | "table" | "text" | "image" {
    const typeMapping = {
      "kpi-card": "metric" as const,
      "line-chart": "chart" as const,
      "bar-chart": "chart" as const,
      "pie-chart": "chart" as const,
      table: "table" as const,
      gauge: "metric" as const,
      text: "text" as const,
      image: "image" as const,
    };

    return typeMapping[manifestType] || "chart";
  }

  /**
   * Convert code manifest to visual dashboard
   */
  static async convertManifestToVisual(
    manifest: DashboardManifest
  ): Promise<Partial<Dashboard>> {
    const widgets: DashboardWidget[] = manifest.widgets.map((widget) => ({
      id: widget.id,
      dashboardId: manifest.dashboardId,
      type: this.mapManifestTypeToVisualType(widget.type),
      position: {
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w,
        h: widget.position.h,
      },
      config: {
        title: widget.title,
        dataSource: widget.dataSourceId,
        ...(widget.config as any),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return {
      id: manifest.dashboardId,
      name: manifest.dashboardName,
      description: manifest.description,
      widgets,
      layout: {
        cols: manifest.layout.columns,
        rowHeight: manifest.layout.rowHeight,
        margin: [10, 10],
        containerPadding: [10, 10],
        breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
        responsive: true,
      },
    };
  }

  /**
   * Sync visual dashboard changes to manifest
   */
  static async syncVisualToManifest(
    tenantId: string,
    dashboardId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Get the latest visual dashboard
      const dashboardResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}`
      );
      const dashboardData = await dashboardResponse.json();

      if (!dashboardData.success) {
        return { success: false, error: "Failed to fetch visual dashboard" };
      }

      // 2. Convert to manifest
      const manifest = await this.convertVisualToManifest(dashboardData.data);

      // 3. Update or create manifest
      const manifestContent = JSON.stringify(manifest, null, 2);

      // Try to update existing manifest first
      const updateResponse = await DashboardManifestService.updateManifest(
        tenantId,
        dashboardId,
        { manifestContent }
      );

      if (updateResponse.success) {
        return { success: true };
      }

      // If update fails, try to create new manifest
      const createResponse = await DashboardManifestService.createManifest(
        tenantId,
        {
          name: manifest.dashboardName,
          description: manifest.description,
          targetTeams: manifest.targetTeams,
          manifestContent,
        }
      );

      return createResponse.success
        ? { success: true }
        : { success: false, error: createResponse.error };
    } catch (error) {
      console.error("Error syncing visual to manifest:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      };
    }
  }

  /**
   * Sync manifest changes to visual dashboard
   */
  static async syncManifestToVisual(
    tenantId: string,
    dashboardId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Get the latest manifest
      const manifestResponse = await DashboardManifestService.getManifestById(
        tenantId,
        dashboardId
      );

      if (!manifestResponse.success) {
        return { success: false, error: "Failed to fetch manifest" };
      }

      // 2. Convert to visual dashboard
      const visualData = await this.convertManifestToVisual(
        manifestResponse.data!
      );

      // 3. Update visual dashboard
      const updateResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(visualData),
        }
      );

      const result = await updateResponse.json();

      return result.success
        ? { success: true }
        : { success: false, error: result.error };
    } catch (error) {
      console.error("Error syncing manifest to visual:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      };
    }
  }

  /**
   * Get sync status between visual and manifest versions
   */
  static async getSyncStatus(
    tenantId: string,
    dashboardId: string
  ): Promise<{
    hasVisual: boolean;
    hasManifest: boolean;
    lastVisualUpdate?: string;
    lastManifestUpdate?: string;
    needsSync: boolean;
  }> {
    try {
      // Check visual dashboard
      const visualResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}`
      );
      const visualData = await visualResponse.json();

      // Check manifest
      const manifestResponse = await DashboardManifestService.getManifestById(
        tenantId,
        dashboardId
      );

      const hasVisual = visualData.success;
      const hasManifest = manifestResponse.success;

      let needsSync = false;
      if (hasVisual && hasManifest) {
        const visualUpdate = new Date(visualData.data?.updatedAt || 0);
        // Since manifest doesn't have updatedAt, we'll consider it always needs sync
        needsSync = true;
      }

      return {
        hasVisual,
        hasManifest,
        lastVisualUpdate: hasVisual ? visualData.data?.updatedAt : undefined,
        lastManifestUpdate: hasManifest ? "N/A - Code based" : undefined,
        needsSync,
      };
    } catch (error) {
      console.error("Error checking sync status:", error);
      return {
        hasVisual: false,
        hasManifest: false,
        needsSync: false,
      };
    }
  }
}
