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
  PieChart as PieChartIcon,
  Hash,
  Table,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  // Chart types
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  ComposedChart,
  FunnelChart,
  Funnel,
  Treemap,
  // Cartesian components
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  // General components
  ResponsiveContainer,
  Legend,
  Tooltip,
  Cell,
  LabelList,
  // Polar components
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  // Reference components
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
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

  // Skip data fetching if in preview mode
  const { data, loading, error, refresh, lastUpdated } = useWidgetData(
    widget.id,
    widget.type,
    shouldUseUploadedData ? config : undefined // Always pass config for uploaded data
  );

  console.log("useWidgetData result:", { data, loading, error });

  // Use data from API
  const widgetData = data;

  // Skip error and loading states in preview mode
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

  switch (widget.type as any) {
    case "kpi":
      return <KPIWidget data={widgetData} />;
    case "line-chart":
    case "line":
      return <LineChartWidget data={widgetData} />;
    case "bar-chart":
    case "bar":
      return <BarChartWidget data={widgetData} />;
    case "area-chart":
    case "area":
      return <AreaChartWidget data={widgetData} />;
    case "pie-chart":
    case "pie":
      return <PieChartWidget data={widgetData} />;
    case "radar-chart":
    case "radar":
      return <RadarChartWidget data={widgetData} />;
    case "scatter-chart":
    case "scatter":
      return <ScatterChartWidget data={widgetData} />;
    case "composed-chart":
    case "composed":
      return <ComposedChartWidget data={widgetData} />;
    case "funnel-chart":
    case "funnel":
      return <FunnelChartWidget data={widgetData} />;
    case "treemap":
      return <TreemapWidget data={widgetData} />;
    case "radial-bar-chart":
    case "radial-bar":
      return <RadialBarChartWidget data={widgetData} />;
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
  console.log("LineChartWidget received data:", data);

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

  console.log("LineChartWidget processed chartData:", chartData);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No line chart data</div>
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
    console.log(`LineChart processed item ${i}:`, item);
    return item;
  });

  console.log("Final processedData for LineChart:", processedData);

  // Show summary info
  const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...processedData.map((item) => item.value));
  const minValue = Math.min(...processedData.map((item) => item.value));

  return (
    <div className="w-full h-full p-2">
      {/* Data Summary */}
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} points • Total: {totalValue.toLocaleString()} •
        Range: {minValue.toLocaleString()} - {maxValue.toLocaleString()}
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart
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
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
            name="Average Cost"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartWidget({
  data,
  type = "bar",
}: {
  data: any;
  type?:
    | "bar"
    | "pie"
    | "line"
    | "area"
    | "radar"
    | "scatter"
    | "composed"
    | "funnel"
    | "treemap"
    | "radial-bar"
    | "doughnut";
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
      return <LineChartWidget data={chartData} />;
    case "area":
      return <AreaChartWidget data={chartData} />;
    case "radar":
      return <RadarChartWidget data={chartData} />;
    case "scatter":
      return <ScatterChartWidget data={chartData} />;
    case "composed":
      return <ComposedChartWidget data={chartData} />;
    case "funnel":
      return <FunnelChartWidget data={chartData} />;
    case "treemap":
      return <TreemapWidget data={chartData} />;
    case "radial-bar":
      return <RadialBarChartWidget data={chartData} />;
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
  console.log("PieChartWidget received data:", data);

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
        <PieChartIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 text-xs text-gray-500">No chart data</div>
      </div>
    );
  }

  // Ensure data has required properties for Recharts
  const processedData = chartData.map((d, i) => {
    const item = {
      name: d?.name || d?.label || d?.Branch || d?.category || `Item ${i + 1}`,
      value: Number(d?.value || d?.AverageCost || d?.y || d || 0),
    };
    console.log(`PieChart processed item ${i}:`, item);
    return item;
  });

  const total = processedData.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <PieChartIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div className="ml-2 text-xs text-gray-500">No data values</div>
      </div>
    );
  }

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  return (
    <div className="w-full h-full p-2">
      {/* Data Summary */}
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} segments • Total: {total.toLocaleString()}
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value?.toLocaleString(), name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function AreaChartWidget({ data }: { data: any }) {
  console.log("AreaChartWidget received data:", data);

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
        <div className="text-center">
          <TrendingUp className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No area chart data</div>
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
    console.log(`AreaChart processed item ${i}:`, item);
    return item;
  });

  // Show summary info
  const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...processedData.map((item) => item.value));
  const minValue = Math.min(...processedData.map((item) => item.value));

  return (
    <div className="w-full h-full p-2">
      {/* Data Summary */}
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} points • Total: {totalValue.toLocaleString()} •
        Range: {minValue.toLocaleString()} - {maxValue.toLocaleString()}
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <AreaChart
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
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
            name="Average Cost"
          />
        </AreaChart>
      </ResponsiveContainer>
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

// New Advanced Chart Widgets

