"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import { useTheme } from "@/app/components/context/ThemeContext";
import { useCompany } from "@/app/components/context/CompanyContext";
import SearchLoading from "@/app/components/ui/SearchLoading";
import EmptyState from "@/app/components/ui/EmptyState";
import MonthPicker from "@/app/components/MonthPicker";
import { MemoizedMultiSelect } from "@/app/components/ui/multi-select";
import { MemoizedRangeSelect } from "@/app/components/ui/range-select";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addGoogleSansFont, setGoogleSansFont } from "@/app/utils/pdfFont";
import {
  Settings,
  RefreshCw,
  BarChart3,
  Building2,
  CheckCircle,
  AlertTriangle,
  Zap,
  XCircle,
  FileText,
  Database,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  X,
  Loader2,
} from "lucide-react";
interface DatabaseRecord {
  // PascalCase fields from SQL Server API
  DataDate: string;
  DocDate: string;
  DocNumber: string;
  Corp: string;
  Branch: string;
  ProdCode: string; // ✅ รหัสสินค้า
  ProdName: string; // ✅ ชื่อสินค้า
  ProdGrp?: string; // Product Group
  UnitName: string;
  QtyFromThisDoc: number;
  BuyPrice?: number; // ราคาซื้อ
  AverageCost: number;
  TotalFromBuyPrice?: number; // มูลค่ารวมจากราคาซื้อ
  TotalFromAverageCost?: number; // มูลค่ารวมจากราคาทุนเฉลี่ย
  DaysAge: number;
  AgeBucket: string;
  CreateDate: string;
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
  ProdCode: string; // ✅ รหัสสินค้า
  ProdName: string; // ✅ ชื่อสินค้า
  ProdGrp?: string; // Product Group
  UnitName: string;
  Corp: string;
  Branch: string;
  DocNumber: string;
  totalQty: number;
  totalValue: number;
  ageBuckets: {
    "0-90": { qty: number; value: number };
    "90-180": { qty: number; value: number };
    "180-360": { qty: number; value: number };
    ">360": { qty: number; value: number };
  };
}

interface IngestionStatus {
  lastRun: string | null;
  nextRun: string | null;
  totalFiles: number;
  totalRecords: number;
  status: "running" | "idle" | "error";
  recentFiles: Array<{
    fileName: string;
    recordCount: number;
    recordsCreated?: number;
    recordsUpdated?: number;
    recordsDeleted?: number;
    processedAt: string;
    status: "success" | "error";
  }>;
}

interface DefaultCompanySettings {
  defaultCompany: string;
  enableDefaultCompany: boolean;
}

// ✅ Product Code/Name Separation - COMPLETED
// =====================================================
// เสร็จสิ้นการแยก ProdCode และ ProdName แล้ว:
//
// ✅ 1. Database/API: แยก ProdCode และ ProdName เรียบร้อย
// ✅ 2. Interfaces: อัพเดท DatabaseRecord และ ProductAgeBucketSummary
// ✅ 3. Display Logic: ตารางแสดงผล 2 columns แยกกัน
// ✅ 4. Excel Export: Product Summary และ Raw Data แยก columns
// ✅ 5. Search/Filter: ใช้ matchesProductSearch() รองรับทั้งสองฟิลด์
// =====================================================

// Multi-Select Dropdown for Product Groups

