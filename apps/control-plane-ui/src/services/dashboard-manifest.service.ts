/**
 * Dashboard Manifest Service
 * Handles CRUD operations for dashboard manifests using "Dashboard as Code" approach
 */

import { ApiResponse } from "@/types/api";
import { DashboardManifest } from "@/types/dashboard-manifest";
import { apiClient } from "@/lib/api/client";

export interface DashboardManifestListItem {
  id: string;
  name: string;
  description?: string;
  version: number;
  targetTeams: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateManifestRequest {
  name: string;
  description?: string;
  targetTeams: string[];
  manifestContent: string; // YAML or JSON string
}

export interface UpdateManifestRequest {
  name?: string;
  description?: string;
  targetTeams?: string[];
  manifestContent?: string; // YAML or JSON string
}

export class DashboardManifestService {
  /**
   * ตรวจสอบสถานะข้อมูล XML ที่อัปโหลดของ tenant
   */
  static async getDataStatus(tenantId: string): Promise<{
    hasData: boolean;
    fileName?: string;
    fileSize?: number;
    lastModified?: string;
    message: string;
    uploadPath?: string;
  }> {
    try {
      const response = await apiClient.get(
        `/api/tenants/${tenantId}/data-status`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking data status:", error);
      return {
        hasData: false,
        message: "Failed to check data status",
        uploadPath: `/tenants/${tenantId}/upload`,
      };
    }
  }

  /**
   * ดึงข้อมูลตัวอย่างจาก XML เพื่อใช้ในการสร้าง Dashboard Template
   */
  static async getXMLSampleData(tenantId: string): Promise<{
    products: any[];
    categories: string[];
    sampleQuery: string;
    dataPreview: any;
  } | null> {
    try {
      const response = await apiClient.get(
        `/api/tenants/${tenantId}/xml-preview`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching XML sample data:", error);
      return null;
    }
  }

  /**
   * Get all dashboard manifests for a tenant
   */
  static async getAllManifests(
    tenantId: string,
    filters?: {
      search?: string;
      isActive?: boolean;
      team?: string;
    }
  ): Promise<ApiResponse<DashboardManifestListItem[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.set("search", filters.search);
      if (filters?.isActive !== undefined)
        queryParams.set("isActive", String(filters.isActive));
      if (filters?.team) queryParams.set("team", filters.team);

      const response = await apiClient.get<DashboardManifestListItem[]>(
        `/api/manifest/tenants/${tenantId}/dashboards/manifests?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch dashboard manifests:", error);
      throw new Error("Failed to fetch dashboard manifests");
    }
  }

  /**
   * Get a single dashboard manifest by ID
   */
  static async getManifestById(
    tenantId: string,
    dashboardId: string
  ): Promise<ApiResponse<DashboardManifest>> {
    try {
      const response = await apiClient.get<{ manifestContent: string }>(
        `/api/manifest/tenants/${tenantId}/dashboards/${dashboardId}/manifest`
      );

      if (response.success && response.data?.manifestContent) {
        // Parse YAML/JSON content to manifest object
        const manifest = this.parseManifestContent(
          response.data.manifestContent
        );
        return {
          success: true,
          data: manifest,
        };
      }

      return {
        success: false,
        error: "No manifest content found",
      };
    } catch (error) {
      console.error("Failed to fetch dashboard manifest:", error);
      throw new Error("Failed to fetch dashboard manifest");
    }
  }

  /**
   * Get raw manifest content as string (for code editor)
   */
  static async getManifestContent(
    tenantId: string,
    dashboardId: string
  ): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.get<{ manifestContent: string }>(
        `/api/manifest/tenants/${tenantId}/dashboards/${dashboardId}/manifest`
      );

      if (response.success && response.data?.manifestContent) {
        return {
          ...response,
          data: response.data.manifestContent,
        };
      }

      return {
        success: false,
        error: "No manifest content found",
      };
    } catch (error) {
      console.error("Failed to fetch manifest content:", error);
      throw new Error("Failed to fetch manifest content");
    }
  }

  /**
   * Create a new dashboard manifest
   */
  static async createManifest(
    tenantId: string,
    data: CreateManifestRequest
  ): Promise<ApiResponse<DashboardManifestListItem>> {
    try {
      // Validate manifest content before sending
      const validation = this.validateManifestContent(data.manifestContent);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid manifest: ${validation.errors.join(", ")}`,
        };
      }

      const response = await apiClient.post<DashboardManifestListItem>(
        `/api/manifest/tenants/${tenantId}/dashboards/manifests`,
        data
      );
      return response;
    } catch (error) {
      console.error("Failed to create dashboard manifest:", error);
      throw new Error("Failed to create dashboard manifest");
    }
  }

