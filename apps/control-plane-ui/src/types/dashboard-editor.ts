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

// Dashboard Configuration
export interface DashboardConfig {
  id: string;
  name: string;
  widgets: Widget[];
  layout: {
    columns: number;
    rows: number;
    gridSize: number;
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
