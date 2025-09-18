/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * KPI Widget Component
 * Displays key performance indicators with status colors
 */

import React from "react";

interface KPIWidgetProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

export default function KPIWidget({ data, config }: KPIWidgetProps) {
  // Extract value from data
  const value = data?.[0] || {};
  const displayValue = (Object.values(value)[0] as number) || 0;

  // Determine status color based on severity rules
  const getStatusColor = () => {
    const rules = config?.display?.severityRules || [];

    for (const rule of rules) {
      if (rule.if && evaluateCondition(rule.if, value)) {
        return rule.color;
      }
      if (rule.else) {
        return rule.color;
      }
    }

    return "neutral";
  };

  const statusColor = getStatusColor();

  const colorClasses = {
    danger: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    ok: "bg-green-50 border-green-200 text-green-800",
    neutral: "bg-gray-50 border-gray-200 text-gray-800",
  };

  return (
    <div
      className={`w-full h-full border rounded-lg p-4 ${
        colorClasses[statusColor as keyof typeof colorClasses] ||
        colorClasses.neutral
      }`}
    >
      <div className="text-center h-full flex flex-col justify-center">
        <h3 className="font-semibold text-sm mb-2 opacity-80">
          {config?.title || "KPI"}
        </h3>
        <div className="text-3xl font-bold mb-1">
          {formatValue(displayValue, config?.display?.valueFormatter)}
        </div>
        <div className="text-xs opacity-60">{getStatusText(statusColor)}</div>
      </div>
    </div>
  );
}

function evaluateCondition(condition: string, data: any): boolean {
  // Simple condition evaluation - in real implementation, use a proper expression parser
  try {
    // Replace field names with actual values
    let expression = condition;
    Object.keys(data).forEach((key) => {
      expression = expression.replace(new RegExp(key, "g"), data[key]);
    });

    // Simple evaluation (unsafe - use proper parser in production)
    return eval(expression);
  } catch {
    return false;
  }
}

function formatValue(value: number, formatter?: string): string {
  switch (formatter) {
    case "number":
      return value.toLocaleString();
    case "qty":
      return value.toLocaleString();
    case "money":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(value);
    default:
      return value.toString();
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "danger":
      return "⚠️ Critical";
    case "warning":
      return "⚡ Warning";
    case "ok":
      return "✅ Good";
    default:
      return "📊 Normal";
  }
}
