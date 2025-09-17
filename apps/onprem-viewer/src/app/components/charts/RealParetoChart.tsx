/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Real Pareto Chart with Recharts
 * Combination chart showing bars and cumulative line
 */

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RealParetoChartProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

export default function RealParetoChart({
  data,
  config,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  width = 400,
  height = 300,
}: RealParetoChartProps) {
  // Process data according to query config
  const processedData = processParetoData(data, config.query);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-full h-full bg-white border rounded-lg p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">No data for Pareto analysis</p>
        </div>
      </div>
    );
  }

  const encoding = config.encoding || {};

  return (
    <div className="w-full h-full bg-white border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-800">
          {config?.title || "Pareto Chart"}
        </h3>
        <p className="text-sm text-gray-500">
          Bar chart with cumulative percentage line
        </p>
      </div>

      <div style={{ width: "100%", height: height - 80 }}>
        <ResponsiveContainer>
          <ComposedChart
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
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value, name) => {
                if (name === "cumulative") {
                  return [`${Number(value).toFixed(1)}%`, "Cumulative %"];
                }
                return [formatValue(value, encoding.yLeft?.formatter), "Value"];
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey={encoding.yLeft?.field || "value"}
              fill="#3b82f6"
              name="Value"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              name="Cumulative %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function processParetoData(data: any[], query: any) {
  if (!data || data.length === 0 || !query?.dimensions || !query?.measures) {
    return [];
  }

  const dimension = query.dimensions[0];
  const measure = query.measures[0];

  // Group by dimension and aggregate
  const grouped = data.reduce((acc, row) => {
    const key = row[dimension];
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += Number(row[measure.field]) || 0;
    return acc;
  }, {});

  // Convert to array and sort
  let result = Object.entries(grouped).map(([key, value]) => ({
    [dimension]: key,
    [measure.field]: value,
    category: key,
    value: value,
  }));

  // Sort by value descending
  result.sort((a, b) => (b.value as number) - (a.value as number));

  // Apply limit
  if (query.limit) {
    result = result.slice(0, query.limit);
  }

  // Calculate cumulative percentage
  const total = result.reduce((sum, item) => sum + (item.value as number), 0);
  let cumSum = 0;

  result = result.map((item) => {
    cumSum += item.value as number;
    const cumulative = total > 0 ? (cumSum / total) * 100 : 0;
    return {
      ...item,
      cumulative,
    };
  });

  return result;
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
    default:
      return num.toString();
  }
}
