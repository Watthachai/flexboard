"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "./layout/DashboardLayout";
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
          className={`flex items-center justify-between w-full min-w-[280px] px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            !hasDateRange ? "text-slate-400" : "text-slate-900"
          }`}
        >
          <div className="flex items-center">
            <CalendarDays className="w-4 h-4 mr-2" />
            <span>{getDisplayText()}</span>
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[320px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-900">
                  เลือกช่วงวันที่
                </h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ตั้งแต่วันที่
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ถึงวันที่
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  ล้างวันที่
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg p-2 mr-3">
            <Settings className="text-white w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">ตัวกรองข้อมูล</h3>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Corp Filter */}
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-slate-500" />
            <select
              value={selectedCorp}
              onChange={(e) => handleCorpChange(e.target.value)}
              className="text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
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
              className="text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
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
              <span className="ml-2 text-xs text-slate-500">
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
              className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ล้างตัวกรอง
            </button>
          )}
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

  // Pagination Component
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
    itemName = "รายการ",
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
    itemName?: string;
  }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-b-xl border-t border-gray-200">
        <div className="text-sm text-gray-600">
          แสดง <span className="font-medium">{startItem}</span> ถึง{" "}
          <span className="font-medium">{endItem}</span> จากทั้งหมด{" "}
          <span className="font-medium">{totalItems.toLocaleString()}</span>{" "}
          {itemName}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700">
            กำลังโหลดข้อมูลจาก Database...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchDatabaseData}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-full">
        <div className="container mx-auto p-6 space-y-8">
          {/* Global Controls */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg p-2 mr-3">
                  <Settings className="text-white w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
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
                <h3 className="text-2xl font-bold text-gray-800">
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
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-lg p-2 mr-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">สรุปข้อมูลตามสินค้า</h3>
                    <p className="text-indigo-100 mt-1">
                      แยกตามกลุ่มอายุ - แสดง{" "}
                      {productSummary.length.toLocaleString()} รายการสินค้า
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-2 font-bold text-gray-700 min-w-[100px]">
                          บริษัท
                        </th>
                        <th className="text-left p-2 font-bold text-gray-700 min-w-[100px]">
                          สาขา
                        </th>
                        <th className="text-left p-2 font-bold text-gray-700 min-w-[200px]">
                          สินค้า
                        </th>
                        <th className="text-left p-2 font-bold text-gray-700 min-w-[80px]">
                          หน่วย
                        </th>
                        <th className="text-right p-2 font-bold text-gray-700 min-w-[120px]">
                          รวมทั้งหมด
                        </th>
                        <th
                          className="text-center p-2 bg-emerald-50 font-bold text-emerald-700 rounded-tl-lg min-w-[100px]"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            0-90 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-2 bg-amber-50 font-bold text-amber-700 min-w-[100px]"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            90-180 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-2 bg-orange-50 font-bold text-orange-700 min-w-[100px]"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <Zap className="w-4 h-4 mr-1" />
                            180-360 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-2 bg-rose-50 font-bold text-rose-700 rounded-tr-lg min-w-[100px]"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <XCircle className="w-4 h-4 mr-1" />
                            &gt;360 วัน
                          </div>
                        </th>
                      </tr>
                      <tr className="border-b border-gray-200 text-sm">
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th className="text-right p-3 text-gray-600">
                          จำนวน / มูลค่า
                        </th>
                        <th className="text-right p-3 bg-green-50 text-green-600 font-medium">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-green-50 text-green-600 font-medium">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-yellow-50 text-yellow-600 font-medium">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-yellow-50 text-yellow-600 font-medium">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-orange-50 text-orange-600 font-medium">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-orange-50 text-orange-600 font-medium">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-red-50 text-red-600 font-medium">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-red-50 text-red-600 font-medium">
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
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="p-2 font-medium text-gray-700">
                            {product.corp}
                          </td>
                          <td className="p-2 text-gray-600">
                            {product.branch}
                          </td>
                          <td
                            className="p-2 font-medium text-gray-800 min-w-[200px]"
                            title={product.prod}
                          >
                            {product.prod}
                          </td>
                          <td className="p-2 text-gray-600">
                            {product.unitName}
                          </td>
                          <td className="p-2 text-right">
                            <div className="font-bold text-gray-800 text-sm">
                              {product.totalQty.toLocaleString()}
                            </div>
                            <div className="text-emerald-600 font-bold">
                              {formatMoney(product.totalValue)}
                            </div>
                          </td>

                          {/* 0-90 days */}
                          <td className="p-2 text-right bg-emerald-50 font-bold text-emerald-700">
                            {product.ageBuckets["0-90"].qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right bg-emerald-50 font-bold text-emerald-800">
                            {formatMoney(product.ageBuckets["0-90"].value)}
                          </td>

                          {/* 90-180 days */}
                          <td className="p-2 text-right bg-amber-50 font-bold text-amber-700">
                            {product.ageBuckets["90-180"].qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right bg-amber-50 font-bold text-amber-800">
                            {formatMoney(product.ageBuckets["90-180"].value)}
                          </td>

                          {/* 180-360 days */}
                          <td className="p-2 text-right bg-orange-50 font-bold text-orange-700">
                            {product.ageBuckets["180-360"].qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right bg-orange-50 font-bold text-orange-800">
                            {formatMoney(product.ageBuckets["180-360"].value)}
                          </td>

                          {/* >360 days */}
                          <td className="p-2 text-right bg-rose-50 font-bold text-rose-700">
                            {product.ageBuckets[">360"].qty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right bg-rose-50 font-bold text-rose-800">
                            {formatMoney(product.ageBuckets[">360"].value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {productSummary.length > ITEMS_PER_PAGE && (
                  <PaginationControls
                    currentPage={productPage}
                    totalPages={getTotalPages(
                      productSummary.length,
                      ITEMS_PER_PAGE
                    )}
                    onPageChange={setProductPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={productSummary.length}
                    itemName="รายการสินค้า"
                  />
                )}
              </div>
            </div>
          )}

          {/* Raw Data Table */}
          {showRawData && filteredData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
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
              </div>

              <div className="p-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left p-2 font-bold text-gray-700 min-w-[100px]">
                          บริษัท
                        </th>
                        <th className="text-left p-2 font-bold text-gray-700 min-w-[100px]">
                          สาขา
                        </th>
                        <th className="text-left p-2 font-bold text-gray-700 min-w-[300px]">
                          สินค้า
                        </th>
                        <th className="text-left p-2 font-bold text-gray-700 min-w-[80px]">
                          หน่วย
                        </th>
                        <th className="text-right p-2 font-bold text-gray-700 min-w-[80px]">
                          จำนวน
                        </th>
                        <th className="text-right p-2 font-bold text-gray-700 min-w-[100px]">
                          ราคาต้นทุน
                        </th>
                        <th className="text-right p-2 font-bold text-gray-700 min-w-[120px]">
                          มูลค่า
                        </th>
                        <th className="text-center p-2 font-bold text-gray-700 min-w-[80px]">
                          อายุ (วัน)
                        </th>
                        <th className="text-center p-2 font-bold text-gray-700 min-w-[100px]">
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
                          className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150"
                        >
                          <td className="p-2 font-medium text-gray-700">
                            {row.corp}
                          </td>
                          <td className="p-2 text-gray-600">{row.branch}</td>
                          <td
                            className="p-2 font-medium text-gray-800 min-w-[300px]"
                            title={row.prod}
                          >
                            {row.prod}
                          </td>
                          <td className="p-2 text-gray-600">{row.unitName}</td>
                          <td className="p-2 text-right font-bold text-gray-800">
                            {row.qtyFromThisDoc?.toLocaleString()}
                          </td>
                          <td className="p-2 text-right font-medium text-emerald-600">
                            {formatMoney(row.averageCost || 0)}
                          </td>
                          <td className="p-2 text-right font-bold text-emerald-700">
                            {formatMoney(row.totalValueRow || 0)}
                          </td>
                          <td className="p-2 text-center font-bold text-gray-700">
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

                {filteredData.length > RAW_DATA_PER_PAGE && (
                  <PaginationControls
                    currentPage={rawDataPage}
                    totalPages={getTotalPages(
                      filteredData.length,
                      RAW_DATA_PER_PAGE
                    )}
                    onPageChange={setRawDataPage}
                    itemsPerPage={RAW_DATA_PER_PAGE}
                    totalItems={filteredData.length}
                    itemName="รายการข้อมูล"
                  />
                )}
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 text-gray-300">
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
        </div>
      </div>
    </DashboardLayout>
  );
}
