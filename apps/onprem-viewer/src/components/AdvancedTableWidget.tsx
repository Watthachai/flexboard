/**
 * Advanced Table Widget with Dynamic Column Groups Support
 * Supports TanStack Table with hierarchical headers and dynamic configuration
 */

"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, Download, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { aggregateBy } from "../utils/aggregate";

// Types for dynamic column configuration
interface ColumnGroup {
  title: string;
  columns: string[];
  headerClass?: string;
  cellClass?: string;
}

interface ColumnConfig {
  field: string;
  label?: string;
  formatter?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  align?: "left" | "center" | "right";
  headerClass?: string;
  cellClass?: string;
}

interface TableDisplayConfig {
  columnGroups?: ColumnGroup[];
  columnLabels?: Record<string, string>;
  columnFormatters?: Record<string, string>;
  columnWidths?: Record<string, number>;
  columnAlignment?: Record<string, "left" | "center" | "right">;
  stickyHeader?: boolean;
  stickyFirstColumns?: number;
  pageSize?: number;
  showTotalsRow?: boolean;
  totalsAgg?: Record<string, "sum" | "avg" | "count" | "min" | "max">;
  rowClassRules?: Array<{
    when: { field: string; op: string; value: any };
    className: string;
  }>;
  exportFilename?: string;
  searchable?: boolean;
  horizontalScroll?: boolean;
}

interface AdvancedTableProps {
  data: any[];
  display?: TableDisplayConfig;
  formatters?: Record<string, any>;
  height?: number;
  title?: string;
  preAggregation?: {
    groupBy: string[];
    measures: any[];
  };
}

// Formatter utility
const formatValue = (
  value: any,
  formatter: string,
  formatters: Record<string, any> = {}
) => {
  if (value == null) return "";

  const formatterConfig = formatters[formatter];
  if (!formatterConfig) return String(value);

  switch (formatterConfig.kind) {
    case "number":
      const num = Number(value);
      if (isNaN(num)) return String(value);

      // Handle floating point precision issues more aggressively
      const precision = formatterConfig.precision || 0;

      // For very small numbers with floating point errors, use parseFloat to clean up
      let cleanNum = num;
      if (Math.abs(num) < 1 && num.toString().includes("e")) {
        // Handle scientific notation
        cleanNum = parseFloat(num.toPrecision(10));
      } else if (num.toString().length > 15) {
        // Handle very long decimal numbers
        cleanNum = parseFloat(num.toPrecision(12));
      }

      const multiplier = Math.pow(10, precision);
      const roundedNum =
        Math.round((cleanNum + Number.EPSILON) * multiplier) / multiplier;
      let formatted = roundedNum.toFixed(precision);

      // Remove unnecessary trailing zeros for better display
      if (precision > 0 && formatted.includes(".")) {
        formatted = formatted.replace(/\.?0+$/, "");
      }

      if (formatterConfig.thousandsSep) {
        const parts = formatted.split(".");
        parts[0] = parts[0].replace(
          /\B(?=(\d{3})+(?!\d))/g,
          formatterConfig.thousandsSep
        );
        formatted = parts.join(".");
      }

      if (formatterConfig.prefix)
        formatted = formatterConfig.prefix + formatted;
      if (formatterConfig.suffix)
        formatted = formatted + formatterConfig.suffix;

      return formatted;

    case "date":
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);

      return date.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    default:
      return String(value);
  }
};

