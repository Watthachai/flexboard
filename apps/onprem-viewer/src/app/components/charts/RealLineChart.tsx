/**
 * Enhanced Real Line Chart with Recharts
 * Supports time series data, multiple lines, and advanced formatting
 */

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface RealLineChartProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

const LINE_COLORS = [
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

export default function RealLineChart({
  data,
  config,
  width = 400,
  height = 300,
}: RealLineChartProps) {
  // Process data according to query config
  const processedData = processLineData(data, config.query);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-full h-full bg-white border rounded-lg p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📈</div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const encoding = config.encoding || {};
  const lines = getLineFields(processedData, config.query);

  return (
    <div className="w-full h-full bg-white border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-800">
          {config?.title || "Line Chart"}
        </h3>
        {config?.description && (
          <p className="text-sm text-gray-500">{config.description}</p>
        )}
      </div>

      <div style={{ width: "100%", height: height - 80 }}>
        <ResponsiveContainer>
          <LineChart
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
              tickFormatter={(value) =>
                formatXAxisValue(value, encoding.x?.formatter)
              }
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
              labelFormatter={(value) =>
                formatXAxisValue(value, encoding.x?.formatter)
              }
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "#f9fafb",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />
            <Legend />
            {lines.map((lineField, index) => (
              <Line
                key={lineField}
                type="monotone"
                dataKey={lineField}
                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={lineField}
              />
            ))}
            {/* Add reference lines if configured */}
            {config.referenceLine && (
              <ReferenceLine
                y={config.referenceLine.value}
                stroke={config.referenceLine.color || "#ff7300"}
                strokeDasharray="5 5"
                label={config.referenceLine.label}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function processLineData(data: any[], query: any) {
  if (!data || data.length === 0 || !query?.dimensions || !query?.measures) {
    return [];
  }

  const xDimension = query.dimensions[0];
  const seriesDimension = query.dimensions[1]; // Optional series grouping
  const measure = query.measures[0];

  // Apply filters first
  let filteredData = data;
  if (query.filters && query.filters.length > 0) {
    filteredData = data.filter((row) => {
      return query.filters.every((filter: any) => {
        const fieldValue = row[filter.field];
        switch (filter.operator) {
          case "equals":
            return fieldValue === filter.value;
          case "not_equals":
            return fieldValue !== filter.value;
          case "greater_than":
            return Number(fieldValue) > Number(filter.value);
          case "less_than":
            return Number(fieldValue) < Number(filter.value);
          case "contains":
            return String(fieldValue)
              .toLowerCase()
              .includes(String(filter.value).toLowerCase());
          case "in":
            return (
              Array.isArray(filter.value) && filter.value.includes(fieldValue)
            );
          default:
            return true;
        }
      });
    });
  }

  if (seriesDimension) {
    // Multiple series line chart
    const grouped = filteredData.reduce((acc, row) => {
      const xKey = row[xDimension];
      const seriesKey = row[seriesDimension] || "Unknown";

      if (!acc[xKey]) {
        acc[xKey] = { [xDimension]: xKey };
      }

      const value = Number(row[measure.field]) || 0;
      acc[xKey][seriesKey] = aggregateValue(
        acc[xKey][seriesKey],
        value,
        measure.aggregation
      );

      return acc;
    }, {});

    return Object.values(grouped);
  } else {
    // Single series line chart
    const grouped = filteredData.reduce((acc, row) => {
      const key = row[xDimension];
      if (!acc[key]) {
        acc[key] = {
          values: [],
          count: 0,
          sum: 0,
        };
      }

      const value = Number(row[measure.field]) || 0;
      acc[key].values.push(value);
      acc[key].count += 1;
      acc[key].sum += value;

      return acc;
    }, {});

    // Apply aggregation and convert to array
    let result = Object.entries(grouped).map(([key, group]: [string, any]) => {
      let aggregatedValue;
      switch (measure.aggregation) {
        case "sum":
          aggregatedValue = group.sum;
          break;
        case "count":
          aggregatedValue = group.count;
          break;
        case "avg":
          aggregatedValue = group.count > 0 ? group.sum / group.count : 0;
          break;
        case "min":
          aggregatedValue = Math.min(...group.values);
          break;
        case "max":
          aggregatedValue = Math.max(...group.values);
          break;
        default:
          aggregatedValue = group.sum;
      }

      return {
        [xDimension]: key,
        [measure.field]: aggregatedValue,
        category: key,
        value: aggregatedValue,
      };
    });

    // Apply sorting
    if (query.sort) {
      const sortField = query.sort.field;
      const sortOrder = query.sort.order || "asc";
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "desc"
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        }
        return sortOrder === "desc"
          ? Number(bVal) - Number(aVal)
          : Number(aVal) - Number(bVal);
      });
    }

    // Apply limit
    if (query.limit) {
      result = result.slice(0, query.limit);
    }

    return result;
  }
}

function aggregateValue(
  currentValue: number | undefined,
  newValue: number,
  aggregation: string
): number {
  if (currentValue === undefined) {
    return newValue;
  }

  switch (aggregation) {
    case "sum":
      return currentValue + newValue;
    case "max":
      return Math.max(currentValue, newValue);
    case "min":
      return Math.min(currentValue, newValue);
    default:
      return newValue;
  }
}

function getLineFields(data: any[], query: any): string[] {
  if (!data.length) return ["value"];

  const xField = query?.dimensions?.[0] || "category";
  const measureField = query?.measures?.[0]?.field || "value";

  const fields = new Set<string>();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      // Include numeric fields that are not the x-axis
      if (
        key !== xField &&
        key !== "category" &&
        typeof item[key] === "number"
      ) {
        fields.add(key);
      }
    });
  });

  // If no series found, use the measure field
  if (fields.size === 0) {
    fields.add(measureField);
  }

  return Array.from(fields).sort();
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
    case "days":
      return `${num} days`;
    default:
      return num.toLocaleString();
  }
}

function formatXAxisValue(value: any, formatter?: string): string {
  if (formatter === "date") {
    // Try to format as date if it looks like a date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("th-TH");
    }
  }
  return String(value);
}
