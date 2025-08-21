/**
 * Enhanced Real Bar Chart with Recharts
 * Supports complex queries, data processing, and conditional formatting
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
  ReferenceLine,
} from "recharts";

interface RealBarChartProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

export default function RealBarChart({
  data,
  config,
  width = 400,
  height = 300,
}: RealBarChartProps) {
  // Use adaptedConfig if available, otherwise fallback to legacy processing
  let chartData: any[];
  let encoding: any;
  let title: string = config.title || "";

  if (config.adaptedConfig) {
    // Use processed config from chartConfigAdapter
    chartData = config.adaptedConfig.data;
    encoding = config.adaptedConfig.encoding || config.encoding || {};
    title = config.adaptedConfig.title || title;
  } else {
    // Legacy processing for backward compatibility
    chartData = processBarData(data, config.query);
    encoding = config.encoding || {};
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-white border rounded-lg p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const colorField = encoding.color?.field;

  console.log("🔍 Bar chart data:", {
    encoding,
    chartData: chartData.slice(0, 3),
    totalRows: chartData.length,
    title: config.title,
    xField: encoding.x?.field,
    yField: encoding.y?.field,
    colorField,
  });

  return (
    <div className="w-full h-full bg-white border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-800">
          {config?.title || "Bar Chart"}
        </h3>
        {config?.description && (
          <p className="text-sm text-gray-500">{config.description}</p>
        )}
      </div>

      <div style={{ width: "100%", height: height - 80 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={encoding.y?.field || encoding.x?.field || "category"}
              angle={-45}
              textAnchor="end"
              height={60}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) =>
                formatValue(
                  value,
                  encoding.x?.formatter || encoding.y?.formatter
                )
              }
            />
            <Tooltip
              formatter={(value, name) => [
                formatValue(
                  value,
                  encoding.x?.formatter || encoding.y?.formatter
                ),
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
            <Bar
              dataKey={encoding.x?.field || encoding.y?.field || "value"}
              fill="#3b82f6"
              name={encoding.x?.title || encoding.y?.title || "Value"}
            />
            {/* Add reference lines if configured */}
            {config.referenceLine && (
              <ReferenceLine
                y={config.referenceLine.value}
                stroke={config.referenceLine.color || "#ff7300"}
                strokeDasharray="5 5"
                label={config.referenceLine.label}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function processBarData(data: any[], query: any) {
  if (!data || data.length === 0 || !query?.dimensions || !query?.measures) {
    console.log("🔍 Bar chart: No data or invalid query", {
      hasData: !!data?.length,
      dimensions: query?.dimensions,
      measures: query?.measures,
    });
    return [];
  }

  const dimension = query.dimensions[0];
  const measure = query.measures[0];
  const aggregation = measure.agg || measure.aggregation || "sum";
  const alias = measure.as || measure.field;

  console.log("🔍 Processing bar chart data:", {
    dimension,
    measureField: measure.field,
    aggregation,
    alias,
    dataCount: data.length,
    sampleRow: data[0],
  });

  // Apply filters first
  let filteredData = data;
  if (query.filters && query.filters.length > 0) {
    filteredData = data.filter((row) => {
      return query.filters.every((filter: any) => {
        const fieldValue = row[filter.field];
        const operator = filter.operator || filter.op; // Support both formats
        switch (operator) {
          case "equals":
          case "eq":
            return fieldValue === filter.value;
          case "not_equals":
          case "ne":
            return fieldValue !== filter.value;
          case "greater_than":
          case "gt":
            return Number(fieldValue) > Number(filter.value);
          case "less_than":
          case "lt":
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

  // Group by dimension and aggregate
  const grouped = filteredData.reduce((acc, row) => {
    const key = row[dimension];
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
    switch (aggregation) {
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
      [dimension]: key,
      [measure.field]: aggregatedValue,
      [alias]: aggregatedValue, // Add alias field
      category: key,
      value: aggregatedValue,
    };
  });

  // Apply sorting
  if (query.sort) {
    const sortConfig = Array.isArray(query.sort) ? query.sort[0] : query.sort;
    const sortField = sortConfig.field;
    const sortOrder = sortConfig.dir || sortConfig.order || "asc";

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

  console.log("🔍 Bar chart processed data:", {
    resultCount: result.length,
    sampleResult: result[0],
    allResults: result.slice(0, 3),
  });

  return result;
}

function getBarColor(
  props: any,
  colorField?: string,
  conditionalFormatting?: any
): string {
  // Default color
  let color = "#3b82f6";

  // Apply conditional formatting if configured
  if (conditionalFormatting && conditionalFormatting.rules) {
    const value = props.payload?.value || props.value;
    for (const rule of conditionalFormatting.rules) {
      if (evaluateCondition(value, rule.condition)) {
        color = rule.color || color;
        break;
      }
    }
  }

  return color;
}

function evaluateCondition(value: any, condition: any): boolean {
  if (!condition) return false;

  const numValue = Number(value);
  switch (condition.operator) {
    case "greater_than":
      return numValue > Number(condition.value);
    case "less_than":
      return numValue < Number(condition.value);
    case "equals":
      return numValue === Number(condition.value);
    case "between":
      return (
        numValue >= Number(condition.min) && numValue <= Number(condition.max)
      );
    default:
      return false;
  }
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
