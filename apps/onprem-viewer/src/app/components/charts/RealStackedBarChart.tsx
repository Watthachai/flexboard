/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Real Stacked Bar Chart with Recharts
 * Supports multiple series stacking with category breakdown
 */

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RealStackedBarChartProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

const CHART_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export default function RealStackedBarChart({
  data,
  config,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  width = 400,
  height = 300,
}: RealStackedBarChartProps) {
  // Process data according to query config
  const processedData = processStackedData(data, config.query);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-full h-full bg-white border rounded-lg p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">No data for stacked chart</p>
        </div>
      </div>
    );
  }

  const encoding = config.encoding || {};
  const stackBy = encoding.stack?.field;
  const stackKeys = getStackKeys(processedData, stackBy);

  return (
    <div className="w-full h-full bg-white border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-800">
          {config?.title || "Stacked Bar Chart"}
        </h3>
        <p className="text-sm text-gray-500">
          Multiple series comparison by category
        </p>
      </div>

      <div style={{ width: "100%", height: height - 80 }}>
        <ResponsiveContainer>
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={encoding.x?.field || "category"}
              angle={-45}
              textAnchor="end"
              height={60}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) =>
                formatValue(value, encoding.y?.formatter)
              }
            />
            <Tooltip
              formatter={(value, name) => [
                formatValue(value, encoding.y?.formatter),
                name,
              ]}
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "#f9fafb",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />
            <Legend />
            {stackKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="stack"
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                name={key}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function processStackedData(data: any[], query: any) {
  if (!data || data.length === 0 || !query?.dimensions || !query?.measures) {
    return [];
  }

  const xDimension = query.dimensions[0];
  const stackDimension = query.dimensions[1]; // Second dimension for stacking
  const measure = query.measures[0];

  // Group by x-dimension and stack dimension
  const grouped = data.reduce((acc, row) => {
    const xKey = row[xDimension];
    const stackKey = row[stackDimension] || "Unknown";

    if (!acc[xKey]) {
      acc[xKey] = {};
    }
    if (!acc[xKey][stackKey]) {
      acc[xKey][stackKey] = 0;
    }

    // Apply aggregation
    const value = Number(row[measure.field]) || 0;
    switch (measure.aggregation) {
      case "sum":
        acc[xKey][stackKey] += value;
        break;
      case "count":
        acc[xKey][stackKey] += 1;
        break;
      case "avg":
        // For average, we'll need to track sum and count separately
        if (!acc[xKey][`${stackKey}_sum`]) acc[xKey][`${stackKey}_sum`] = 0;
        if (!acc[xKey][`${stackKey}_count`]) acc[xKey][`${stackKey}_count`] = 0;
        acc[xKey][`${stackKey}_sum`] += value;
        acc[xKey][`${stackKey}_count`] += 1;
        acc[xKey][stackKey] =
          acc[xKey][`${stackKey}_sum`] / acc[xKey][`${stackKey}_count`];
        break;
      default:
        acc[xKey][stackKey] = value;
    }

    return acc;
  }, {});

  // Convert to array format for Recharts
  let result = Object.entries(grouped).map(([xValue, stacks]) => {
    const item: any = {
      [xDimension]: xValue,
      category: xValue,
    };

    // Add each stack as a separate property
    Object.entries(stacks as Record<string, number>).forEach(
      ([stackKey, value]) => {
        if (!stackKey.endsWith("_sum") && !stackKey.endsWith("_count")) {
          item[stackKey] = value;
        }
      }
    );

    return item;
  });

  // Apply sorting if specified
  if (query.sort) {
    const sortField = query.sort.field;
    const sortOrder = query.sort.order || "asc";
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });
  }

  // Apply limit
  if (query.limit) {
    result = result.slice(0, query.limit);
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getStackKeys(data: any[], stackField?: string): string[] {
  if (!data.length) return [];

  const keys = new Set<string>();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      // Exclude the x-axis field and any metadata fields
      if (key !== "category" && typeof item[key] === "number") {
        keys.add(key);
      }
    });
  });

  return Array.from(keys).sort();
}

function formatValue(value: any, formatter?: string): string {
  const num = Number(value) || 0;
  switch (formatter) {
    case "qty":
      return num.toLocaleString("th-TH");
    case "money":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(num);
    case "percentage":
      return `${num.toFixed(1)}%`;
    default:
      return num.toLocaleString();
  }
}
