/**
 * OnPrem Viewer Dashboard Page - License-Based Data Access
 */
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  dashboardId: string;
  name: string;
  widgets: Widget[];
  metadata: {
    tenantId: string;
    lastUpdated: string;
    dataSource: string;
  };
}

interface Widget {
  id: string;
  type: "chart" | "metric" | "table";
  title: string;
  data: any[];
  config: Record<string, any>;
}

// Sample data ที่จะแสดงเมื่อไม่สามารถเชื่อมต่อ API ได้
const sampleDashboards: DashboardData[] = [
  {
    dashboardId: "sales-dashboard",
    name: "Sales Performance Dashboard",
    widgets: [
      {
        id: "sales-trend",
        type: "chart",
        title: "Monthly Sales Trend",
        data: [
          { name: "Jan", sales: 4000, target: 3800 },
          { name: "Feb", sales: 3000, target: 3200 },
          { name: "Mar", sales: 5000, target: 4500 },
          { name: "Apr", sales: 4500, target: 4200 },
          { name: "May", sales: 6000, target: 5500 },
          { name: "Jun", sales: 5500, target: 5200 },
        ],
        config: { chartType: "line" },
      },
      {
        id: "total-revenue",
        type: "metric",
        title: "Total Revenue",
        data: [{ value: 125000, currency: "THB", growth: 12.5 }],
        config: {},
      },
    ],
    metadata: {
      tenantId: "vpi-co-ltd",
      lastUpdated: "2024-08-01T10:30:00Z",
      dataSource: "PostgreSQL",
    },
  },
  {
    dashboardId: "analytics-dashboard",
    name: "Website Analytics",
    widgets: [
      {
        id: "page-views",
        type: "chart",
        title: "Daily Page Views",
        data: [
          { name: "Mon", views: 2400 },
          { name: "Tue", views: 1398 },
          { name: "Wed", views: 9800 },
          { name: "Thu", views: 3908 },
          { name: "Fri", views: 4800 },
          { name: "Sat", views: 3800 },
          { name: "Sun", views: 4300 },
        ],
        config: { chartType: "bar" },
      },
    ],
    metadata: {
      tenantId: "vpi-co-ltd",
      lastUpdated: "2024-08-01T11:00:00Z",
      dataSource: "Firebase Analytics",
    },
  },
];

export default function OnPremViewer() {
  const [selectedDashboard, setSelectedDashboard] = useState<string>("");
  const [dashboards, setDashboards] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current dashboard data
  const currentDashboard =
    dashboards.find((d) => d.dashboardId === selectedDashboard) ||
    dashboards[0];

  useEffect(() => {
    // Load dashboards based on license
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get dashboard data from Control Plane API
      const response = await fetch(
        "http://localhost:3000/api/secure/dashboards/data",
        {
          credentials: "include", // Include HTTP-only cookies for Firebase auth
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDashboards(result.dashboards);
          if (result.dashboards.length > 0) {
            setSelectedDashboard(result.dashboards[0].dashboardId);
          }
          return; // Success, exit early
        }
      } else if (response.status === 401) {
        // Session expired - redirect to login
        setError("Session expired. Please login again.");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      // If dashboard fetch fails, show error
      setError("Failed to load dashboard data.");
    } catch (err) {
      console.warn("Dashboard loading failed, using sample data:", err);
      // Fallback to sample data if API completely fails
      setDashboards(sampleDashboards);
      setSelectedDashboard(sampleDashboards[0].dashboardId);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadDashboards}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                FlexBoard OnPrem Viewer
              </h1>
            </div>

            {/* Dashboard Selector */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedDashboard}
                onChange={(e) => setSelectedDashboard(e.target.value)}
                className="block w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {dashboards.map((dashboard) => (
                  <option
                    key={dashboard.dashboardId}
                    value={dashboard.dashboardId}
                  >
                    {dashboard.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentDashboard ? (
          <>
            {/* Dashboard Info */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentDashboard.name}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  📊 Data Source: {currentDashboard.metadata.dataSource}
                </span>
                <span>
                  🕐 Last Updated:{" "}
                  {new Date(
                    currentDashboard.metadata.lastUpdated
                  ).toLocaleString()}
                </span>
                <span>🏢 Tenant: {currentDashboard.metadata.tenantId}</span>
              </div>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentDashboard.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {widget.title}
                  </h3>

                  {/* Widget Content */}
                  {widget.type === "chart" && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        {widget.config.chartType === "bar" ? (
                          <BarChart data={widget.data}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-gray-300 dark:stroke-gray-600"
                            />
                            <XAxis
                              dataKey="name"
                              className="text-gray-600 dark:text-gray-300"
                            />
                            <YAxis className="text-gray-600 dark:text-gray-300" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--tooltip-bg, #fff)",
                                border: "1px solid var(--tooltip-border, #ccc)",
                                borderRadius: "4px",
                              }}
                            />
                            <Bar dataKey="views" fill="#3B82F6" />
                          </BarChart>
                        ) : (
                          <LineChart data={widget.data}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-gray-300 dark:stroke-gray-600"
                            />
                            <XAxis
                              dataKey="name"
                              className="text-gray-600 dark:text-gray-300"
                            />
                            <YAxis className="text-gray-600 dark:text-gray-300" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--tooltip-bg, #fff)",
                                border: "1px solid var(--tooltip-border, #ccc)",
                                borderRadius: "4px",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="sales"
                              stroke="#3B82F6"
                              strokeWidth={2}
                              name="Sales"
                            />
                            {widget.data[0]?.target && (
                              <Line
                                type="monotone"
                                dataKey="target"
                                stroke="#EF4444"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Target"
                              />
                            )}
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}

                  {widget.type === "metric" && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {widget.data[0]?.currency}{" "}
                        {widget.data[0]?.value?.toLocaleString()}
                      </div>
                      {widget.data[0]?.growth && (
                        <div
                          className={`text-sm ${
                            widget.data[0].growth > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {widget.data[0].growth > 0 ? "↗️" : "↘️"}{" "}
                          {Math.abs(widget.data[0].growth)}% vs last month
                        </div>
                      )}
                    </div>
                  )}

                  {widget.type === "table" && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {widget.data.map((row, index) => (
                            <tr key={index}>
                              {Object.entries(row).map(([key, value]) => (
                                <td
                                  key={key}
                                  className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300"
                                >
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* License-based Features Notice */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-blue-500">ℹ️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Dashboard Access Based on License Key
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      🔑 Authentication: Firebase Session-based (HTTP-only
                      cookies) <br />
                      📊 Data is fetched from Control Plane API based on your
                      license permissions <br />
                      🏢 Company: {currentDashboard.metadata.tenantId} | Last
                      Updated:{" "}
                      {new Date(
                        currentDashboard.metadata.lastUpdated
                      ).toLocaleString()}{" "}
                      <br />
                      ⚡ Features: Dashboard Viewer, Data Export | Max Users:
                      Based on license <br />
                      📞 Contact your administrator to modify dashboard access
                      or upgrade features
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Dashboards Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No dashboards are accessible with your current license key.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
