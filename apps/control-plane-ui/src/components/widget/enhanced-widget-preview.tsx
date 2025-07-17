/**
 * Enhanced Widget Components with Real Data
 */

import React from "react";
import { useWidgetData } from "@/hooks/useWidgetData";
import { Widget } from "@/types/dashboard-editor";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Hash,
  Table,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface EnhancedWidgetPreviewProps {
  widget: Widget;
}

export function EnhancedWidgetPreview({ widget }: EnhancedWidgetPreviewProps) {
  const { data, loading, error, refresh, lastUpdated } = useWidgetData(
    widget.id,
    widget.type,
    widget.config
  );

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-red-500 dark:text-red-400">
        <AlertCircle className="w-6 h-6 mb-2" />
        <div className="text-xs text-center">Error loading data</div>
        <button
          onClick={refresh}
          className="mt-1 text-xs text-blue-500 hover:text-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  switch (widget.type) {
    case "kpi":
      return <KPIWidget data={data} />;
    case "line-chart":
      return <LineChartWidget data={data} />;
    case "bar-chart":
      return <BarChartWidget data={data} />;
    case "pie-chart":
      return <PieChartWidget data={data} />;
    case "table":
      return <TableWidget data={data} />;
    default:
      return <DefaultWidget data={data} />;
  }
}

function KPIWidget({ data }: { data: any }) {
  if (!data) return <div className="text-gray-400">No data</div>;

  const isPositive = data.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="text-center p-2">
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
        {data.value?.toLocaleString() || 0}
        {data.unit && <span className="text-sm ml-1">{data.unit}</span>}
      </div>
      <div className="flex items-center justify-center mt-1">
        <TrendIcon
          className={`w-3 h-3 mr-1 ${isPositive ? "text-green-500" : "text-red-500"}`}
        />
        <span
          className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}
        >
          {Math.abs(data.change)}%
        </span>
      </div>
    </div>
  );
}

function LineChartWidget({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  // Simple line chart visualization
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  return (
    <div className="w-full h-full p-2 bg-gray-50 dark:bg-gray-700 rounded">
      <div className="w-full h-full relative">
        <svg width="100%" height="100%" viewBox="0 0 200 100">
          <polyline
            points={data
              .map((d, i) => {
                const x = (i / (data.length - 1)) * 180 + 10;
                const y = 90 - ((d.value - min) / range) * 80;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 180 + 10;
            const y = 90 - ((d.value - min) / range) * 80;
            return <circle key={i} cx={x} cy={y} r="2" fill="#3b82f6" />;
          })}
        </svg>
      </div>
    </div>
  );
}

function BarChartWidget({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="w-full h-full p-2 bg-gray-50 dark:bg-gray-700 rounded">
      <div className="w-full h-full flex items-end justify-between">
        {data.slice(0, 5).map((d, i) => (
          <div
            key={i}
            className="flex-1 mx-1 bg-blue-500 rounded-t"
            style={{
              height: `${(d.value / maxValue) * 100}%`,
              minHeight: "10%",
            }}
            title={`${d.label}: ${d.value}`}
          />
        ))}
      </div>
    </div>
  );
}

function PieChartWidget({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <PieChart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
  let currentAngle = 0;

  return (
    <div className="w-full h-full p-2 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
      <svg width="60" height="60" viewBox="0 0 60 60">
        {data.map((d, i) => {
          const angle = (d.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;

          const x1 = 30 + 25 * Math.cos(((startAngle - 90) * Math.PI) / 180);
          const y1 = 30 + 25 * Math.sin(((startAngle - 90) * Math.PI) / 180);
          const x2 = 30 + 25 * Math.cos(((endAngle - 90) * Math.PI) / 180);
          const y2 = 30 + 25 * Math.sin(((endAngle - 90) * Math.PI) / 180);

          const largeArcFlag = angle > 180 ? 1 : 0;

          currentAngle += angle;

          return (
            <path
              key={i}
              d={`M 30 30 L ${x1} ${y1} A 25 25 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
              fill={colors[i % colors.length]}
            >
              <title>{`${d.label}: ${d.value}%`}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}

function TableWidget({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <Table className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  const headers = Object.keys(data[0]).slice(0, 3);

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="grid grid-cols-3 gap-1 text-xs">
        {headers.map((header, i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-600 p-1 text-gray-900 dark:text-white font-medium"
          >
            {header}
          </div>
        ))}
        {data.slice(0, 3).map((row, i) =>
          headers.map((header, j) => (
            <div
              key={`${i}-${j}`}
              className="p-1 text-gray-700 dark:text-gray-300 truncate"
            >
              {row[header]}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DefaultWidget({ data }: { data: any }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <Hash className="w-6 h-6 text-gray-400 mx-auto mb-1" />
        <div className="text-xs text-gray-400">
          {data ? JSON.stringify(data).slice(0, 20) + "..." : "No data"}
        </div>
      </div>
    </div>
  );
}
