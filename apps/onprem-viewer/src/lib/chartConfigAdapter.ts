/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Chart Config Adapter
 * Converts dashboard config to Recharts-compatible format
 */

import {
  processDataWithManifest,
  filterRows,
  groupAgg,
  sortLimit,
} from "./engine";

// Type definitions for dynamic data
interface Transform {
  as: string;
  expr: string;
}

interface Measure {
  field: string;
  agg: string;
  as?: string;
}

interface AgingBucket {
  name: string;
  condition: string;
  key: string;
}

// Dynamic record type for data that varies by source
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynamicRecord = Record<string, any>;

export interface ChartConfig {
  data: any[];
  chartType: "bar" | "line" | "pie" | "kpi" | "table";
  encoding?: {
    x?: { field: string; type: string; formatter?: string };
    y?: { field: string; type: string; formatter?: string };
    color?: { field: string; type: string };
  };
  title?: string;
  formatters?: Record<string, any>;
  display?: any;
  tooltip?: any;
}

export interface KPIConfig {
  value: number | string;
  title: string;
  formatter?: string;
  display?: {
    valueFormatter?: string;
    severityRules?: Array<{
      op: string;
      value: number;
      color: string;
    }>;
  };
  tooltip?: any;
}

export interface TableConfig {
  data: any[];
  columns: string[];
  title: string;
  display?: {
    columnFormatters?: Record<string, string>;
    rowClassRules?: Array<{
      when: { field: string; op: string; value: any };
      className: string;
    }>;
    pageSize?: number;
    stickyHeader?: boolean;
  };
}

/**
 * Generate aging bucket configuration based on business rules
 */
function generateAgingBuckets(dashboardId?: string): AgingBucket[] {
  // Default aging buckets for inventory management
  const defaultBuckets: AgingBucket[] = [
    { name: "Expired", condition: "DaysAge < 0", key: "Expired" },
    { name: "0-90", condition: "AgeBucket = '0-90'", key: "0_90" },
    { name: "91-180", condition: "AgeBucket = '91-180'", key: "91_180" },
    { name: "181-365", condition: "AgeBucket = '181-365'", key: "181_365" },
    { name: ">365", condition: "AgeBucket = '>365'", key: "365_plus" },
  ];

  // Could be extended to support different bucket configurations per dashboard
  const customBuckets: Record<string, AgingBucket[]> = {
    // Example: Different buckets for financial aging
    "accounts-receivable": [
      { name: "Current", condition: "DaysAge <= 30", key: "current" },
      {
        name: "30-60",
        condition: "DaysAge > 30 AND DaysAge <= 60",
        key: "30_60",
      },
      {
        name: "60-90",
        condition: "DaysAge > 60 AND DaysAge <= 90",
        key: "60_90",
      },
      { name: "90+", condition: "DaysAge > 90", key: "90_plus" },
    ],
  };

  return customBuckets[dashboardId || ""] || defaultBuckets;
}

/**
 * Generate aging transforms for given buckets and field mappings
 */
function generateAgingTransforms(
  buckets: AgingBucket[],
  qtyField: string = "QtyFromThisDoc",
  costField: string = "AverageCost"
): Transform[] {
  const transforms: Transform[] = [];

  buckets.forEach((bucket) => {
    transforms.push(
      // Quantity field
      {
        as: `Qty_${bucket.key}_row`,
        expr: `case( ${bucket.condition}, ${qtyField}, true, 0 )`,
      },
      // Value field
      {
        as: `Val_${bucket.key}_row`,
        expr: `case( ${bucket.condition}, ${qtyField} * ${costField}, true, 0 )`,
      }
    );
  });

  return transforms;
}

/**
 * Process widget query and return processed data
 */
