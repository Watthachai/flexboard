/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import {
  BaseChartProps,
  DEFAULT_COLORS,
  DEFAULT_TOOLTIP_STYLE,
  DEFAULT_CHART_CONFIG,
} from "./types";

export default function BarChart({
  data,
  xAxis,
  yAxis,
  title,
  colors = DEFAULT_COLORS,
  height,
  maxHeight,
}: BaseChartProps) {
  // Calculate responsive height
  const chartHeight = height || DEFAULT_CHART_CONFIG.height;
  const finalHeight = maxHeight
    ? Math.min(chartHeight, maxHeight)
    : Math.min(chartHeight, DEFAULT_CHART_CONFIG.maxHeight);

  // Process and group data
  const chartData = data
    .map((item) => ({
      name: item[xAxis],
      value: Number(item[yAxis]) || 0,
    }))
    .filter((item) => item.name !== undefined && item.name !== "");

  // Group data by name and sum values
  const groupedData = chartData.reduce((acc, item) => {
    const existing = acc.find((x) => x.name === item.name);
    if (existing) {
      existing.value += item.value;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as any[]);

  // Sort by value and take top 10
  const sortedData = groupedData.sort((a, b) => b.value - a.value).slice(0, 10);

  if (!data || data.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg"
        style={{ minHeight: finalHeight }}
      >
        <div className="text-center p-4">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No data available for {title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ maxHeight: finalHeight }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-sm text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {sortedData.length} records
        </div>
      </div>

      <div
        style={{ height: finalHeight - 80 }}
        className="bg-white dark:bg-gray-900 rounded-lg"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={sortedData}
            margin={DEFAULT_CHART_CONFIG.margin}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              fontSize={10}
              stroke="#666"
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis fontSize={10} stroke="#666" />
            <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} />
            <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="flex-shrink-0 mt-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <span className="font-medium">Total:</span>{" "}
        {sortedData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}{" "}
        • <span className="font-medium">Top {sortedData.length}</span> of{" "}
        {groupedData.length}
      </div>
    </div>
  );
}