export default function PVSDashboard() {
  const {} = useTheme();
  const { setAvailableCompanies } = useCompany();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DatabaseRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DatabaseRecord[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [productSummary, setProductSummary] = useState<
    ProductAgeBucketSummary[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCorps, setSelectedCorps] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [fromProdGrp, setFromProdGrp] = useState<string>("");
  const [toProdGrp, setToProdGrp] = useState<string>("");

  // Default to current month (YYYY-MM format)
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

  // Available filter options
  const [corps, setCorps] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [prodGrps, setProdGrps] = useState<string[]>([]);

  // Pagination states
  const [productPage, setProductPage] = useState(1);
  const [rawDataPage, setRawDataPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const RAW_DATA_PER_PAGE = 100;

  // Search states
  const [productSearch, setProductSearch] = useState<string>("");
  const [debouncedProductSearch, setDebouncedProductSearch] =
    useState<string>("");
  const [isProductSearching, setIsProductSearching] = useState<boolean>(false);
  const [rawDataSearch, setRawDataSearch] = useState<string>("");
  const [debouncedRawDataSearch, setDebouncedRawDataSearch] =
    useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Export loading state
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Ingestion status state
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>({
    lastRun: null,
    nextRun: null,
    totalFiles: 0,
    totalRecords: 0,
    status: "idle",
    recentFiles: [],
  });

  // ✅ Helper functions for prodCode/prodName (Approved & Active)
  // ================================================================================

  // สำหรับ search/filter ที่รองรับทั้ง prodCode และ prodName
  const matchesProductSearch = (
    prodCode: string,
    prodName: string,
    searchTerm: string
  ) => {
    const search = searchTerm.toLowerCase();
    return (
      prodCode.toLowerCase().includes(search) ||
      prodName.toLowerCase().includes(search)
    );
  };

  // ================================================================================

  // Debounce effect for product search
  useEffect(() => {
    if (productSearch.trim()) {
      setIsProductSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
      setProductPage(1); // Reset to first page when searching
      setIsProductSearching(false);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
      if (productSearch.trim()) {
        setIsProductSearching(false);
      }
    };
  }, [productSearch]);

  // Debounce effect for raw data search
  useEffect(() => {
    if (rawDataSearch.trim()) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedRawDataSearch(rawDataSearch);
      setRawDataPage(1); // Reset to first page when searching
      setIsSearching(false);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
      if (rawDataSearch.trim()) {
        setIsSearching(false);
      }
    };
  }, [rawDataSearch]);

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
          ...new Set(result.rows.map((r: DatabaseRecord) => r.Corp)),
        ]
          .filter(Boolean)
          .sort() as string[];
        const uniqueBranches = [
          ...new Set(result.rows.map((r: DatabaseRecord) => r.Branch)),
        ]
          .filter(Boolean)
          .sort() as string[];
        const uniqueProdGrps = [
          ...new Set(result.rows.map((r: DatabaseRecord) => r.ProdGrp)),
        ]
          .filter(Boolean)
          .sort() as string[];
        setCorps(uniqueCorps);
        setBranches(uniqueBranches);
        setProdGrps(uniqueProdGrps);

        // Update company context for other components
        setAvailableCompanies(uniqueCorps);

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
  }, [setAvailableCompanies]);

  // Load default company settings and apply if enabled
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      corps.length > 0 &&
      selectedCorps.length === 0
    ) {
      // ✅ เพิ่มเงื่อนไข: run เฉพาะเมื่อ selectedCorps ยังเป็น empty (ยังไม่ได้เลือก)
      const savedDefaultSettings = localStorage.getItem(
        "flexboard-default-company-settings"
      );
      if (savedDefaultSettings) {
        try {
          const settings: DefaultCompanySettings =
            JSON.parse(savedDefaultSettings);
          console.log("Loading default company settings:", settings);
          console.log("Available corps:", corps);

          if (settings.enableDefaultCompany && settings.defaultCompany) {
            // Check if the default company exists in available corps
            if (corps.includes(settings.defaultCompany)) {
              console.log("Setting default company:", settings.defaultCompany);
              setSelectedCorps([settings.defaultCompany]);
            } else {
              console.log(
                "Default company not found in available corps:",
                settings.defaultCompany
              );
            }
          } else {
            console.log("Default company not enabled or not set");
          }
        } catch (error) {
          console.error("Failed to load default company settings:", error);
        }
      } else {
        console.log("No default company settings found in localStorage");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corps]); // ✅ Run เฉพาะเมื่อ corps เปลี่ยน (ไม่ใส่ selectedCorps เพื่อป้องกันการ reset เมื่อ user เปลี่ยนการเลือก)

  // Fetch ingestion status
  const fetchIngestionStatus = useCallback(async () => {
    try {
      const statusResponse = await fetch("/api/ingestion/status");
      const statusData = await statusResponse.json();

      if (statusData.success) {
        setIngestionStatus({
          lastRun: statusData.data.lastRun,
          nextRun: statusData.data.nextRun,
          totalFiles: statusData.data.totalFiles,
          totalRecords: statusData.data.totalRecords,
          status: statusData.data.status,
          recentFiles: statusData.data.recentFiles || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch ingestion status:", error);
      // Fallback to current time if API fails
      setIngestionStatus((prev) => ({
        ...prev,
        lastRun: new Date().toISOString(),
        status: "error",
      }));
    }
  }, []);

  useEffect(() => {
    fetchDatabaseData();
    fetchIngestionStatus();
  }, [fetchDatabaseData, fetchIngestionStatus]);
  const applyFilters = useCallback(
    (records: DatabaseRecord[]) => {
      let filtered = records;

      // Apply corp filter (multiple selection)
      if (selectedCorps.length > 0) {
        filtered = filtered.filter((r) => selectedCorps.includes(r.Corp));
      }

      // Apply branch filter (multiple selection)
      if (selectedBranches.length > 0) {
        filtered = filtered.filter((r) => selectedBranches.includes(r.Branch));
      }

      // Apply product group range filter
      // Logic:
      // - เลือกแค่ "จาก" = แสดงเฉพาะกลุ่มนั้นอย่างเดียว
      // - เลือกทั้ง "จาก" และ "ถึง" = แสดงช่วง (range)
      if (fromProdGrp || toProdGrp) {
        filtered = filtered.filter((r) => {
          if (!r.ProdGrp) return false;

          // ถ้าเลือกแค่ "จากกลุ่มสินค้า" (ไม่เลือก "ถึง")
          if (fromProdGrp && !toProdGrp) {
            return r.ProdGrp === fromProdGrp;
          }

          // ถ้าเลือกทั้ง "จาก" และ "ถึง" = แสดง range
          if (fromProdGrp && toProdGrp) {
            const fromIndex = prodGrps.indexOf(fromProdGrp);
            const toIndex = prodGrps.indexOf(toProdGrp);
            const currentIndex = prodGrps.indexOf(r.ProdGrp);

            // ถ้า ProdGrp ไม่อยู่ใน prodGrps list = ไม่แสดง
            if (currentIndex === -1) return false;

            // รองรับการเลือกย้อนกลับ (จาก index สูง ถึง index ต่ำ)
            const minIndex = Math.min(fromIndex, toIndex);
            const maxIndex = Math.max(fromIndex, toIndex);

            return currentIndex >= minIndex && currentIndex <= maxIndex;
          }

          // ถ้าเลือกแค่ "ถึง" (ไม่น่าจะเกิด แต่เผื่อไว้)
          if (!fromProdGrp && toProdGrp) {
            const toIndex = prodGrps.indexOf(toProdGrp);
            const currentIndex = prodGrps.indexOf(r.ProdGrp);

            if (currentIndex === -1) return false;

            return currentIndex >= 0 && currentIndex <= toIndex;
          }

          return false;
        });
      }

      // Apply month filter
      if (selectedMonth) {
        filtered = filtered.filter((r) => {
          const recordDate = new Date(r.DataDate);
          const [year, month] = selectedMonth.split("-");
          const recordYear = recordDate.getFullYear();
          const recordMonth = recordDate.getMonth() + 1; // 0-indexed

          return (
            recordYear === parseInt(year) && recordMonth === parseInt(month)
          );
        });
      }

      setFilteredData(filtered);
      calculateStats(filtered);
      calculateProductSummary(filtered);
    },
    [
      selectedCorps,
      selectedBranches,
      fromProdGrp,
      toProdGrp,
      selectedMonth,
      prodGrps,
    ]
  );

  const calculateProductSummary = (records: DatabaseRecord[]) => {
    const productMap = new Map<string, ProductAgeBucketSummary>();

    records.forEach((record) => {
      // ✅ รวมสินค้าที่มี ProdCode และ AverageCost เหมือนกัน (ไม่แยกตาม Corp/Branch/DocNumber)
      const avgCost = (record.AverageCost || 0).toFixed(2); // ปัดเศษเพื่อเปรียบเทียบ
      const key = `${record.ProdCode}_${avgCost}`;

      if (!productMap.has(key)) {
        productMap.set(key, {
          ProdCode: record.ProdCode,
          ProdName: record.ProdName,
          ProdGrp: record.ProdGrp,
          UnitName: record.UnitName,
          Corp: record.Corp,
          Branch: record.Branch,
          DocNumber: record.DocNumber || "N/A", // เก็บเอกสารแรกที่พบ
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
      const qty = record.QtyFromThisDoc || 0;
      const value = (record.QtyFromThisDoc || 0) * (record.AverageCost || 0);

      summary.totalQty += qty;
      summary.totalValue += value;

      // Map ageBucket to our defined buckets
      let bucketKey: keyof typeof summary.ageBuckets;
      if (record.AgeBucket === "0-90 Days") bucketKey = "0-90";
      else if (record.AgeBucket === "91-180 Days") bucketKey = "90-180";
      else if (record.AgeBucket === "181-365 Days") bucketKey = "180-360";
      else bucketKey = ">360"; // For "Over 365 Days" or any other values

      summary.ageBuckets[bucketKey].qty += qty;
      summary.ageBuckets[bucketKey].value += value;
    });

    const summaryArray = Array.from(productMap.values()).sort(
      (a, b) => b.totalValue - a.totalValue
    );
    setProductSummary(summaryArray);
  };

  // Apply filters when filter values change
  // Use a debounced approach for date filtering to prevent filtering while user is still selecting dates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.length > 0) {
        applyFilters(data);
        // Reset pagination when filters change
        setProductPage(1);
        setRawDataPage(1);
      }
    }, 600); // Wait 600ms before applying filters (increased to prevent dropdown closing)

    return () => clearTimeout(timer);
  }, [
    selectedCorps,
    selectedBranches,
    fromProdGrp,
    toProdGrp,
    selectedMonth,
    data,
    applyFilters,
  ]);

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

    const corps = new Set(records.map((r) => r.Corp));
    const branches = new Set(records.map((r) => r.Branch));
    const products = new Set(records.map((r) => r.ProdCode)); // ✅ ใช้ ProdCode

    const totalValue = records.reduce(
      (sum, r) => sum + (r.QtyFromThisDoc || 0) * (r.AverageCost || 0),
      0
    );

    const dates = records
      .map((r) => r.DataDate)
      .filter(Boolean)
      .sort();

    const ageBuckets: Record<string, number> = {};
    records.forEach((r) => {
      if (r.AgeBucket) {
        ageBuckets[r.AgeBucket] = (ageBuckets[r.AgeBucket] || 0) + 1;
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
      const value = (record.QtyFromThisDoc || 0) * (record.AverageCost || 0);
      const bucket = record.AgeBucket;

      // Count unique buckets for debugging
      bucketCounts[bucket] = (bucketCounts[bucket] || 0) + 1;

      if (bucket === "0-90 Days") values.fresh += value;
      else if (bucket === "91-180 Days") values.aging += value;
      else if (bucket === "181-365 Days") values.risk += value;
      else if (bucket === "Over 365 Days") values.old += value;
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

  // Calculate age bucket record counts for KPI cards
  const getAgeBucketCounts = () => {
    if (!filteredData.length)
      return {
        fresh: 0,
        aging: 0,
        risk: 0,
        old: 0,
      };

    const counts = {
      fresh: 0, // 0-90 days
      aging: 0, // 91-180 days
      risk: 0, // 181-365 days
      old: 0, // >365 days
    };

    filteredData.forEach((record) => {
      const bucket = record.AgeBucket;

      if (bucket === "0-90 Days") counts.fresh += 1;
      else if (bucket === "91-180 Days") counts.aging += 1;
      else if (bucket === "181-365 Days") counts.risk += 1;
      else if (bucket === "Over 365 Days") counts.old += 1;
      else {
        counts.old += 1;
      }
    });

    return counts;
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatQuantity = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatUnitCost = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  // Export to Excel function with proper XLSX format and styling
  const exportToExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create worksheet data with proper structure
      const wsData: (string | number)[][] = [];

      // Add title rows
      // Get company and branch from filter or use default
      const companyText =
        selectedCorps.length > 0
          ? `บริษัท: ${selectedCorps.join(", ")}`
          : "บริษัท: ทุกบริษัท";

      const branchText =
        selectedBranches.length > 0
          ? `สาขา: ${selectedBranches.join(", ")}`
          : "สาขา: ทุกสาขา";

      const dataMonth = selectedMonth
        ? new Date(selectedMonth).toLocaleDateString("th-TH", {
            month: "long",
            year: "numeric",
          })
        : "ทั้งหมด";

      const prodGrpText =
        fromProdGrp || toProdGrp
          ? `กลุ่มสินค้า: ${fromProdGrp || "ทั้งหมด"} - ${
              toProdGrp || "ทั้งหมด"
            }`
          : "กลุ่มสินค้า: ทุกกลุ่มสินค้า";

      // วันที่พิมพ์พร้อมเวลา
      const exportPrintDate = new Date();
      const printDate = exportPrintDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const printTime = exportPrintDate.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const printDateTime = `${printDate} ${printTime}`;

      wsData.push([""]); // Empty row
      wsData.push([companyText]); // Company info
      wsData.push([branchText]); // Branch info
      wsData.push([`วันที่ของข้อมูล: ${dataMonth}`]); // Data month
      wsData.push([prodGrpText]); // Product group info
      wsData.push([`วันที่พิมพ์: ${printDateTime}`]); // Print date with time
      wsData.push(["Inventory Aging Report"]); // Report name
      wsData.push([""]); // Empty row

      // Add main header row with groupings
      wsData.push([
        "Product Info",
        "",
        "",
        "",
        "Total",
        "",
        "",
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
        "รหัสสินค้า", // Product Code
        "ชื่อสินค้า", // Product Name
        "กลุ่มสินค้า", // Product Group
        "หน่วย",
        "ราคาทุน",
        "Quantity", // Total Quantity
        "Unit Cost", // Total Unit Cost
        "Total Value", // Total Value
        "Quantity", // 0-90 Quantity
        "Value", // 0-90 Value
        "Quantity", // 91-180 Quantity
        "Value", // 91-180 Value
        "Quantity", // 181-365 Quantity
        "Value", // 181-365 Value
        "Quantity", // >365 Quantity
        "Value", // >365 Value
      ]);

      // Sort products by product code
      const sortedProducts = getFilteredProductSummary().sort((a, b) => {
        return a.ProdCode.localeCompare(b.ProdCode);
      });

      // Add data rows from filtered product summary
      sortedProducts.forEach((product) => {
        wsData.push([
          product.ProdCode, // ✅ รหัสสินค้า
          product.ProdName, // ✅ ชื่อสินค้า
          product.ProdGrp || "-", // ✅ กลุ่มสินค้า
          product.UnitName,
          product.totalValue / product.totalQty || 0, // ราคาทุน
          product.totalQty, // Total Quantity
          product.totalValue / product.totalQty || 0, // Unit Cost
          product.totalValue, // Total Value
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
        { wch: 15 }, // รหัสสินค้า - Product Code
        { wch: 30 }, // ชื่อสินค้า - Product Name
        { wch: 20 }, // กลุ่มสินค้า - Product Group
        { wch: 10 }, // Unit
        { wch: 12 }, // Unit Cost - ราคาทุน
        { wch: 12 }, // Total Quantity
        { wch: 12 }, // Unit Cost (duplicate for clarity)
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

      // Define merges for title and grouped headers
      ws["!merges"] = [
        // Company name (row 2, merge across all 16 columns: 0-15)
        { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },
        // Report name (row 3, merge across all 16 columns: 0-15)
        { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
        // Date (row 4, merge across all 16 columns: 0-15)
        { s: { r: 3, c: 0 }, e: { r: 3, c: 15 } },

        // Product Info group (row 6) - รวม รหัสสินค้า, ชื่อสินค้า, กลุ่มสินค้า, หน่วย (4 columns: 0-3)
        { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } },
        // Total group (4 columns: ราคาทุน, Quantity, Unit Cost, Total Value = 4-7)
        { s: { r: 5, c: 4 }, e: { r: 5, c: 7 } },
        // 0-90 Days group (2 columns: 8-9)
        { s: { r: 5, c: 8 }, e: { r: 5, c: 9 } },
        // 91-180 Days group (2 columns: 10-11)
        { s: { r: 5, c: 10 }, e: { r: 5, c: 11 } },
        // 181-365 Days group (2 columns: 12-13)
        { s: { r: 5, c: 12 }, e: { r: 5, c: 13 } },
        // Over 365 Days group (2 columns: 14-15)
        { s: { r: 5, c: 14 }, e: { r: 5, c: 15 } },
      ];

      // Apply styles to cells
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          // Title rows styling (Company name, Report name, Date)
          if (R === 1 || R === 2 || R === 3) {
            ws[cellAddress].s = {
              alignment: { horizontal: "center", vertical: "center" },
              font: {
                name: "Angsana New",
                bold: true,
                size: R === 1 ? 14 : 12,
              },
            };
          }
          // Main header row styling (Row 6 - Product Info, Total, etc.)
          else if (R === 5) {
            ws[cellAddress].s = {
              font: {
                name: "Angsana New",
                bold: true,
                color: { rgb: "FFFFFF" },
                sz: 12,
              },
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
          // Sub header row styling (Row 7)
          else if (R === 6) {
            ws[cellAddress].s = {
              font: { name: "Angsana New", bold: true, sz: 11 },
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
          // Data rows (starting from row 8)
          else if (R >= 7) {
            let fillColor = "FFFFFF"; // Default white

            // Apply age bucket colors
            if (C >= 8 && C <= 9) {
              // 0-90 days - Light green
              fillColor = "E2EFDA";
            } else if (C >= 10 && C <= 11) {
              // 91-180 days - Light yellow
              fillColor = "FFF2CC";
            } else if (C >= 12 && C <= 13) {
              // 181-365 days - Light orange
              fillColor = "FCE4D6";
            } else if (C >= 14 && C <= 15) {
              // Over 365 days - Light red
              fillColor = "FFEBE9";
            }

            ws[cellAddress].s = {
              font: { name: "Angsana New", sz: 10 },
              fill: { fgColor: { rgb: fillColor } },
              alignment: {
                horizontal: C >= 5 ? "right" : "left", // Right align for numeric columns (starting from column 6)
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
            if (typeof ws[cellAddress].v === "number" && C >= 5) {
              if (C % 2 === 1) {
                // Value columns (odd indices after column 5)
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
      const excelFileDate = new Date();
      const dateStr = excelFileDate.toISOString().split("T")[0];
      let filename = `PVS_Summary_${dateStr}`;

      if (selectedCorps.length > 0) filename += `_${selectedCorps.join("_")}`;
      if (selectedBranches.length > 0)
        filename += `_${selectedBranches.join("_")}`;
      if (debouncedProductSearch.trim()) {
        filename += `_search_${debouncedProductSearch
          .trim()
          .replace(/[^a-zA-Z0-9ก-๛]/g, "_")}`;
      }
      if (selectedMonth) {
        filename += `_${selectedMonth}`;
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

      if (selectedCorps.length > 0)
        fallbackFilename += `_${selectedCorps.join("_")}`;
      if (selectedBranches.length > 0)
        fallbackFilename += `_${selectedBranches.join("_")}`;
      if (debouncedProductSearch.trim()) {
        fallbackFilename += `_search_${debouncedProductSearch
          .trim()
          .replace(/[^a-zA-Z0-9ก-๛]/g, "_")}`;
      }
      if (selectedMonth) {
        fallbackFilename += `_${selectedMonth}`;
      }
      fallbackFilename += ".csv";

      const csvData = [
        [
          "Product Name",
          "Unit",
          "Unit Cost",
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
        ...getFilteredProductSummary()
          .sort((a, b) => a.ProdCode.localeCompare(b.ProdCode))
          .map((product) => {
            return [
              product.ProdCode, // ✅ รหัสสินค้า
              product.ProdName, // ✅ ชื่อสินค้า
              product.UnitName,
              product.totalValue / product.totalQty || 0, // ราคาทุน
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
            ];
          }),
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

  // Export Raw Data to Excel function
  const exportRawDataToExcel = async () => {
    if (isExportingExcel) return; // Prevent multiple clicks

    try {
      setIsExportingExcel(true);

      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get filtered data
      const filteredRawData = getFilteredRawData();

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create worksheet data with proper structure
      const wsData: (string | number)[][] = [];

      // Add title rows
      const companyText =
        selectedCorps.length > 0
          ? `บริษัท: ${selectedCorps.join(", ")}`
          : "บริษัท: ทุกบริษัท";

      const branchText =
        selectedBranches.length > 0
          ? `สาขา: ${selectedBranches.join(", ")}`
          : "สาขา: ทุกสาขา";

      const dataMonth = selectedMonth
        ? new Date(selectedMonth).toLocaleDateString("th-TH", {
            month: "long",
            year: "numeric",
          })
        : "ทั้งหมด";

      const prodGrpText =
        fromProdGrp || toProdGrp
          ? `กลุ่มสินค้า: ${fromProdGrp || "ทั้งหมด"} - ${
              toProdGrp || "ทั้งหมด"
            }`
          : "กลุ่มสินค้า: ทุกกลุ่มสินค้า";

      // วันที่พิมพ์พร้อมเวลา
      const rawExportPrintDate = new Date();
      const printDate = rawExportPrintDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const printTime = rawExportPrintDate.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const printDateTime = `${printDate} ${printTime}`;

      wsData.push([companyText]); // Company info
      wsData.push([branchText]); // Branch info
      wsData.push([`วันที่ของข้อมูล: ${dataMonth}`]); // Data month
      wsData.push([prodGrpText]); // Product group info
      wsData.push([`วันที่พิมพ์: ${printDateTime}`]); // Print date with time
      wsData.push(["Inventory Aging Report (Raw Data)"]); // Report name
      wsData.push([]); // Empty row

      // Add header row
      wsData.push([
        "บริษัท",
        "สาขา",
        "วันที่เอกสาร",
        "เลขที่เอกสาร",
        "รหัสสินค้า",
        "ชื่อสินค้า",
        "กลุ่มสินค้า",
        "หน่วย",
        "จำนวน",
        "ราคาต้นทุน",
        "มูลค่า",
        "อายุ (วัน)",
        "กลุ่มอายุ",
      ]);

      // Helper function to format date
      const formatDate = (dateString: string) => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          // Format as DD/MM/YYYY
          return date.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        } catch {
          return dateString;
        }
      };

      // Add data rows
      filteredRawData.forEach((row) => {
        wsData.push([
          row.Corp || "",
          row.Branch || "",
          formatDate(row.DocDate || ""), // วันที่เอกสาร
          row.DocNumber || "", // เลขที่เอกสาร
          row.ProdCode || "", // รหัสสินค้า
          row.ProdName || "", // ชื่อสินค้า
          row.ProdGrp || "-", // กลุ่มสินค้า
          row.UnitName || "", // หน่วย
          row.QtyFromThisDoc || 0, // จำนวน
          row.AverageCost || 0, // ราคาต้นทุน
          (row.QtyFromThisDoc || 0) * (row.AverageCost || 0), // มูลค่า
          row.DaysAge || 0, // อายุ (วัน)
          row.AgeBucket || "", // กลุ่มอายุ
        ]);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Add merge cells for title rows (13 columns: 0-12)
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Company name (row 1, all columns)
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }, // Report name (row 2, all columns)
        { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } }, // Date (row 3, all columns)
      ];

      // Set column widths
      ws["!cols"] = [
        { wch: 15 }, // บริษัท
        { wch: 15 }, // สาขา
        { wch: 12 }, // วันที่เอกสาร
        { wch: 18 }, // เลขที่เอกสาร
        { wch: 15 }, // รหัสสินค้า
        { wch: 30 }, // ชื่อสินค้า
        { wch: 20 }, // กลุ่มสินค้า
        { wch: 12 }, // หน่วย
        { wch: 12 }, // จำนวน
        { wch: 15 }, // ราคาต้นทุน
        { wch: 18 }, // มูลค่า
        { wch: 12 }, // อายุ (วัน)
        { wch: 15 }, // กลุ่มอายุ
      ];

      // Apply styles to cells
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          // Title rows styling (Company name, Report name, Date)
          if (R === 0 || R === 1 || R === 2) {
            ws[cellAddress].s = {
              alignment: { horizontal: "center", vertical: "center" },
              font: {
                name: "Angsana New",
                bold: true,
                size: R === 0 ? 14 : 12,
              },
            };
          }
          // Header row styling (Row 5)
          else if (R === 4) {
            ws[cellAddress].s = {
              font: {
                name: "Angsana New",
                bold: true,
                color: { rgb: "FFFFFF" },
                sz: 12,
              },
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
          // Data rows (starting from row 6)
          else if (R >= 5) {
            let fillColor = "FFFFFF"; // Default white

            // Apply age bucket colors based on age group column (column 9)
            if (C === 9) {
              // กลุ่มอายุ column
              const ageBucket = ws[cellAddress].v;
              if (ageBucket === "0-90") {
                fillColor = "E2EFDA"; // Light green
              } else if (ageBucket === "91-180" || ageBucket === "90-180") {
                fillColor = "FFF2CC"; // Light yellow
              } else if (ageBucket === "181-365" || ageBucket === "180-360") {
                fillColor = "FCE4D6"; // Light orange
              } else if (ageBucket === ">365" || ageBucket === ">360") {
                fillColor = "FFEBE9"; // Light red
              }
            }

            ws[cellAddress].s = {
              font: { name: "Angsana New", sz: 10 },
              fill: { fgColor: { rgb: fillColor } },
              alignment: {
                horizontal: C >= 5 && C <= 8 ? "right" : "left", // Right align for numeric columns
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
            if (typeof ws[cellAddress].v === "number") {
              if (C === 5 || C === 8) {
                // จำนวน and อายุ (วัน) - integers
                ws[cellAddress].z = "#,##0";
              } else if (C === 6 || C === 7) {
                // ราคาต้นทุน and มูลค่า - decimals
                ws[cellAddress].z = "#,##0.00";
              }
            }
          }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Raw Data");

      // Generate filename with current date and filter info
      const rawExcelFileDate = new Date();
      const dateStr = rawExcelFileDate.toISOString().split("T")[0];
      let filename = `Raw_Data_${dateStr}`;

      if (selectedCorps.length > 0) filename += `_${selectedCorps.join("_")}`;
      if (selectedBranches.length > 0)
        filename += `_${selectedBranches.join("_")}`;
      if (debouncedRawDataSearch.trim()) {
        filename += `_search_${debouncedRawDataSearch
          .trim()
          .replace(/[^a-zA-Z0-9ก-๛]/g, "_")}`;
      }
      if (selectedMonth) {
        filename += `_${selectedMonth}`;
      }
      filename += ".xlsx";

      // Write and download the file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Raw Data Excel export failed:", error);

      // Show user-friendly error message
      alert("การ export Excel ล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export to PDF function
  const exportToPDF = async () => {
    if (isExportingPDF) return; // Prevent multiple clicks

    try {
      setIsExportingPDF(true);

      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create new PDF document
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Load Google Sans font for Thai language support
      await addGoogleSansFont(doc);
      setGoogleSansFont(doc, "normal");

      // Get company and branch info
      const companyName =
        selectedCorps.length > 0
          ? selectedCorps.length === 1
            ? selectedCorps[0]
            : `${selectedCorps.length} บริษัทที่เลือก`
          : "ทุกบริษัท";
      const branchName =
        selectedBranches.length > 0
          ? selectedBranches.length === 1
            ? selectedBranches[0]
            : `${selectedBranches.length} สาขาที่เลือก`
          : "ทุกสาขา";
      const prodGrpName =
        fromProdGrp || toProdGrp
          ? `${fromProdGrp || "ทั้งหมด"} - ${toProdGrp || "ทั้งหมด"}`
          : "ทุกกลุ่มสินค้า";

      // Add title
      doc.setFontSize(16);
      doc.text("รายงานอายุสินค้าคงคลัง (Inventory Aging Report)", 148, 15, {
        align: "center",
      });

      // Add company and filter info
      doc.setFontSize(10);
      doc.text(`บริษัท: ${companyName}`, 14, 25);
      doc.text(`สาขา: ${branchName}`, 14, 30);
      doc.text(`กลุ่มสินค้า: ${prodGrpName}`, 14, 35);

      // วันที่ของข้อมูล
      const dataDate = selectedMonth
        ? new Date(selectedMonth).toLocaleDateString("th-TH", {
            month: "long",
            year: "numeric",
          })
        : "ทั้งหมด";
      doc.text(`วันที่ของข้อมูล: ${dataDate}`, 14, 40);

      // วันที่พิมพ์พร้อมเวลา
      const pdfExportDate = new Date();
      const printDate = pdfExportDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const printTime = pdfExportDate.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`วันที่พิมพ์: ${printDate} ${printTime}`, 14, 45);

      // Get filtered data
      const filteredProducts = getFilteredProductSummary();

      // Prepare table data
      const tableData = filteredProducts.map((product) => [
        product.ProdCode,
        product.ProdName,
        product.ProdGrp || "-",
        product.UnitName,
        formatQuantity(product.totalQty),
        formatUnitCost(product.totalValue / product.totalQty || 0),
        formatMoney(product.totalValue).replace("฿", "").trim(),
        formatQuantity(product.ageBuckets["0-90"].qty),
        formatMoney(product.ageBuckets["0-90"].value).replace("฿", "").trim(),
        formatQuantity(product.ageBuckets["90-180"].qty),
        formatMoney(product.ageBuckets["90-180"].value).replace("฿", "").trim(),
        formatQuantity(product.ageBuckets["180-360"].qty),
        formatMoney(product.ageBuckets["180-360"].value)
          .replace("฿", "")
          .trim(),
        formatQuantity(product.ageBuckets[">360"].qty),
        formatMoney(product.ageBuckets[">360"].value).replace("฿", "").trim(),
      ]);

      // Add table
      autoTable(doc, {
        startY: 50,
        head: [
          [
            "รหัสสินค้า",
            "ชื่อสินค้า",
            "กลุ่มสินค้า",
            "หน่วย",
            "จำนวนรวม",
            "ราคาทุน",
            "มูลค่ารวม",
            "0-90 วัน (จน.)",
            "0-90 วัน (มูลค่า)",
            "91-180 วัน (จน.)",
            "91-180 วัน (มูลค่า)",
            "181-365 วัน (จน.)",
            "181-365 วัน (มูลค่า)",
            ">365 วัน (จน.)",
            ">365 วัน (มูลค่า)",
          ],
        ],
        body: tableData,
        styles: {
          font: "GoogleSans",
          fontSize: 7,
          cellPadding: 1,
          fontStyle: "normal",
        },
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          font: "GoogleSans",
        },
        columnStyles: {
          0: { cellWidth: 15 }, // รหัสสินค้า
          1: { cellWidth: 35 }, // ชื่อสินค้า
          2: { cellWidth: 20 }, // กลุ่มสินค้า
          3: { cellWidth: 10 }, // หน่วย
          4: { halign: "right", cellWidth: 15 }, // จำนวนรวม
          5: { halign: "right", cellWidth: 15 }, // ราคาทุน
          6: { halign: "right", cellWidth: 18 }, // มูลค่ารวม
          7: { halign: "right", cellWidth: 15 }, // 0-90 จน.
          8: { halign: "right", cellWidth: 18 }, // 0-90 มูลค่า
          9: { halign: "right", cellWidth: 15 }, // 91-180 จน.
          10: { halign: "right", cellWidth: 18 }, // 91-180 มูลค่า
          11: { halign: "right", cellWidth: 15 }, // 181-365 จน.
          12: { halign: "right", cellWidth: 18 }, // 181-365 มูลค่า
          13: { halign: "right", cellWidth: 15 }, // >365 จน.
          14: { halign: "right", cellWidth: 18 }, // >365 มูลค่า
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Generate filename
      const pdfFileDate = new Date();
      const dateStr = pdfFileDate.toISOString().split("T")[0];
      let filename = `PVS_Report_${dateStr}`;

      if (selectedCorps.length > 0) filename += `_${selectedCorps.join("_")}`;
      if (selectedBranches.length > 0)
        filename += `_${selectedBranches.join("_")}`;
      if (fromProdGrp || toProdGrp)
        filename += `_${fromProdGrp || "All"}-${toProdGrp || "All"}`;
      if (selectedMonth) filename += `_${selectedMonth}`;
      filename += ".pdf";

      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("การ export PDF ล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Filter Controls Component
  const FilterTabs = ({ showClearAll = true }: { showClearAll?: boolean }) => {
    const hasActiveFilters =
      selectedCorps.length > 0 ||
      selectedBranches.length > 0 ||
      fromProdGrp !== "" ||
      toProdGrp !== "" ||
      selectedMonth !== getCurrentMonth();

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
          <MemoizedMultiSelect
            selected={selectedCorps}
            options={corps}
            placeholder="ทุกบริษัท"
            onChange={setSelectedCorps}
            icon={Building2}
          />

          {/* Branch Filter */}
          <MemoizedMultiSelect
            selected={selectedBranches}
            options={branches}
            placeholder="ทุกสาขา"
            onChange={setSelectedBranches}
            icon={Building2}
          />

          {/* Product Group Range Filter - Single Dropdown with From/To */}
          <MemoizedRangeSelect
            options={prodGrps}
            fromSelected={fromProdGrp}
            toSelected={toProdGrp}
            onFromChange={setFromProdGrp}
            onToChange={setToProdGrp}
            placeholder="กลุ่มสินค้า: ทั้งหมด"
            icon={BarChart3}
          />

          {/* Month Filter */}
          <div className="flex items-center">
            <MonthPicker
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </div>

          {/* Clear Filters Button */}
          {showClearAll && hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedCorps([]);
                setSelectedBranches([]);
                setFromProdGrp("");
                setToProdGrp("");
                setSelectedMonth(getCurrentMonth());
              }}
              className="px-4 py-2 bg-slate-500 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors flex items-center font-medium"
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

  // Search filter functions
  const getFilteredProductSummary = () => {
    if (!debouncedProductSearch.trim()) return productSummary;
    const searchTerm = debouncedProductSearch.toLowerCase();
    return productSummary.filter(
      (product) =>
        matchesProductSearch(product.ProdCode, product.ProdName, searchTerm) ||
        product.Corp.toLowerCase().includes(searchTerm) ||
        product.Branch.toLowerCase().includes(searchTerm) ||
        (product.UnitName &&
          product.UnitName.toLowerCase().includes(searchTerm))
    );
  };

  const getFilteredRawData = () => {
    if (!debouncedRawDataSearch.trim()) return filteredData;
    const searchTerm = debouncedRawDataSearch.toLowerCase();
    return filteredData.filter(
      (row) =>
        matchesProductSearch(row.ProdCode, row.ProdName, searchTerm) ||
        row.Corp.toLowerCase().includes(searchTerm) ||
        row.Branch.toLowerCase().includes(searchTerm) ||
        (row.DocNumber && row.DocNumber.toLowerCase().includes(searchTerm)) ||
        (row.UnitName && row.UnitName.toLowerCase().includes(searchTerm))
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

              {/* Data Info */}
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 px-6 py-2 rounded-xl border border-blue-200 dark:border-slate-500 flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      ข้อมูล ณ วันที่:
                    </div>
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {ingestionStatus.lastRun
                        ? new Date(ingestionStatus.lastRun).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : new Date().toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      เวลา:
                    </div>
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {ingestionStatus.lastRun
                        ? new Date(ingestionStatus.lastRun).toLocaleTimeString(
                            "th-TH",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Bangkok",
                            }
                          )
                        : new Date().toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Bangkok",
                          })}{" "}
                      น.
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      รวม:
                    </div>
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {stats?.totalRecords.toLocaleString() || 0} รายการ
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={fetchDatabaseData}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    รีเฟรช
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Age Bucket KPI Cards */}
          {stats && (
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-blue-500 rounded-lg p-2 mr-3">
                  <BarChart3 className="text-white w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-200">
                  สรุปตามกลุ่มอายุสินค้า
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 0-90 Days (Fresh) */}
                <div className="bg-[#dbfce5] rounded-xl shadow-lg p-5 text-gray-800 transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-600/20 rounded-full p-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-green-700 mb-2">
                      สินค้าใหม่ - {getAgeBucketCounts().fresh.toLocaleString()}{" "}
                      เอกสาร
                    </div>
                    <div className="text-2xl font-bold text-green-800">
                      {formatMoney(getAgeBucketValues().fresh)}
                    </div>
                  </div>
                  <div className="border-t border-green-600 pt-4">
                    <p className="text-green-700 text-sm font-medium">
                      0-90 วัน (Fresh Stock)
                    </p>
                  </div>
                </div>

                {/* 91-180 Days (Aging) */}
                <div className="bg-[#f1fdf4] rounded-xl shadow-lg p-5 text-gray-800 transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-600/20 rounded-full p-2">
                      <AlertTriangle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-green-700 mb-2">
                      สินค้าเริ่มเก่า -{" "}
                      {getAgeBucketCounts().aging.toLocaleString()} เอกสาร
                    </div>
                    <div className="text-2xl font-bold text-green-800">
                      {formatMoney(getAgeBucketValues().aging)}
                    </div>
                  </div>
                  <div className="border-t border-green-600 pt-4">
                    <p className="text-green-700 text-sm font-medium">
                      91-180 วัน (Aging Stock)
                    </p>
                  </div>
                </div>

                {/* 181-365 Days (Risk) */}
                <div className="bg-[#fdfbe6] rounded-xl shadow-lg p-5 text-gray-800 transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-yellow-600/20 rounded-full p-2">
                      <Zap className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-yellow-700 mb-2">
                      สินค้าเสี่ยง -{" "}
                      {getAgeBucketCounts().risk.toLocaleString()} เอกสาร
                    </div>
                    <div className="text-2xl font-bold text-yellow-800">
                      {formatMoney(getAgeBucketValues().risk)}
                    </div>
                  </div>
                  <div className="border-t border-yellow-600 pt-4">
                    <p className="text-yellow-700 text-sm font-medium">
                      181-365 วัน (Risk Stock)
                    </p>
                  </div>
                </div>

                {/* >365 Days (Old Stock) */}
                <div className="bg-[#fee2e2] rounded-xl shadow-lg p-5 text-gray-800 transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-red-600/20 rounded-full p-2">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-red-700 mb-2">
                      สินค้าเก่า - {getAgeBucketCounts().old.toLocaleString()}{" "}
                      เอกสาร
                    </div>
                    <div className="text-2xl font-bold text-red-800">
                      {formatMoney(getAgeBucketValues().old)}
                    </div>
                  </div>
                  <div className="border-t border-red-600 pt-4">
                    <p className="text-red-700 text-sm font-medium">
                      มากกว่า 365 วัน (Old Stock)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Controls */}
          <FilterTabs />

          {/* Product Summary Table */}
          {productSummary.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-slate-600 overflow-hidden">
              <div className="bg-[#1677ff] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
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
                        {getFilteredProductSummary().length.toLocaleString()}{" "}
                        รายการสินค้า
                        {productSearch &&
                          ` (กรองจาก ${productSummary.length.toLocaleString()} รายการ)`}
                      </p>
                    </div>
                  </div>

                  {/* Top Pagination Controls */}
                  {getFilteredProductSummary().length > ITEMS_PER_PAGE && (
                    <div className="flex items-center space-x-4 text-white">
                      <div className="text-sm opacity-90">
                        หน้า {productPage} จาก{" "}
                        {getTotalPages(
                          getFilteredProductSummary().length,
                          ITEMS_PER_PAGE
                        )}
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
                                  getFilteredProductSummary().length,
                                  ITEMS_PER_PAGE
                                )
                              ),
                            },
                            (_, i) => {
                              const totalPages = getTotalPages(
                                getFilteredProductSummary().length,
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
                                  getFilteredProductSummary().length,
                                  ITEMS_PER_PAGE
                                ),
                                productPage + 1
                              )
                            )
                          }
                          disabled={
                            productPage ===
                            getTotalPages(
                              getFilteredProductSummary().length,
                              ITEMS_PER_PAGE
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

                {/* Search Input */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="ค้นหาสินค้า, บริษัท, หรือสาขา..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(1); // Reset to first page when searching
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    />
                    {productSearch && (
                      <button
                        onClick={() => {
                          setProductSearch("");
                          setProductPage(1);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-2">
                    {/* Export Excel Button */}
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center font-medium shadow-md hover:shadow-lg"
                      disabled={
                        getFilteredProductSummary().length === 0 ||
                        isExportingExcel
                      }
                    >
                      {isExportingExcel ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          กำลัง Export...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export Excel
                        </>
                      )}
                    </button>

                    {/* Export PDF Button */}
                    <button
                      onClick={exportToPDF}
                      className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center font-medium shadow-md hover:shadow-lg"
                      disabled={
                        getFilteredProductSummary().length === 0 ||
                        isExportingPDF
                      }
                    >
                      {isExportingPDF ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          กำลัง Export...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Export PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-8 dark:bg-slate-800">
                <div className="overflow-x-auto max-h-[600px] relative border-2 border-gray-300 dark:border-slate-500 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b-3 border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800">
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[150px] bg-white dark:bg-slate-800 border-r-2 border-gray-300 dark:border-slate-500">
                          รหัสสินค้า
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[250px] bg-white dark:bg-slate-800 border-r-2 border-gray-300 dark:border-slate-500">
                          ชื่อสินค้า
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[150px] bg-white dark:bg-slate-800 border-r-2 border-gray-300 dark:border-slate-500">
                          กลุ่มสินค้า
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[80px] bg-white dark:bg-slate-800 border-r-2 border-gray-300 dark:border-slate-500">
                          หน่วย
                        </th>
                        <th
                          className="text-center p-3 bg-gray-50 dark:bg-slate-800 font-bold text-gray-700 dark:text-slate-300 rounded-tl-lg min-w-[100px] border-r-2 border-gray-300 dark:border-slate-500"
                          colSpan={3}
                        >
                          <div className="flex items-center justify-center">
                            รวมทั้งหมด
                          </div>
                        </th>
                        <th
                          className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/50 font-bold text-emerald-700 dark:text-emerald-300 rounded-tl-lg min-w-[100px] border-r-2 border-l-2 border-gray-300 dark:border-slate-500"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            0-90 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-3 bg-amber-50 dark:bg-amber-900/50 font-bold text-amber-700 dark:text-amber-300 min-w-[100px] border-r-2 border-gray-300 dark:border-slate-500"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            90-180 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-3 bg-orange-50 dark:bg-orange-900/50 font-bold text-orange-700 dark:text-orange-300 min-w-[100px] border-r-2 border-gray-300 dark:border-slate-500"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <Zap className="w-4 h-4 mr-1" />
                            180-360 วัน
                          </div>
                        </th>
                        <th
                          className="text-center p-3 bg-rose-50 dark:bg-rose-900/50 font-bold text-rose-700 dark:text-rose-300 rounded-tr-lg min-w-[100px] border-r-2 border-gray-300 dark:border-slate-500"
                          colSpan={2}
                        >
                          <div className="flex items-center justify-center">
                            <XCircle className="w-4 h-4 mr-1" />
                            &gt;360 วัน
                          </div>
                        </th>
                      </tr>
                      <tr className="border-b-2 border-gray-300 dark:border-slate-500 text-sm bg-white dark:bg-slate-800">
                        <th className="bg-white dark:bg-slate-800 border-r-2 border-gray-300 dark:border-slate-500"></th>
                        <th className="bg-white dark:bg-slate-800 border-r-2 border-gray-300 dark:border-slate-500"></th>
                        <th className="bg-white dark:bg-slate-800 border-r-2 border-gray-300 dark:border-slate-500"></th>
                        <th className="bg-white dark:bg-slate-800 border-r-2 border-gray-300 dark:border-slate-500"></th>
                        <th className="text-right p-3 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium border-r border-l-2 border-gray-300 dark:border-slate-500">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium border-r border-gray-300 dark:border-slate-500">
                          ราคาทุน
                        </th>
                        <th className="text-right p-3 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium border-r-2 border-gray-300 dark:border-slate-500">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-green-50 dark:bg-emerald-900/50 text-green-600 dark:text-emerald-300 font-medium border-r border-l-2 border-gray-300 dark:border-slate-500">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-green-50 dark:bg-emerald-900/50 text-green-600 dark:text-emerald-300 font-medium border-r-2 border-gray-300 dark:border-slate-500">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-yellow-50 dark:bg-amber-900/50 text-yellow-600 dark:text-amber-300 font-medium border-r border-gray-300 dark:border-slate-500">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-yellow-50 dark:bg-amber-900/50 text-yellow-600 dark:text-amber-300 font-medium border-r-2 border-gray-300 dark:border-slate-500">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 font-medium border-r border-gray-300 dark:border-slate-500">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 font-medium border-r-2 border-gray-300 dark:border-slate-500">
                          มูลค่า
                        </th>
                        <th className="text-right p-3 bg-red-50 dark:bg-rose-900/50 text-red-600 dark:text-rose-300 font-medium border-r border-gray-300 dark:border-slate-500">
                          จำนวน
                        </th>
                        <th className="text-right p-3 bg-red-50 dark:bg-rose-900/50 text-red-600 dark:text-rose-300 font-medium border-r-2 border-gray-300 dark:border-slate-500">
                          มูลค่า
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isProductSearching ? (
                        <tr>
                          <td colSpan={16} className="p-0">
                            <SearchLoading
                              message="กำลังค้นหาสินค้า..."
                              size="md"
                              className="py-12"
                            />
                          </td>
                        </tr>
                      ) : getFilteredProductSummary().length === 0 ? (
                        <tr>
                          <td colSpan={16} className="p-0">
                            <EmptyState
                              type={
                                debouncedProductSearch.trim()
                                  ? "search"
                                  : productSummary.length === 0
                                  ? "no-data"
                                  : "filter"
                              }
                              size="md"
                              className="py-12"
                              title={
                                debouncedProductSearch.trim()
                                  ? "ไม่พบสินค้าที่ค้นหา"
                                  : productSummary.length === 0
                                  ? "ไม่มีข้อมูลสินค้า"
                                  : "ไม่มีสินค้าที่ตรงกับเงื่อนไข"
                              }
                              description={
                                debouncedProductSearch.trim()
                                  ? `ไม่พบสินค้าที่ตรงกับ "${debouncedProductSearch}"`
                                  : productSummary.length === 0
                                  ? "ยังไม่มีข้อมูลสินค้าที่จะแสดงในขณะนี้"
                                  : "ลองปรับเปลี่ยนตัวกรองหรือช่วงวันที่"
                              }
                              actionLabel={
                                debouncedProductSearch.trim()
                                  ? "ล้างการค้นหา"
                                  : undefined
                              }
                              onAction={
                                debouncedProductSearch.trim()
                                  ? () => {
                                      setProductSearch("");
                                      setProductPage(1);
                                    }
                                  : undefined
                              }
                            />
                          </td>
                        </tr>
                      ) : (
                        getPaginatedData(
                          getFilteredProductSummary(),
                          productPage,
                          ITEMS_PER_PAGE
                        ).map((product, index) => (
                          <tr
                            key={index}
                            className="border-b-2 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-150"
                          >
                            {/* ✅ แยก ProdCode และ ProdName เป็น 2 คอลัมน์ */}
                            <td className="p-2 text-gray-700 dark:text-slate-300 font-mono border-r-2 border-gray-200 dark:border-slate-600">
                              {product.ProdCode}
                            </td>
                            <td className="p-2 text-gray-800 dark:text-slate-200 border-r-2 border-gray-200 dark:border-slate-600">
                              {product.ProdName}
                            </td>
                            <td className="p-2 text-gray-600 dark:text-slate-400 border-r-2 border-gray-200 dark:border-slate-600">
                              {product.ProdGrp || "-"}
                            </td>
                            <td className="p-2 text-gray-600 dark:text-slate-400 border-r-2 border-gray-200 dark:border-slate-600">
                              {product.UnitName}
                            </td>
                            <td className="p-2 text-right text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 border-r border-l-2 border-gray-200 dark:border-slate-600">
                              {formatQuantity(product.totalQty)}
                            </td>
                            <td className="p-2 text-right text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-600">
                              {formatUnitCost(
                                product.totalValue / product.totalQty || 0
                              )}
                            </td>
                            <td className="p-2 text-right text-gray-700 dark:text-emerald-300 bg-gray-50 dark:bg-slate-800 border-r-2 border-gray-200 dark:border-slate-600">
                              {formatMoney(product.totalValue)}
                            </td>

                            {/* 0-90 days */}
                            <td className="p-2 text-right bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-r border-l-2 border-gray-200 dark:border-slate-600">
                              {formatQuantity(product.ageBuckets["0-90"].qty)}
                            </td>
                            <td className="p-2 text-right bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-r-2 border-gray-200 dark:border-slate-600">
                              {formatMoney(product.ageBuckets["0-90"].value)}
                            </td>

                            {/* 90-180 days */}
                            <td className="p-2 text-right bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-r border-gray-200 dark:border-slate-600">
                              {formatQuantity(product.ageBuckets["90-180"].qty)}
                            </td>
                            <td className="p-2 text-right bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-r-2 border-gray-200 dark:border-slate-600">
                              {formatMoney(product.ageBuckets["90-180"].value)}
                            </td>

                            {/* 180-360 days */}
                            <td className="p-2 text-right bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-r border-gray-200 dark:border-slate-600">
                              {formatQuantity(
                                product.ageBuckets["180-360"].qty
                              )}
                            </td>
                            <td className="p-2 text-right bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-r-2 border-gray-200 dark:border-slate-600">
                              {formatMoney(product.ageBuckets["180-360"].value)}
                            </td>

                            {/* >360 days */}
                            <td className="p-2 text-right bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-r border-gray-200 dark:border-slate-600">
                              {formatQuantity(product.ageBuckets[">360"].qty)}
                            </td>
                            <td className="p-2 text-right bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-r-2 border-gray-200 dark:border-slate-600">
                              {formatMoney(product.ageBuckets[">360"].value)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Raw Data Table */}
          {filteredData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-slate-600 overflow-hidden">
              <div className="bg-[#1677ff] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-lg p-2 mr-3">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">ข้อมูลที่กรอง</h3>
                      <p className="text-blue-100 text-sm mt-1">
                        แสดง {getFilteredRawData().length.toLocaleString()}{" "}
                        รายการ จากทั้งหมด {data.length.toLocaleString()} รายการ
                      </p>
                    </div>
                  </div>

                  {/* Top Pagination Controls for Raw Data */}
                  {getFilteredRawData().length > RAW_DATA_PER_PAGE && (
                    <div className="flex items-center space-x-4 text-white">
                      <div className="text-sm opacity-90">
                        หน้า {rawDataPage} จาก{" "}
                        {getTotalPages(
                          getFilteredRawData().length,
                          RAW_DATA_PER_PAGE
                        )}
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
                                  getFilteredRawData().length,
                                  RAW_DATA_PER_PAGE
                                )
                              ),
                            },
                            (_, i) => {
                              const totalPages = getTotalPages(
                                getFilteredRawData().length,
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
                                  getFilteredRawData().length,
                                  RAW_DATA_PER_PAGE
                                ),
                                rawDataPage + 1
                              )
                            )
                          }
                          disabled={
                            rawDataPage ===
                            getTotalPages(
                              getFilteredRawData().length,
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

                {/* Search Input */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="ค้นหาข้อมูลดิบ..."
                      value={rawDataSearch}
                      onChange={(e) => {
                        setRawDataSearch(e.target.value);
                        setRawDataPage(1); // Reset to first page when searching
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    />
                    {rawDataSearch && (
                      <button
                        onClick={() => {
                          setRawDataSearch("");
                          setRawDataPage(1);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Export Excel Button for Raw Data */}
                  <button
                    onClick={exportRawDataToExcel}
                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center font-medium shadow-md hover:shadow-lg ${
                      isExportingExcel
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600"
                    }`}
                    disabled={
                      getFilteredRawData().length === 0 || isExportingExcel
                    }
                  >
                    {isExportingExcel ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        กำลังประมวลผล...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-8 dark:bg-slate-800">
                <div className="overflow-x-auto max-h-[600px] relative border-2 border-gray-300 dark:border-slate-500 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b-3 border-gray-300 dark:border-slate-500 bg-gray-50 dark:bg-slate-700">
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          บริษัท
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          สาขา
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[110px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          วันที่เอกสาร
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[120px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          เลขที่เอกสาร
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[150px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          รหัสสินค้า
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[300px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          ชื่อสินค้า
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[150px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          กลุ่มสินค้า
                        </th>
                        <th className="text-left p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[80px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          หน่วย
                        </th>
                        <th className="text-right p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[80px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          จำนวน
                        </th>
                        <th className="text-right p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          ราคาทุน
                        </th>
                        <th className="text-right p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[120px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          มูลค่า
                        </th>
                        <th className="text-center p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[80px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          อายุ (วัน)
                        </th>
                        <th className="text-center p-3 font-bold text-gray-700 dark:text-slate-300 min-w-[100px] bg-gray-50 dark:bg-slate-700 border-r-2 border-gray-300 dark:border-slate-500">
                          กลุ่มอายุ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isSearching ? (
                        <tr>
                          <td colSpan={13} className="p-0">
                            <SearchLoading
                              message="กำลังค้นหาข้อมูล..."
                              size="md"
                              className="py-12"
                            />
                          </td>
                        </tr>
                      ) : getFilteredRawData().length === 0 ? (
                        <tr>
                          <td colSpan={13} className="p-0">
                            <EmptyState
                              type={
                                debouncedRawDataSearch.trim()
                                  ? "search"
                                  : filteredData.length === 0
                                  ? "no-data"
                                  : "filter"
                              }
                              size="md"
                              className="py-12"
                              title={
                                debouncedRawDataSearch.trim()
                                  ? "ไม่พบผลการค้นหา"
                                  : filteredData.length === 0
                                  ? "ไม่มีข้อมูล"
                                  : "ไม่มีข้อมูลที่ตรงกับเงื่อนไข"
                              }
                              description={
                                debouncedRawDataSearch.trim()
                                  ? `ไม่พบข้อมูลที่ตรงกับ "${debouncedRawDataSearch}"`
                                  : filteredData.length === 0
                                  ? "ยังไม่มีข้อมูลที่จะแสดงในขณะนี้"
                                  : "ลองปรับเปลี่ยนตัวกรองหรือช่วงวันที่"
                              }
                              actionLabel={
                                debouncedRawDataSearch.trim()
                                  ? "ล้างการค้นหา"
                                  : undefined
                              }
                              onAction={
                                debouncedRawDataSearch.trim()
                                  ? () => {
                                      setRawDataSearch("");
                                      setRawDataPage(1);
                                    }
                                  : undefined
                              }
                            />
                          </td>
                        </tr>
                      ) : (
                        getPaginatedData(
                          getFilteredRawData(),
                          rawDataPage,
                          RAW_DATA_PER_PAGE
                        ).map((row, index) => (
                          <tr
                            key={index}
                            className="border-b-2 border-gray-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-150"
                          >
                            <td className="p-2 text-gray-700 dark:text-slate-300 border-r-2 border-gray-200 dark:border-slate-600">
                              {row.Corp}
                            </td>
                            <td className="p-2 text-gray-600 dark:text-slate-400 border-r-2 border-gray-200 dark:border-slate-600">
                              {row.Branch}
                            </td>
                            <td className="p-2 text-gray-600 dark:text-slate-400 border-r-2 border-gray-200 dark:border-slate-600">
                              {row.DocDate
                                ? (() => {
                                    const date = new Date(row.DocDate);
                                    const day = String(date.getDate()).padStart(
                                      2,
                                      "0"
                                    );
                                    const month = String(
                                      date.getMonth() + 1
                                    ).padStart(2, "0");
                                    const year = String(
                                      date.getFullYear() + 543
                                    ).slice(-2);
                                    return `${day}/${month}/${year}`;
                                  })()
                                : "N/A"}
                            </td>
                            <td className="p-2 text-gray-600 dark:text-slate-400 border-r-2 border-gray-200 dark:border-slate-600">
                              {row.DocNumber || "N/A"}
                            </td>
                            {/* ✅ แยก ProdCode และ ProdName เป็น 2 คอลัมน์ */}
                            <td className="p-2 text-gray-700 dark:text-slate-300 font-mono border-r-2 border-gray-200 dark:border-slate-600">
                              {row.ProdCode}
                            </td>
                            <td className="p-2 text-gray-800 dark:text-slate-200 border-r-2 border-gray-200 dark:border-slate-600">
                              {row.ProdName}
                            </td>
                            <td className="p-2 text-gray-600 dark:text-slate-400 border-r-2 border-gray-200 dark:border-slate-600">
                              {row.ProdGrp || "-"}
                            </td>
                            <td className="p-2 text-gray-600 dark:text-slate-400 border-r-2 border-gray-200 dark:border-slate-600">
                              {row.UnitName}
                            </td>
                            <td className="p-2 text-right text-gray-800 dark:text-slate-200 border-r-2 border-gray-200 dark:border-slate-600">
                              {formatQuantity(row.QtyFromThisDoc || 0)}
                            </td>
                            <td className="p-2 text-right text-gray-800 dark:text-emerald-400 border-r-2 border-gray-200 dark:border-slate-600">
                              {formatUnitCost(row.AverageCost || 0)}
                            </td>
                            <td className="p-2 text-right text-gray-800 dark:text-emerald-300 border-r-2 border-gray-200 dark:border-slate-600">
                              {formatMoney(
                                (row.QtyFromThisDoc || 0) *
                                  (row.AverageCost || 0)
                              )}
                            </td>
                            <td className="p-2 text-center text-gray-700 dark:text-slate-300 border-r-2 border-gray-200 dark:border-slate-600">
                              {row.DaysAge}
                            </td>
                            <td className="p-2 text-center border-r-2 border-gray-200 dark:border-slate-600">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  row.AgeBucket === "Over 365 Days"
                                    ? "bg-rose-500 text-white"
                                    : row.AgeBucket === "0-90 Days"
                                    ? "bg-[#dbfce5] text-gray-800"
                                    : "bg-gray-500 text-white"
                                }`}
                              >
                                {row.AgeBucket}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
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