export function processWidgetData(
  widget: any,
  rawData: any[],
  manifest: any
): any[] {
  console.log("🔍 processWidgetData called:", {
    widgetId: widget.id,
    widgetType: widget.type,
    rawDataLength: rawData.length,
    hasQuery: !!widget.query,
    hasManifest: !!manifest,
    manifestTransforms: manifest?.transforms?.length || 0,
    sampleRawData: rawData.slice(0, 2),
  });

  const { query } = widget;
  if (!query) {
    console.log("⚠️ No query found for widget:", widget.id);
    return rawData;
  }

  let processedData = [...rawData];

  // Create context for engine functions
  const context = {
    referenceTables: manifest?.referenceTables || {},
    settings: manifest?.settings || {},
  };

  // Debug manifest structure
  console.log("🔍 Manifest debug:", {
    hasManifest: !!manifest,
    manifestKeys: manifest ? Object.keys(manifest) : [],
    hasTransforms: !!(manifest && manifest.transforms),
    transformsLength: manifest?.transforms?.length || 0,
    transformsValue: manifest?.transforms,
    fullManifest: manifest, // เพิ่มเพื่อดู manifest ทั้งหมด
  });

  // Apply transforms from manifest
  if (manifest && manifest.transforms && manifest.transforms.length > 0) {
    console.log("🔄 Applying transforms:", manifest.transforms);
    processedData = processDataWithManifest(processedData, manifest);
    console.log("✅ Transform result:", {
      originalLength: rawData.length,
      transformedLength: processedData.length,
      sampleTransformed: processedData.slice(0, 2),
    });

    // Debug: Check AgeBucket values
    if (processedData.length > 0) {
      const ageBucketValues = processedData
        .map((row) => row.AgeBucket)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      console.log("🎯 AgeBucket unique values:", ageBucketValues);
      console.log(
        "🎯 Sample AgeBucket data:",
        processedData.slice(0, 5).map((row) => ({
          DataDate: row.DataDate,
          DocDate: row.DocDate,
          DaysAge: row.DaysAge,
          AgeBucket: row.AgeBucket,
        }))
      );
    }
  } else {
    // Fallback: Check if dashboard config has transforms but manifest doesn't
    console.log("🔍 Checking localStorage for dashboard config...");

    // Check all localStorage keys
    const localStorageKeys = Object.keys(localStorage);
    console.log("🗄️ All localStorage keys:", localStorageKeys);

    // Try multiple possible keys for dashboard config
    const possibleKeys = [
      "dashboardConfig",
      "selectedDashboard",
      "currentDashboard",
      "onprem-manifest-config",
    ];
    let configTransforms = null;
    let configSource = null;

    for (const key of possibleKeys) {
      const configData = localStorage.getItem(key);
      if (configData) {
        console.log(
          `📋 Found config in localStorage.${key}:`,
          configData.substring(0, 200) + "..."
        );
        try {
          const parsedConfig = JSON.parse(configData);
          console.log(`🔍 Parsed config structure for ${key}:`, {
            hasTransforms: !!parsedConfig.transforms,
            transformsLength: parsedConfig.transforms?.length || 0,
            transformsPreview: parsedConfig.transforms?.slice(0, 2),
            topLevelKeys: Object.keys(parsedConfig),
            hasData: !!parsedConfig.data,
            dataKeys: parsedConfig.data ? Object.keys(parsedConfig.data) : null,
          });

          // Check if transforms exist in top level
          if (parsedConfig.transforms && parsedConfig.transforms.length > 0) {
            configTransforms = parsedConfig.transforms;
            configSource = key;
            break;
          }

          // Check if transforms exist in data.transforms (for API response format)
          if (
            parsedConfig.data &&
            parsedConfig.data.transforms &&
            parsedConfig.data.transforms.length > 0
          ) {
            configTransforms = parsedConfig.data.transforms;
            configSource = key + ".data";
            break;
          }
        } catch (error) {
          console.warn(`Failed to parse ${key}:`, error);
        }
      }
    }

    // If no transforms found in localStorage, try to read from local file
    if (!configTransforms) {
      console.log(
        "🔍 No transforms in localStorage, checking local config file..."
      );

      // Try to get the config from the last used file path
      const lastUsedFilePath = localStorage.getItem("lastUsedFilePath");
      console.log("📁 Last used file path:", lastUsedFilePath);

      if (lastUsedFilePath) {
        try {
          // For client-side, we need to rely on the dashboard config that was loaded
          // Let's check if there's a way to get the original config
          const filePathHistory = localStorage.getItem("filePathHistory");
          if (filePathHistory) {
            console.log("📚 File path history:", filePathHistory);
            // This might contain information about the loaded config
          }
        } catch (error) {
          console.warn("Failed to read local config file:", error);
        }
      }
    }

    // Final fallback: Generic transforms based on common patterns
    if (!configTransforms) {
      console.log(
        "🔄 Using generic fallback transforms for dashboard:",
        manifest?.dashboardId
      );

      // Check if the data has date fields that could be used for aging calculations
      if (rawData.length > 0) {
        const sampleRow = rawData[0];
        const hasDataDate = "DataDate" in sampleRow || "data_date" in sampleRow;
        const hasDocDate = "DocDate" in sampleRow || "doc_date" in sampleRow;
        const hasQty =
          "QtyFromThisDoc" in sampleRow || "qty_from_this_doc" in sampleRow;
        const hasCost =
          "AverageCost" in sampleRow || "average_cost" in sampleRow;

        console.log("� Data pattern analysis:", {
          hasDataDate,
          hasDocDate,
          hasQty,
          hasCost,
          sampleKeys: Object.keys(sampleRow),
        });

        // If it looks like inventory aging data, apply appropriate transforms
        if (hasDataDate && hasDocDate) {
          configTransforms = [
            { as: "DaysAge", expr: "dateDiff(DataDate, DocDate, 'days')" },
            {
              as: "AgeBucket",
              expr: "case( DaysAge <= 90, '0-90', DaysAge <= 180, '91-180', DaysAge <= 365, '181-365', true, '>365' )",
            },
          ];

          // Add value calculation if quantity and cost are available
          if (hasQty && hasCost) {
            configTransforms.push({
              as: "TotalValueRow",
              expr: "QtyFromThisDoc * AverageCost",
            });
          }

          // Generate aging bucket transforms dynamically
          const agingBuckets = generateAgingBuckets(manifest?.dashboardId);
          const agingTransforms = generateAgingTransforms(
            agingBuckets,
            "QtyFromThisDoc",
            "AverageCost"
          );

          // Add aging transforms to config
          configTransforms.push(...agingTransforms);

          configSource = "auto-detected-aging";
        }
      }
    }

    if (configTransforms && configTransforms.length > 0) {
      console.log("🔄 Applying fallback transforms from config...", {
        source: configSource,
        transformsCount: configTransforms.length,
        transforms: configTransforms.map(
          (t: Transform) => `${t.as} = ${t.expr}`
        ),
      });

      const manifestWithTransforms = {
        ...manifest,
        transforms: configTransforms,
      };

      processedData = processDataWithManifest(
        processedData,
        manifestWithTransforms
      );
      console.log("✅ Fallback transform result:", {
        originalLength: rawData.length,
        transformedLength: processedData.length,
        sampleTransformed: processedData.slice(0, 2),
      });

      // Debug: Check computed field values
      if (processedData.length > 0) {
        const computedFields = configTransforms.map((t: Transform) => t.as);
        console.log("🎯 Computed fields created:", computedFields);

        // Sample the first few rows for each computed field - dynamic field access
        computedFields.forEach((field: string) => {
          const values = processedData
            .slice(0, 5)
            .map((row: DynamicRecord) => row[field])
            .filter((v) => v !== undefined && v !== null);
          console.log(`🎯 Sample ${field} values:`, values);
        });
      }
    } else {
      console.log("⚠️ No transforms found in manifest or config");
    }
  }

  // Apply filters
  if (query.filters) {
    console.log("🔽 Applying filters:", query.filters);
    const beforeFilter = processedData.length;
    processedData = filterRows(processedData, query.filters, context);
    console.log("✅ Filter result:", {
      beforeFilter,
      afterFilter: processedData.length,
      sampleFiltered: processedData.slice(0, 2),
    });
  }

  // Apply grouping and aggregation
  if (query.groupBy || query.dimensions || query.measures) {
    console.log("📊 Applying grouping and aggregation:", {
      groupBy: query.groupBy,
      dimensions: query.dimensions,
      measures: query.measures,
      dataBeforeGrouping: processedData.length,
      sampleDataBeforeGrouping: processedData.slice(0, 3),
    });

    // Use groupBy first, then fallback to dimensions
    const dimensions = query.groupBy || query.dimensions || [];
    const measures = query.measures || [];

    console.log("📊 Final grouping config:", { dimensions, measures });

    // Debug: Check if required fields exist in data
    if (processedData.length > 0 && dimensions.length > 0) {
      const sampleRow = processedData[0];
      const availableFields = Object.keys(sampleRow);
      const missingDimensions = dimensions.filter(
        (dim: string) => !availableFields.includes(dim)
      );
      const availableMeasureFields = measures
        .map((m: Measure) => m.field)
        .filter((field: string) => field && availableFields.includes(field));

      console.log("📊 Field availability check:", {
        availableFields,
        requestedDimensions: dimensions,
        missingDimensions,
        requestedMeasureFields: measures.map((m: Measure) => m.field),
        availableMeasureFields,
      });
    }

    processedData = groupAgg(processedData, dimensions, measures);

    console.log("📊 After grouping:", {
      originalLength: rawData.length,
      groupedLength: processedData.length,
      sampleGrouped: processedData.slice(0, 2),
    });
  }

  // Apply sorting and limiting
  if (query.sort || query.limit) {
    processedData = sortLimit(processedData, query.sort || [], query.limit);
  }

  return processedData;
}