function RadarChartWidget({ data }: { data: any }) {
  console.log("RadarChartWidget received data:", data);

  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No radar chart data</div>
        </div>
      </div>
    );
  }

  const processedData = chartData.map((d, i) => ({
    subject: d?.name || d?.label || d?.Branch || d?.category || `Item ${i + 1}`,
    A: Number(d?.value || d?.AverageCost || d?.y || d || 0),
    fullMark:
      Math.max(
        ...chartData.map((item) =>
          Number(item?.value || item?.AverageCost || item?.y || item || 0)
        )
      ) * 1.2,
  }));

  return (
    <div className="w-full h-full p-2">
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} metrics • Radar Analysis
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <RadarChart data={processedData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fontSize: 8 }} />
          <Radar
            name="Value"
            dataKey="A"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScatterChartWidget({ data }: { data: any }) {
  console.log("ScatterChartWidget received data:", data);

  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No scatter plot data</div>
        </div>
      </div>
    );
  }

  const processedData = chartData.map((d, i) => ({
    x: Number(d?.value || d?.AverageCost || d?.x || i),
    y: Number(d?.value || d?.AverageCost || d?.y || Math.random() * 100),
    z: Number(d?.size || 100),
  }));

  return (
    <div className="w-full h-full p-2">
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} points • Scatter Analysis
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <ScatterChart margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" fontSize={10} />
          <YAxis type="number" dataKey="y" fontSize={10} />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Data Points" data={processedData} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComposedChartWidget({ data }: { data: any }) {
  console.log("ComposedChartWidget received data:", data);

  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No composed chart data</div>
        </div>
      </div>
    );
  }

  const processedData = chartData.map((d, i) => ({
    name: d?.name || d?.label || d?.Branch || d?.category || `Item ${i + 1}`,
    bar: Number(d?.value || d?.AverageCost || d?.y || d || 0),
    line: Number(d?.value || d?.AverageCost || d?.y || d || 0) * 0.8,
    area: Number(d?.value || d?.AverageCost || d?.y || d || 0) * 1.2,
  }));

  return (
    <div className="w-full h-full p-2">
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} records • Multi-Chart View
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <ComposedChart
          data={processedData}
          margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={60}
            fontSize={10}
          />
          <YAxis fontSize={10} />
          <Tooltip />
          <Legend />
          <Area
            dataKey="area"
            fill="#8884d8"
            stroke="#8884d8"
            fillOpacity={0.3}
          />
          <Bar dataKey="bar" fill="#413ea0" />
          <Line
            type="monotone"
            dataKey="line"
            stroke="#ff7300"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function FunnelChartWidget({ data }: { data: any }) {
  console.log("FunnelChartWidget received data:", data);

  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <TrendingDown className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No funnel chart data</div>
        </div>
      </div>
    );
  }

  const processedData = chartData.map((d, i) => ({
    name: d?.name || d?.label || d?.Branch || d?.category || `Stage ${i + 1}`,
    value: Number(d?.value || d?.AverageCost || d?.y || d || 0),
    fill: `hsl(${210 + i * 30}, 70%, 50%)`,
  }));

  return (
    <div className="w-full h-full p-2">
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} stages • Conversion Funnel
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <FunnelChart>
          <Tooltip />
          <Funnel dataKey="value" data={processedData} isAnimationActive />
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

function TreemapWidget({ data }: { data: any }) {
  console.log("TreemapWidget received data:", data);

  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <Hash className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No treemap data</div>
        </div>
      </div>
    );
  }

  const COLORS = [
    "#8889DD",
    "#9597E4",
    "#8DC77B",
    "#A5D297",
    "#E2CF45",
    "#F8C12D",
  ];

  const processedData = chartData.map((d, i) => ({
    name: d?.name || d?.label || d?.Branch || d?.category || `Item ${i + 1}`,
    size: Number(d?.value || d?.AverageCost || d?.y || d || 0),
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="w-full h-full p-2">
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} items • Hierarchical View
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <Treemap
          data={processedData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
        />
      </ResponsiveContainer>
    </div>
  );
}

function RadialBarChartWidget({ data }: { data: any }) {
  console.log("RadialBarChartWidget received data:", data);

  let chartData: any[] = [];

  if (!data) {
    chartData = [];
  } else if (Array.isArray(data)) {
    chartData = data;
  } else if (data.data && Array.isArray(data.data)) {
    chartData = data.data;
  } else if (typeof data === "object" && data.value !== undefined) {
    chartData = [data];
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <PieChartIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <div className="text-xs text-gray-500">No radial bar data</div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...chartData.map((d) =>
      Number(d?.value || d?.AverageCost || d?.y || d || 0)
    )
  );

  const processedData = chartData.map((d, i) => ({
    name: d?.name || d?.label || d?.Branch || d?.category || `Item ${i + 1}`,
    uv: Number(d?.value || d?.AverageCost || d?.y || d || 0),
    fill: `hsl(${210 + i * 45}, 70%, 50%)`,
  }));

  return (
    <div className="w-full h-full p-2">
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
        {processedData.length} items • Radial Progress
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="10%"
          outerRadius="80%"
          data={processedData}
        >
          <RadialBar dataKey="uv" fill="#8884d8" />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: "10px" }}
          />
          <Tooltip />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
