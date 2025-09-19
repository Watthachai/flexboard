/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Enhanced Charts with Custom Tooltips
 * Support for KPI, Bar, Line, Table widgets with proper data handling
 */

"use client";

import React from "react";

interface BaseChartProps {
  data: any[];
  title: string;
  height?: number;
}

interface KPIProps extends BaseChartProps {
  value: number | string;
  formatter?: string;
  severity?: "ok" | "warning" | "danger";
  tooltip?: string;
}

interface ChartProps extends BaseChartProps {
  xAxis: string;
  yAxis: string;
  formatter?: string;
  tooltip?: {
    template: string;
  };
}

interface TableProps extends BaseChartProps {
  columns: string[];
  formatters?: { [key: string]: string };
  pageSize?: number;
}

interface ActionBarProps extends BaseChartProps {
  actions: Array<{
    type: string;
    title: string;
    targetWidgetId?: string;
    filename?: string;
  }>;
}

// Utility function to format values
const formatValue = (value: any, formatter?: string): string => {
  if (!value && value !== 0) return "";

  switch (formatter) {
    case "qty":
    case "number":
      return new Intl.NumberFormat("th-TH").format(Number(value));
    case "days":
      return `${value} วัน`;
    case "date":
      return new Date(value).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    case "money":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(Number(value));
    default:
      return String(value);
  }
};

// KPI Widget
export const KPIWidget: React.FC<KPIProps> = ({
  title,
  value,
  formatter,
  severity = "ok",
  tooltip,
}) => {
  const severityColors = {
    ok: "text-green-600 bg-green-50 border-green-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    danger: "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
      <div
        className={`flex-1 flex items-center justify-center rounded-lg border-2 ${severityColors[severity]}`}
        title={tooltip}
      >
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">
            {formatValue(value, formatter)}
          </div>
          {tooltip && <div className="text-xs opacity-75">{tooltip}</div>}
        </div>
      </div>
    </div>
  );
};

// Bar Chart Widget
export const BarChartWidget: React.FC<ChartProps> = ({
  data,
  title,
  xAxis,
  yAxis,
  formatter,
  tooltip,
}) => {
  if (!data.length) {
    return (
      <div className="h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map((item) => Number(item[yAxis]) || 0));

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
      <div className="flex-1 flex items-end gap-1 p-2 bg-gray-50 rounded">
        {data.slice(0, 10).map((item, index) => {
          const value = Number(item[yAxis]) || 0;
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center"
              title={
                tooltip?.template
                  ? tooltip.template
                      .replace(
                        /\{\{\s*(\w+)\s*\}\}/g,
                        (match, field) => item[field] || ""
                      )
                      .replace(
                        /\{\{\s*format\s+(\w+)\s+'(\w+)'\s*\}\}/g,
                        (match, field, fmt) => formatValue(item[field], fmt)
                      )
                  : `${item[xAxis]}: ${formatValue(value, formatter)}`
              }
            >
              <div
                className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              />
              <div className="text-xs mt-1 text-center truncate w-full">
                {String(item[xAxis]).substring(0, 8)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">
        Showing top {Math.min(data.length, 10)} items
      </div>
    </div>
  );
};

// Line Chart Widget
export const LineChartWidget: React.FC<ChartProps> = ({
  data,
  title,
  xAxis,
  yAxis,
  formatter,
  tooltip,
}) => {
  if (!data.length) {
    return (
      <div className="h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📈</div>
            <p className="text-sm">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => Number(item[yAxis]) || 0));
  const minValue = Math.min(...data.map((item) => Number(item[yAxis]) || 0));

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
      <div className="flex-1 p-2 bg-gray-50 rounded relative">
        <svg width="100%" height="100%" className="overflow-visible">
          {data.map((item, index) => {
            if (index === 0) return null;

            const prevValue = Number(data[index - 1][yAxis]) || 0;
            const currentValue = Number(item[yAxis]) || 0;

            const x1 = ((index - 1) / (data.length - 1)) * 90 + 5;
            const x2 = (index / (data.length - 1)) * 90 + 5;
            const y1 =
              90 - ((prevValue - minValue) / (maxValue - minValue)) * 80;
            const y2 =
              90 - ((currentValue - minValue) / (maxValue - minValue)) * 80;

            return (
              <g key={index}>
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="#3B82F6"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx={`${x2}%`}
                  cy={`${y2}%`}
                  r="3"
                  fill="#3B82F6"
                  className="hover:r-4 cursor-pointer"
                >
                  <title>
                    {tooltip?.template
                      ? tooltip.template
                          .replace(
                            /\{\{\s*(\w+)\s*\}\}/g,
                            (match, field) => item[field] || ""
                          )
                          .replace(
                            /\{\{\s*format\s+(\w+)\s+'(\w+)'\s*\}\}/g,
                            (match, field, fmt) => formatValue(item[field], fmt)
                          )
                      : `${item[xAxis]}: ${formatValue(
                          currentValue,
                          formatter
                        )}`}
                  </title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">
        {data.length} data points
      </div>
    </div>
  );
};

// Table Widget
export const TableWidget: React.FC<TableProps> = ({
  data,
  title,
  columns,
  formatters = {},
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const startIdx = currentPage * pageSize;
  const displayData = data.slice(startIdx, startIdx + pageSize);

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
      <div className="flex-1 overflow-auto bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-medium text-gray-700 border-b"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 border-b text-gray-900">
                    {formatValue(row[col], formatters[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            Page {currentPage + 1} of {totalPages} ({data.length} total)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              ← Prev
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
              }
              disabled={currentPage === totalPages - 1}
              className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Action Bar Widget
export const ActionBarWidget: React.FC<ActionBarProps> = ({
  title,
  actions,
}) => {
  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
      <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              if (action.type === "exportCSV") {
                // TODO: Implement CSV export
                alert(`Export CSV: ${action.filename || "data.csv"}`);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            📥 {action.title}
          </button>
        ))}
      </div>
    </div>
  );
};