/**
 * Convert widget config to KPI format
 */
export function adaptKPIWidget(
  widget: any,
  rawData: any[],
  manifest: any
): KPIConfig {
  console.log("📊 adaptKPIWidget called:", {
    widgetId: widget.id,
    title: widget.title,
    rawDataLength: rawData.length,
    query: widget.query,
  });

  const processedData = processWidgetData(widget, rawData, manifest);

  console.log("📊 KPI processedData:", {
    length: processedData.length,
    sampleData: processedData.slice(0, 3),
  });

  // For KPI, usually we get a single aggregated value
  let value: number | string = 0;

  if (processedData.length > 0) {
    const firstRow = processedData[0];

    // Find the measure field (usually the first measure in query)
    if (widget.query?.measures && widget.query.measures.length > 0) {
      const measureField =
        widget.query.measures[0].as || widget.query.measures[0].field;
      value = firstRow[measureField] || 0;
    } else {
      // If no specific measures, use the count of rows
      value = processedData.length;
    }
  }

  return {
    value,
    title: widget.title || "",
    formatter: widget.display?.valueFormatter,
    display: widget.display,
    tooltip: widget.tooltip,
  };
}

/**
 * Convert widget config to Chart format (Bar, Line, etc.)
 */
export function adaptChartWidget(
  widget: any,
  rawData: any[],
  manifest: any
): ChartConfig {
  const processedData = processWidgetData(widget, rawData, manifest);

  return {
    data: processedData,
    chartType: widget.type as "bar" | "line" | "pie",
    encoding: widget.encoding,
    title: widget.title,
    formatters: manifest.formatters,
    display: widget.display,
    tooltip: widget.tooltip,
  };
}

