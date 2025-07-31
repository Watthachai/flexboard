/**
 * Enhanced Widget Components with Real Data
 */

import React from "react";
import { useWidgetData } from "@/hooks/useWidgetData";
import { useWidgetDataSource } from "@/contexts/UploadedDataContext";
import { Widget } from "@/types/dashboard-editor";
import AnalyticsWidget from "@/components/analytics/analytics-widget";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EnhancedWidgetPreviewProps {
  widget: Widget;
  uploadedData?: any;
  onConfigChange?: (config: any) => void;
}

export function EnhancedWidgetPreview({
  widget,
  uploadedData,
  onConfigChange,
}: EnhancedWidgetPreviewProps) {
  // Get tenantId from URL params
  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const currentTenantId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/tenants/")[1]?.split("/")[0]
      : "default";

  // Ensure widget.config exists with default values
  const config = {
    dataSource: "api",
    refreshInterval: 30000,
    tenantId: currentTenantId || "default",
    widgetId: widget.id,
    ...widget.config, // Override with actual config
  };

  console.log("EnhancedWidgetPreview - widget:", widget);
  console.log("EnhancedWidgetPreview - config:", config);
  console.log("EnhancedWidgetPreview - currentTenantId:", currentTenantId);

  // Force use uploaded data for widgets with dataSource: "uploaded-data"
  const shouldUseUploadedData =
    config.dataSource === "uploaded-data" ||
    config.dataSource === "uploadedData";

  console.log("Should use uploaded data:", shouldUseUploadedData);

  // Try to get data from context first (for uploaded data sources)
  // Handle case where UploadedDataProvider is not available
  let contextData = null;
  try {
    contextData = useWidgetDataSource(widget);
  } catch (error) {
    console.log("UploadedDataProvider not available, skipping context data");
    contextData = null;
  }

  // Check data source type from new config structure
  const dataSourceConfig = (config as any).dataSourceConfig;
  const dataSourceType = dataSourceConfig?.type || config.dataSource;

  // Check if widget uses static data or context data
  const useStaticData =
    dataSourceType === "static" && (config as any).staticData;
  const useContextData =
    contextData !== null &&
    (dataSourceType === "uploadedData" || dataSourceType === "uploaded-data");

  const { data, loading, error, refresh, lastUpdated } = useWidgetData(
    widget.id,
    widget.type,
    shouldUseUploadedData ? config : undefined // Always pass config for uploaded data
  );

  console.log("useWidgetData result:", { data, loading, error });

  // Use data in priority: API data for uploaded-data widgets
  const widgetData = data;

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
      return <KPIWidget data={widgetData} />;
    case "line-chart":
    case "line":
      return <LineChartWidget data={widgetData} />;
    case "bar-chart":
    case "bar":
      return <BarChartWidget data={widgetData} />;
    case "pie-chart":
    case "pie":
      return <PieChartWidget data={widgetData} />;
    case "chart":
      return (
        <div className="w-full h-full flex items-center justify-center">
          <ChartWidget
            data={widgetData}
            type={widget.config?.chartType || "bar"}
          />
        </div>
      );
    case "table":
      return <TableWidget data={widgetData} />;

    // Analytics Widgets - PowerBI-style comparison widgets
    case "period-comparison":
    case "target-comparison":
    case "peer-comparison":
    case "composition-analysis":
    case "trend-analysis":
    case "interactive-chart":
      return (
        <AnalyticsWidget
          widget={widget}
          uploadedData={uploadedData || widgetData}
          onConfigChange={onConfigChange}
          isEditMode={false}
        />
      );

    default:
      return <DefaultWidget data={widgetData} />;
  }
}

