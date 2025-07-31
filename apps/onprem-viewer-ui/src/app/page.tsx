"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Interface for dashboard manifest
interface Widget {
  id: string;
  type: string;
  title: string;
  dataSource: string;
  config: {
    xAxis?: string;
    yAxis?: string;
    tenantId?: string;
  };
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DashboardManifest {
  dashboardId: string;
  dashboardName: string;
  description: string;
  widgets: Widget[];
}

// Sample dashboard manifest (คุณสามารถแก้ไขตรงนี้)
const DASHBOARD_MANIFEST: DashboardManifest = {
  dashboardId: "vpi-co-ltd-v1",
  dashboardName: "VPI Dashboard",
  description: "Branch vs Average Cost Analysis",
  widgets: [
    {
      id: "chart-branch-cost",
      type: "bar-chart",
      title: "Branch vs Average Cost",
      dataSource: "uploaded-data",
      config: {
        xAxis: "Branch",
        yAxis: "AverageCost",
        tenantId: "vpi-co-ltd",
      },
      layout: {
        x: 0,
        y: 0,
        width: 12,
        height: 8,
      },
    },
  ],
};

// Component สำหรับแสดง KPI Cards
function KPICard({
  title,
  value,
  suffix = "",
}: {
  title: string;
  value: number;
  suffix?: string;
}) {
  const formatValue = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toFixed(0);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-white">
        {formatValue(value)}
        {suffix}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [widgetData, setWidgetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data for each widget based on its config
        const widgetPromises = DASHBOARD_MANIFEST.widgets.map(
          async (widget) => {
            if (
              widget.dataSource === "uploaded-data" &&
              widget.config.tenantId
            ) {
              try {
                const apiUrl =
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                const response = await fetch(
                  `${apiUrl}/api/tenants/${widget.config.tenantId}/dashboards/${DASHBOARD_MANIFEST.dashboardId}`
                );

                if (!response.ok) {
                  throw new Error(
                    `Failed to fetch data for widget ${widget.id}`
                  );
                }

                const result = await response.json();

                if (result.success && result.data) {
                  // Transform data based on widget config
                  if (
                    widget.type === "bar-chart" &&
                    widget.config.xAxis &&
                    widget.config.yAxis
                  ) {
                    const grouped: { [key: string]: number } = {};

                    result.data.forEach((record: any) => {
                      const category = String(
                        record[widget.config.xAxis!] || "Unknown"
                      );
                      const value =
                        parseFloat(record[widget.config.yAxis!]) || 0;
                      grouped[category] = (grouped[category] || 0) + value;
                    });

                    const chartData = Object.entries(grouped).map(
                      ([name, value]) => ({
                        name,
                        value,
                      })
                    );

                    return {
                      ...widget,
                      data: chartData,
                    };
                  }
                }
              } catch (widgetError) {
                console.error(
                  `Error fetching data for widget ${widget.id}:`,
                  widgetError
                );
                return {
                  ...widget,
                  data: [],
                  error:
                    widgetError instanceof Error
                      ? widgetError.message
                      : "Unknown error",
                };
              }
            }

            return {
              ...widget,
              data: [],
            };
          }
        );

        const widgetsWithData = await Promise.all(widgetPromises);
        setWidgetData(widgetsWithData);
      } catch (err: any) {
        console.error("Error fetching widget data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWidgetData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="text-center mt-4 text-gray-400">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 font-bold mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">FlexBoard Viewer</h1>
            <p className="text-gray-400 text-sm">Tenant: Demo</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              {DASHBOARD_MANIFEST.dashboardName}
            </p>
            <p className="text-xs text-gray-500">
              {DASHBOARD_MANIFEST.description}
            </p>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Widget Rendering */}
          {widgetData.map((widget) => (
            <div
              key={widget.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              style={{
                gridColumn: `span ${widget.layout.width}`,
                gridRow: `span ${Math.ceil(widget.layout.height / 2)}`,
              }}
            >
              <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>

              {widget.error ? (
                <div className="flex items-center justify-center h-64 text-red-400">
                  <div className="text-center">
                    <p>Error loading widget</p>
                    <p className="text-sm text-gray-500 mt-2">{widget.error}</p>
                  </div>
                </div>
              ) : widget.data && widget.data.length > 0 ? (
                widget.type === "bar-chart" ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={widget.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <p>Widget type "{widget.type}" not implemented</p>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p>No data available</p>
                    <p className="text-sm text-gray-500 mt-2">
                      X: {widget.config.xAxis}, Y: {widget.config.yAxis}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Debug Info</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Dashboard ID: {DASHBOARD_MANIFEST.dashboardId}</p>
            <p>Widgets loaded: {widgetData.length}</p>
            <p>
              API URL:{" "}
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