// Generate dynamic columns based on configuration
const generateColumns = (
  data: any[],
  display: TableDisplayConfig,
  formatters: Record<string, any>
): ColumnDef<any>[] => {
  console.log("🔧 generateColumns called:", {
    dataLength: data.length,
    hasColumnGroups: !!display.columnGroups?.length,
    columnGroups: display.columnGroups,
    dataKeys: data.length > 0 ? Object.keys(data[0]) : [],
    sampleData: data.slice(0, 1),
  });

  if (!data.length) return [];

  const dataKeys = Object.keys(data[0]);
  const columnHelper = createColumnHelper<any>();

  // If columnGroups are defined, create hierarchical structure
  if (display.columnGroups?.length) {
    const columns: ColumnDef<any>[] = [];

    display.columnGroups.forEach((group) => {
      console.log("🔧 Processing column group:", {
        groupTitle: group.title,
        groupColumns: group.columns,
        availableInData: group.columns.filter((col) => dataKeys.includes(col)),
      });

      if (group.columns.length === 1) {
        // Single column - no group header
        const field = group.columns[0];
        if (dataKeys.includes(field)) {
          columns.push(
            columnHelper.accessor(field, {
              id: field, // Explicit ID
              header: display.columnLabels?.[field] || field,
              cell: (info: any) => {
                const value = info.getValue();
                const formatter = display.columnFormatters?.[field];
                return formatter
                  ? formatValue(value, formatter, formatters)
                  : value;
              },
              meta: {
                align: display.columnAlignment?.[field] || "left",
                className: display.rowClassRules ? "dynamic-cell" : undefined,
              },
            })
          );
        } else {
          console.warn(
            `🚨 Column '${field}' not found in data. Available columns:`,
            dataKeys
          );
        }
      } else {
        // Multiple columns - create group
        const availableColumns = group.columns.filter((field) =>
          dataKeys.includes(field)
        );

        if (availableColumns.length > 0) {
          columns.push(
            columnHelper.group({
              id: `group_${group.title.replace(/\s+/g, "_").toLowerCase()}`, // Explicit group ID
              header: group.title,
              columns: availableColumns.map((field) =>
                columnHelper.accessor(field, {
                  id: field, // Explicit ID for each column
                  header: display.columnLabels?.[field] || field,
                  cell: (info: any) => {
                    const value = info.getValue();
                    const formatter = display.columnFormatters?.[field];
                    return formatter
                      ? formatValue(value, formatter, formatters)
                      : value;
                  },
                  meta: {
                    align: display.columnAlignment?.[field] || "left",
                    className: display.rowClassRules
                      ? "dynamic-cell"
                      : undefined,
                  },
                })
              ),
            })
          );
        } else {
          console.warn(
            `🚨 No columns from group '${group.title}' found in data. Requested:`,
            group.columns,
            "Available:",
            dataKeys
          );
        }
      }
    });

    return columns;
  } else {
    // No groups - flat structure
    return dataKeys.map((field) =>
      columnHelper.accessor(field, {
        id: field, // Explicit ID
        header: display.columnLabels?.[field] || field,
        cell: (info: any) => {
          const value = info.getValue();
          const formatter = display.columnFormatters?.[field];
          return formatter ? formatValue(value, formatter, formatters) : value;
        },
        meta: {
          align: display.columnAlignment?.[field] || "left",
          className: display.rowClassRules ? "dynamic-cell" : undefined,
        },
      })
    );
  }
};

// Calculate totals row
const calculateTotalsRow = (
  data: any[],
  totalsAgg: Record<string, string>
): Record<string, any> => {
  const totals: Record<string, any> = {};

  Object.entries(totalsAgg).forEach(([field, aggType]) => {
    const values = data
      .map((row) => Number(row[field] || 0))
      .filter((v) => !isNaN(v));

    switch (aggType) {
      case "sum":
        totals[field] = values.reduce((sum, val) => sum + val, 0);
        break;
      case "avg":
        totals[field] = values.length
          ? values.reduce((sum, val) => sum + val, 0) / values.length
          : 0;
        break;
      case "count":
        totals[field] = data.length;
        break;
      case "min":
        totals[field] = values.length ? Math.min(...values) : 0;
        break;
      case "max":
        totals[field] = values.length ? Math.max(...values) : 0;
        break;
      default:
        totals[field] = "";
    }
  });

  return totals;
};

