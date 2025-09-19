/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Real Table Widget with Recharts-style data processing
 * Supports complex queries, filtering, sorting, and formatting
 */

import React, { useState } from "react";
import * as XLSX from "xlsx";

interface RealTableWidgetProps {
  data: any[];
  config: any;
  height?: number;
}

export default function RealTableWidget({
  data,
  config,
}: Omit<RealTableWidgetProps, "height">) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Use adaptedConfig if available, otherwise fallback to legacy processing
  let tableData: any[];
  let columns: Array<{ field: string; title: string; formatter?: string }>;
  let title: string = config.title || "";

  if (config.adaptedConfig) {
    // Use processed config from chartConfigAdapter
    tableData = config.adaptedConfig.data;
    // Convert simple column names to column objects
    const columnNames: string[] = config.adaptedConfig.columns;
    columns = columnNames.map((col: string) => ({
      field: col,
      title: col,
      formatter: config.adaptedConfig.display?.columnFormatters?.[col],
    }));
    title = config.adaptedConfig.title;
  } else {
    // Legacy processing for backward compatibility
    const processed = processTableData(
      data,
      config.query,
      sortField,
      sortOrder
    );
    tableData = processed.processedData;
    // processed.columns returns array of objects, extract field names
    const columnObjects = processed.columns as Array<{
      field: string;
      title: string;
      formatter?: string;
    }>;
    columns = columnObjects; // Use the objects directly
    // display = config.display; // Not used in current implementation
  }

  if (!tableData || tableData.length === 0) {
    return (
      <div className="w-full h-full bg-white border rounded-lg p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📋</div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Define age buckets for separate sheets
      const ageBuckets = [
        { bucket: "0-90", sheetName: "0-90 Days" },
        { bucket: "91-180", sheetName: "91-180 Days" },
        { bucket: "181-365", sheetName: "181-365 Days" },
        { bucket: ">365", sheetName: "Over 365 Days" },
      ];

      // Check if this is an aging report table (has AgeBucket data)
      const hasAgeBucket = tableData.some((row) => row.AgeBucket);

      if (hasAgeBucket) {
        // Create separate sheets for each age bucket
        ageBuckets.forEach(({ bucket, sheetName }) => {
          // Filter data for this age bucket
          const bucketData = tableData.filter(
            (row) => row.AgeBucket === bucket
          );

          if (bucketData.length > 0) {
            // Prepare export data for this bucket
            const exportData = bucketData.map((row) => {
              const exportRow: any = {};
              columns.forEach((col) => {
                exportRow[col.title] = formatCellValue(
                  row[col.field],
                  col.formatter || ""
                );
              });
              return exportRow;
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Set column widths
            const columnWidths = columns.map((col) => ({
              wch: Math.max(col.title.length, 15),
            }));
            ws["!cols"] = columnWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          }
        });

        // Also create a summary sheet with all data
        const allExportData = tableData.map((row) => {
          const exportRow: any = {};
          columns.forEach((col) => {
            exportRow[col.title] = formatCellValue(
              row[col.field],
              col.formatter || ""
            );
          });
          return exportRow;
        });

        const summaryWs = XLSX.utils.json_to_sheet(allExportData);
        const summaryColumnWidths = columns.map((col) => ({
          wch: Math.max(col.title.length, 15),
        }));
        summaryWs["!cols"] = summaryColumnWidths;
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
      } else {
        // For non-aging reports, create single sheet
        const exportData = tableData.map((row) => {
          const exportRow: any = {};
          columns.forEach((col) => {
            exportRow[col.title] = formatCellValue(
              row[col.field],
              col.formatter || ""
            );
          });
          return exportRow;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const columnWidths = columns.map((col) => ({
          wch: Math.max(col.title.length, 15),
        }));
        ws["!cols"] = columnWidths;

        const sheetName = title.replace(/[^\w\s]/gi, "") || "Data Export";
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = hasAgeBucket
        ? `Inventory_Aging_Report_${timestamp}.xlsx`
        : `${title.replace(/[^\w\s]/gi, "")}_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      console.log(`📊 Excel export completed: ${filename}`);
      console.log(`📋 Sheets created: ${wb.SheetNames.join(", ")}`);
    } catch (error) {
      console.error("Failed to export Excel:", error);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  return (
    <div className="w-full h-full bg-white border rounded-lg p-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            {config?.title || "Data Table"}
          </h3>
          <p className="text-sm text-gray-500">
            {tableData.length} rows • {columns.length} columns
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          title="Export to Excel"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Excel
        </button>
      </div>

      <div
        className="overflow-auto border border-gray-200 rounded-lg"
        style={{ height: "800px" }}
      >
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.field}
                  className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 border-b"
                  onClick={() => handleSort(column.field)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {sortField === column.field && (
                      <span className="text-blue-600">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr
                key={index}
                className={`border-b hover:bg-gray-50 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-25"
                }`}
              >
                {columns.map((column) => (
                  <td key={column.field} className="px-4 py-3">
                    <div
                      className={getConditionalStyling(
                        row[column.field],
                        column,
                        config.conditionalFormatting
                      )}
                    >
                      {formatCellValue(row[column.field], column.formatter)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function processTableData(
  data: any[],
  query: any,
  sortField?: string | null,
  sortOrder?: "asc" | "desc"
) {
  if (!data || data.length === 0) {
    return { processedData: [], columns: [] };
  }

  // Apply filters first
  let filteredData = data;
  if (query?.filters && query.filters.length > 0) {
    filteredData = data.filter((row) => {
      return query.filters.every((filter: any) => {
        const fieldValue = row[filter.field];
        switch (filter.operator) {
          case "equals":
            return fieldValue === filter.value;
          case "not_equals":
            return fieldValue !== filter.value;
          case "greater_than":
            return Number(fieldValue) > Number(filter.value);
          case "less_than":
            return Number(fieldValue) < Number(filter.value);
          case "contains":
            return String(fieldValue)
              .toLowerCase()
              .includes(String(filter.value).toLowerCase());
          case "in":
            return (
              Array.isArray(filter.value) && filter.value.includes(fieldValue)
            );
          default:
            return true;
        }
      });
    });
  }

  // Determine columns
  const columns: Array<{ field: string; title: string; formatter?: string }> =
    [];

  if (query?.dimensions && query?.measures) {
    // Use specified dimensions and measures
    query.dimensions.forEach((dim: string) => {
      columns.push({
        field: dim,
        title: formatTitle(dim),
        formatter: "text",
      });
    });

    query.measures.forEach((measure: any) => {
      columns.push({
        field: measure.field,
        title: measure.title || formatTitle(measure.field),
        formatter: measure.formatter || "number",
      });
    });
  } else {
    // Auto-detect columns from data
    if (filteredData.length > 0) {
      Object.keys(filteredData[0]).forEach((key) => {
        columns.push({
          field: key,
          title: formatTitle(key),
          formatter: detectFormatter(filteredData[0][key]),
        });
      });
    }
  }

  // Apply aggregation if specified
  let processedData = filteredData;
  if (
    query?.dimensions &&
    query?.measures &&
    query.measures.some((m: any) => m.aggregation)
  ) {
    processedData = aggregateTableData(filteredData, query);
  }

  // Apply sorting
  if (sortField) {
    processedData = [...processedData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        const result = aVal.localeCompare(bVal);
        return sortOrder === "desc" ? -result : result;
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortOrder === "desc" ? numB - numA : numA - numB;
    });
  } else if (query?.sort) {
    const sortField = query.sort.field;
    const sortOrder = query.sort.order || "asc";
    processedData = [...processedData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        const result = aVal.localeCompare(bVal);
        return sortOrder === "desc" ? -result : result;
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortOrder === "desc" ? numB - numA : numA - numB;
    });
  }

  // Apply limit
  if (query?.limit) {
    processedData = processedData.slice(0, query.limit);
  }

  return { processedData, columns };
}

function aggregateTableData(data: any[], query: any) {
  const dimensions = query.dimensions || [];
  const measures = query.measures || [];

  // Group by dimensions
  const grouped = data.reduce((acc, row) => {
    const key = dimensions.map((dim: string) => row[dim]).join("|");
    if (!acc[key]) {
      acc[key] = {
        dimensions: dimensions.reduce((dimObj: any, dim: string) => {
          dimObj[dim] = row[dim];
          return dimObj;
        }, {}),
        measures: measures.reduce((measObj: any, measure: any) => {
          measObj[measure.field] = { values: [], count: 0, sum: 0 };
          return measObj;
        }, {}),
      };
    }

    measures.forEach((measure: any) => {
      const value = Number(row[measure.field]) || 0;
      acc[key].measures[measure.field].values.push(value);
      acc[key].measures[measure.field].count += 1;
      acc[key].measures[measure.field].sum += value;
    });

    return acc;
  }, {});

  // Apply aggregations
  return Object.values(grouped).map((group: any) => {
    const result = { ...group.dimensions };

    measures.forEach((measure: any) => {
      const measureData = group.measures[measure.field];
      switch (measure.aggregation) {
        case "sum":
          result[measure.field] = measureData.sum;
          break;
        case "count":
          result[measure.field] = measureData.count;
          break;
        case "avg":
          result[measure.field] =
            measureData.count > 0 ? measureData.sum / measureData.count : 0;
          break;
        case "min":
          result[measure.field] = Math.min(...measureData.values);
          break;
        case "max":
          result[measure.field] = Math.max(...measureData.values);
          break;
        default:
          result[measure.field] = measureData.sum;
      }
    });

    return result;
  });
}

function formatTitle(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function detectFormatter(value: any): string {
  if (typeof value === "number") {
    if (value > 1000000 || String(value).includes(".")) {
      return "number";
    }
    return "qty";
  }
  if (typeof value === "string" && !isNaN(Date.parse(value))) {
    return "date";
  }
  return "text";
}

function formatCellValue(value: any, formatter?: string): string {
  if (value === null || value === undefined) {
    return "-";
  }

  switch (formatter) {
    case "number":
      return Number(value).toLocaleString();
    case "qty":
      return Number(value).toLocaleString("th-TH");
    case "money":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(Number(value));
    case "percentage":
      return `${Number(value).toFixed(1)}%`;
    case "date":
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("th-TH");
      }
      return String(value);
    case "days":
      return `${Number(value)} days`;
    default:
      return String(value);
  }
}

function getConditionalStyling(
  value: any,
  column: any,
  conditionalFormatting?: any
): string {
  let className = "";

  if (conditionalFormatting && conditionalFormatting.rules) {
    const numValue = Number(value);
    for (const rule of conditionalFormatting.rules) {
      if (rule.field === column.field || !rule.field) {
        if (evaluateCondition(numValue, rule.condition)) {
          className = getConditionalClass(rule.severity || rule.color);
          break;
        }
      }
    }
  }

  return className;
}

function evaluateCondition(value: number, condition: any): boolean {
  if (!condition) return false;

  switch (condition.operator) {
    case "greater_than":
      return value > Number(condition.value);
    case "less_than":
      return value < Number(condition.value);
    case "equals":
      return value === Number(condition.value);
    case "between":
      return value >= Number(condition.min) && value <= Number(condition.max);
    default:
      return false;
  }
}

function getConditionalClass(severity: string): string {
  switch (severity) {
    case "danger":
    case "red":
      return "text-red-600 bg-red-50 font-medium";
    case "warning":
    case "yellow":
      return "text-yellow-600 bg-yellow-50 font-medium";
    case "ok":
    case "green":
      return "text-green-600 bg-green-50 font-medium";
    default:
      return "";
  }
}
