"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import { useTheme } from "@/app/components/context/ThemeContext";
import * as XLSX from "xlsx";
import {
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Zap,
  XCircle,
  TrendingUp,
  FileText,
  Database,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Download,
} from "lucide-react";
interface DatabaseRecord {
  id: number;
  corp: string;
  branch: string;
  prod: string;
  unitName: string;
  docDate: string;
  dataDate: string;
  qtyFromThisDoc: number;
  averageCost: number;
  totalValueRow: number;
  daysAge: number;
  ageBucket: string;
  qtySafe: number;
  costSafe: number;
}

interface DatabaseStats {
  totalRecords: number;
  totalValue: number;
  uniqueCorps: number;
  uniqueBranches: number;
  uniqueProducts: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  ageBucketSummary: Record<string, number>;
}

interface ProductAgeBucketSummary {
  prod: string;
  unitName: string;
  corp: string;
  branch: string;
  totalQty: number;
  totalValue: number;
  ageBuckets: {
    "0-90": { qty: number; value: number };
    "90-180": { qty: number; value: number };
    "180-360": { qty: number; value: number };
    ">360": { qty: number; value: number };
  };
}

export default function PVSDashboard() {
  const {} = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DatabaseRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DatabaseRecord[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [productSummary, setProductSummary] = useState<
    ProductAgeBucketSummary[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  // Filter states
  const [selectedCorp, setSelectedCorp] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Available filter options
  const [corps, setCorps] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);

  // Pagination states
  const [productPage, setProductPage] = useState(1);
  const [rawDataPage, setRawDataPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const RAW_DATA_PER_PAGE = 100;

  const fetchDatabaseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ALL data from our API
      const response = await fetch("/api/inventory/raw?noPagination=true");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Database response:", result);
      console.log(
        `Fetched ${result.rows?.length || 0} records out of ${
          result.totalRecords || 0
        } total`
      );

      if (result.success && result.rows) {
        setData(result.rows);

        // Extract unique values for filters
        const uniqueCorps = [
          ...new Set(result.rows.map((r: DatabaseRecord) => r.corp)),
        ]
          .filter(Boolean)
          .sort() as string[];
        const uniqueBranches = [
          ...new Set(result.rows.map((r: DatabaseRecord) => r.branch)),
        ]
          .filter(Boolean)
          .sort() as string[];
        setCorps(uniqueCorps);
        setBranches(uniqueBranches);

        // Apply initial filtering
        // No need to call applyFilters here since useEffect will handle it
      } else {
        throw new Error(
          result.error ||
            `No data received. Response: ${JSON.stringify(result)}`
        );
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatabaseData();
  }, [fetchDatabaseData]);

  const applyFilters = useCallback(
    (records: DatabaseRecord[]) => {
      let filtered = records;

      // Apply corp filter
      if (selectedCorp) {
        filtered = filtered.filter((r) => r.corp === selectedCorp);
      }

      // Apply branch filter
      if (selectedBranch) {
        filtered = filtered.filter((r) => r.branch === selectedBranch);
      }

      // Apply date range filter
      if (dateFrom || dateTo) {
        filtered = filtered.filter((r) => {
          const recordDate = new Date(r.dataDate);
          const fromDate = dateFrom ? new Date(dateFrom) : null;
          const toDate = dateTo ? new Date(dateTo) : null;

          if (fromDate && recordDate < fromDate) return false;
          if (toDate && recordDate > toDate) return false;
          return true;
        });
      }

      setFilteredData(filtered);
      calculateStats(filtered);
      calculateProductSummary(filtered);
    },
    [selectedCorp, selectedBranch, dateFrom, dateTo]
  );

  const calculateProductSummary = (records: DatabaseRecord[]) => {
    const productMap = new Map<string, ProductAgeBucketSummary>();

    records.forEach((record) => {
      const key = `${record.prod}_${record.corp}_${record.branch}`;

      if (!productMap.has(key)) {
        productMap.set(key, {
          prod: record.prod,
          unitName: record.unitName,
          corp: record.corp,
          branch: record.branch,
          totalQty: 0,
          totalValue: 0,
          ageBuckets: {
            "0-90": { qty: 0, value: 0 },
            "90-180": { qty: 0, value: 0 },
            "180-360": { qty: 0, value: 0 },
            ">360": { qty: 0, value: 0 },
          },
        });
      }

      const summary = productMap.get(key)!;
      const qty = record.qtyFromThisDoc || 0;
      const value = record.totalValueRow || 0;

      summary.totalQty += qty;
      summary.totalValue += value;

      // Map ageBucket to our defined buckets
      let bucketKey: keyof typeof summary.ageBuckets;
      if (record.ageBucket === "0-90") bucketKey = "0-90";
      else if (record.ageBucket === "91-180")
        bucketKey = "90-180"; // Map "91-180" -> "90-180" for display
      else if (record.ageBucket === "181-365")
        bucketKey = "180-360"; // Map "181-365" -> "180-360" for display
      else bucketKey = ">360"; // For '>365', '>360', or any other values

      summary.ageBuckets[bucketKey].qty += qty;
      summary.ageBuckets[bucketKey].value += value;
    });

    const summaryArray = Array.from(productMap.values()).sort(
      (a, b) => b.totalValue - a.totalValue
    );
    setProductSummary(summaryArray);
  };

  // Apply filters when filter values change
  useEffect(() => {
    if (data.length > 0) {
      applyFilters(data);
      // Reset pagination when filters change
      setProductPage(1);
      setRawDataPage(1);
    }
  }, [selectedCorp, selectedBranch, dateFrom, dateTo, data, applyFilters]);

  // Reset pagination when data changes
  useEffect(() => {
    setProductPage(1);
    setRawDataPage(1);
  }, [productSummary.length, filteredData.length]);

  const calculateStats = (records: DatabaseRecord[]) => {
    if (!records || records.length === 0) {
      setStats(null);
      return;
    }

    const corps = new Set(records.map((r) => r.corp));
    const branches = new Set(records.map((r) => r.branch));
    const products = new Set(records.map((r) => r.prod));

    const totalValue = records.reduce(
      (sum, r) => sum + (r.totalValueRow || 0),
      0
    );

    const dates = records
      .map((r) => r.dataDate)
      .filter(Boolean)
      .sort();

    const ageBuckets: Record<string, number> = {};
    records.forEach((r) => {
      if (r.ageBucket) {
        ageBuckets[r.ageBucket] = (ageBuckets[r.ageBucket] || 0) + 1;
      }
    });

    setStats({
      totalRecords: records.length,
      totalValue,
      uniqueCorps: corps.size,
      uniqueBranches: branches.size,
      uniqueProducts: products.size,
      dateRange: {
        earliest: dates[0] || "N/A",
        latest: dates[dates.length - 1] || "N/A",
      },
      ageBucketSummary: ageBuckets,
    });
  };

  // Calculate age bucket values for KPI cards
  const getAgeBucketValues = () => {
    if (!filteredData.length)
      return {
        fresh: 0,
        aging: 0,
        risk: 0,
        old: 0,
      };

    const values = {
      fresh: 0, // 0-90 days
      aging: 0, // 91-180 days
      risk: 0, // 181-365 days
      old: 0, // >365 days
    };

    console.log("=== Age Bucket Debug ===");
    const bucketCounts: Record<string, number> = {};

    filteredData.forEach((record) => {
      const value = record.totalValueRow || 0;
      const bucket = record.ageBucket;

      // Count unique buckets for debugging
      bucketCounts[bucket] = (bucketCounts[bucket] || 0) + 1;

      if (bucket === "0-90") values.fresh += value;
      else if (bucket === "91-180")
        values.aging += value; // แก้จาก "90-180" เป็น "91-180"
      else if (bucket === "181-365")
        values.risk += value; // แก้จาก "180-360" เป็น "181-365"
      else if (bucket === ">365" || bucket === ">360" || bucket === "365+")
        values.old += value;
      else {
        // Handle any unexpected bucket names
        console.log(`Unknown ageBucket: "${bucket}" - adding to old stock`);
        values.old += value;
      }
    });

    console.log("Unique ageBuckets found:", Object.keys(bucketCounts));
    console.log("Bucket counts:", bucketCounts);
    console.log("Calculated values:", values);
    console.log("======================");

    return values;
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Export to Excel function with proper XLSX format and styling
  const exportToExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create worksheet data with proper structure
      const wsData: (string | number)[][] = [];

      // Add main header row with groupings (Row 1)
      wsData.push([
        "Product Info",
        "",
        "",
        "",
        "Total",
        "",
        "0-90 Days",
        "",
        "91-180 Days",
        "",
        "181-365 Days",
        "",
        "Over 365 Days",
        "",
      ]);

      // Add sub header row (Row 2)
      wsData.push([
        "สินค้า",
        "หน่วย",
        "",
        "",
        "Quantity",
        "Total Value",
        "Quantity",
        "Value",
        "Quantity",
        "Value",
        "Quantity",
        "Value",
        "Quantity",
        "Value",
      ]);

      // Add data rows
      productSummary.forEach((product) => {
        wsData.push([
          product.prod,
          product.unitName,
          "", // Empty columns for alignment
          "",
          product.totalQty,
          product.totalValue,
          product.ageBuckets["0-90"].qty,
          product.ageBuckets["0-90"].value,
          product.ageBuckets["90-180"].qty,
          product.ageBuckets["90-180"].value,
          product.ageBuckets["180-360"].qty,
          product.ageBuckets["180-360"].value,
          product.ageBuckets[">360"].qty,
          product.ageBuckets[">360"].value,
        ]);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws["!cols"] = [
        { wch: 50 }, // Product name - wider
        { wch: 10 }, // Unit
        { wch: 8 }, // Empty
        { wch: 8 }, // Empty
        { wch: 12 }, // Total Quantity
        { wch: 15 }, // Total Value
        { wch: 12 }, // 0-90 Quantity
        { wch: 15 }, // 0-90 Value
        { wch: 12 }, // 91-180 Quantity
        { wch: 15 }, // 91-180 Value
        { wch: 12 }, // 181-365 Quantity
        { wch: 15 }, // 181-365 Value
        { wch: 12 }, // >365 Quantity
        { wch: 15 }, // >365 Value
      ];

      // Define merges for grouped headers
      ws["!merges"] = [
        // Product Info group (A1:D1)
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        // Total group (E1:F1)
        { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } },
        // 0-90 Days group (G1:H1)
        { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } },
        // 91-180 Days group (I1:J1)
        { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } },
        // 181-365 Days group (K1:L1)
        { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } },
        // Over 365 Days group (M1:N1)
        { s: { r: 0, c: 12 }, e: { r: 0, c: 13 } },
      ];

      // Apply styles to cells
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          // Header row styling (Row 1)
          if (R === 0) {
            ws[cellAddress].s = {
              font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
              fill: { fgColor: { rgb: "4472C4" } }, // Blue background
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
          // Sub header row styling (Row 2)
          else if (R === 1) {
            ws[cellAddress].s = {
              font: { bold: true, sz: 11 },
              fill: { fgColor: { rgb: "D9E2F3" } }, // Light blue background
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
          // Data rows
          else {
            let fillColor = "FFFFFF"; // Default white

            // Apply age bucket colors
            if (C >= 6 && C <= 7) {
              // 0-90 days - Light green
              fillColor = "E2EFDA";
            } else if (C >= 8 && C <= 9) {
              // 91-180 days - Light yellow
              fillColor = "FFF2CC";
            } else if (C >= 10 && C <= 11) {
              // 181-365 days - Light orange
              fillColor = "FCE4D6";
            } else if (C >= 12 && C <= 13) {
              // Over 365 days - Light red
              fillColor = "FFEBE9";
            }

            ws[cellAddress].s = {
              font: { sz: 10 },
              fill: { fgColor: { rgb: fillColor } },
              alignment: {
                horizontal: C >= 4 ? "right" : "left",
                vertical: "center",
              },
              border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } },
              },
            };

            // Format numbers
            if (typeof ws[cellAddress].v === "number" && C >= 4) {
              if (C % 2 === 1) {
                // Value columns (odd indices after column 4)
                ws[cellAddress].z = "#,##0.00"; // Number format with 2 decimals
              } else {
                // Quantity columns
                ws[cellAddress].z = "#,##0"; // Number format without decimals
              }
            }
          }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "PVS Summary");

      // Generate filename with current date and filter info
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      let filename = `PVS_Summary_${dateStr}`;

      if (selectedCorp) filename += `_${selectedCorp}`;
      if (selectedBranch) filename += `_${selectedBranch}`;
      if (dateFrom || dateTo) {
        filename += "_";
        if (dateFrom) filename += dateFrom;
        if (dateTo) filename += "_to_" + dateTo;
      }
      filename += ".xlsx";

      // Write and download the file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Export failed:", error);

      // Fallback to CSV if XLSX fails
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      let fallbackFilename = `PVS_Summary_${dateStr}`;

      if (selectedCorp) fallbackFilename += `_${selectedCorp}`;
      if (selectedBranch) fallbackFilename += `_${selectedBranch}`;
      if (dateFrom || dateTo) {
        fallbackFilename += "_";
        if (dateFrom) fallbackFilename += dateFrom;
        if (dateTo) fallbackFilename += "_to_" + dateTo;
      }
      fallbackFilename += ".csv";

      const csvData = [
        [
          "Product Info",
          "Unit",
          "Total Quantity",
          "Total Value",
          "0-90 Days Qty",
          "0-90 Days Value",
          "91-180 Days Qty",
          "91-180 Days Value",
          "181-365 Days Qty",
          "181-365 Days Value",
          "Over 365 Days Qty",
          "Over 365 Days Value",
        ],
        ...productSummary.map((product) => [
          product.prod,
          product.unitName,
          product.totalQty,
          product.totalValue,
          product.ageBuckets["0-90"].qty,
          product.ageBuckets["0-90"].value,
          product.ageBuckets["90-180"].qty,
          product.ageBuckets["90-180"].value,
          product.ageBuckets["180-360"].qty,
          product.ageBuckets["180-360"].value,
          product.ageBuckets[">360"].qty,
          product.ageBuckets[">360"].value,
        ]),
      ];

      const csvContent = csvData
        .map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        )
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fallbackFilename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Get available branches for selected corporation
  const getAvailableBranches = () => {
    if (!selectedCorp) {
      return branches;
    }

    const corpBranches = [
      ...new Set(
        data.filter((r) => r.corp === selectedCorp).map((r) => r.branch)
      ),
    ]
      .filter(Boolean)
      .sort() as string[];

    return corpBranches;
  };

  // Reset branch selection when corp changes
  const handleCorpChange = (corp: string) => {
    setSelectedCorp(corp);

    // Reset branch if it's not available in the new corp
    if (corp && selectedBranch) {
      const availableBranches = [
        ...new Set(data.filter((r) => r.corp === corp).map((r) => r.branch)),
      ].filter(Boolean) as string[];

      if (!availableBranches.includes(selectedBranch)) {
        setSelectedBranch("");
      }
    }
  };

  // Custom DateRangePicker Component
  const DateRangePicker = () => {
    const [isOpen, setIsOpen] = useState(false);
    const hasDateRange = dateFrom || dateTo;

    const formatDisplayDate = (date: string) => {
      if (!date) return "";
      try {
        return new Date(date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch {
        return date;
      }
    };

    const getDisplayText = () => {
      if (dateFrom && dateTo) {
        return `${formatDisplayDate(dateFrom)} - ${formatDisplayDate(dateTo)}`;
      } else if (dateFrom) {
        return `ตั้งแต่ ${formatDisplayDate(dateFrom)}`;
      } else if (dateTo) {
        return `ถึง ${formatDisplayDate(dateTo)}`;
      }
      return "เลือกช่วงวันที่";
    };

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full min-w-[280px] px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            !hasDateRange
              ? "text-slate-400 dark:text-slate-500"
              : "text-slate-900 dark:text-slate-200"
          }`}
        >
          <div className="flex items-center">
            <CalendarDays className="w-4 h-4 mr-2" />
            <span>{getDisplayText()}</span>
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[320px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  เลือกช่วงวันที่
                </h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ตั้งแต่วันที่
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ถึงวันที่
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  ล้างวันที่
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Filter Controls Component
  const FilterTabs = ({ showClearAll = true }: { showClearAll?: boolean }) => {
    const hasActiveFilters =
      selectedCorp || selectedBranch || dateFrom || dateTo;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg p-2 mr-3">
            <Settings className="text-white w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">
            ตัวกรองข้อมูล
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Corp Filter */}
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-slate-500" />
            <select
              value={selectedCorp}
              onChange={(e) => handleCorpChange(e.target.value)}
              className="text-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
            >
              <option value="">ทุกบริษัท</option>
              {corps.map((corp) => (
                <option key={corp} value={corp}>
                  {corp}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-slate-500" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
              disabled={!selectedCorp && getAvailableBranches().length === 0}
            >
              <option value="">
                {selectedCorp ? "ทุกสาขา" : "เลือกบริษัทก่อน"}
              </option>
              {getAvailableBranches().map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            {selectedCorp && getAvailableBranches().length > 0 && (
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                ({getAvailableBranches().length} สาขา)
              </span>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center">
            <DateRangePicker />
          </div>

          {/* Clear Filters Button */}
          {showClearAll && hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedCorp("");
                setSelectedBranch("");
                setDateFrom("");
                setDateTo("");
              }}
              className="px-4 py-2 bg-slate-500 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors flex items-center font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ล้างตัวกรอง
            </button>
          )}

          {/* Export Excel Button */}
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center font-medium"
            disabled={productSummary.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700 font-medium flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              กำลังกรอง:{" "}
              <span className="font-bold mx-1">
                {filteredData.length.toLocaleString()}
              </span>{" "}
              รายการ จากทั้งหมด{" "}
              <span className="font-bold mx-1">
                {data.length.toLocaleString()}
              </span>{" "}
              รายการ
            </div>
          </div>
        )}
      </div>
    );
  };

  // Pagination helper functions
  const getPaginatedData = <T,>(
    data: T[],
    page: number,
    itemsPerPage: number
  ) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number, itemsPerPage: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="text-lg font-medium text-gray-700 dark:text-slate-300">
            กำลังโหลดข้อมูลจาก Database...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="w-16 h-16 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">{error}</p>
            <button
              onClick={fetchDatabaseData}
              className="px-6 py-3 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-full">
        <div className="container mx-auto p-6 space-y-8">
          {/* Global Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg p-2 mr-3">
                  <Settings className="text-white w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">
                  Dashboard Controls
                </h2>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchDatabaseData}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  รีเฟรช
                </button>
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                    showRawData
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
                      : "bg-white border border-indigo-200 text-indigo-600 hover:border-indigo-300"
                  }`}
                >
                  {showRawData ? (
                    <EyeOff className="w-4 h-4 mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {showRawData ? "ซ่อน" : "แสดง"} ข้อมูลทั้งหมด
                </button>
              </div>
            </div>
          </div>

          {/* Age Bucket KPI Cards */}
          {stats && (
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2 mr-3">
                  <BarChart3 className="text-white w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-200">
                  มูลค่าตามกลุ่มอายุสินค้า
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 0-90 Days (Fresh) */}
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-green-100 mb-2">
                      0-90 Days (Fresh)
                    </div>
                    <div className="text-3xl font-bold">
                      {formatMoney(getAgeBucketValues().fresh)}
                    </div>
                  </div>
                  <div className="border-t border-green-400 pt-4">
                    <p className="text-green-100 text-sm">สินค้าใหม่</p>
                  </div>
                </div>

                {/* 91-180 Days (Aging) */}
                <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-yellow-100 mb-2">
                      91-180 Days (Aging)
                    </div>
                    <div className="text-3xl font-bold">
                      {formatMoney(getAgeBucketValues().aging)}
                    </div>
                  </div>
                  <div className="border-t border-yellow-400 pt-4">
                    <p className="text-yellow-100 text-sm">สินค้าเริ่มเก่า</p>
                  </div>
                </div>

                {/* 181-365 Days (Risk) */}
                <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <Zap className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-orange-100 mb-2">
                      181-365 Days (Risk)
                    </div>
                    <div className="text-3xl font-bold">
                      {formatMoney(getAgeBucketValues().risk)}
                    </div>
                  </div>
                  <div className="border-t border-orange-400 pt-4">
                    <p className="text-orange-100 text-sm">สินค้าเสี่ยง</p>
                  </div>
                </div>

                {/* >365 Days (Old Stock) */}
                <div className="bg-gradient-to-br from-rose-400 to-rose-500 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <XCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-red-100 mb-2">
                      &gt;365 Days (Old Stock)
                    </div>
                    <div className="text-3xl font-bold">
                      {formatMoney(getAgeBucketValues().old)}
                    </div>
                  </div>
                  <div className="border-t border-red-400 pt-4">
                    <p className="text-red-100 text-sm">สินค้าเก่า</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Age Bucket Summary */}
          {stats && Object.keys(stats.ageBucketSummary).length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2 mr-3">
                  <TrendingUp className="text-white w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  สรุปตามกลุ่มอายุสินค้า
                </h3>
              </div>
              <p className="text-gray-600 mb-6">จำนวนรายการในแต่ละกลุ่มอายุ</p>
              <div className="flex flex-wrap gap-4">
                {Object.entries(stats.ageBucketSummary).map(
                  ([bucket, count]) => (
                    <div
                      key={bucket}
                      className={`px-6 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200 ${
                        bucket === ">365" || bucket === ">360"
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                          : bucket === "0-90"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {count.toLocaleString()}
                        </div>
                        <div className="text-sm opacity-90">{bucket} วัน</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Filter Controls */}
          <FilterTabs />

          {/* Product Summary Table */}
          {productSummary.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-lg p-2 mr-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        สรุปข้อมูลตามสินค้า
                      </h3>
                      <p className="text-indigo-100 mt-1">
                        แยกตามกลุ่มอายุ - แสดง{" "}
                        {productSummary.length.toLocaleString()} รายการสินค้า
                      </p>
                    </div>
                  </div>

                  {/* Top Pagination Controls */}
                  {productSummary.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center space-x-4 text-white">
                      <div className="text-sm opacity-90">
                        หน้า {productPage} จาก{" "}
                        {getTotalPages(productSummary.length, ITEMS_PER_PAGE)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setProductPage(Math.max(1, productPage - 1))
                          }
                          disabled={productPage === 1}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center space-x-1">
                          {Array.from(
                            {
                              length: Math.min(
                                5,
                                getTotalPages(
                                  productSummary.length,
                                  ITEMS_PER_PAGE
                                )
                              ),
                            },
                            (_, i) => {
                              const totalPages = getTotalPages(
                                productSummary.length,
                                ITEMS_PER_PAGE
                              );
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (productPage <= 3) {
                                pageNum = i + 1;
                              } else if (productPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = productPage - 2 + i;
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setProductPage(pageNum)}
                                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    productPage === pageNum
                                      ? "bg-white text-indigo-600"
                                      : "bg-white/20 hover:bg-white/30"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}
                        </div>

                        <button
                          onClick={() =>
                            setProductPage(
                              Math.min(
                                getTotalPages(
                                  productSummary.length,
                                  ITEMS_PER_PAGE
                                ),
                                productPage + 1
                              )
                            )
                          }
                          disabled={
                            productPage ===
                            getTotalPages(productSummary.length, ITEMS_PER_PAGE)
                          }
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 dark:bg-slate-800">
                <div className="overflow-x-auto max-h-[600px] relative">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-white dark:bg-slate-800">
                          บริษัท
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-white dark:bg-slate-800">
                          สาขา
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[200px] bg-white dark:bg-slate-800">
                          สินค้า
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[80px] bg-white dark:bg-slate-800">
                          หน่วย
                        </th>
                        <th className="text-right p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[120px] bg-white dark:bg-slate-800">
                          รวมทั้งหมด
                        </th>
                        <th
                          className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/50 font-bold text-emerald-700 dark:text-emerald-300 rounded-tl-lg min-w-[100px]"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            0-90 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-3 bg-amber-50 dark:bg-amber-900/50 font-bold text-amber-700 dark:text-amber-300 min-w-[100px]"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            90-180 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-3 bg-orange-50 dark:bg-orange-900/50 font-bold text-orange-700 dark:text-orange-300 min-w-[100px]"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <Zap className="w-4 h-4 mr-1" />
                            180-360 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-3 bg-rose-50 dark:bg-rose-900/50 font-bold text-rose-700 dark:text-rose-300 rounded-tr-lg min-w-[100px]"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <XCircle className="w-4 h-4 mr-1" />
                            &gt;360 วัน
                          </div>
                        </th>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-800">
                        <th className="bg-white dark:bg-slate-800"></th>
                        <th className="bg-white dark:bg-slate-800"></th>
                        <th className="bg-white dark:bg-slate-800"></th>
                        <th className="bg-white dark:bg-slate-800"></th>
                        <th className="text-right p-3 text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-800">
                          จำนวน / มูลค่า
                        </th>
                        <th className="text-right p-3 bg-green-50 dark:bg-emerald-900/50 text-green-600 dark:text-emerald-300 font-medium">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-green-50 dark:bg-emerald-900/50 text-green-600 dark:text-emerald-300 font-medium">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-yellow-50 dark:bg-amber-900/50 text-yellow-600 dark:text-amber-300 font-medium">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-yellow-50 dark:bg-amber-900/50 text-yellow-600 dark:text-amber-300 font-medium">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 font-medium">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 font-medium">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-red-50 dark:bg-rose-900/50 text-red-600 dark:text-rose-300 font-medium">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-red-50 dark:bg-rose-900/50 text-red-600 dark:text-rose-300 font-medium">
                          มูลค่า
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(
                        productSummary,
                        productPage,
                        ITEMS_PER_PAGE
                      ).map((product, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-150"
                        >
                          <td className="p-2 font-medium text-gray-700 dark:text-slate-300">
                            {product.corp}
                          </td>
                          <td className="p-2 text-gray-600 dark:text-slate-400">
                            {product.branch}
                          </td>
                          <td
                            className="p-2 font-medium text-gray-800 dark:text-slate-200 min-w-[200px]"
                            title={product.prod}
                          >
                            {product.prod}
                          </td>
                          <td className="p-2 text-gray-600 dark:text-slate-400">
                            {product.unitName}
                          </td>
                          <td className="p-2 text-right">
                            <div className="font-bold text-gray-800 dark:text-slate-200 text-sm">
                              {product.totalQty.toLocaleString()}
                            </div>
                            <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {formatMoney(product.totalValue)}
                            </div>
                          </td>

                          {/* 0-90 days */}
                          <td className="p-2 text-right bg-emerald-50 dark:bg-emerald-900/30 font-bold text-emerald-700 dark:text-emerald-300">
                            {product.ageBuckets["0-90"].qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right bg-emerald-50 dark:bg-emerald-900/30 font-bold text-emerald-800 dark:text-emerald-200">
                            {formatMoney(product.ageBuckets["0-90"].value)}
                          </td>

                          {/* 90-180 days */}
                          <td className="p-2 text-right bg-amber-50 dark:bg-amber-900/30 font-bold text-amber-700 dark:text-amber-300">
                            {product.ageBuckets["90-180"].qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right bg-amber-50 dark:bg-amber-900/30 font-bold text-amber-800 dark:text-amber-200">
                            {formatMoney(product.ageBuckets["90-180"].value)}
                          </td>

                          {/* 180-360 days */}
                          <td className="p-2 text-right bg-orange-50 dark:bg-orange-900/30 font-bold text-orange-700 dark:text-orange-300">
                            {product.ageBuckets["180-360"].qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right bg-orange-50 dark:bg-orange-900/30 font-bold text-orange-800 dark:text-orange-200">
                            {formatMoney(product.ageBuckets["180-360"].value)}
                          </td>

                          {/* >360 days */}
                          <td className="p-2 text-right bg-rose-50 dark:bg-rose-900/30 font-bold text-rose-700 dark:text-rose-300">
                            {product.ageBuckets[">360"].qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right bg-rose-50 dark:bg-rose-900/30 font-bold text-rose-800 dark:text-rose-200">
                            {formatMoney(product.ageBuckets[">360"].value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Raw Data Table */}
          {showRawData && filteredData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-lg p-2 mr-3">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">ข้อมูลที่กรอง</h3>
                      <p className="text-blue-100 text-sm mt-1">
                        แสดง {filteredData.length.toLocaleString()} รายการ
                        จากทั้งหมด {data.length.toLocaleString()} รายการ
                      </p>
                    </div>
                  </div>

                  {/* Top Pagination Controls for Raw Data */}
                  {filteredData.length > RAW_DATA_PER_PAGE && (
                    <div className="flex items-center space-x-4 text-white">
                      <div className="text-sm opacity-90">
                        หน้า {rawDataPage} จาก{" "}
                        {getTotalPages(filteredData.length, RAW_DATA_PER_PAGE)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setRawDataPage(Math.max(1, rawDataPage - 1))
                          }
                          disabled={rawDataPage === 1}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center space-x-1">
                          {Array.from(
                            {
                              length: Math.min(
                                5,
                                getTotalPages(
                                  filteredData.length,
                                  RAW_DATA_PER_PAGE
                                )
                              ),
                            },
                            (_, i) => {
                              const totalPages = getTotalPages(
                                filteredData.length,
                                RAW_DATA_PER_PAGE
                              );
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (rawDataPage <= 3) {
                                pageNum = i + 1;
                              } else if (rawDataPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = rawDataPage - 2 + i;
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setRawDataPage(pageNum)}
                                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    rawDataPage === pageNum
                                      ? "bg-white text-blue-600"
                                      : "bg-white/20 hover:bg-white/30"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}
                        </div>

                        <button
                          onClick={() =>
                            setRawDataPage(
                              Math.min(
                                getTotalPages(
                                  filteredData.length,
                                  RAW_DATA_PER_PAGE
                                ),
                                rawDataPage + 1
                              )
                            )
                          }
                          disabled={
                            rawDataPage ===
                            getTotalPages(
                              filteredData.length,
                              RAW_DATA_PER_PAGE
                            )
                          }
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 dark:bg-slate-800">
                <div className="overflow-x-auto max-h-[600px] relative">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-gray-50 dark:bg-slate-700">
                          บริษัท
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-gray-50 dark:bg-slate-700">
                          สาขา
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[300px] bg-gray-50 dark:bg-slate-700">
                          สินค้า
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[80px] bg-gray-50 dark:bg-slate-700">
                          หน่วย
                        </th>
                        <th className="text-right p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[80px] bg-gray-50 dark:bg-slate-700">
                          จำนวน
                        </th>
                        <th className="text-right p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-gray-50 dark:bg-slate-700">
                          ราคาต้นทุน
                        </th>
                        <th className="text-right p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[120px] bg-gray-50 dark:bg-slate-700">
                          มูลค่า
                        </th>
                        <th className="text-center p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[80px] bg-gray-50 dark:bg-slate-700">
                          อายุ (วัน)
                        </th>
                        <th className="text-center p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-gray-50 dark:bg-slate-700">
                          กลุ่มอายุ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(
                        filteredData,
                        rawDataPage,
                        RAW_DATA_PER_PAGE
                      ).map((row, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-150"
                        >
                          <td className="p-2 font-medium text-gray-700 dark:text-slate-300">
                            {row.corp}
                          </td>
                          <td className="p-2 text-gray-600 dark:text-slate-400">
                            {row.branch}
                          </td>
                          <td
                            className="p-2 font-medium text-gray-800 dark:text-slate-200 min-w-[300px]"
                            title={row.prod}
                          >
                            {row.prod}
                          </td>
                          <td className="p-2 text-gray-600 dark:text-slate-400">
                            {row.unitName}
                          </td>
                          <td className="p-2 text-right font-bold text-gray-800 dark:text-slate-200">
                            {row.qtyFromThisDoc?.toLocaleString()}
                          </td>
                          <td className="p-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {formatMoney(row.averageCost || 0)}
                          </td>
                          <td className="p-2 text-right font-bold text-emerald-700 dark:text-emerald-300">
                            {formatMoney(row.totalValueRow || 0)}
                          </td>
                          <td className="p-2 text-center font-bold text-gray-700 dark:text-slate-300">
                            {row.daysAge}
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                row.ageBucket === ">365" ||
                                row.ageBucket === ">360"
                                  ? "bg-rose-500 text-white"
                                  : row.ageBucket === "0-90"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-gray-500 text-white"
                              }`}
                            >
                              {row.ageBucket}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info - Development Only */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-800 dark:bg-slate-900 rounded-2xl shadow-xl p-6 text-gray-300 dark:text-slate-400">
              <div className="flex items-center mb-4">
                <Settings className="text-white w-6 h-6 mr-2" />
                <h4 className="text-lg font-bold text-white">
                  Debug Information
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="text-white">API Endpoint:</strong>{" "}
                  /api/inventory/raw
                </div>
                <div>
                  <strong className="text-white">Records Loaded:</strong>{" "}
                  {data.length} (Filtered: {filteredData.length})
                </div>
                <div>
                  <strong className="text-white">Last Refresh:</strong>{" "}
                  {new Date().toLocaleString("th-TH")}
                </div>
                {filteredData.length > 0 && (
                  <div>
                    <strong className="text-white">Sample Fields:</strong>{" "}
                    {Object.keys(filteredData[0]).join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