/**
 * Convert widget config to Table format
 */
export function adaptTableWidget(
  widget: any,
  rawData: any[],
  manifest: any
): TableConfig {
  console.log("🔧 adaptTableWidget called:", {
    widgetId: widget.id,
    widgetType: widget.type,
    hasQuery: !!widget.query,
    query: widget.query,
    rawDataLength: rawData.length,
    sampleRawData: rawData.slice(0, 2),
  });

  const processedData = processWidgetData(widget, rawData, manifest);

  console.log("🔧 adaptTableWidget result:", {
    originalDataLength: rawData.length,
    processedDataLength: processedData.length,
    sampleProcessedData: processedData.slice(0, 2),
  });

  // Get columns from query or use all available columns
  const columns =
    widget.query?.columns ||
    (processedData.length > 0 ? Object.keys(processedData[0]) : []);

  return {
    data: processedData,
    columns,
    title: widget.title || "",
    display: widget.display,
  };
}

/**
 * Format value using manifest formatters
 */
export function formatValue(
  value: any,
  formatterName: string,
  formatters: Record<string, any>
): string {
  if (!formatterName || !formatters[formatterName]) {
    return String(value);
  }

  const formatter = formatters[formatterName];

  switch (formatter.kind) {
    case "number":
      const num = Number(value);
      if (isNaN(num)) return String(value);

      let formatted = num.toFixed(formatter.precision || 0);

      if (formatter.thousandsSep) {
        formatted = formatted.replace(
          /\B(?=(\d{3})+(?!\d))/g,
          formatter.thousandsSep
        );
      }

      if (formatter.prefix) {
        formatted = formatter.prefix + formatted;
      }

      if (formatter.suffix) {
        formatted = formatted + formatter.suffix;
      }

      return formatted;

    case "date":
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);

      // Simple date formatting (can be enhanced with dayjs)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      if (formatter.pattern === "dd MMM yyyy") {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return `${day} ${months[date.getMonth()]} ${year}`;
      }

      return `${day}/${month}/${year}`;

    default:
      return String(value);
  }
}

/**
 * Get severity color for KPI based on rules
 */
export function getSeverityColor(
  value: number,
  severityRules: Array<{ op: string; value: number; color: string }> = []
): string {
  for (const rule of severityRules) {
    let matches = false;

    switch (rule.op) {
      case ">":
        matches = value > rule.value;
        break;
      case ">=":
        matches = value >= rule.value;
        break;
      case "<":
        matches = value < rule.value;
        break;
      case "<=":
        matches = value <= rule.value;
        break;
      case "=":
      case "==":
        matches = value === rule.value;
        break;
    }

    if (matches) {
      return rule.color;
    }
  }

  return "default";
}

/**
 * Convert color name to CSS color
 */
export function getColorValue(colorName: string, theme?: any): string {
  const colorMap: Record<string, string> = {
    ok: theme?.statusColors?.ok || "#10b981",
    warning: theme?.statusColors?.warning || "#f59e0b",
    danger: theme?.statusColors?.danger || "#ef4444",
    primary: theme?.brandColor || "#3b82f6",
    default: "#6b7280",
  };

  return colorMap[colorName] || colorName;
}
