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

      let formatted = num.toFixed(formatterConfig.precision || 0);

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
  if (!data.length) return [];

  const dataKeys = Object.keys(data[0]);
  const columnHelper = createColumnHelper<any>();

  // If columnGroups are defined, create hierarchical structure
  if (display.columnGroups?.length) {
    const columns: ColumnDef<any>[] = [];

    display.columnGroups.forEach((group) => {
      if (group.columns.length === 1) {
        // Single column - no group header
        const field = group.columns[0];
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
        // Multiple columns - create group
        columns.push(
          columnHelper.group({
            id: `group_${group.title.replace(/\s+/g, "_").toLowerCase()}`, // Explicit group ID
            header: group.title,
            columns: group.columns.map((field) =>
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
                  className: display.rowClassRules ? "dynamic-cell" : undefined,
                },
              })
            ),
          })
        );
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
}: AdvancedTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: display.pageSize || 25,
  });

  // Generate columns dynamically
  const columns = useMemo(() => {
    return generateColumns(data, display, formatters);
  }, [data, display, formatters]);

  // Calculate totals if enabled
  const totalsRow = useMemo(() => {
    if (!display.showTotalsRow || !display.totalsAgg) return null;
    return calculateTotalsRow(data, display.totalsAgg);
  }, [data, display.showTotalsRow, display.totalsAgg]);

  // Initialize table
  const table = useReactTable({
    data,
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

  // Export to Excel function
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const filename =
      display.exportFilename ||
      `table-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
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
        className={`flex-1 overflow-auto ${display.horizontalScroll ? "overflow-x-auto" : ""}`}
        style={{ maxHeight: height - 120 }}
      >
        <table className="w-full border-collapse border border-gray-200">
          {/* Headers */}
          <thead className={display.stickyHeader ? "sticky top-0 z-10" : ""}>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <tr key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map((header: any, index: number) => {
                  const isSticky =
                    display.stickyFirstColumns &&
                    index < display.stickyFirstColumns;
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`
                        border border-gray-200 p-3 text-left font-medium text-gray-700
                        ${isSticky ? "sticky left-0 z-20 bg-gray-50" : ""}
                        ${header.column.getCanSort() ? "cursor-pointer hover:bg-gray-100" : ""}
                      `}
                      style={isSticky ? { left: index * 150 } : {}}
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
            {table.getRowModel().rows.map((row: any) => {
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
                    const align = cell.column.columnDef.meta?.align || "left";

                    return (
                      <td
                        key={cell.id}
                        className={`
                          border border-gray-200 p-3 text-${align}
                          ${isSticky ? "sticky left-0 z-10 bg-white" : ""}
                        `}
                        style={isSticky ? { left: index * 150 } : {}}
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
            })}

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

                  return (
                    <td
                      key={column.id}
                      className={`
                        border border-gray-200 p-3
                        ${isSticky ? "sticky left-0 z-10 bg-gray-100" : ""}
                      `}
                      style={isSticky ? { left: index * 150 } : {}}
                    >
                      {index === 0 ? "Total" : formattedValue || ""}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
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
