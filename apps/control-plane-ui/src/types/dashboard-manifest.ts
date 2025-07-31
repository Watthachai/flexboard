/**
 * Dashboard Manifest Types
 * Schema definitions for Dashboard as Code approach
 */

export interface DashboardManifest {
  schemaVersion: string;
  dashboardId: string;
  dashboardName: string;
  description?: string;
  version: number;
  targetTeams: string[];
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  dataSources: DataSource[];
}

export interface DashboardLayout {
  type: "grid" | "flex" | "absolute";
  columns: number;
  rowHeight: number;
  gap?: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  position: WidgetPosition;
  dataSourceId: string;
  config?: Record<string, unknown>;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type WidgetType =
  | "kpi-card"
  | "line-chart"
  | "bar-chart"
  | "pie-chart"
  | "table"
  | "gauge"
  | "text"
  | "image";

export interface DataSource {
  id: string;
  type: DataSourceType;
  connectionId?: string;
  query: string | XMLQuery;
  mappings?: Record<string, string>;
  sourceDetails?: SourceDetails;
}

export type DataSourceType = "sql" | "xml" | "csv" | "excel" | "rest_api";

export interface XMLQuery {
  rowSelector: string;
  fields: Record<string, string>;
}

export interface SourceDetails {
  filePath?: string;
  endpoint?: string;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PUT" | "DELETE";
}

// Template for new dashboards
export const DASHBOARD_TEMPLATE: Partial<DashboardManifest> = {
  schemaVersion: "1.0",
  dashboardName: "New Dashboard",
  description: "Dashboard description",
  version: 1,
  targetTeams: ["default"],
  layout: {
    type: "grid",
    columns: 12,
    rowHeight: 50,
  },
  widgets: [],
  dataSources: [],
};
