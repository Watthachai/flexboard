/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OnPrem Dashboard Viewer
 * Displays dashboard based on manifest configuration
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { manifestSyncService } from "../../services/manifestSync";
import { localDataService } from "../../services/localDataService";
import {
  adaptKPIWidget,
  adaptChartWidget,
  adaptTableWidget,
} from "../../lib/chartConfigAdapter";
import { MultiSelectDropdown } from "../../components/MultiSelectDropdown";
import { PieChart, ActionBar } from "./charts";
import RealKPIWidget from "./charts/RealKPIWidget";
import RealBarChart from "./charts/RealBarChart";
import RealLineChart from "./charts/RealLineChart";
import RealParetoChart from "./charts/RealParetoChart";
import RealStackedBarChart from "./charts/RealStackedBarChart";
import RealTableWidget from "./charts/RealTableWidget";
import AdvancedTableWidget from "../../components/AdvancedTableWidget";
import LoadingSpinner from "./ui/LoadingSpinner";
import MonthYearPicker from "./ui/MonthYearPicker";
import DateRangePicker from "./DateRangePicker";
import {
  validateAndFixLayout,
  convertToMobileLayout,
  generateGridStyles,
  getWidgetGridStyles,
  generateLayoutDebugInfo,
} from "./layout/ResponsiveLayoutUtils";

// Layout adapter for new schema format
const adaptLayoutFromSchema = (config: any) => {
  console.log("🔄 adaptLayoutFromSchema input:", {
    hasFormatters: !!config.formatters,
    formatters: config.formatters,
    formatterKeys: config.formatters ? Object.keys(config.formatters) : "none",
  });

  // If config has layout.desktop structure (new schema)
  if (config.layout?.desktop && Array.isArray(config.layout.desktop)) {
    const layoutMap = new Map();

    // Create layout map from desktop layout
    config.layout.desktop.forEach((item: any) => {
      layoutMap.set(item.widgetId, {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      });
    });

    // Add layout to widgets and adapt widget structure
    const adaptedWidgets =
      config.widgets?.map((widget: any) => {
        // Extract xAxis and yAxis from new query structure
        let xAxis = "";
        let yAxis = "";

        // For chart widgets, try to extract axis info from query/encoding
        if (widget.encoding) {
          xAxis = widget.encoding.x?.field || "";
          yAxis = widget.encoding.y?.field || "";
        } else if (widget.query?.dimensions) {
          xAxis = widget.query.dimensions[0] || "";
          if (widget.query.measures?.[0]) {
            yAxis =
              widget.query.measures[0].field ||
              widget.query.measures[0].as ||
              "";
          }
        }

        // Get layout from map - fix for missing layouts
        const widgetLayout = layoutMap.get(widget.id);

        console.log(`🔍 Widget "${widget.id}" layout:`, {
          found: !!widgetLayout,
          layout: widgetLayout,
          availableLayoutIds: Array.from(layoutMap.keys()),
        });

        return {
          ...widget,
          layout: widgetLayout || {
            x: 0,
            y: 0,
            width: 6,
            height: 4,
          },
          config: {
            xAxis,
            yAxis,
            dataSource: widget.dataSource || "",
            tenantId: "",
          },
        };
      }) || [];

    const result = {
      ...config,
      widgets: adaptedWidgets,
      formatters: config.formatters, // ✅ Keep formatters from original config
      globalFilters: config.globalFilters, // Use globalFilters from API
    };

    console.log("✅ adaptLayoutFromSchema result:", {
      hasFormatters: !!result.formatters,
      formatters: result.formatters,
      formatterKeys: result.formatters
        ? Object.keys(result.formatters)
        : "none",
    });

    return result;
  }

  // Return as-is if already in old format
  return config;
};