// Row class evaluation
const evaluateRowClass = (
  row: any,
  rules: Array<{
    when: { field: string; op: string; value: any };
    className: string;
  }>
): string => {
  for (const rule of rules) {
    const { field, op, value } = rule.when;
    const rowValue = row[field];

    let matches = false;
    switch (op) {
      case ">":
        matches = Number(rowValue) > Number(value);
        break;
      case ">=":
        matches = Number(rowValue) >= Number(value);
        break;
      case "<":
        matches = Number(rowValue) < Number(value);
        break;
      case "<=":
        matches = Number(rowValue) <= Number(value);
        break;
      case "=":
      case "==":
        matches = rowValue == value;
        break;
      case "!=":
        matches = rowValue != value;
        break;
      default:
        matches = false;
    }

    if (matches) return rule.className;
  }
  return "";
};

export default function AdvancedTableWidget({
  data,
  display = {},
  formatters = {},
  height = 400,
  title,
  preAggregation,
}: AdvancedTableProps) {
  // Debug logging
  console.log("🔥 AdvancedTableWidget Props:", {
    dataLength: data?.length || 0,
    dataPreview: data?.slice(0, 2) || [],
    display,
    formatters,
    height,
    title,
    preAggregation,
  });

  const aggregatedData = useMemo(() => {
    if (preAggregation && data.length > 0) {
      console.log("🚀 Running pre-aggregation:", preAggregation);
      const result = aggregateBy(
        data,
        preAggregation.groupBy,
        preAggregation.measures
      );
      console.log("✅ Aggregation result:", result.slice(0, 5));
      return result;
    }
    return data;
  }, [data, preAggregation]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: display.pageSize || 25,
  });

  // Calculate dynamic height - เพิ่มความสูงให้เพียงพอ
  const tableContainerHeight = useMemo(() => {
    const headerHeight = 60;
    const paginationHeight = 60;
    const minHeight = 500; // เพิ่มความสูงขั้นต่ำ
    const calculatedHeight = height - headerHeight - paginationHeight;
    return Math.max(minHeight, calculatedHeight);
  }, [height]);

  // Generate columns dynamically
  const columns = useMemo(() => {
    const generatedColumns = generateColumns(
      aggregatedData,
      display,
      formatters
    );
    console.log("🔥 Generated Columns:", generatedColumns);
    return generatedColumns;
  }, [aggregatedData, display, formatters]);

  // Calculate totals if enabled
  const totalsRow = useMemo(() => {
    if (!display.showTotalsRow || !display.totalsAgg) return null;
    return calculateTotalsRow(aggregatedData, display.totalsAgg);
  }, [aggregatedData, display.showTotalsRow, display.totalsAgg]);

  // Initialize table
  const table = useReactTable({
    data: aggregatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
  });

  // Export to Excel function with column groups support
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Get export options from display config
    const exportOptions = display.exportExcelOptions || {};
    const filename =
      exportOptions.filename ||
      `table-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    const worksheetName = exportOptions.worksheetName || "Data";

    // Create worksheet with column groups if available
    let worksheet: XLSX.WorkSheet;

    if (display.columnGroups && display.columnGroups.length > 0) {
      // Create worksheet with custom headers for column groups
      worksheet = createWorksheetWithColumnGroups(
        aggregatedData,
        display.columnGroups,
        display.columnLabels || {},
        display.columnFormatters || {},
        formatters
      );
    } else {
      // Fallback to simple export
      worksheet = XLSX.utils.json_to_sheet(aggregatedData);
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
    XLSX.writeFile(workbook, filename);
  };

  // Helper function to create worksheet with column groups
  const createWorksheetWithColumnGroups = (
    data: any[],
    columnGroups: ColumnGroup[],
    columnLabels: Record<string, string>,
    columnFormatters: Record<string, string>,
    formatters: Record<string, any>
  ): XLSX.WorkSheet => {
    if (data.length === 0) return XLSX.utils.json_to_sheet([]);

    // Prepare header rows
    const groupHeaderRow: string[] = [];
    const columnHeaderRow: string[] = [];
    const columnKeys: string[] = [];

    // Build headers from column groups
    columnGroups.forEach((group) => {
      const groupColumns = group.columns.filter(
        (col) => data.length > 0 && data[0].hasOwnProperty(col)
      );

      if (groupColumns.length > 0) {
        // Add group title spanning multiple columns
        groupHeaderRow.push(group.title);
        // Add empty cells for remaining columns in this group
        for (let i = 1; i < groupColumns.length; i++) {
          groupHeaderRow.push("");
        }

        // Add individual column headers
        groupColumns.forEach((col) => {
          columnHeaderRow.push(columnLabels[col] || col);
          columnKeys.push(col);
        });
      }
    });

    // Create data rows with proper formatting
    const dataRows = data.map((row) => {
      const formattedRow: any[] = [];
      columnKeys.forEach((key) => {
        let value = row[key];

        // Apply formatting if specified
        const formatterKey = columnFormatters[key];
        if (formatterKey && formatters[formatterKey]) {
          const formatter = formatters[formatterKey];
          if (formatter.kind === "number") {
            // For Excel, keep numbers as numbers but format appropriately
            if (typeof value === "number") {
              formattedRow.push(value);
            } else {
              formattedRow.push(parseFloat(value) || 0);
            }
          } else if (formatter.kind === "date") {
            // Convert dates for Excel
            formattedRow.push(value);
          } else {
            formattedRow.push(value);
          }
        } else {
          formattedRow.push(value);
        }
      });
      return formattedRow;
    });

    // Combine all rows
    const allRows = [groupHeaderRow, columnHeaderRow, ...dataRows];

    // Create worksheet from array of arrays
    const worksheet = XLSX.utils.aoa_to_sheet(allRows);

    // Merge cells for group headers
    if (!worksheet["!merges"]) worksheet["!merges"] = [];

    let colIndex = 0;
    columnGroups.forEach((group) => {
      const groupColumns = group.columns.filter(
        (col) => data.length > 0 && data[0].hasOwnProperty(col)
      );

      if (groupColumns.length > 1) {
        // Merge cells for group header (row 0)
        const startCol = XLSX.utils.encode_col(colIndex);
        const endCol = XLSX.utils.encode_col(
          colIndex + groupColumns.length - 1
        );
        worksheet["!merges"].push({
          s: { r: 0, c: colIndex },
          e: { r: 0, c: colIndex + groupColumns.length - 1 },
        });
      }

      colIndex += groupColumns.length;
    });

    // Set column widths based on content
    const columnWidths = columnKeys.map((key) => {
      const maxLength = Math.max(
        (columnLabels[key] || key).length,
        ...data.map((row) => String(row[key] || "").length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet["!cols"] = columnWidths;

    return worksheet;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {display.searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
          )}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div
        className="flex-1 relative border border-gray-300"
        style={{
          minHeight: `${tableContainerHeight}px`,
          maxHeight: `${Math.max(tableContainerHeight, 600)}px`,
          overflow: "hidden", // ป้องกันการล้น
        }}
      >
        {/* Table Wrapper with proper scroll */}
        <div
          className="absolute inset-0 overflow-auto"
          style={{
            overflowX: "auto",
            overflowY: "auto",
          }}
        >
          <table
            className="border-collapse border border-gray-200"
            style={{
              minWidth: "100%",
              width: "max-content", // ให้ table ขยายตามเนื้อหา
            }}
          >
            {/* Headers */}
            <thead className="sticky top-0 z-30 bg-gray-50">
              {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any, index: number) => {
                    const isSticky =
                      display.stickyFirstColumns &&
                      index < display.stickyFirstColumns;

                    // คำนวณ left position สำหรับ sticky columns
                    let leftPosition = 0;
                    if (isSticky) {
                      for (let i = 0; i < index; i++) {
                        leftPosition += 120; // width ของแต่ละ column
                      }
                    }

                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={`
                          border border-gray-200 p-2 text-left font-medium text-gray-700 text-sm bg-gray-50
                          ${isSticky ? "sticky z-40" : ""}
                          ${
                            header.column.getCanSort()
                              ? "cursor-pointer hover:bg-gray-100"
                              : ""
                          }
                        `}
                        style={{
                          ...(isSticky
                            ? {
                                left: `${leftPosition}px`,
                                backgroundColor: "#f9fafb", // เพื่อให้เห็นชัดเจน
                                borderRight: "2px solid #e5e7eb", // เส้นขอบขวาสำหรับ sticky
                              }
                            : {}),
                          minWidth: "120px",
                          width: "120px",
                          maxWidth: "120px",
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {header.column.getCanSort() && (
                            <div className="flex flex-col">
                              <ChevronUp
                                className={`h-3 w-3 ${
                                  header.column.getIsSorted() === "asc"
                                    ? "text-blue-600"
                                    : "text-gray-400"
                                }`}
                              />
                              <ChevronDown
                                className={`h-3 w-3 ${
                                  header.column.getIsSorted() === "desc"
                                    ? "text-blue-600"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center p-8 text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row: any) => {
                  const rowClassName = display.rowClassRules
                    ? evaluateRowClass(row.original, display.rowClassRules)
                    : "";

                  return (
                    <tr
                      key={row.id}
                      className={`border-b hover:bg-gray-50 ${rowClassName}`}
                    >
                      {row.getVisibleCells().map((cell: any, index: number) => {
                        const isSticky =
                          display.stickyFirstColumns &&
                          index < display.stickyFirstColumns;
                        const align =
                          cell.column.columnDef.meta?.align || "left";

                        // คำนวณ left position สำหรับ sticky columns
                        let leftPosition = 0;
                        if (isSticky) {
                          for (let i = 0; i < index; i++) {
                            leftPosition += 120; // width ของแต่ละ column
                          }
                        }

                        return (
                          <td
                            key={cell.id}
                            className={`
                            border border-gray-200 p-2 text-${align} text-sm
                            ${isSticky ? "sticky z-20 bg-white" : ""}
                          `}
                            style={{
                              ...(isSticky
                                ? {
                                    left: `${leftPosition}px`,
                                    backgroundColor: "white",
                                    borderRight: "2px solid #e5e7eb",
                                  }
                                : {}),
                              minWidth: "120px",
                              width: "120px",
                              maxWidth: "120px",
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}

              {/* Totals Row */}
              {totalsRow && (
                <tr className="bg-gray-100 font-semibold">
                  {table.getAllColumns().map((column: any, index: number) => {
                    const isSticky =
                      display.stickyFirstColumns &&
                      index < display.stickyFirstColumns;
                    const value = totalsRow[column.id];
                    const formatter = display.columnFormatters?.[column.id];
                    const formattedValue = formatter
                      ? formatValue(value, formatter, formatters)
                      : value;

                    // คำนวณ left position สำหรับ sticky columns
                    let leftPosition = 0;
                    if (isSticky) {
                      for (let i = 0; i < index; i++) {
                        leftPosition += 120; // width ของแต่ละ column
                      }
                    }

                    return (
                      <td
                        key={column.id}
                        className={`
                        border border-gray-200 p-2 text-sm
                        ${isSticky ? "sticky z-20 bg-gray-100" : ""}
                      `}
                        style={{
                          ...(isSticky
                            ? {
                                left: `${leftPosition}px`,
                                backgroundColor: "#f3f4f6",
                                borderRight: "2px solid #e5e7eb",
                              }
                            : {}),
                          minWidth: "120px",
                          width: "120px",
                          maxWidth: "120px",
                        }}
                      >
                        {index === 0 ? "Total" : formattedValue || ""}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>{" "}
        {/* Close min-w-max wrapper */}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50 flex-shrink-0">
        <div className="text-sm text-gray-600">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} entries
          {/* Debug info */}
          <span className="ml-4 text-xs text-blue-600">
            (Total rows: {aggregatedData.length}, Filtered:{" "}
            {table.getFilteredRowModel().rows.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
