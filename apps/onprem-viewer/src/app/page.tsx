/**
 * OnPrem Viewer Dashboard Page - License-Based Data Access with Manifest Sync
 */
"use client";

import { useState, useEffect } from "react";
import {
  manifestSyncService,
  type DashboardManifest,
} from "../services/manifestSync";
// Remove direct import to avoid client-side database driver issues
// import { dataSourceService } from "../services/dataSource";
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
  data?: any[];
  config?: Record<string, any>;
  // Additional properties for metric widgets
  value?: string;
  change?: string;
  trend?: string;
  // Additional properties for table widgets
  columns?: string[];
  // Position properties for layout
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export default function OnPremViewer() {
  const [selectedDashboard, setSelectedDashboard] = useState<string>("");
  const [dashboards, setDashboards] = useState<DashboardData[]>([]);
  const [manifests, setManifests] = useState<DashboardManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "connecting" | "success" | "cached" | "failed"
  >("connecting");

  // Get current dashboard data
  const currentDashboard =
    dashboards.find((d) => d.dashboardId === selectedDashboard) ||
    dashboards[0];

  useEffect(() => {
    // Load dashboards based on license and manifests
    loadDashboards();
    // Start auto-sync
    manifestSyncService.startAutoSync();

    // Cleanup on unmount
    return () => {
      manifestSyncService.stopAutoSync();
    };
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to sync latest manifests with error handling
      console.log("🔄 Syncing dashboard manifests...");
      let syncResult;

      try {
        syncResult = await manifestSyncService.syncManifests();
      } catch (syncError) {
        console.warn("Manifest sync failed:", syncError);
        syncResult = {
          success: false,
          error: "Failed to connect to Control Plane",
        };
      }

      let manifestData: DashboardManifest[] = [];

      if (syncResult.success && syncResult.manifests) {
        manifestData = syncResult.manifests;
        setLastSync(new Date().toISOString());
        setSyncStatus("success");
        console.log(`✅ Successfully synced ${manifestData.length} manifests`);
      } else {
        // Fallback to cached manifests
        console.log(
          "📦 Using cached manifests due to sync failure:",
          syncResult.error
        );
        manifestData = manifestSyncService.getCachedManifests();
        setLastSync(manifestSyncService.getLastSyncTime());
        setSyncStatus("cached");

        // Show warning but continue with cached data
        if (manifestData.length === 0) {
          console.warn("No cached manifests available");
          setSyncStatus("failed");
        }
      }

      setManifests(manifestData);

      // Convert manifests to dashboard data with local data
      const dashboardsFromManifests = await Promise.all(
        manifestData.map(async (manifest) => {
          const widgets = await Promise.all(
            manifest.widgets.map(async (widget) => {
              // For each widget, try to get data from configured data sources
              const data = await getWidgetData(widget);

              return {
                id: widget.id,
                type: mapWidgetType(widget.type),
                title: widget.title,
                data: data,
                config: widget.config,
                position: {
                  x: widget.layout?.x || 0,
                  y: widget.layout?.y || 0,
                  w: widget.layout?.width || 6,
                  h: widget.layout?.height || 4,
                },
              };
            })
          );

          return {
            dashboardId: manifest.dashboardId,
            name: manifest.dashboardName,
            widgets: widgets,
            metadata: {
              tenantId: "vpi-co-ltd",
              lastUpdated: new Date().toISOString(),
              dataSource: "OnPrem Data Sources",
            },
          };
        })
      );

      if (dashboardsFromManifests.length > 0) {
        setDashboards(dashboardsFromManifests);
        setSelectedDashboard(dashboardsFromManifests[0].dashboardId);
        return; // Success with manifests
      }

      // Fallback: Try to get dashboard data from OnPrem Viewer API
      const response = await fetch("/api/dashboards/data", {
        credentials: "include", // Include HTTP-only cookies
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDashboards(result.dashboards);
          if (result.dashboards.length > 0) {
            setSelectedDashboard(result.dashboards[0].dashboardId);
          }

          // Show message about data source
          if (result.source !== "api") {
            console.log(
              `Dashboard data loaded from: ${result.source}`,
              result.message
            );
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

      // If everything fails, show error
      console.warn("All data sources failed - no dashboards available");
      setDashboards([]);
      setError(
        "No dashboards available. Please check your sync configuration or upload dashboards."
      );
    } catch (err) {
      console.warn("Dashboard loading failed:", err);
      // Show error if everything fails
      setDashboards([]);
      setError(
        "Failed to load dashboards. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getWidgetData = async (widget: any): Promise<any[]> => {
    try {
      // Get configured data sources via API
      const dataSourcesResponse = await fetch("/api/data-sources/fetch");
      const dataSourcesResult = await dataSourcesResponse.json();

      if (!dataSourcesResult.success || dataSourcesResult.data.length === 0) {
        // Return empty data if no data sources configured
        console.warn("No data sources configured for widget:", widget.id);
        return [];
      }

      // Try to get data from the first available data source
      const dataSource = dataSourcesResult.data[0];

      // Fetch data via API
      const dataResponse = await fetch("/api/data-sources/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataSource,
          widget: dataSource.type === "sql" ? widget : undefined,
        }),
      });

      const result = await dataResponse.json();

      if (result.success && result.data) {
        // For SQL sources, data is already processed by the widget-specific query
        if (dataSource.type === "sql") {
          return result.data;
        } else {
          // Process data based on widget configuration for other sources
          return processDataForWidget(result.data, widget);
        }
      }

      console.warn("No data available for widget:", widget.id);
      return [];
    } catch (error) {
      console.warn(`Failed to get data for widget ${widget.id}:`, error);
      return [];
    }
  };

  const processDataForWidget = (data: any[], widget: any): any[] => {
    try {
      const xAxis = widget.config?.xAxis;
      const yAxis = widget.config?.yAxis;

      if (!xAxis || !yAxis) {
        return data.slice(0, 10); // Return first 10 items if no axis config
      }

      // Group data by yAxis and sum xAxis values
      const grouped = data.reduce((acc: any, item: any) => {
        const key = item[yAxis];
        const value = parseFloat(item[xAxis]) || 0;

        if (!acc[key]) {
          acc[key] = { name: key, value: 0, count: 0 };
        }

        acc[key].value += value;
        acc[key].count += 1;

        return acc;
      }, {});

      // Convert to array and calculate averages
      return Object.values(grouped).map((item: any) => ({
        name: item.name,
        value: Math.round(item.value / item.count),
      }));
    } catch (error) {
      console.warn("Data processing failed:", error);
      return [];
    }
  };

  const mapWidgetType = (
    manifestType: string
  ): "chart" | "metric" | "table" => {
    switch (manifestType) {
      case "bar":
      case "line":
      case "area":
      case "pie":
      case "radar":
      case "scatter":
      case "composed":
      case "treemap":
        return "chart";
      case "table":
        return "table";
      default:
        return "chart";
    }
  };

  const handleManualSync = async () => {
    await loadDashboards();
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

            {/* Dashboard Selector and Sync Controls */}
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

              <button
                onClick={handleManualSync}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                title="Sync dashboards from Control Plane"
              >
                <span>🔄</span>
                <span>Sync</span>
              </button>

              <button
                onClick={() => (window.location.href = "/settings")}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                title="OnPrem Settings"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentDashboard ? (
          <>
            {/* Dashboard Info with Sync Status */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
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

                {lastSync && (
                  <div className="text-right">
                    <div
                      className={`text-sm ${
                        syncStatus === "success"
                          ? "text-green-600 dark:text-green-400"
                          : syncStatus === "cached"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {syncStatus === "success" && "✅ Manifest Synced"}
                      {syncStatus === "cached" && "📦 Using Cached Data"}
                      {syncStatus === "failed" && "❌ Sync Failed"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(lastSync).toLocaleString()}
                    </div>
                  </div>
                )}
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
                  {widget.type === "chart" && widget.data && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        {widget.config?.chartType === "bar" ? (
                          <BarChart data={widget.data}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-gray-300 dark:stroke-gray-600"
                            />
                            <XAxis
                              dataKey={
                                widget.data[0]?.month
                                  ? "month"
                                  : widget.data[0]?.category
                                    ? "category"
                                    : "name"
                              }
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
                            <Bar dataKey="value" fill="#3B82F6" />
                          </BarChart>
                        ) : (
                          <LineChart data={widget.data}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-gray-300 dark:stroke-gray-600"
                            />
                            <XAxis
                              dataKey={
                                widget.data[0]?.month
                                  ? "month"
                                  : widget.data[0]?.category
                                    ? "category"
                                    : "name"
                              }
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
                              dataKey="value"
                              stroke="#3B82F6"
                              strokeWidth={2}
                              name="Value"
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
                        {widget.value || "N/A"}
                      </div>
                      {widget.change && (
                        <div
                          className={`text-sm ${
                            widget.change.includes("+")
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {widget.change.includes("+") ? "↗️" : "↘️"}{" "}
                          {widget.change}
                        </div>
                      )}
                    </div>
                  )}

                  {widget.type === "table" && widget.columns && widget.data && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            {widget.columns.map((column, index) => (
                              <th
                                key={index}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {widget.data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {Array.isArray(row)
                                ? row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      {String(cell)}
                                    </td>
                                  ))
                                : Object.values(row).map((value, cellIndex) => (
                                    <td
                                      key={cellIndex}
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

            {/* OnPrem Architecture Notice */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-blue-500">🏗️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    OnPrem Deployment Architecture
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      � <strong>Manifest Sync:</strong> Dashboard configurations
                      synced from Control Plane API with version control <br />
                      🗄️ <strong>Local Data:</strong> Customer data stays
                      on-premises using configured data sources
                      (SQL/XML/CSV/API) <br />
                      📦 <strong>Offline Support:</strong> Cached manifests
                      ensure dashboards work without internet connectivity{" "}
                      <br />
                      🔒 <strong>Security:</strong> Only metadata and
                      configuration sync - no customer data leaves premises{" "}
                      <br />
                      ⚙️ <strong>Configuration:</strong> Use Settings page to
                      configure data sources and sync parameters <br />�{" "}
                      <strong>Current Status:</strong> {manifests.length}{" "}
                      dashboard manifests loaded | Last sync:{" "}
                      {lastSync ? new Date(lastSync).toLocaleString() : "Never"}
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
