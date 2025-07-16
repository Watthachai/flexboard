/**
 * Tenant Domain Types
 * Core business entities for tenant management
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: TenantSettings;
  _count: {
    dashboards: number;
    users: number;
  };
  owner?: User;
}

export interface TenantSettings {
  theme: "light" | "dark" | "auto";
  timezone: string;
  dateFormat: string;
  currency: string;
  features: TenantFeature[];
  limits: TenantLimits;
}

export interface TenantFeature {
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface TenantLimits {
  maxDashboards: number;
  maxUsers: number;
  maxDataSources: number;
  storageQuotaGB: number;
}

export interface TenantStats {
  dashboardCount: number;
  userCount: number;
  dataSourceCount: number;
  storageUsedMB: number;
  lastActivity: string;
  monthlyActiveUsers: number;
  apiCallsThisMonth: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  tenantId?: string;
}

export type UserRole = "admin" | "editor" | "viewer";

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  config: DashboardConfig;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface DashboardConfig {
  widgets: Widget[];
  layout: LayoutSettings;
  theme: string;
  filters?: DashboardFilter[];
  variables?: DashboardVariable[];
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: WidgetConfig;
  dataSource?: DataSourceConfig;
}

export type WidgetType =
  | "kpi"
  | "line-chart"
  | "bar-chart"
  | "pie-chart"
  | "table"
  | "text"
  | "image";

export interface WidgetConfig {
  [key: string]: unknown;
}

export interface LayoutSettings {
  columns: number;
  rows: number;
  gridSize: number;
  margin?: number;
  padding?: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: "dropdown" | "input" | "daterange" | "multiselect";
  options?: FilterOption[];
  defaultValue?: unknown;
}

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface DashboardVariable {
  id: string;
  name: string;
  type: "static" | "query" | "computed";
  value: unknown;
  query?: string;
}

export interface DataSourceConfig {
  id: string;
  type: "api" | "database" | "file" | "mock";
  endpoint?: string;
  query?: string;
  refreshInterval?: number;
  cache?: boolean;
}
