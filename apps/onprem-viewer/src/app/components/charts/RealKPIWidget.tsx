/**
 * Real KPI Widget with Recharts
 * Displays key performance indicators with conditional styling
 */

import React from "react";
import { Cell, PieChart, Pie, ResponsiveContainer } from "recharts";

interface KPIWidgetProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

export default function RealKPIWidget({
  data,
  config,
  width = 200,
  height = 150,
}: KPIWidgetProps) {
  // Process data according to query config
  const processedData = processKPIData(data, config.query);
  const value = processedData?.value || 0;

  // Determine status color based on severity rules
  const statusColor = getStatusColor(value, config.display?.severityRules);

  const colorClasses = {
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      accent: "#ef4444",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      accent: "#f59e0b",
    },
    ok: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      accent: "#10b981",
    },
    neutral: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-800",
      accent: "#6b7280",
    },
  };

  const colors =
    colorClasses[statusColor as keyof typeof colorClasses] ||
    colorClasses.neutral;

  // Create mini chart data for visual interest
  const chartData = [
    { name: "Value", value: Math.abs(value) },
    { name: "Rest", value: Math.max(0, 100 - Math.abs(value)) },
  ];

  return (
    <div
      className={`w-full h-full border rounded-lg p-4 ${colors.bg} ${colors.border}`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-2">
          <h3 className={`font-semibold text-sm ${colors.text} opacity-80`}>
            {config?.title || "KPI"}
          </h3>
        </div>

        {/* Main Value Display */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${colors.text}`}>
              {formatValue(value, config?.display?.valueFormatter)}
            </div>
            <div className="text-xs opacity-60 flex items-center justify-center gap-1">
              {getStatusIcon(statusColor)}
              {getStatusText(statusColor)}
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        {value > 0 && (
          <div className="h-8 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={8}
                  outerRadius={12}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill={colors.accent} />
                  <Cell fill={colors.accent + "20"} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function processKPIData(data: any[], query: any) {
  if (!data || data.length === 0) {
    return { value: 0 };
  }

  if (!query || !query.measures || query.measures.length === 0) {
    console.log("🔍 No query measures found, returning 0");
    return { value: 0 };
  }

  const measure = query.measures[0];
  const field = measure.field;
  const agg = measure.agg || measure.aggregation || "sum"; // Support both 'agg' and 'aggregation'
  const alias = measure.as || field;

  console.log("🔍 Processing KPI data:", {
    field,
    agg,
    alias,
    dataCount: data.length,
    sampleRow: data[0],
    availableFields: Object.keys(data[0] || {}),
  });

  let result = 0;

  switch (agg) {
    case "sum":
      result = data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
      break;
    case "count":
      result = data.length;
      break;
    case "avg":
      const sum = data.reduce((s, row) => s + (Number(row[field]) || 0), 0);
      result = data.length > 0 ? sum / data.length : 0;
      break;
    case "min":
      result = Math.min(...data.map((row) => Number(row[field]) || 0));
      break;
    case "max":
      result = Math.max(...data.map((row) => Number(row[field]) || 0));
      break;
    default:
      result = data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
  }

  console.log("🔍 KPI calculation result:", { result, field, agg });

  return { value: result, [alias]: result };
}

function getStatusColor(value: number, rules: any[] = []): string {
  if (!rules || rules.length === 0) {
    return "neutral";
  }

  for (const rule of rules) {
    if (rule.if) {
      // Simple condition evaluation - handle basic comparisons
      if (evaluateSimpleCondition(rule.if, value)) {
        return rule.color || "neutral";
      }
    }
    if (rule.else === true) {
      return rule.color || "neutral";
    }
  }
  return "neutral";
}

function evaluateSimpleCondition(condition: string, value: number): boolean {
  try {
    // Handle common patterns in severity rules
    if (condition.includes(">")) {
      const threshold = parseFloat(condition.split(">")[1].trim());
      return value > threshold;
    }
    if (condition.includes("<")) {
      const threshold = parseFloat(condition.split("<")[1].trim());
      return value < threshold;
    }
    if (condition.includes(">=")) {
      const threshold = parseFloat(condition.split(">=")[1].trim());
      return value >= threshold;
    }
    if (condition.includes("<=")) {
      const threshold = parseFloat(condition.split("<=")[1].trim());
      return value <= threshold;
    }
    if (condition.includes("==") || condition.includes("===")) {
      const threshold = parseFloat(condition.split(/==|===/)[1].trim());
      return value === threshold;
    }

    // For complex conditions, try basic substitution
    let expression = condition;
    // Replace common field names with the value
    expression = expression.replace(
      /\b(value|NearExpiry|Expired|TotalQty)\b/g,
      value.toString()
    );

    // Very basic evaluation (only for simple expressions)
    if (/^[0-9\s\+\-\*\/\(\)\>\<\=\&\|\.]+$/.test(expression)) {
      return eval(expression);
    }

    return false;
  } catch (error) {
    console.warn("Failed to evaluate condition:", condition, error);
    return false;
  }
}

function formatValue(value: number, formatter?: string): string {
  switch (formatter) {
    case "number":
      return value.toLocaleString("th-TH");
    case "qty":
      return value.toLocaleString("th-TH");
    case "money":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(value);
    case "days":
      return `${value} วัน`;
    default:
      return value.toString();
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case "danger":
      return "⚠️";
    case "warning":
      return "⚡";
    case "ok":
      return "✅";
    default:
      return "📊";
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "danger":
      return "Critical";
    case "warning":
      return "Warning";
    case "ok":
      return "Good";
    default:
      return "Normal";
  }
}
