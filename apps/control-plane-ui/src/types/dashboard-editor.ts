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
  | "line-chart";

// Widget Configuration Interface
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, unknown>;
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

// Drag Item Types
export const ItemTypes = {
  WIDGET: "widget",
  NEW_WIDGET: "new_widget",
} as const;