interface Widget {
  id: string;
  type: string;
  title: string;
  dataSource: string;
  query?: any; // Add query for new schema format
  encoding?: any; // Add encoding for chart config
  display?: any; // Add display config
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
  transforms?: any[]; // Add optional transforms property
  formatters?: Record<string, any>; // Add optional formatters property
  globalFilters?: Array<{
    type: "date" | "dropdown" | "search" | "monthYearPicker" | "dateRange";
    field?: string;
    label?: string;
    options?: any[];
    config?: {
      startYear?: number;
      endYear?: number;
      defaultValue?: string;
      startDateLabel?: string;
      endDateLabel?: string;
    };
  }>; // Add globalFilters property
}

interface WidgetConfigValidation {
  isValid: boolean;
  issues: string[];
  missingColumns: string[];
}

//#!TODO: THIS อาจจะใช้ทีหลัง
// Validate widget configurations against file columns
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenWidth, setScreenWidth] = useState<number>(1200); // Default desktop width
  const [dateFilter, setDateFilter] = useState<string>("all"); // New date filter state
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null); // Date range filter state
  const [globalFilterValues, setGlobalFilterValues] = useState<
    Record<string, any>
  >({}); // New global filter state for Corp, Branch, etc.

  // Ref to track if data loading has been initiated
  const dataLoadingInitiated = useRef(false);

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

        // Skip override manifest and use original manifest directly to get globalFilters
        /*
        try {
          console.log("🔧 Trying override manifest for debugging...");
          const overrideResponse = await fetch(
            `/api/dashboard/${dashboardId}/manifest-override?tenantId=${tenantId}&debug=true&loadAll=true`
          );

          if (overrideResponse.ok) {
            const overrideResult = await overrideResponse.json();
            if (overrideResult.success && overrideResult.data) {
              console.log("✅ Using override manifest:", {
                dashboardId,
                hasGlobalFilters: !!overrideResult.data.globalFilters?.length,
                dataSource: overrideResult.data.dataSources?.[0],
                transforms: overrideResult.data.transforms?.length || 0,
                globalFilters: overrideResult.data.globalFilters,
              });

              // Only use override if it has globalFilters, otherwise fall back
              if (overrideResult.data.globalFilters && overrideResult.data.globalFilters.length > 0) {
                const adaptedManifest = adaptLayoutFromSchema(
                  overrideResult.data
                );
                setManifest(adaptedManifest);
                return;
              } else {
                console.log("⚠️ Override manifest has no globalFilters, falling back to original");
              }
            }
          }
        } catch (overrideError) {
          console.log(
            "⚠️ Override manifest failed, falling back to original:",
            overrideError
          );
        }
        */

        // Try to load from manifest API first
        try {
          console.log("� Loading manifest from API...");
          const result = await manifestSyncService.fetchDashboardManifest(
            dashboardId
          );

          if (result.success && result.manifest) {
            console.log("✅ Loaded manifest from API:", {
              dashboardId,
              schemaVersion: result.manifest.schemaVersion,
              version: result.manifest.version,
              dashboardName: result.manifest.dashboardName,
              widgetCount: result.manifest.widgets?.length,
              firstWidget: result.manifest.widgets?.[0],
              rawManifest: result.manifest,
            });

            // Adapt layout from new schema format to old format
            const adaptedManifest = adaptLayoutFromSchema(result.manifest);
            setManifest(adaptedManifest);
            return;
          } else {
            console.log("❌ API manifest failed:", result.error);
            throw new Error(
              `Failed to load manifest from API: ${
                result.error || "Unknown error"
              }`
            );
          }
        } catch (err) {
          console.log("❌ API manifest error:", err);
          throw new Error(
            `Failed to load manifest from API: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        }

        try {
          console.log("� Loading manifest directly from JSON file...");
          const directResponse = await fetch(`/pvs_expiry_pra.json`);

          if (directResponse.ok) {
            const directManifest = await directResponse.json();
            console.log("✅ Loaded direct JSON manifest:", {
              dashboardId,
              hasGlobalFilters: !!directManifest.globalFilters?.length,
              globalFilters: directManifest.globalFilters,
              globalFiltersLength: directManifest.globalFilters?.length || 0,
              schemaVersion: directManifest.schemaVersion,
            });

            if (
              directManifest.globalFilters &&
              directManifest.globalFilters.length > 0
            ) {
              const adaptedManifest = adaptLayoutFromSchema(directManifest);
              setManifest(adaptedManifest);
              return;
            }
          }
        } catch (directError) {
          console.log("⚠️ Direct JSON loading failed:", directError);
        }

        // If all else fails, throw error
        throw new Error("Unable to load manifest from API or fallback sources");
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

  // Helper function to convert camelCase/snake_case to PascalCase
  const toPascalCase = (str: string): string => {
    // Handle camelCase: dataDate -> DataDate
    if (str.includes("_")) {
      // Handle snake_case: data_date -> DataDate
      return str
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");
    } else {
      // Handle camelCase: dataDate -> DataDate
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  };

  // Helper function to transform data keys to PascalCase
  const transformDataToPascalCase = useCallback((data: any[]): any[] => {
    return data.map((row) => {
      const newRow: any = {};
      Object.keys(row).forEach((key) => {
        const pascalKey = toPascalCase(key);
        newRow[pascalKey] = row[key];
      });
      return newRow;
    });
  }, []);

  // Load data from API or localStorage fallback
  useEffect(() => {
    const loadData = async () => {
      console.log("� Loading data from API...");

      try {
        // Try to load from API first - with ALL data for accuracy
        const apiData = await localDataService.fetchData({
          id: "uploaded-xml",
          type: "api",
          url: "/api/inventory/raw?noPagination=true", // Force load all data
          method: "GET",
        });

        if (apiData && apiData.length > 0) {
          // Transform field names from snake_case to PascalCase
          const transformedData = transformDataToPascalCase(apiData);
          setUploadedData(transformedData);

          console.log("✅ Successfully loaded data from API:", {
            recordCount: transformedData.length,
            originalSample: apiData[0],
            transformedSample: transformedData[0],
            availableColumns:
              transformedData.length > 0 ? Object.keys(transformedData[0]) : [],
          });

          // Clear loading state immediately after successful API load
          setTimeout(() => {
            setDataLoading(false);
          }, 300);
          return;
        }
      } catch (error) {
        console.error("❌ Failed to load data from API:", error);
        console.log("🔄 Falling back to localStorage...");
      }

      // Fallback to localStorage
      try {
        const savedData = localStorage.getItem("uploadedData");
        const savedFileName = localStorage.getItem("uploadedFileName");
        const savedTimestamp = localStorage.getItem("uploadedDataTimestamp");

        console.log("📦 localStorage contents:", {
          hasData: !!savedData,
          hasFileName: !!savedFileName,
          hasTimestamp: !!savedTimestamp,
          dataLength: savedData ? savedData.length : 0,
          fileName: savedFileName,
          timestamp: savedTimestamp,
        });

        if (savedData) {
          const parsedData = JSON.parse(savedData);
          const transformedData = transformDataToPascalCase(parsedData);
          setUploadedData(transformedData);

          console.log("✅ Successfully loaded data from localStorage:", {
            recordCount: transformedData.length,
            firstRecord: transformedData[0],
            availableColumns:
              transformedData.length > 0 ? Object.keys(transformedData[0]) : [],
          });

          // Clear loading state immediately after successful localStorage load
          setTimeout(() => {
            setDataLoading(false);
          }, 300);
        } else {
          console.log("⚠️ No data found in localStorage or API");

          // Clear loading state when no data found
          setTimeout(() => {
            setDataLoading(false);
          }, 300);
        }
      } catch (fallbackError) {
        console.error("❌ Failed to load fallback data:", fallbackError);

        // Clear loading state on error
        setTimeout(() => {
          setDataLoading(false);
        }, 300);
      }
    };

    // Only start loading if we haven't already initiated loading and don't have data
    if (
      !dataLoadingInitiated.current &&
      uploadedData.length === 0 &&
      !dataLoading
    ) {
      console.log("🚀 Starting data loading process...");
      dataLoadingInitiated.current = true;
      setDataLoading(true);
      loadData();
    } else {
      console.log("⏸️ Skipping data loading:", {
        alreadyInitiated: dataLoadingInitiated.current,
        hasData: uploadedData.length > 0,
        isLoading: dataLoading,
      });
    }
  }, [dataLoading, uploadedData.length, transformDataToPascalCase]); // Add all dependencies used in effect

  // Render individual widget with chartConfigAdapter
  const renderWidget = (widget: Widget) => {
    console.log("🎯 Rendering widget:", {
      widgetId: widget.id,
      widgetTitle: widget.title,
      widgetType: widget.type,
      query: widget.query,
      xAxis: widget.config.xAxis,
      yAxis: widget.config.yAxis,
      hasData: uploadedData.length > 0,
      uploadedDataLength: uploadedData.length,
      dataColumns: uploadedData.length > 0 ? Object.keys(uploadedData[0]) : [],
      sampleData: uploadedData.slice(0, 2),
      manifestExists: !!manifest,
      manifestTransforms: manifest?.transforms?.length || 0,
      dateFilter: dateFilter,
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

    // Apply date filter to uploaded data
    let filteredData = uploadedData;

    // Apply global filters (Corp, Branch, etc.)
    if (Object.keys(globalFilterValues).length > 0 && uploadedData.length > 0) {
      console.log("🎯 Applying global filters:", globalFilterValues);

      filteredData = filteredData.filter((row) => {
        return Object.entries(globalFilterValues).every(
          ([field, selectedValues]) => {
            if (!selectedValues || selectedValues.length === 0) return true;

            const rowValue = row[field];
            const isMatch = selectedValues.includes(rowValue);

            console.log("🎯 Filter check:", {
              field,
              rowValue,
              selectedValues,
              isMatch,
            });

            return isMatch;
          }
        );
      });

      console.log("🎯 After global filtering:", {
        originalLength: uploadedData.length,
        filteredLength: filteredData.length,
        appliedFilters: globalFilterValues,
      });
    }

    // Apply date filter
    if (dateFilter !== "all" && filteredData.length > 0) {
      console.log("🗓️ Date filtering:", {
        dateFilter,
        originalDataLength: uploadedData.length,
        filteredDataLength: filteredData.length, // ใช้ filteredData แทน uploadedData
        sampleDataDate: filteredData[0]?.DataDate, // ใช้ filteredData แทน uploadedData
      });

      // Handle new YYYY-MM format from MonthYearPicker
      if (dateFilter.match(/^\d{4}-\d{2}$/)) {
        // New format: "2024-09"
        const selectedYearMonth = dateFilter; // "2024-09"
        console.log("🗓️ Filtering for year-month:", selectedYearMonth);

        filteredData = filteredData.filter((row) => {
          // Extract date part from ISO datetime string (YYYY-MM-DD)
          const dataDateOnly = row.DataDate ? row.DataDate.split("T")[0] : "";
          // Extract year-month from data date
          const dataYearMonth = dataDateOnly.substring(0, 7); // "2024-09"

          console.log("🗓️ Date comparison:", {
            selectedYearMonth,
            dataYearMonth,
            dataDateOnly,
            match: dataYearMonth === selectedYearMonth,
          });

          return dataYearMonth === selectedYearMonth;
        });
        console.log(
          `✅ Filtering for year-month: ${selectedYearMonth}, found ${filteredData.length} rows`
        );
      } else if (dateFilter.startsWith("month-")) {
        // Legacy format: "month-2024-09-30" (for backward compatibility)
        const selectedDate = dateFilter.replace("month-", "");
        console.log("🗓️ Filtering for legacy date:", selectedDate);

        // ✅ ใช้ filteredData แทนที่จะใช้ uploadedData
        filteredData = filteredData.filter((row) => {
          // Extract date part from ISO datetime string (YYYY-MM-DD)
          const dataDateOnly = row.DataDate ? row.DataDate.split("T")[0] : "";
          // Extract year-month from both dates for comparison
          const selectedYearMonth = selectedDate.substring(0, 7); // "2025-07"
          const dataYearMonth = dataDateOnly.substring(0, 7); // "2025-07"

          console.log("🗓️ Date comparison:", {
            selectedYearMonth,
            dataYearMonth,
            dataDateOnly,
            selectedDate,
            match: dataYearMonth === selectedYearMonth,
          });

          return dataYearMonth === selectedYearMonth;
        });
        console.log(
          `✅ Filtering for month: ${selectedDate.substring(0, 7)}, found ${
            filteredData.length
          } rows (from ${filteredData.length} after global filters)`
        );
      }

      console.log("🗓️ Final filtered data length:", filteredData.length);
    } else {
      console.log("🗓️ No date filtering applied, using globally filtered data");
    }

    // Apply date range filter
    if (
      dateRangeFilter &&
      dateRangeFilter.startDate &&
      dateRangeFilter.endDate &&
      filteredData.length > 0
    ) {
      console.log("📅 Date range filtering:", {
        startDate: dateRangeFilter.startDate,
        endDate: dateRangeFilter.endDate,
        originalDataLength: filteredData.length,
      });

      const startDate = new Date(dateRangeFilter.startDate);
      const endDate = new Date(dateRangeFilter.endDate);

      // Set time to start and end of day for accurate comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      filteredData = filteredData.filter((row) => {
        const dataDateStr = row.DataDate ? row.DataDate.split("T")[0] : "";
        if (!dataDateStr) return false;

        const dataDate = new Date(dataDateStr);
        dataDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

        const isInRange = dataDate >= startDate && dataDate <= endDate;

        console.log("📅 Date range comparison:", {
          dataDate: dataDateStr,
          startDate: dateRangeFilter.startDate,
          endDate: dateRangeFilter.endDate,
          isInRange,
        });

        return isInRange;
      });

      console.log(
        `✅ Date range filtering complete: ${filteredData.length} rows match the range ${dateRangeFilter.startDate} to ${dateRangeFilter.endDate}`
      );
    } else {
      console.log("📅 No date range filtering applied");
    }

    // Calculate widget height based on layout
    const widgetHeight =
      widget.layout.height * (manifest?.layout?.rowHeight || 50);

    // For table widgets, allow more height to accommodate data
    const maxChartHeight =
      widget.type === "table"
        ? Math.max(500, widgetHeight - 80) // ให้ความสูงขั้นต่ำ 500px สำหรับตาราง
        : Math.min(400, Math.max(250, widgetHeight - 80));

    // Use chartConfigAdapter to process data and create chart configs
    switch (widget.type) {
      case "kpi": {
        const kpiConfig = adaptKPIWidget(widget, filteredData, manifest!);
        console.log("📊 KPI Config:", kpiConfig);

        return (
          <RealKPIWidget
            data={[{ value: kpiConfig.value }]}
            config={{
              ...widget,
              adaptedConfig: kpiConfig,
            }}
          />
        );
      }

      case "bar":
      case "line": {
        const chartConfig = adaptChartWidget(widget, filteredData, manifest!);
        console.log("📊 Chart Config:", chartConfig);

        const Component = widget.type === "bar" ? RealBarChart : RealLineChart;
        return (
          <Component
            data={chartConfig.data}
            config={{
              ...widget,
              adaptedConfig: chartConfig,
            }}
            height={maxChartHeight}
          />
        );
      }

      case "table": {
        const tableConfig = adaptTableWidget(widget, filteredData, manifest!);
        console.log("📊 Table Config:", tableConfig);

        // Use AdvancedTableWidget if columnGroups are defined
        if (widget.display?.columnGroups?.length) {
          console.log("🏗️ DashboardViewer - AdvancedTableWidget formatters:", {
            manifestFormatters: manifest?.formatters,
            hasManifest: !!manifest,
            formatterKeys: manifest?.formatters
              ? Object.keys(manifest.formatters)
              : "no formatters",
          });

          return (
            <AdvancedTableWidget
              data={tableConfig.data}
              display={widget.display}
              formatters={manifest?.formatters || {}}
              height={maxChartHeight}
              title={widget.title}
            />
          );
        } else {
          // Fallback to original RealTableWidget
          return (
            <RealTableWidget
              data={tableConfig.data}
              config={{
                ...widget,
                adaptedConfig: tableConfig,
              }}
            />
          );
        }
      }

      case "pie": {
        const pieChartConfig = adaptChartWidget(
          widget,
          uploadedData,
          manifest!
        );
        return (
          <PieChart
            data={pieChartConfig.data}
            xAxis={widget.encoding?.x?.field || "category"}
            yAxis={widget.encoding?.y?.field || "value"}
            title={widget.title}
            height={maxChartHeight}
            maxHeight={400}
          />
        );
      }

      case "pareto":
        return (
          <RealParetoChart
            data={uploadedData}
            config={widget}
            height={maxChartHeight}
          />
        );

      case "stackedBar":
        return (
          <RealStackedBarChart
            data={uploadedData}
            config={widget}
            height={maxChartHeight}
          />
        );

      case "actionBar":
        return (
          <ActionBar actions={(widget as any).actions || []} config={widget} />
        );

      default:
        return (
          <div className="w-full h-full bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-sm">
                Widget type &quot;{widget.type}&quot; not supported yet
              </p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (!manifest) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">📄</div>
          <p className="text-gray-600">No dashboard configuration found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-4">
      {/* Global Filters - Show only if configured in manifest */}
      {(() => {
        const hasData = uploadedData.length > 0;
        const hasGlobalFilters =
          manifest?.globalFilters && manifest.globalFilters.length > 0;
        const shouldShow = hasData && hasGlobalFilters;

        console.log("🎯 Global Filters Debug:", {
          hasData,
          uploadedDataLength: uploadedData.length,
          hasManifest: !!manifest,
          globalFilters: manifest?.globalFilters,
          hasGlobalFilters,
          shouldShow,
          manifestSchemaVersion: manifest?.schemaVersion,
        });

        return shouldShow;
      })() && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            {manifest?.globalFilters?.map((filter, index) => {
              if (filter.type === "date" || filter.type === "monthYearPicker") {
                // Auto-detect year range from actual data
                let autoStartYear = filter.config?.startYear || 2000;
                let autoEndYear =
                  filter.config?.endYear || new Date().getFullYear();

                if (uploadedData.length > 0) {
                  // Extract years from actual data
                  const dataYears = uploadedData
                    .map((row) => {
                      const dateStr = row.DataDate || row.DocDate;
                      if (dateStr) {
                        const year = new Date(dateStr).getFullYear();
                        return isNaN(year) ? null : year;
                      }
                      return null;
                    })
                    .filter((year) => year !== null);

                  if (dataYears.length > 0) {
                    const minYear = Math.min(...dataYears);
                    const maxYear = Math.max(...dataYears);

                    // Use data range but ensure reasonable bounds
                    autoStartYear = Math.min(
                      minYear,
                      filter.config?.startYear || 2000
                    );
                    autoEndYear = Math.max(maxYear, new Date().getFullYear());

                    console.log("📅 Auto-detected year range:", {
                      dataYears: dataYears.length,
                      minYear,
                      maxYear,
                      autoStartYear,
                      autoEndYear,
                    });
                  }
                }

                // Date Filter with MonthYearPicker
                return (
                  <div key={index} className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📅 {filter.label || "Filter by Date"}:
                    </label>
                    <div className="relative">
                      <MonthYearPicker
                        value={dateFilter}
                        onChange={(value) => setDateFilter(value)}
                        startYear={autoStartYear}
                        endYear={autoEndYear}
                        className="min-w-[160px]"
                      />
                    </div>
                  </div>
                );
              } else if (filter.type === "dateRange") {
                // Date Range Filter
                return (
                  <div key={index} className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📅 {filter.label || "ช่วงวันที่"}:
                    </label>
                    <div className="relative">
                      <DateRangePicker
                        value={dateRangeFilter}
                        onChange={(value) => setDateRangeFilter(value)}
                        startDateLabel={
                          filter.config?.startDateLabel || "ตั้งแต่"
                        }
                        endDateLabel={filter.config?.endDateLabel || "จนถึง"}
                        className="min-w-[200px]"
                      />
                    </div>
                  </div>
                );
              } else if (filter.type === "dropdown" && filter.field) {
                // Dropdown Filter (Corp, Branch, etc.) with dependent filtering
                let availableData = uploadedData;
                const filterField = filter.field;

                // Apply dependent filtering for Branch based on Corp selection
                if (
                  filterField === "Branch" &&
                  globalFilterValues["Corp"]?.length > 0
                ) {
                  // Filter data to only show branches for selected corporations
                  availableData = uploadedData.filter((row) =>
                    globalFilterValues["Corp"].includes(row["Corp"])
                  );
                  console.log("🏪 Filtered Branch options based on Corp:", {
                    selectedCorp: globalFilterValues["Corp"],
                    originalBranches: [
                      ...new Set(
                        uploadedData.map((row) => row["Branch"]).filter(Boolean)
                      ),
                    ].length,
                    filteredBranches: [
                      ...new Set(
                        availableData
                          .map((row) => row["Branch"])
                          .filter(Boolean)
                      ),
                    ].length,
                  });
                }

                const uniqueValues = [
                  ...new Set(
                    availableData.map((row) => row[filterField]).filter(Boolean)
                  ),
                ].sort();

                const selectedValues = globalFilterValues[filterField] || [];

                // Clear Branch selection if Corp changes and selected branches are no longer valid
                if (filterField === "Branch") {
                  const validBranches = selectedValues.filter(
                    (branch: string) => uniqueValues.includes(branch)
                  );
                  if (validBranches.length !== selectedValues.length) {
                    // Auto-clear invalid branch selections
                    setTimeout(() => {
                      setGlobalFilterValues((prev) => ({
                        ...prev,
                        [filterField]: validBranches,
                      }));
                    }, 0);
                  }
                }

                return (
                  <div key={index} className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {filter.field === "Corp"
                        ? "🏢"
                        : filter.field === "Branch"
                        ? "🏪"
                        : "📋"}{" "}
                      {filter.label || filter.field}:
                    </label>
                    <div className="relative">
                      <MultiSelectDropdown
                        options={uniqueValues.map((value) => ({
                          label: value,
                          value,
                        }))}
                        selectedValues={selectedValues}
                        onChange={(newValues) => {
                          setGlobalFilterValues((prev) => ({
                            ...prev,
                            [filterField]: newValues,
                          }));
                        }}
                        placeholder={`เลือก ${filter.label || filterField}`}
                        className="min-w-[180px] max-w-[250px]"
                      />
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {/* Clear all filters button */}
            {(dateFilter !== "all" ||
              Object.keys(globalFilterValues).some(
                (key) => globalFilterValues[key]?.length > 0
              )) && (
              <button
                onClick={() => {
                  setDateFilter("all");
                  setGlobalFilterValues({});
                }}
                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Temporary Debug Info - Remove after testing */}
      {process.env.NODE_ENV === "production" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs">
          <strong>Debug Info:</strong>
          <br />
          Data: {uploadedData.length} rows
          <br />
          Manifest: {manifest ? "✅" : "❌"}
          <br />
          GlobalFilters:{" "}
          {manifest?.globalFilters
            ? `${manifest.globalFilters.length} filters`
            : "None"}
          <br />
          Date Filter:{" "}
          {manifest?.globalFilters?.some((f) => f.type === "date")
            ? "✅ Found"
            : "❌ Missing"}
          <br />
          Dropdown Filters:{" "}
          {manifest?.globalFilters?.filter((f) => f.type === "dropdown")
            .length || 0}
          <br />
          Should Show:{" "}
          {uploadedData.length > 0 && manifest?.globalFilters?.length
            ? "✅"
            : "❌"}
          <br />
          Current Date Filter: &quot;{dateFilter}&quot;
          <br />
          Current Global Filters: {JSON.stringify(globalFilterValues)}
          <br />
          Sample Data Date:{" "}
          {uploadedData.length > 0 ? uploadedData[0]?.DataDate : "No data"}
          <br />
          Available Corp:{" "}
          {uploadedData.length > 0
            ? [...new Set(uploadedData.map((r) => r.Corp))]
                .slice(0, 3)
                .join(", ")
            : "None"}
          <br />
          Available Branch:{" "}
          {uploadedData.length > 0
            ? [...new Set(uploadedData.map((r) => r.Branch))]
                .slice(0, 3)
                .join(", ")
            : "None"}
        </div>
      )}

      {/* Show loading screen when data is being loaded */}
      {dataLoading && (
        <LoadingSpinner size="lg" text="Loading data..." className="mb-4" />
      )}

      {/* Show upload prompt if no data and not loading */}
      {uploadedData.length === 0 && !dataLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 text-center">
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
        className="hidden md:grid gap-3"
        style={generateGridStyles(
          manifest?.layout || { type: "grid", columns: 12, rowHeight: 50 },
          screenWidth
        )}
      >
        {manifest?.widgets?.map((widget) => {
          const validatedLayout = validateAndFixLayout(
            widget.layout,
            manifest?.layout?.columns || 12,
            widget.title
          );

          return (
            <div
              key={widget.id}
              className="min-h-0"
              style={getWidgetGridStyles(
                validatedLayout,
                manifest?.layout?.columns || 12
              )}
            >
              {renderWidget(widget)}
            </div>
          );
        }) || []}
      </div>

      {/* Mobile Dashboard Layout */}
      <div className="block md:hidden">
        <div className="space-y-6">
          {convertToMobileLayout(
            manifest?.widgets || [],
            manifest?.layout?.rowHeight || 50
          ).map((mobileWidget) => {
            const originalWidget = manifest?.widgets?.find(
              (w) => w.id === mobileWidget.id
            );
            if (!originalWidget) return null;

            return (
              <div
                key={`mobile-${mobileWidget.id}`}
                style={{
                  minHeight: `${mobileWidget.mobileHeight}px`,
                }}
              >
                {renderWidget(originalWidget)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Layout Debug Info (Development only) */}
      {process.env.NODE_ENV === "production" && (
        <div className="mt-8 space-y-4">
          {/* Current Layout Analysis */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              💡 Layout Optimization Suggestions
            </h3>
            {(() => {
              if (!manifest) return null;
              const debugInfo = generateLayoutDebugInfo(
                manifest.widgets,
                manifest.layout
              );
              const hasIssues =
                debugInfo.overlaps.length > 0 ||
                manifest.widgets.some(
                  (w) =>
                    w.layout.x + w.layout.width >
                    (manifest?.layout?.columns || 12)
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
                        <p>
                          • Ensure x + width ≤ {manifest?.layout?.columns || 12}
                        </p>
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

      {manifest?.widgets?.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">
            No widgets configured in this dashboard
          </p>
        </div>
      )}
    </div>
  );
}
