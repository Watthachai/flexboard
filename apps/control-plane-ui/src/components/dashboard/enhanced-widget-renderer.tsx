/**
 * Enhanced Widget Implementations with Real Charts
 * Using Recharts for beautiful, interactive charts
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Widget } from "./visual-dashboard-editor";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Activity,
  RefreshCw,
  Calendar,
  Clock,
} from "lucide-react";

interface EnhancedWidgetRendererProps {
  widget: Widget;
  isPreviewMode?: boolean;
  data?: any;
}

// Sample data for different chart types
const SAMPLE_DATA = {
  lineChart: [
    { name: "Jan", value: 400, target: 380 },
    { name: "Feb", value: 300, target: 350 },
    { name: "Mar", value: 600, target: 450 },
    { name: "Apr", value: 800, target: 520 },
    { name: "May", value: 500, target: 480 },
    { name: "Jun", value: 900, target: 650 },
  ],
  barChart: [
    { name: "Product A", sales: 4000, target: 3500 },
    { name: "Product B", sales: 3000, target: 2800 },
    { name: "Product C", sales: 2000, target: 2200 },
    { name: "Product D", sales: 2780, target: 2500 },
    { name: "Product E", sales: 1890, target: 2000 },
  ],
  pieChart: [
    { name: "Desktop", value: 400, color: "#8884d8" },
    { name: "Mobile", value: 300, color: "#82ca9d" },
    { name: "Tablet", value: 200, color: "#ffc658" },
    { name: "Other", value: 100, color: "#ff7300" },
  ],
  kpiData: {
    revenue: { value: 125000, change: 12.5, trend: "up" },
    users: { value: 2847, change: -3.2, trend: "down" },
    orders: { value: 1205, change: 8.7, trend: "up" },
    conversion: { value: 3.24, change: 1.1, trend: "up" },
  },
};

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#ff00ff",
];

export default function EnhancedWidgetRenderer({
  widget,
  isPreviewMode = false,
  data,
}: EnhancedWidgetRendererProps) {
  const [widgetData, setWidgetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data based on widget configuration
  useEffect(() => {
    if (widget.config.dataSource && widget.config.dataSource !== "static") {
      fetchWidgetData();
    } else {
      // Use sample data for static widgets
      setWidgetData(getSampleData(widget.type));
    }
  }, [
    widget.config.dataSource,
    widget.config.apiEndpoint,
    widget.config.refreshInterval,
  ]);

  const fetchWidgetData = async () => {
    if (!widget.config.dataSource || widget.config.dataSource === "static")
      return;

    setLoading(true);
    setError(null);

    try {
      if (widget.config.dataSource === "api" && widget.config.apiEndpoint) {
        const response = await fetch(widget.config.apiEndpoint);
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        setWidgetData(result);
      } else if (
        widget.config.dataSource === "database" &&
        widget.config.sqlQuery
      ) {
        // TODO: Implement database query execution
        setWidgetData(getSampleData(widget.type));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setWidgetData(getSampleData(widget.type)); // Fallback to sample data
    } finally {
      setLoading(false);
    }
  };

  const getSampleData = (type: string) => {
    switch (type) {
      case "line-chart":
      case "chart":
        return SAMPLE_DATA.lineChart;
      case "bar-chart":
        return SAMPLE_DATA.barChart;
      case "pie-chart":
        return SAMPLE_DATA.pieChart;
      case "kpi":
        return SAMPLE_DATA.kpiData;
      default:
        return null;
    }
  };

  const renderWidget = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      );
    }

    if (error && isPreviewMode) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-red-500">
            <div className="text-sm font-medium">Error loading data</div>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      );
    }

    switch (widget.type) {
      case "kpi":
        return <KPIWidget widget={widget} data={widgetData} />;
      case "line-chart":
      case "chart":
        return <LineChartWidget widget={widget} data={widgetData} />;
      case "bar-chart":
        return <BarChartWidget widget={widget} data={widgetData} />;
      case "pie-chart":
        return <PieChartWidget widget={widget} data={widgetData} />;
      case "table":
        return <TableWidget widget={widget} data={widgetData} />;
      case "text":
        return <TextWidget widget={widget} />;
      case "image":
        return <ImageWidget widget={widget} />;
      case "date":
        return <DateRangeWidget widget={widget} />;
      default:
        return <div className="text-gray-400">Unknown widget type</div>;
    }
  };

  return <div className="w-full h-full p-2">{renderWidget()}</div>;
}

// KPI Widget Component
function KPIWidget({ widget, data }: { widget: Widget; data: any }) {
  const kpiType = widget.config.kpiType || "revenue";
  const kpiData =
    data?.[kpiType] || data?.revenue || SAMPLE_DATA.kpiData.revenue;

  const formatValue = (value: number) => {
    if (kpiType === "revenue") return `$${(value / 1000).toFixed(1)}k`;
    if (kpiType === "conversion") return `${value}%`;
    return value.toLocaleString();
  };

  const getIcon = () => {
    switch (kpiType) {
      case "revenue":
        return <DollarSign className="w-6 h-6" />;
      case "users":
        return <Users className="w-6 h-6" />;
      case "orders":
        return <ShoppingCart className="w-6 h-6" />;
      case "conversion":
        return <Activity className="w-6 h-6" />;
      default:
        return <TrendingUp className="w-6 h-6" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <Card className="h-full p-4 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          {getIcon()}
        </div>
        {kpiData.change && (
          <div className="flex items-center space-x-1">
            {getTrendIcon(kpiData.trend)}
            <span
              className={`text-sm ${kpiData.trend === "up" ? "text-green-600" : "text-red-600"}`}
            >
              {Math.abs(kpiData.change)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {formatValue(kpiData.value)}
      </div>
      <div className="text-sm text-gray-500">{widget.title}</div>
    </Card>
  );
}

// Line Chart Widget
function LineChartWidget({ widget, data }: { widget: Widget; data: any }) {
  const chartData = data || SAMPLE_DATA.lineChart;

  return (
    <Card className="h-full p-4">
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
          />
          {chartData[0]?.target && (
            <Line
              type="monotone"
              dataKey="target"
              stroke="#82ca9d"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

// Bar Chart Widget
function BarChartWidget({ widget, data }: { widget: Widget; data: any }) {
  const chartData = data || SAMPLE_DATA.barChart;

  return (
    <Card className="h-full p-4">
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sales" fill="#8884d8" />
          {chartData[0]?.target && (
            <Bar dataKey="target" fill="#82ca9d" opacity={0.6} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// Pie Chart Widget
function PieChartWidget({ widget, data }: { widget: Widget; data: any }) {
  const chartData = data || SAMPLE_DATA.pieChart;

  return (
    <Card className="h-full p-4">
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

// Table Widget
function TableWidget({ widget, data }: { widget: Widget; data: any }) {
  const tableData = data || SAMPLE_DATA.barChart;

  return (
    <Card className="h-full p-4">
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {Object.keys(tableData[0] || {}).map((key) => (
                <th key={key} className="text-left p-2 font-medium">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row: any, index: number) => (
              <tr key={index} className="border-b">
                {Object.values(row).map((value: any, i: number) => (
                  <td key={i} className="p-2">
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Text Widget
function TextWidget({ widget }: { widget: Widget }) {
  return (
    <Card className="h-full p-4">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: widget.config.content || "Click to edit text...",
        }}
      />
    </Card>
  );
}

// Image Widget
function ImageWidget({ widget }: { widget: Widget }) {
  return (
    <Card className="h-full p-4">
      {widget.config.imageUrl ? (
        <img
          src={widget.config.imageUrl}
          alt={widget.title}
          className="w-full h-full object-cover rounded"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-400">No image selected</span>
        </div>
      )}
    </Card>
  );
}

// Date Range Widget
function DateRangeWidget({ widget }: { widget: Widget }) {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  return (
    <Card className="h-full p-4">
      <div className="flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-gray-500" />
        <div className="text-sm">
          <div className="font-medium">Date Range</div>
          <div className="text-gray-500">
            {dateRange.start.toLocaleDateString()} -{" "}
            {dateRange.end.toLocaleDateString()}
          </div>
        </div>
      </div>
    </Card>
  );
}
