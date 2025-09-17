/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Real KPI Widget with Recharts
 * Displays key performance indicators with conditional styling
 */

import React from "react";

interface KPIWidgetProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

export default function RealKPIWidget({
  data,
  config,
}: KPIWidgetProps) {
  // Use adaptedConfig if available, otherwise fallback to legacy processing
  let value: number | string = 0;
  let display: any;
  let title: string = config.title || "";

  if (config.adaptedConfig) {
    // Use processed config from chartConfigAdapter
    value = config.adaptedConfig.value;
    display = config.adaptedConfig.display;
    title = config.adaptedConfig.title;
  } else {
    // Legacy processing for backward compatibility
    const processedData = processKPIData(data, config.query);
    value = processedData?.value || 0;
    display = config.display;
  }

  // Determine status color based on title/age group
  const numericValue =
    typeof value === "string" ? parseFloat(value) || 0 : value;
  const statusColor = getStatusColorByTitle(
    title,
    numericValue,
    display?.severityRules
  );

  const colorClasses = {
    danger: {
      bg: "bg-red-100",
      border: "border-red-300",
      text: "text-red-900",
      accent: "#dc2626",
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
    fresh: {
      bg: "bg-green-100",
      border: "border-green-400",
      text: "text-green-900",
      accent: "#047857",
    },
    aging: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
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
              {formatValue(numericValue, config?.display?.valueFormatter)}
            </div>
            <div className="text-xs opacity-60 flex items-center justify-center gap-1">
              {getStatusIcon(statusColor)}
              {getStatusText(statusColor)}
            </div>
          </div>
        </div>
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

function getStatusColorByTitle(
  title: string,
  value: number,
  rules: any[] = []
): string {
  // Determine color based on title for age-based KPIs
  if (title.includes("0-90") || title.includes("Fresh")) {
    return "fresh";
  }
  if (title.includes("91-180") || title.includes("Aging")) {
    return "aging";
  }
  if (title.includes("181-365") || title.includes("Risk")) {
    return "warning";
  }
  if (title.includes(">365") || title.includes("Old Stock")) {
    return "danger";
  }

  // Fallback to original age-based logic
  return getStatusColor(value, rules);
}

function getStatusColor(value: number, rules: any[] = []): string {
  // Special handling for age-based KPIs (Days)
  if (value > 365) {
    return "danger";
  }
  if (value > 180) {
    return "warning";
  }
  if (value > 90) {
    return "aging";
  }
  if (value >= 0) {
    return "fresh";
  }

  // Fallback to rule-based evaluation if provided
  if (rules && rules.length > 0) {
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
      return "🚨";
    case "warning":
      return "⚠️";
    case "ok":
      return "✅";
    case "fresh":
      return "🟢";
    case "aging":
      return "🟡";
    default:
      return "";
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "danger":
      return "อันตรายมาก";
    case "warning":
      return "ต้องระวัง";
    case "ok":
      return "ปกติ";
    case "fresh":
      return "สดใหม่";
    case "aging":
      return "เริ่มเก่า";
    default:
      return "";
  }
}
