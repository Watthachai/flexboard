/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Base Chart Props Interface
 */

export interface BaseChartProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  title: string;
  colors?: string[];
  height?: number;
  maxHeight?: number;
}

export const DEFAULT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
];

export const DEFAULT_TOOLTIP_STYLE = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "12px",
};

export const DEFAULT_CHART_CONFIG = {
  height: 300,
  maxHeight: 400,
  margin: { top: 20, right: 30, left: 20, bottom: 50 },
};
