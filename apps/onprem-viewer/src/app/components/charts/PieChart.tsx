import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BaseChartProps, DEFAULT_COLORS, DEFAULT_TOOLTIP_STYLE, DEFAULT_CHART_CONFIG } from "./types";

export default function PieChart({
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
  const finalHeight = maxHeight ? Math.min(chartHeight, maxHeight) : Math.min(chartHeight, DEFAULT_CHART_CONFIG.maxHeight);

  // Process and group data
  const chartData = data
    .map((item) => ({
      name: item[xAxis],
      value: Number(item[yAxis]) || 0,
    }))
    .filter((item) => item.name !== undefined && item.name !== "" && item.value > 0);

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

  // Sort and take top 6 segments to avoid clutter
  const sortedData = groupedData
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const totalValue = sortedData.reduce((sum, item) => sum + item.value, 0);

  // Custom label function - only show labels for slices > 5%
  const renderLabel = (entry: any) => {
    const percentage = ((entry.value / totalValue) * 100);
    if (percentage > 5) {
      return `${percentage.toFixed(1)}%`;
    }
    return "";
  };

  if (!data || data.length === 0 || sortedData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded" style={{ minHeight: finalHeight }}>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">🥧</div>
          <p className="text-sm text-gray-500">No data available for {title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ maxHeight: finalHeight }}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🥧</span>
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <div className="text-xs text-gray-500">{sortedData.length} segments</div>
      </div>

      <div style={{ height: finalHeight - 100 }} className="bg-white rounded border">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={Math.min(80, (finalHeight - 120) / 3)}
              fill="#8884d8"
              dataKey="value"
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      {/* Compact Legend */}
      <div className="flex-shrink-0 mt-2">
        <div className="grid grid-cols-2 gap-1 text-xs">
          {sortedData.map((item, index) => {
            const percentage = ((item.value / totalValue) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="truncate text-gray-700">
                  {item.name}: {percentage}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Total:</strong> {totalValue.toLocaleString()} • 
          <strong> Top {sortedData.length} of {groupedData.length}</strong>
        </div>
      </div>
    </div>
  );
}
