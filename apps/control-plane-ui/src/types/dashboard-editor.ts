/**
 * Dashboard Editor Types
 * Shared types for the visual dashboard editor components
 */

import React from "react";

// Widget Types
export type WidgetType =
  | "kpi"
  | "chart"
  | "table"
  | "text"
  | "image"
  | "date"
  | "bar-chart"
  | "pie-chart"
  | "line-chart"
  | "gauge"
  | "progress"
  | "iframe"
  | "map"
  | "calendar"
  // Analytics Widget Types - PowerBI-style comparison widgets
  | "period-comparison"
  | "target-comparison"
  | "peer-comparison"
  | "composition-analysis"
  | "trend-analysis"
  | "interactive-chart";

// **อัปเดต Widget Interface ให้รองรับ Firestore Structure**
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // **สำคัญ**: Config ใหม่ที่รองรับ Raw Query
  config: {
    // Data Configuration
    dataSourceType?: "sql" | "postgresql" | "mysql" | "firestore" | "api";
    query?: string; // Raw Query String
    params?: string; // JSON string for parameters
    refreshInterval?: number; // milliseconds

    // Display Configuration
    chartType?: "bar" | "line" | "pie" | "doughnut" | "area";
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    showBorder?: boolean;
    showTitle?: boolean;

    // Legacy support
    dataSource?: string;
    apiEndpoint?: string;
    sqlQuery?: string;
    customCss?: string;
    customJs?: string;

    // Other options
    [key: string]: unknown;
  };
  data?: unknown;
}

// Layout Item for react-grid-layout
export interface LayoutItem {
  i: string; // widget id
  x: number; // position x (grid units)
  y: number; // position y (grid units)
  w: number; // width (grid units)
  h: number; // height (grid units)
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

// Dashboard Configuration
export interface DashboardConfig {
  id: string;
  name: string;
  widgets: Widget[];
  layout: LayoutItem[]; // เพิ่ม layout array
  layout_config: {
    columns: number;
    rows: number;
    gridSize: number;
    breakpoints?: Record<string, number>;
    cols?: Record<string, number>;
  };
  theme: string;
}

// Widget Library Item Interface
export interface WidgetLibraryItem {
  type: WidgetType;
  name: string;
  icon: React.ComponentType;
  defaultSize: { width: number; height: number };
  category: string;
}

// **เพิ่ม Firestore API Response Types**
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

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

// Drag Item Types
export const ItemTypes = {
  WIDGET: "widget",
  NEW_WIDGET: "new_widget",
} as const;
