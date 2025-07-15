/**
 * API Response Types
 * Common types for API communication
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  statusCode?: number;
}

// Tenant API Types
export interface CreateTenantRequest {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  settings?: TenantSettings;
}

export interface UpdateTenantRequest {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  settings?: TenantSettings;
}

export interface TenantSettings {
  theme?: "light" | "dark" | "auto";
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  features?: string[];
}

// Dashboard API Types
export interface CreateDashboardRequest {
  name: string;
  description?: string;
  tenantId: string;
  layout?: {
    cols?: number;
    rowHeight?: number;
    margin?: [number, number];
    containerPadding?: [number, number];
    breakpoints?: Record<string, number>;
    responsive?: boolean;
  };
  tags?: string[];
  isTemplate?: boolean;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: {
    cols?: number;
    rowHeight?: number;
    margin?: [number, number];
    containerPadding?: [number, number];
    breakpoints?: Record<string, number>;
    responsive?: boolean;
  };
  tags?: string[];
  isTemplate?: boolean;
  sharing?: {
    isPublic?: boolean;
    allowedUsers?: string[];
    password?: string;
    expiresAt?: string;
  };
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  theme: string;
  filters?: FilterConfig[];
}

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, any>;
}

export interface LayoutConfig {
  columns: number;
  rows: number;
  gridSize: number;
}

export interface FilterConfig {
  id: string;
  name: string;
  type: "dropdown" | "input" | "daterange";
  options?: string[];
}

// User API Types
export interface CreateUserRequest {
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  tenantId?: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: "admin" | "editor" | "viewer";
  isActive?: boolean;
}
