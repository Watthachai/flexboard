/**
 * OnPrem Dashboard Viewer
 * Displays dashboard based on manifest configuration
 */

"use client";

import React, { useState, useEffect } from "react";
import { manifestSyncService } from "../../services/manifestSync";
import { UniversalXmlParser } from "../../lib/xml-parser";
import { BarChart, LineChart, PieChart } from "./charts";
import DashboardLayout from "./layout/DashboardLayout";
import StatsCards from "./StatsCards";
import {
  validateAndFixLayout,
  convertToMobileLayout,
  generateGridStyles,
  getWidgetGridStyles,
  generateLayoutDebugInfo,
} from "./layout/ResponsiveLayoutUtils";

interface Widget {
  id: string;
  type: string;
  title: string;
  dataSource: string;
  config: {
    xAxis: string;
    yAxis: string;
    dataSource: string;
    tenantId: string;
  };
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DashboardManifest {
  schemaVersion: string;
  dashboardId: string;
  dashboardName: string;
  description: string;
  version: number;
  targetTeams: string[];
  layout: {
    type: string;
    columns: number;
    rowHeight: number;
  };
  widgets: Widget[];
  dataSources: any[];
  availableColumns?: string[]; // Add optional availableColumns
}

interface WidgetConfigValidation {
  isValid: boolean;
  issues: string[];
  missingColumns: string[];
}

// Validate widget configurations against file columns
const validateWidgetConfigs = (
  widgets: Widget[],
  fileColumns: string[]
): WidgetConfigValidation => {
  const issues: string[] = [];
  const missingColumns: string[] = [];

  widgets.forEach((widget) => {
    // Check if xAxis column exists in file
    if (widget.config.xAxis && !fileColumns.includes(widget.config.xAxis)) {
      const issue = `Widget "${widget.title}" requires X-axis column "${widget.config.xAxis}" which is missing in uploaded file`;
      issues.push(issue);
      missingColumns.push(widget.config.xAxis);
    }

    // Check if yAxis column exists in file
    if (widget.config.yAxis && !fileColumns.includes(widget.config.yAxis)) {
      const issue = `Widget "${widget.title}" requires Y-axis column "${widget.config.yAxis}" which is missing in uploaded file`;
      issues.push(issue);
      missingColumns.push(widget.config.yAxis);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    missingColumns: [...new Set(missingColumns)], // Remove duplicates
  };
};

interface DashboardViewerProps {
  tenantId: string;
  dashboardId: string;
}

export default function DashboardViewer({
  tenantId,
  dashboardId,
}: DashboardViewerProps) {
  const [manifest, setManifest] = useState<DashboardManifest | null>(null);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenWidth, setScreenWidth] = useState<number>(1200); // Default desktop width

  // Handle screen resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    // Set initial width
    if (typeof window !== "undefined") {
      setScreenWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // Load dashboard manifest
  useEffect(() => {
    const loadManifest = async () => {
      try {
        setLoading(true);

        // Use manifestSyncService to fetch dashboard with license validation
        const result =
          await manifestSyncService.fetchDashboardManifest(dashboardId);

        if (result.success && result.manifest) {
          setManifest(result.manifest);
        } else {
          throw new Error(
            result.error || "Failed to load dashboard configuration"
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    if (tenantId && dashboardId) {
      loadManifest();
    }
  }, [tenantId, dashboardId]);

  // Load uploaded data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("uploadedData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setUploadedData(parsedData);

        // Debug: Log data structure
        console.log("🔍 Loaded data from localStorage:", {
          recordCount: parsedData.length,
          firstRecord: parsedData[0],
          availableColumns:
            parsedData.length > 0 ? Object.keys(parsedData[0]) : [],
          sampleData: parsedData.slice(0, 3),
        });
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    }
  }, []);

  // Simple CSV parser (kept for backwards compatibility)
  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Try to parse as number, otherwise keep as string
        obj[header] =
          !isNaN(Number(value)) && value !== "" ? Number(value) : value;
      });
      return obj;
    });
  };

  // Universal XML parser using the advanced parser from control-plane-ui
  const parseXML = (text: string): any[] => {
    try {
      const parseResult = UniversalXmlParser.parse(text, {
        maxRecords: 1000,
        skipEmptyFields: true,
        normalizeFieldNames: false, // Keep original field names
      });

      console.log("🔍 XML Parse Result:", {
        detectedStructure: parseResult.detectedStructure,
        rootElement: parseResult.rootElement,
        recordElement: parseResult.recordElement,
        totalRecords: parseResult.totalRecords,
        availableColumns: parseResult.availableColumns,
        sampleRecord: parseResult.records[0],
      });

      return parseResult.records;
    } catch (err) {
      console.error("XML parsing error:", err);
      throw new Error(
        `Failed to parse XML file: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  // Render individual widget
  const renderWidget = (widget: Widget) => {
    console.log("🎯 Rendering widget:", {
      widgetId: widget.id,
      widgetTitle: widget.title,
      widgetType: widget.type,
      xAxis: widget.config.xAxis,
      yAxis: widget.config.yAxis,
      hasData: uploadedData.length > 0,
      dataColumns: uploadedData.length > 0 ? Object.keys(uploadedData[0]) : [],
      sampleData: uploadedData.slice(0, 2),
    });

    if (!uploadedData.length) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center p-4">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-gray-500">Upload data to view chart</p>
            <div className="text-xs text-gray-400 mt-2">
              Expected: {widget.config.xAxis} (X) & {widget.config.yAxis} (Y)
            </div>
          </div>
        </div>
      );
    }

    // Calculate widget height based on layout
    const widgetHeight = widget.layout.height * manifest!.layout.rowHeight;
    const maxChartHeight = Math.min(400, Math.max(250, widgetHeight - 80)); // Leave space for title & summary

    // Get available columns from uploaded data
    const availableColumns =
      uploadedData.length > 0 ? Object.keys(uploadedData[0]) : [];

    // Use fallback columns if widget config doesn't match data
    const xAxis =
      widget.config.xAxis && availableColumns.includes(widget.config.xAxis)
        ? widget.config.xAxis
        : availableColumns[0] || "index";

    const yAxis =
      widget.config.yAxis && availableColumns.includes(widget.config.yAxis)
        ? widget.config.yAxis
        : availableColumns.find((col) => {
            const sampleValue = uploadedData[0]?.[col];
            return !isNaN(Number(sampleValue)) && sampleValue !== "";
          }) ||
          availableColumns[1] ||
          "value";

    console.log("📊 Chart config:", {
      widgetTitle: widget.title,
      originalXAxis: widget.config.xAxis,
      originalYAxis: widget.config.yAxis,
      finalXAxis: xAxis,
      finalYAxis: yAxis,
      availableColumns,
    });

    // Common chart props
    const chartProps = {
      data: uploadedData,
      xAxis: xAxis,
      yAxis: yAxis,
      title: widget.title,
      height: maxChartHeight,
      maxHeight: 400, // Global max height limit
    };

    // Render appropriate chart type
    switch (widget.type) {
      case "bar":
        return <BarChart {...chartProps} />;
      case "line":
        return <LineChart {...chartProps} />;
      case "pie":
        return <PieChart {...chartProps} />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading Dashboard">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl animate-pulse mb-4">⏳</div>
            <p className="text-gray-600">Loading dashboard configuration...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Error">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!manifest) {
    return (
      <DashboardLayout title="Dashboard Not Found">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-4">📄</div>
            <p className="text-gray-600">No dashboard configuration found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={manifest.dashboardName}
      breadcrumb={[{ label: "Dashboards" }, { label: manifest.dashboardName }]}
    >
      <div className="h-full p-6 space-y-6">
        {/* Dashboard Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {manifest.dashboardName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {manifest.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Version {manifest.version} | {manifest.widgets.length} widgets
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Show when data is uploaded */}
        {uploadedData.length > 0 && (
          <StatsCards
            data={uploadedData}
            manifest={{
              ...manifest,
              availableColumns:
                uploadedData.length > 0 ? Object.keys(uploadedData[0]) : [],
            }}
          />
        )}

        {/* Show upload prompt if no data */}
        {uploadedData.length === 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6 text-center">
            <div className="text-blue-600 dark:text-blue-400 mb-2">
              📊 No data uploaded yet
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              To view dashboard charts, please upload your data file first.
            </p>
            <button
              onClick={() => (window.location.href = "/settings")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📤 Go to Settings to Upload Data
            </button>
          </div>
        )}

        {/* Desktop Dashboard Grid */}
        <div
          className="hidden md:grid gap-4"
          style={generateGridStyles(manifest.layout, screenWidth)}
        >
          {manifest.widgets.map((widget) => {
            const validatedLayout = validateAndFixLayout(
              widget.layout,
              manifest.layout.columns,
              widget.title
            );

            return (
              <div
                key={widget.id}
                className="bg-white rounded-lg shadow-sm p-4 min-h-0"
                style={getWidgetGridStyles(
                  validatedLayout,
                  manifest.layout.columns
                )}
              >
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 flex-shrink-0">
                    {widget.title}
                  </h3>
                  <div className="flex-1 min-h-0">{renderWidget(widget)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Dashboard Layout */}
        <div className="block md:hidden">
          <div className="space-y-4">
            {convertToMobileLayout(
              manifest.widgets,
              manifest.layout.rowHeight
            ).map((mobileWidget) => {
              const originalWidget = manifest.widgets.find(
                (w) => w.id === mobileWidget.id
              );
              if (!originalWidget) return null;

              return (
                <div
                  key={`mobile-${mobileWidget.id}`}
                  className="bg-white rounded-lg shadow-sm p-4"
                  style={{
                    minHeight: `${mobileWidget.mobileHeight}px`,
                  }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {originalWidget.title}
                  </h3>
                  <div className="h-full">{renderWidget(originalWidget)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Layout Debug Info (Development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 space-y-4">
            {/* Current Layout Analysis */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                💡 Layout Optimization Suggestions
              </h3>
              {(() => {
                const debugInfo = generateLayoutDebugInfo(
                  manifest.widgets,
                  manifest.layout
                );
                const hasIssues =
                  debugInfo.overlaps.length > 0 ||
                  manifest.widgets.some(
                    (w) => w.layout.x + w.layout.width > manifest.layout.columns
                  );

                return (
                  <div className="text-xs text-blue-700 space-y-2">
                    <div>
                      Screen: {screenWidth}px | Grid: {debugInfo.gridInfo}
                    </div>

                    {hasIssues && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mt-2">
                        <p className="font-medium text-yellow-800">
                          ⚠️ Layout Issues Detected:
                        </p>
                        <div className="mt-1 text-yellow-700">
                          <p>
                            • Consider using side-by-side layout: width: 6 each
                          </p>
                          <p>• Recommended height: 6-8 rows (300-400px)</p>
                          <p>• Ensure x + width ≤ {manifest.layout.columns}</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-green-100 border border-green-300 rounded p-2 mt-2">
                      <p className="font-medium text-green-800">
                        ✅ Recommended Layout:
                      </p>
                      <div className="mt-1 text-green-700 font-mono text-xs">
                        <div>Bar Chart: x:0, y:0, width:6, height:8</div>
                        <div>Line Chart: x:6, y:0, width:6, height:8</div>
                      </div>
                    </div>

                    {debugInfo.overlaps.length > 0 && (
                      <div className="text-red-600">
                        ⚠️ Widget Overlaps:
                        {debugInfo.overlaps.map((overlap, i) => (
                          <div key={i} className="ml-2">
                            {overlap.widget1} ↔ {overlap.widget2}
                          </div>
                        ))}
                      </div>
                    )}

                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">
                        Current Widget Details
                      </summary>
                      <div className="mt-1 ml-2">
                        {debugInfo.widgetInfo.map((widget) => (
                          <div key={widget.id} className="font-mono">
                            {widget.title}: pos{widget.position} size
                            {widget.size}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {manifest.widgets.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">
              No widgets configured in this dashboard
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
