/**
 * Dashboard Type Definitions
 * Types for dashboard entities and operations
 */

/**
 * Widget position on dashboard grid
 */
export interface WidgetPosition {
  x: number;
  y: number;
  w: number; // width in grid units
  h: number; // height in grid units
}

/**
 * Widget configuration for different chart types
 */
export interface WidgetConfig {
  // Chart configuration
  chartType?: "bar" | "line" | "pie" | "area" | "scatter";
  dataSource?: string;
  metrics?: string[];
  dimensions?: string[];

  // Display settings
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];

  // Filters
  filters?: Record<string, unknown>;
  dateRange?: {
    start: string;
    end: string;
  };

  // Refresh settings
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

/**
 * Dashboard widget entity
 */
export interface DashboardWidget {
  id: string;
  dashboardId: string;
  type: "chart" | "metric" | "table" | "text" | "image";
  position: WidgetPosition;
  config: WidgetConfig;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dashboard layout settings
 */
export interface DashboardLayout {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  breakpoints: Record<string, number>;
  responsive: boolean;
}

/**
 * Dashboard sharing settings
 */
export interface DashboardSharing {
  isPublic: boolean;
  shareUrl?: string;
  allowedUsers?: string[];
  password?: string;
  expiresAt?: string;
}

/**
 * Main dashboard entity
 */
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdBy: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  sharing: DashboardSharing;
  tags: string[];
  isTemplate: boolean;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
}

/**
 * Dashboard analytics data
 */
export interface DashboardAnalytics {
  dashboardId: string;
  views: {
    total: number;
    unique: number;
    timeRange: Array<{
      date: string;
      views: number;
      uniqueViews: number;
    }>;
  };
  widgets: {
    totalWidgets: number;
    widgetTypes: Record<string, number>;
    mostUsedWidget: string;
  };
  performance: {
    averageLoadTime: number;
    slowestWidget?: string;
    errorRate: number;
  };
  users: {
    activeUsers: number;
    topUsers: Array<{
      userId: string;
      views: number;
      lastViewed: string;
    }>;
  };
  exports: {
    total: number;
    formats: Record<string, number>;
  };
}

/**
 * Dashboard template for quick creation
 */
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  config: Omit<
    Dashboard,
    "id" | "tenantId" | "createdBy" | "createdAt" | "updatedAt"
  >;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  rating: number;
}

/**
 * Dashboard filter for search and listing
 */
export interface DashboardFilter {
  search?: string;
  tags?: string[];
  createdBy?: string;
  isTemplate?: boolean;
  isPublic?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Dashboard sort options
 */
export type DashboardSortField =
  | "name"
  | "createdAt"
  | "updatedAt"
  | "lastViewedAt";
export type DashboardSortOrder = "asc" | "desc";

export interface DashboardSort {
  field: DashboardSortField;
  order: DashboardSortOrder;
}