function KPIWidget({ data }: { data: any }) {
  if (!data) return <div className="text-gray-400">No data</div>;

  // Handle both API data and static data formats
  const value = data.value || 0;
  const change = data.change || data.trend?.value || 0;
  const unit = data.unit || "";
  const color = data.color || "#3B82F6";

  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="text-center p-2">
      <div className="text-2xl font-bold" style={{ color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
      {change !== 0 && (
        <div className="flex items-center justify-center mt-1">
          <TrendIcon
            className={`w-3 h-3 mr-1 ${isPositive ? "text-green-500" : "text-red-500"}`}
          />
          <span
            className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {Math.abs(change)}%
          </span>
        </div>
      )}
    </div>
  );
}

function LineChartWidget({ data }: { data: any }) {
  // Handle different data formats
  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    // Single data point
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 text-xs text-gray-500">No line data</div>
      </div>
    );
  }

  // Ensure data has value property
  const processedData = chartData.map((d, i) => ({
    value: d?.value || d?.y || d || 0,
    label: d?.label || d?.name || d?.x || i,
  }));

  // Simple line chart visualization
  const values = processedData.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1; // Avoid division by zero

  return (
    <div className="w-full h-full p-2 bg-gray-50 dark:bg-gray-700 rounded">
      <div className="w-full h-full relative">
        <svg width="100%" height="100%" viewBox="0 0 200 100">
          <polyline
            points={processedData
              .map((d, i) => {
                const x =
                  (i / Math.max(processedData.length - 1, 1)) * 180 + 10;
                const y = 90 - ((d.value - min) / range) * 80;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {processedData.map((d, i) => {
            const x = (i / Math.max(processedData.length - 1, 1)) * 180 + 10;
            const y = 90 - ((d.value - min) / range) * 80;
            return <circle key={i} cx={x} cy={y} r="2" fill="#3b82f6" />;
          })}
        </svg>
      </div>
    </div>
  );
}

function ChartWidget({
  data,
  type = "bar",
}: {
  data: any;
  type?: "bar" | "pie" | "line" | "doughnut" | "area";
}) {
  if (!data) return <div className="text-gray-400">No data</div>;

  // If data has a chartType property, use it; otherwise use the type parameter
  const chartType = data.chartType || type;
  const chartData = data.data || data;

  switch (chartType) {
    case "bar":
      return <BarChartWidget data={chartData} />;
    case "pie":
    case "doughnut":
      return <PieChartWidget data={chartData} />;
    case "line":
    case "area":
      return <LineChartWidget data={chartData} />;
    default:
      return <BarChartWidget data={chartData} />;
  }
}

function BarChartWidget({ data }: { data: any }) {
  console.log("BarChartWidget received data:", data);

  // Handle different data formats
  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    // Single data point
    chartData = [data];
  }

  console.log("BarChartWidget processed chartData:", chartData);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No chart data</div>
          <div className="text-xs text-gray-400 mt-1">
            Check data source configuration
          </div>
        </div>
      </div>
    );
  }

  // Ensure data has required properties for Recharts
  const processedData = chartData.map((d, i) => {
    const item = {
      name: d?.name || d?.label || d?.Branch || d?.category || `Item ${i + 1}`,
      value: Number(d?.value || d?.AverageCost || d?.y || d || 0),
    };
    console.log(`Processed item ${i}:`, item);
    return item;
  });

  console.log("Final processedData for Recharts:", processedData);

  // Show summary info
  const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...processedData.map((item) => item.value));

  return (
    <div className="w-full h-full p-2">
      {/* Data Summary */}
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} records • Total: {totalValue.toLocaleString()} •
        Max: {maxValue.toLocaleString()}
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={processedData}
          margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
            fontSize={10}
          />
          <YAxis fontSize={10} />
          <Tooltip
            formatter={(value, name) => [value?.toLocaleString(), name]}
            labelFormatter={(label) => `Branch: ${label}`}
          />
          <Bar dataKey="value" fill="#3b82f6" name="Average Cost" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartWidget({ data }: { data: any }) {
  // Handle different data formats
  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    // Single data point
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <PieChart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 text-xs text-gray-500">No chart data</div>
      </div>
    );
  }

  // Ensure data has value property
  const processedData = chartData.map((d, i) => ({
    value: d?.value || d?.y || d || 0,
    label: d?.label || d?.name || d?.x || `Item ${i + 1}`,
  }));

  const total = processedData.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <PieChart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 text-xs text-gray-500">No data values</div>
      </div>
    );
  }

  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
  let currentAngle = 0;

  return (
    <div className="w-full h-full p-2 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
      <svg width="60" height="60" viewBox="0 0 60 60">
        {processedData.map((d, i) => {
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
              <title>{`${d.label}: ${d.value}`}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}

function AreaChartWidget({ data }: { data: any }) {
  // Handle different data formats
  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    // Single data point
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <TrendingUp className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 text-xs text-gray-500">No area data</div>
      </div>
    );
  }

  // Ensure data has value property
  const processedData = chartData.map((d, i) => ({
    value: d?.value || d?.y || d || 0,
    label: d?.label || d?.name || d?.x || i,
  }));

  // Simple area chart visualization
  const values = processedData.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1; // Avoid division by zero

  return (
    <div className="w-full h-full p-2 bg-gray-50 dark:bg-gray-700 rounded">
      <div className="w-full h-full relative">
        <svg width="100%" height="100%" viewBox="0 0 200 100">
          <polygon
            points={`10,90 ${processedData
              .map((d, i) => {
                const x =
                  (i / Math.max(processedData.length - 1, 1)) * 180 + 10;
                const y = 90 - ((d.value - min) / range) * 80;
                return `${x},${y}`;
              })
              .join(" ")} 190,90`}
            fill="#3b82f6"
            fillOpacity="0.3"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}

function TableWidget({ data }: { data: any }) {
  // Handle different data formats and ensure data is valid
  let tableData: any[] = [];

  if (!data) {
    // No data at all
    tableData = [];
  } else if (Array.isArray(data)) {
    // Data is already an array
    tableData = data;
  } else if (data.data && Array.isArray(data.data)) {
    // Data has a 'data' property containing the array
    tableData = data.data;
  } else if (data.columns && Array.isArray(data.columns)) {
    // Data has columns format (like uploaded data)
    tableData = data.rows || data.data || [];
  } else if (typeof data === "object") {
    // Single object, wrap in array
    tableData = [data];
  }

  if (!tableData || tableData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <Table className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 text-xs text-gray-500">No table data</div>
      </div>
    );
  }

  // Get the first valid row to extract headers
  const firstValidRow = tableData.find((row) => row && typeof row === "object");
  if (!firstValidRow) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <Table className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 text-xs text-gray-500">Invalid data format</div>
      </div>
    );
  }

  const headers = Object.keys(firstValidRow).slice(0, 3);

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
        {tableData.slice(0, 3).map((row, i) =>
          headers.map((header, j) => (
            <div
              key={`${i}-${j}`}
              className="p-1 text-gray-700 dark:text-gray-300 truncate"
            >
              {row && row[header] !== undefined ? String(row[header]) : "N/A"}
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
