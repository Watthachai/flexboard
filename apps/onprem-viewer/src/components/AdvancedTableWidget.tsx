/**
 * Advanced Table Widget with Dynamic Column Groups Support
 * Supports TanStack Table with hierarchical headers and dynamic configuration
 */

"use client";

import React, { useMemo, useState } from "react";
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
import { ChevronUp, ChevronDown, Download, Search, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { aggregateBy } from "../utils/aggregate";
import {
  formatMoney,
  isMoneyField,
  EXCEL_MONEY_FORMAT,
} from "../utils/numberFormat";

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
  console.log("🔧 formatValue called:", { value, formatter, formatters });

  if (value == null) return "";

  const formatterConfig = formatters[formatter];
  console.log("📝 formatterConfig:", formatterConfig);

  if (!formatterConfig) {
    console.log("❌ No formatter config found for:", formatter);
    return String(value);
  }

  switch (formatterConfig.kind) {
    case "number":
      console.log("🔢 Number formatting:", { value, formatterConfig });
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

      if (formatterConfig.thousandsSep !== false) {
        // ใช้ comma เป็น default สำหรับการคั่นหลักพัน
        const separator = formatterConfig.thousandsSep || ",";
        const parts = formatted.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        formatted = parts.join(".");
      }

      if (formatterConfig.prefix)
        formatted = formatterConfig.prefix + formatted;
      if (formatterConfig.suffix)
        formatted = formatted + formatterConfig.suffix;

      console.log("✅ Number formatted result:", formatted);
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
                const formatterKey = display.columnFormatters?.[field];

                console.log(`🔍 Format Debug [${field}]:`, {
                  value,
                  formatterKey,
                  availableFormatters: Object.keys(formatters),
                  isMoneyField: isMoneyField(field),
                });

                // Use formatter from config first, then fallback to auto-format
                if (formatterKey) {
                  const formatted = formatValue(
                    value,
                    formatterKey,
                    formatters
                  );
                  console.log(
                    `✅ Formatted [${field}] with "${formatterKey}":`,
                    value,
                    "→",
                    formatted
                  );
                  return formatted;
                } // Fallback: auto-format money columns if no explicit formatter
                if (isMoneyField(field)) {
                  const formatted = formatMoney(value);
                  console.log(
                    `🔄 Auto-formatted [${field}]:`,
                    value,
                    "→",
                    formatted
                  );
                  return formatted;
                }

                console.log(`➡️ No formatting [${field}]:`, value);
                return value;
              },
              meta: {
                align:
                  display.columnAlignment?.[field] ||
                  (isMoneyField(field) ? "right" : "left"),
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
                    const formatterKey = display.columnFormatters?.[field];

                    console.log(`🔍 Group Format Debug [${field}]:`, {
                      value,
                      formatterKey,
                      availableFormatters: Object.keys(formatters),
                      isMoneyField: isMoneyField(field),
                    });

                    // Use formatter from config first, then fallback to auto-format
                    if (formatterKey) {
                      const formatted = formatValue(
                        value,
                        formatterKey,
                        formatters
                      );
                      console.log(
                        `✅ Group Formatted [${field}] with "${formatterKey}":`,
                        value,
                        "→",
                        formatted
                      );
                      return formatted;
                    } // Fallback: auto-format money columns if no explicit formatter
                    if (isMoneyField(field)) {
                      const formatted = formatMoney(value);
                      console.log(
                        `🔄 Group Auto-formatted [${field}]:`,
                        value,
                        "→",
                        formatted
                      );
                      return formatted;
                    }

                    console.log(`➡️ Group No formatting [${field}]:`, value);
                    return value;
                  },
                  meta: {
                    align:
                      display.columnAlignment?.[field] ||
                      (isMoneyField(field) ? "right" : "left"),
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
          const formatterKey = display.columnFormatters?.[field];

          console.log(`🔍 Flat Format Debug [${field}]:`, {
            value,
            formatterKey,
            availableFormatters: Object.keys(formatters),
            isMoneyField: isMoneyField(field),
          });

          // Use formatter from config first, then fallback to auto-format
          if (formatterKey) {
            const formatted = formatValue(value, formatterKey, formatters);
            console.log(
              `✅ Flat Formatted [${field}] with "${formatterKey}":`,
              value,
              "→",
              formatted
            );
            return formatted;
          }

          // Fallback: auto-format money columns if no explicit formatter
          if (isMoneyField(field)) {
            const formatted = formatMoney(value);
            console.log(
              `🔄 Flat Auto-formatted [${field}]:`,
              value,
              "→",
              formatted
            );
            return formatted;
          }

          console.log(`➡️ Flat No formatting [${field}]:`, value);
          return value;
        },
        meta: {
          align:
            display.columnAlignment?.[field] ||
            (isMoneyField(field) ? "right" : "left"),
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
  // 🔧 Temporary hardcoded formatters as fallback
  const fallbackFormatters = {
    money: {
      kind: "number",
      precision: 2,
      thousandsSep: ",",
      prefix: "฿",
      roundingMode: "round",
    },
    qty: {
      kind: "number",
      precision: 0,
      thousandsSep: ",",
      roundingMode: "round",
    },
    unitCost: {
      kind: "number",
      precision: 6,
      thousandsSep: ",",
      prefix: "฿",
      roundingMode: "round",
    },
    days: {
      kind: "number",
      precision: 0,
      roundingMode: "round",
    },
    date: {
      kind: "date",
      timezone: "Asia/Bangkok",
      pattern: "dd MMM yyyy",
    },
  };

  // Merge provided formatters with fallback
  const mergedFormatters = { ...fallbackFormatters, ...formatters };

  // Debug logging
  console.log("🔥 AdvancedTableWidget Props:", {
    dataLength: data?.length || 0,
    dataPreview: data?.slice(0, 2) || [],
    display,
    originalFormatters: formatters,
    fallbackFormatters,
    mergedFormatters,
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
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: display.pageSize || 25,
  });

  // Calculate dynamic height - เพิ่มความสูงให้เพียงพอ
  const tableContainerHeight = useMemo(() => {
    const headerHeight = 60;
    const paginationHeight = 60;
    const filterHeight = 60; // เพิ่ม space สำหรับ filters
    const minHeight = 500; // เพิ่มความสูงขั้นต่ำ
    const calculatedHeight =
      height - headerHeight - paginationHeight - filterHeight;
    return Math.max(minHeight, calculatedHeight);
  }, [height]);

  // Extract unique values for filters
  const getUniqueValues = (field: string) => {
    const values = aggregatedData.map((row) => row[field]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Apply column filters to data
  const filteredData = useMemo(() => {
    console.log("🔍 Filter Debug:", {
      originalDataCount: aggregatedData.length,
      columnFilters,
      hasFilters: Object.keys(columnFilters).length > 0,
    });

    if (Object.keys(columnFilters).length === 0) {
      console.log("📊 No filters applied, returning all data");
      return aggregatedData;
    }

    const filtered = aggregatedData.filter((row) => {
      return Object.entries(columnFilters).every(([field, filterValue]) => {
        if (!filterValue) return true;

        console.log(
          `🔎 Checking filter: ${field} = ${filterValue} for row:`,
          row[field]
        );

        // Special handling for month filter
        if (field === "documentMonth") {
          const month = parseInt(filterValue);
          const docDate = row["Document Date"] || row["Data Date"];
          if (docDate) {
            const date = new Date(docDate);
            const matches = date.getMonth() + 1 === month;
            console.log(
              `📅 Month filter: ${month}, row date: ${docDate}, matches: ${matches}`
            );
            return matches;
          }
          return false;
        }

        // Regular text filtering - exact match สำหรับ dropdown
        const cellValue = String(row[field] || "");
        const matches = cellValue === filterValue;
        console.log(
          `🏢 Text filter: "${filterValue}" vs "${cellValue}", matches: ${matches}`
        );
        return matches;
      });
    });

    console.log(
      `✅ Filtered result: ${filtered.length} rows from ${aggregatedData.length}`
    );
    return filtered;
  }, [aggregatedData, columnFilters]);

  // Generate columns dynamically
  const columns = useMemo(() => {
    const generatedColumns = generateColumns(
      filteredData,
      display,
      mergedFormatters
    );
    console.log("🔥 Generated Columns:", generatedColumns);
    return generatedColumns;
  }, [filteredData, display, mergedFormatters]);

  // Calculate totals if enabled
  const totalsRow = useMemo(() => {
    if (!display.showTotalsRow || !display.totalsAgg) return null;
    return calculateTotalsRow(filteredData, display.totalsAgg);
  }, [filteredData, display.showTotalsRow, display.totalsAgg]);

  // Initialize table
  const table = useReactTable({
    data: filteredData,
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

  // Export to Excel function with column groups support and 6-month filter
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Get export options from display config
    const exportOptions =
      (
        display as {
          exportExcelOptions?: { filename?: string; worksheetName?: string };
        }
      ).exportExcelOptions || {};
    const filename =
      exportOptions.filename ||
      `inventory-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    const worksheetName = exportOptions.worksheetName || "Filtered Data";

    // Export ALL data (ข้อมูลทั้งหมดไม่จำกัดด้วย pagination)
    const allData = aggregatedData; // ใช้ข้อมูลทั้งหมดที่ผ่าน aggregation แล้ว
    const currentFilteredData = globalFilter
      ? allData.filter((row) =>
          Object.values(row).some((value) =>
            String(value).toLowerCase().includes(globalFilter.toLowerCase())
          )
        )
      : allData;

    console.log(
      `📊 Exporting ${currentFilteredData.length} rows (from ${allData.length} total) - ALL DATA EXPORT`
    );

    // Create worksheet with column groups if available
    let worksheet: XLSX.WorkSheet;

    if (display.columnGroups && display.columnGroups.length > 0) {
      // Create worksheet with custom headers for column groups
      worksheet = createWorksheetWithColumnGroups(
        currentFilteredData,
        display.columnGroups,
        display.columnLabels || {},
        display.columnFormatters || {},
        mergedFormatters
      );
    } else {
      // Fallback to simple export
      worksheet = XLSX.utils.json_to_sheet(currentFilteredData);
    }

    // Add the filtered data worksheet
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    // Add raw data worksheet with ALL original data
    console.log(`📋 Adding raw data worksheet with ${data.length} total rows`);
    const rawDataWorksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(
      workbook,
      rawDataWorksheet,
      `Raw Data (${data.length} rows)`
    );

    // Force .xlsx extension
    const finalFilename = filename.endsWith(".xlsx")
      ? filename
      : filename + ".xlsx";

    // Export with proper MIME type
    XLSX.writeFile(workbook, finalFilename, {
      bookType: "xlsx",
      type: "binary",
    });
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
          // Special handling for Total Value and Value columns (accounting format)
          if (
            key === "Total Value" ||
            key === "Value" ||
            key.toLowerCase().includes("value")
          ) {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              formattedRow.push(numValue);
            } else {
              formattedRow.push(value);
            }
          } else {
            formattedRow.push(value);
          }
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

    // Style the header rows (make them bold with yellow background)
    const headerCells = [];

    // Style group header row (row 0)
    for (let col = 0; col < groupHeaderRow.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      headerCells.push(cellAddress);
      // Apply yellow background and bold formatting
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
        font: { bold: true }, // Bold text
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // Style column header row (row 1)
    for (let col = 0; col < columnHeaderRow.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
      if (!worksheet[cellAddress]) continue;
      headerCells.push(cellAddress);
      // Apply yellow background and bold formatting
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
        font: { bold: true }, // Bold text
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // Add number formatting for currency/number columns
    columnKeys.forEach((key, colIndex) => {
      const formatterKey = columnFormatters[key];
      if (formatterKey && formatters[formatterKey]) {
        const formatter = formatters[formatterKey];
        if (formatter.kind === "number") {
          // Apply number format with thousand separator
          for (let rowIndex = 2; rowIndex < allRows.length; rowIndex++) {
            const cellAddress = XLSX.utils.encode_cell({
              r: rowIndex,
              c: colIndex,
            });
            if (
              worksheet[cellAddress] &&
              typeof worksheet[cellAddress].v === "number"
            ) {
              worksheet[cellAddress].z = "#,##0.00"; // Number format with comma separator and 2 decimals
            }
          }
        }
      } else if (isMoneyField(key)) {
        // Auto-format money columns even without explicit formatter
        for (let rowIndex = 2; rowIndex < allRows.length; rowIndex++) {
          const cellAddress = XLSX.utils.encode_cell({
            r: rowIndex,
            c: colIndex,
          });
          if (
            worksheet[cellAddress] &&
            typeof worksheet[cellAddress].v === "number"
          ) {
            // Use accounting format with currency symbol
            worksheet[cellAddress].z = EXCEL_MONEY_FORMAT;
            // Also add right alignment for numbers
            if (!worksheet[cellAddress].s) {
              worksheet[cellAddress].s = {};
            }
            worksheet[cellAddress].s.alignment = { horizontal: "right" };
          }
        }
      }
    });

    return worksheet;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0 transition-colors duration-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            📊 Total: {data.length} records | Displayed: {filteredData.length}{" "}
            rows
            {globalFilter &&
              ` | Search: ${table.getFilteredRowModel().rows.length}`}
            {Object.keys(columnFilters).length > 0 &&
              ` | Filtered: ${filteredData.length}`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Global Search */}
          {display.searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search all fields..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          )}

          {/* Company Filter - ปรับปรุงให้ดูชัดเจนขึ้น */}
          {(data.some((row) => row["บริษัท"]) ||
            data.some((row) => row["Company"])) && (
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
              <select
                value={
                  columnFilters["บริษัท"] || columnFilters["Company"] || ""
                }
                onChange={(e) => {
                  const field = data.some((row) => row["บริษัท"])
                    ? "บริษัท"
                    : "Company";
                  setColumnFilters((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }));
                }}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all duration-200"
              >
                <option value="">
                  🏢 All Companies (
                  {
                    getUniqueValues(
                      data.some((row) => row["บริษัท"]) ? "บริษัท" : "Company"
                    ).length
                  }
                  )
                </option>
                {getUniqueValues(
                  data.some((row) => row["บริษัท"]) ? "บริษัท" : "Company"
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Product Filter - เพิ่ม filter สำหรับสินค้า */}
          {(data.some((row) => row["สินค้า"]) ||
            data.some((row) => row["Product"])) && (
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
              <select
                value={
                  columnFilters["สินค้า"] || columnFilters["Product"] || ""
                }
                onChange={(e) => {
                  const field = data.some((row) => row["สินค้า"])
                    ? "สินค้า"
                    : "Product";
                  setColumnFilters((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }));
                }}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all duration-200"
              >
                <option value="">
                  📦 All Products (
                  {
                    getUniqueValues(
                      data.some((row) => row["สินค้า"]) ? "สินค้า" : "Product"
                    ).length
                  }
                  )
                </option>
                {getUniqueValues(
                  data.some((row) => row["สินค้า"]) ? "สินค้า" : "Product"
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date/Month Filter */}
          {(data.some((row) => row["Document Date"]) ||
            data.some((row) => row["Data Date"])) && (
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
              <select
                value={columnFilters["documentMonth"] || ""}
                onChange={(e) => {
                  setColumnFilters((prev) => ({
                    ...prev,
                    documentMonth: e.target.value,
                  }));
                }}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all duration-200"
              >
                <option value="">📅 All Months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = new Date(2024, i).toLocaleDateString("en-US", {
                    month: "long",
                  });
                  return (
                    <option key={i} value={i + 1}>
                      {month}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Clear Filters Button */}
          {(Object.keys(columnFilters).length > 0 || globalFilter) && (
            <button
              onClick={() => {
                setColumnFilters({});
                setGlobalFilter("");
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-300 rounded-lg transition-all duration-200"
              title="Clear all filters"
            >
              ✕ Clear
            </button>
          )}

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            title="Export to Excel with all data sheets"
          >
            <Download className="h-4 w-4" />
            Export Excel ({filteredData.length}/{data.length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div
        className="flex-1 relative border border-gray-300 dark:border-gray-600 transition-colors duration-200"
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
            className="border-collapse border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 transition-colors duration-200"
            style={{
              minWidth: "100%",
              width: "max-content", // ให้ table ขยายตามเนื้อหา
              tableLayout: "auto", // ให้ browser คำนวณความกว้างอัตโนมัติ
            }}
          >
            {/* Headers */}
            <thead className="sticky top-0 z-30 bg-yellow-100 dark:bg-yellow-900">
              {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => {
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={`
                          border border-gray-200 dark:border-gray-600 p-2 text-left font-bold text-gray-800 dark:text-gray-200 text-sm bg-yellow-100 dark:bg-yellow-900 transition-colors duration-200
                          ${
                            header.column.getCanSort()
                              ? "cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800"
                              : ""
                          }
                        `}
                        style={{
                          minWidth: "120px",
                          width: "auto",
                          whiteSpace: "nowrap",
                          verticalAlign: "middle",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
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

              {/* Filter Row ใต้ header (Dropdown ต่อคอลัมน์) */}
              <tr className="bg-gray-50 dark:bg-gray-700">
                {table.getAllLeafColumns().map((column: any) => {
                  const columnId = column.id as string;

                  // เลือกว่าจะให้คอลัมน์ไหนมี dropdown filter บ้าง
                  // ถ้าไม่กำหนด จะเปิดให้ทุกคอลัมน์ที่มี unique values ไม่เยอะ
                  const filterableWhitelist = new Set<string>([
                    "Corp",
                    "บริษัท",
                    "Company",
                    "Prod",
                    "สินค้า",
                    "Product",
                    "Branch",
                    "สาขา",
                    "documentMonth", // สำหรับกรองตามเดือน (จาก Document Date/Data Date)
                  ]);

                  // ถ้าคุณอยาก "เปิดทุกคอลัมน์" ให้คอมเมนต์บรรทัด isFilterableColumn ด้านล่าง แล้วตั้งเป็น true
                  const isFilterableColumn =
                    filterableWhitelist.has(columnId) ||
                    // เปิดออโต้เมื่อจำนวนค่าซ้ำไม่เกิน 300 (กัน dropdown ยาวเกิน)
                    (new Set(
                      aggregatedData
                        .map((r) => r[columnId])
                        .filter(
                          (v) => v !== undefined && v !== null && v !== ""
                        )
                    ).size <= 300 &&
                      // ไม่เปิดกับคอลัมน์ตัวเลขยาว/amount/price โดยดีฟอลต์ และไม่เปิดกับ money fields
                      !isMoneyField(columnId));

                  if (!isFilterableColumn) {
                    return (
                      <th
                        key={`filter-${columnId}`}
                        className="border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700"
                        style={{ minWidth: "120px" }}
                      >
                        <div className="h-6" />
                      </th>
                    );
                  }

                  // กรณีพิเศษ: documentMonth (กรองเดือนจาก Document Date / Data Date)
                  if (columnId === "documentMonth") {
                    return (
                      <th
                        key={`filter-${columnId}`}
                        className="border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700"
                        style={{ minWidth: "140px" }}
                      >
                        <select
                          value={columnFilters["documentMonth"] || ""}
                          onChange={(e) =>
                            setColumnFilters((prev) => ({
                              ...prev,
                              documentMonth: e.target.value,
                            }))
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">📅 All Months</option>
                          {Array.from({ length: 12 }, (_, i) => {
                            const label = new Date(2024, i).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                              }
                            );
                            return (
                              <option key={i + 1} value={i + 1}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </th>
                    );
                  }

                  // ค่าไม่ซ้ำทั้งหมดจาก "ข้อมูลหลัง aggregation" (ให้ dropdown เห็นทุกตัวเลือก)
                  const uniq = Array.from(
                    new Set(
                      aggregatedData
                        .map((r) => r[columnId])
                        .filter(
                          (v) => v !== undefined && v !== null && v !== ""
                        )
                    )
                  )
                    .map((v) => String(v))
                    .sort((a, b) =>
                      a.localeCompare(b, undefined, { numeric: true })
                    );

                  return (
                    <th
                      key={`filter-${columnId}`}
                      className="border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700"
                      style={{ minWidth: "140px" }}
                    >
                      <select
                        value={columnFilters[columnId] || ""}
                        onChange={(e) =>
                          setColumnFilters((prev) => ({
                            ...prev,
                            [columnId]: e.target.value,
                          }))
                        }
                        className="w-full pl-2 pr-6 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All</option>
                        {uniq.slice(0, 500).map((value) => (
                          <option key={value} value={value}>
                            {value.length > 40
                              ? value.slice(0, 37) + "..."
                              : value}
                          </option>
                        ))}
                      </select>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center p-8 text-gray-500 dark:text-gray-400"
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
                      className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${rowClassName}`}
                    >
                      {row.getVisibleCells().map((cell: any) => {
                        const align =
                          cell.column.columnDef.meta?.align || "left";

                        return (
                          <td
                            key={cell.id}
                            className={`border border-gray-200 dark:border-gray-600 p-2 text-${align} text-sm text-gray-900 dark:text-gray-100 transition-colors duration-200`}
                            style={{
                              minWidth: "120px",
                              width: "auto",
                              whiteSpace: "nowrap",
                              verticalAlign: "top",
                              padding: "8px 12px",
                              lineHeight: "1.4",
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

              {/* Totals Row - Only show if enabled AND has data */}
              {totalsRow && display.showTotalsRow && (
                <tr className="bg-gray-100 dark:bg-gray-700 font-semibold transition-colors duration-200">
                  {table.getAllColumns().map((column: any, index: number) => {
                    const value = totalsRow[column.id];
                    const formatterKey = display.columnFormatters?.[column.id];
                    let formattedValue = value;

                    // Apply formatter or auto-format money columns
                    if (formatterKey) {
                      formattedValue = formatValue(
                        value,
                        formatterKey,
                        mergedFormatters
                      );
                    } else if (isMoneyField(column.id)) {
                      formattedValue = formatMoney(value);
                    }

                    return (
                      <td
                        key={column.id}
                        className="border border-gray-200 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100 transition-colors duration-200"
                        style={{
                          minWidth: "120px",
                          width: "auto",
                          whiteSpace: "nowrap",
                          verticalAlign: "top",
                          padding: "8px 12px",
                          lineHeight: "1.4",
                          textAlign:
                            display.columnAlignment?.[column.id] ||
                            (isMoneyField(column.id) ? "right" : "left"),
                        }}
                      >
                        {index === 0
                          ? "Total"
                          : formattedValue !== undefined &&
                            formattedValue !== null &&
                            formattedValue !== 0
                          ? formattedValue
                          : ""}
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
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0 transition-colors duration-200">
        <div className="text-sm text-gray-600 dark:text-gray-400">
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
          <span className="ml-4 text-xs text-blue-600 dark:text-blue-400">
            (Total rows: {filteredData.length}, Filtered:{" "}
            {table.getFilteredRowModel().rows.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Previous
          </button>

          <span className="text-sm text-gray-900 dark:text-gray-100">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
