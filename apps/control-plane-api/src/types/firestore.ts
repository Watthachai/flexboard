/**
 * Firestore Models และ Types
 * สำหรับการจัดการข้อมูลใน Firestore
 */

import { Timestamp } from "firebase-admin/firestore";

// ===== Base Types =====
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// ===== Tenant Models =====
export interface TenantDocument extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  settings: {
    theme: "light" | "dark";
    timezone: string;
    locale: string;
    features: string[];
  };
  status: "active" | "inactive" | "suspended";
  subscriptionPlan: "free" | "pro" | "enterprise";
}

// ===== Dashboard Models =====
export interface DashboardDocument extends BaseDocument {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  settings: {
    refreshInterval: number;
    theme: "light" | "dark";
    autoRefresh: boolean;
  };
  status: "draft" | "published" | "archived";
  tags: string[];
  // Metadata สำหรับ Visual Builder
  visualConfig?: {
    layout: {
      columns: number;
      rows: number;
      gridSize: number;
    };
    widgets: WidgetConfig[];
  };
}

// ===== Widget Models =====
export interface WidgetDocument extends BaseDocument {
  tenantId: string;
  dashboardId: string;
  name: string;
  type: WidgetType;
  // การวางตำแหน่งใน Grid
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // **สำคัญ**: Data Configuration ใหม่
  dataConfig: {
    dataSourceType: "sql" | "firestore" | "mysql" | "postgresql" | "api";
    // Query String ที่ Admin วางเข้าไปเอง
    query: string;
    // พารามิเตอร์เสริม (Optional)
    params?: Record<string, any>;
    // การรีเฟรชข้อมูล
    refreshInterval: number; // milliseconds
    cacheDuration: number; // milliseconds
  };
  // การแสดงผล
  displayConfig: {
    title: string;
    subtitle?: string;
    showTitle: boolean;
    showBorder: boolean;
    backgroundColor?: string;
    textColor?: string;
    chartType?: "bar" | "line" | "pie" | "doughnut" | "area";
    chartOptions?: Record<string, any>;
  };
  // สถานะ
  status: "active" | "inactive";
  isVisible: boolean;
}

// ===== Widget Types =====
export type WidgetType =
  | "kpi"
  | "chart"
  | "table"
  | "gauge"
  | "progress"
  | "text"
  | "image"
  | "iframe"
  | "map"
  | "calendar";

// ===== Visual Builder Support Types =====
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: {
    dataSourceType: "sql" | "firestore" | "mysql" | "postgresql" | "api";
    query: string;
    params?: Record<string, any>;
    refreshInterval: number;
    // Visual properties
    chartType?: string;
    displayOptions?: Record<string, any>;
  };
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

// ===== Query Types =====
export interface QueryResult {
  data: any[];
  columns: string[];
  rowCount: number;
  executionTime: number;
  metadata?: {
    dataSource: string;
    query: string;
    params?: Record<string, any>;
  };
}

// ===== Export all types =====
// All types are already exported above with their interface declarations