  /**
   * Update an existing dashboard manifest
   */
  static async updateManifest(
    tenantId: string,
    dashboardId: string,
    data: UpdateManifestRequest
  ): Promise<ApiResponse<DashboardManifestListItem>> {
    try {
      // Validate manifest content if provided
      if (data.manifestContent) {
        const validation = this.validateManifestContent(data.manifestContent);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Invalid manifest: ${validation.errors.join(", ")}`,
          };
        }
      }

      const response = await apiClient.put<DashboardManifestListItem>(
        `/api/manifest/tenants/${tenantId}/dashboards/${dashboardId}`,
        data
      );
      return response;
    } catch (error) {
      console.error("Failed to update dashboard manifest:", error);
      throw new Error("Failed to update dashboard manifest");
    }
  }

  /**
   * Delete a dashboard manifest
   */
  static async deleteManifest(
    tenantId: string,
    dashboardId: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>(
        `/api/manifest/tenants/${tenantId}/dashboards/${dashboardId}`
      );
      return response;
    } catch (error) {
      console.error("Failed to delete dashboard manifest:", error);
      throw new Error("Failed to delete dashboard manifest");
    }
  }

  /**
   * Toggle dashboard active status
   */
  static async toggleManifestStatus(
    tenantId: string,
    dashboardId: string,
    isActive: boolean
  ): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.patch<void>(
        `/api/manifest/tenants/${tenantId}/dashboards/${dashboardId}/status`,
        { isActive }
      );
      return response;
    } catch (error) {
      console.error("Failed to toggle dashboard status:", error);
      throw new Error("Failed to toggle dashboard status");
    }
  }

  /**
   * Get the default template content
   */
  static async getTemplate(
    templateType: "basic" | "sales" | "inventory" | "manager-overview" = "basic"
  ): Promise<string> {
    switch (templateType) {
      case "manager-overview":
        return `{
  "schemaVersion": "1.0",
  "dashboardId": "",
  "dashboardName": "Manager Overview Dashboard",
  "description": "Executive dashboard for inventory management overview with key risk indicators and actionable insights",
  "version": 1,
  "targetTeams": ["management", "inventory-managers"],
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 60
  },
  "widgets": [
    {
      "id": "value-at-risk-kpi",
      "title": "Value at Risk (Critical Stock)",
      "type": "kpi-card",
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
      "dataSourceId": "query_kpi_value_at_risk",
      "config": {
        "color": "red",
        "showTrend": true,
        "format": "currency",
        "unit": "THB",
        "comparison": {
          "period": "last-month",
          "showPercentage": true
        },
        "thresholds": {
          "critical": 1000000,
          "warning": 500000
        }
      }
    },
    {
      "id": "stock-aging-overview",
      "title": "Stock Aging by Category",
      "type": "bar-chart",
      "position": { "x": 3, "y": 0, "w": 6, "h": 4 },
      "dataSourceId": "query_stock_aging_summary",
      "config": {
        "chartType": "stacked",
        "orientation": "vertical",
        "showLegend": true,
        "colors": ["#ef4444", "#f59e0b", "#10b981"],
        "categoryLabels": {
          "critical": "Critical (<30 days)",
          "warning": "Warning (30-90 days)", 
          "healthy": "Healthy (>90 days)"
        },
        "sorting": "desc",
        "maxCategories": 10
      }
    },
    {
      "id": "consumption-trend",
      "title": "Monthly Consumption Trend (12 Months)",
      "type": "timeseries-chart",
      "position": { "x": 9, "y": 0, "w": 3, "h": 4 },
      "dataSourceId": "query_consumption_trend_monthly",
      "config": {
        "showTrendLine": true,
        "showDataPoints": true,
        "color": "#3b82f6",
        "smoothing": true,
        "showAverage": true,
        "yAxisFormat": "currency"
      }
    },
    {
      "id": "fifo-action-list",
      "title": "FIFO Priority Actions (Top 10 Oldest Lots)",
      "type": "data-table",
      "position": { "x": 0, "y": 4, "w": 12, "h": 4 },
      "dataSourceId": "query_actionable_fifo_list",
      "config": {
        "columns": [
          { "key": "product_code", "title": "Product Code", "width": 120, "sortable": true },
          { "key": "product_name", "title": "Product Name", "width": 200, "sortable": true },
          { "key": "lot_number", "title": "Lot Number", "width": 100, "sortable": true },
          { "key": "expiry_date", "title": "Expiry Date", "width": 120, "sortable": true, "format": "date" },
          { "key": "days_to_expiry", "title": "Days to Expiry", "width": 100, "sortable": true },
          { "key": "current_stock", "title": "Current Stock", "width": 100, "sortable": true, "format": "number" },
          { "key": "unit_cost", "title": "Unit Cost", "width": 100, "format": "currency" },
          { "key": "total_value", "title": "Total Value", "width": 120, "format": "currency" }
        ],
        "defaultSort": { "column": "days_to_expiry", "direction": "asc" },
        "showPagination": true,
        "pageSize": 10,
        "highlightRules": [
          { "condition": "days_to_expiry < 30", "style": "critical" },
          { "condition": "days_to_expiry < 60", "style": "warning" }
        ]
      }
    }
  ],
  "dataSources": [
    {
      "id": "query_kpi_value_at_risk",
      "type": "sql",
      "connectionId": "main_inventory_db",
      "query": "WITH critical_stock AS (\\n  SELECT \\n    SUM(current_stock * unit_cost) as total_value_at_risk,\\n    COUNT(*) as critical_items_count\\n  FROM inventory_items \\n  WHERE days_to_expiry < 30 AND current_stock > 0\\n),\\nlast_month_critical AS (\\n  SELECT SUM(value_at_risk) as last_month_value\\n  FROM monthly_risk_snapshots \\n  WHERE snapshot_date = DATE_SUB(CURDATE(), INTERVAL 1 MONTH)\\n)\\nSELECT \\n  cs.total_value_at_risk as current_value,\\n  cs.critical_items_count,\\n  lmc.last_month_value,\\n  CASE \\n    WHEN lmc.last_month_value > 0 \\n    THEN ((cs.total_value_at_risk - lmc.last_month_value) / lmc.last_month_value) * 100\\n    ELSE 0\\n  END as change_percentage\\nFROM critical_stock cs\\nCROSS JOIN last_month_critical lmc",
      "mappings": {
        "value": "current_value",
        "trend": "change_percentage",
        "metadata": {
          "itemsCount": "critical_items_count"
        }
      }
    },
    {
      "id": "query_stock_aging_summary",
      "type": "sql", 
      "connectionId": "main_inventory_db",
      "query": "SELECT \\n  pc.category_name,\\n  SUM(CASE WHEN ii.days_to_expiry < 30 THEN ii.current_stock * ii.unit_cost ELSE 0 END) as critical_value,\\n  SUM(CASE WHEN ii.days_to_expiry BETWEEN 30 AND 90 THEN ii.current_stock * ii.unit_cost ELSE 0 END) as warning_value,\\n  SUM(CASE WHEN ii.days_to_expiry > 90 THEN ii.current_stock * ii.unit_cost ELSE 0 END) as healthy_value,\\n  SUM(ii.current_stock * ii.unit_cost) as total_value\\nFROM inventory_items ii\\nJOIN products p ON ii.product_id = p.product_id\\nJOIN product_categories pc ON p.category_id = pc.category_id\\nWHERE ii.current_stock > 0\\nGROUP BY pc.category_name, pc.category_id\\nORDER BY total_value DESC\\nLIMIT 10",
      "mappings": {
        "category": "category_name",
        "series": {
          "critical": "critical_value",
          "warning": "warning_value", 
          "healthy": "healthy_value"
        }
      }
    },
    {
      "id": "query_consumption_trend_monthly",
      "type": "sql",
      "connectionId": "main_inventory_db", 
      "query": "SELECT \\n  DATE_FORMAT(consumption_date, '%Y-%m') as month,\\n  SUM(consumed_quantity * unit_cost) as monthly_consumption_value,\\n  COUNT(DISTINCT product_id) as products_consumed\\nFROM inventory_consumption_log\\nWHERE consumption_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)\\nGROUP BY DATE_FORMAT(consumption_date, '%Y-%m')\\nORDER BY month ASC",
      "mappings": {
        "x": "month",
        "y": "monthly_consumption_value",
        "metadata": {
          "productsCount": "products_consumed"
        }
      }
    },
    {
      "id": "query_actionable_fifo_list",
      "type": "sql",
      "connectionId": "main_inventory_db",
      "query": "SELECT \\n  p.product_code,\\n  p.product_name,\\n  ii.lot_number,\\n  ii.expiry_date,\\n  DATEDIFF(ii.expiry_date, CURDATE()) as days_to_expiry,\\n  ii.current_stock,\\n  ii.unit_cost,\\n  (ii.current_stock * ii.unit_cost) as total_value,\\n  pc.category_name\\nFROM inventory_items ii\\nJOIN products p ON ii.product_id = p.product_id\\nJOIN product_categories pc ON p.category_id = pc.category_id\\nWHERE ii.current_stock > 0\\nORDER BY ii.expiry_date ASC, total_value DESC\\nLIMIT 10",
      "mappings": {
        "rows": "*"
      }
    }
  ]
}`;

      case "sales":
        return `{
  "schemaVersion": "1.0",
  "dashboardId": "",
  "dashboardName": "Sales Performance Dashboard",
  "description": "Monthly sales performance tracking with KPIs and trends",
  "version": 1,
  "targetTeams": ["sales", "management"],
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 60
  },
  "widgets": [
    {
      "id": "total-sales-kpi",
      "title": "Total Sales This Month",
      "type": "kpi-card",
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
      "dataSourceId": "monthly_sales_total",
      "config": {
        "color": "blue",
        "showTrend": true,
        "format": "currency"
      }
    }
  ],
  "dataSources": [
    {
      "id": "monthly_sales_total",
      "type": "sql",
      "connectionId": "main_db",
      "query": "SELECT SUM(amount) as total_sales FROM sales WHERE MONTH(created_at) = MONTH(GETDATE())",
      "mappings": {
        "value": "total_sales"
      }
    }
  ]
}`;

      case "inventory":
        return `{
  "schemaVersion": "1.0",
  "dashboardId": "",
  "dashboardName": "Inventory Dashboard",
  "description": "Real-time inventory tracking and alerts",
  "version": 1,
  "targetTeams": ["warehouse", "operations"],
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 60
  },
  "widgets": [
    {
      "id": "low-stock-alert",
      "title": "Low Stock Items",
      "type": "table",
      "position": { "x": 0, "y": 0, "w": 6, "h": 3 },
      "dataSourceId": "low_stock_items",
      "config": {
        "highlightRows": true,
        "alertThreshold": 10
      }
    }
  ],
  "dataSources": [
    {
      "id": "low_stock_items",
      "type": "xml",
      "sourceDetails": {
        "filePath": "/opt/inventory/stock_levels.xml"
      },
      "query": {
        "rowSelector": "/Inventory/Items/Item",
        "fields": {
          "productId": "@ID",
          "productName": "Name",
          "currentStock": "Quantity",
          "minStock": "MinLevel"
        }
      },
      "mappings": {
        "id": "productId",
        "name": "productName",
        "stock": "currentStock",
        "minimum": "minStock"
      }
    }
  ]
}`;

      default:
        return `{
  "schemaVersion": "1.0",
  "dashboardId": "",
  "dashboardName": "New Dashboard",
  "description": "Dashboard description",
  "version": 1,
  "targetTeams": ["default"],
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 50
  },
  "widgets": [],
  "dataSources": []
}`;
    }
  }

  /**
   * Parse manifest content from YAML or JSON string
   */
  static parseManifestContent(content: string): DashboardManifest {
    try {
      // Try parsing as JSON first
      return JSON.parse(content);
    } catch {
      // If JSON parsing fails, try basic YAML parsing
      // For now, we'll use a simple approach since we don't have js-yaml
      // In production, you'd want to add js-yaml as a dependency
      throw new Error("YAML parsing not implemented. Please use JSON format.");
    }
  }

  /**
   * Validate manifest content (YAML/JSON)
   */
  static validateManifestContent(content: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Try to parse the content
      const parsed = this.parseManifestContent(content);

      // Basic validation
      if (!parsed.schemaVersion) {
        errors.push("schemaVersion is required");
      }

      if (!parsed.dashboardName) {
        errors.push("dashboardName is required");
      }

      if (!parsed.layout) {
        errors.push("layout is required");
      } else {
        if (!parsed.layout.type) {
          errors.push("layout.type is required");
        }
        if (!parsed.layout.columns || parsed.layout.columns <= 0) {
          errors.push("layout.columns must be a positive number");
        }
      }

      if (!Array.isArray(parsed.widgets)) {
        errors.push("widgets must be an array");
      }

      if (!Array.isArray(parsed.dataSources)) {
        errors.push("dataSources must be an array");
      }
    } catch (parseError) {
      errors.push(`Invalid JSON format: ${parseError}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
