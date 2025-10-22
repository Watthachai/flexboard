/**
 * TODO #2: TypeScript Types for Inventory
 *
 * File: src/lib/types/inventory.ts
 * Priority: HIGH
 * Estimated Time: 20 minutes
 */

/**
 * View Configuration
 * ใช้สำหรับระบุ view ที่ต้องการ query
 */
export interface ViewConfig {
  customer: string; // เช่น PVSG, ABC, XYZ
  area: string; // เช่น INVENTORY, SALES, PURCHASING
  dashboard: string; // เช่น 001, 002, 003
  view: string; // เช่น VIEW_001, VIEW_002
}

/**
 * Database Record from Inventory View
 * ✅ Manager Approved - Product Code/Name Separation
 */
export interface DatabaseRecord {
  dataDate: Date;
  corp: string;
  branch: string;

  // Product Information
  prodCode: string; // รหัสสินค้า
  prodName: string; // ชื่อสินค้า
  prodGrp: string | null; // Product Group

  // Document Information
  unitName: string;
  docNumber: string;
  docDate: Date;
  qtyFromThisDoc: number;

  // Pricing
  buyPrice: number | null; // ราคาซื้อ
  averageCost: number; // ราคาทุนเฉลี่ย
  totalFromBuyPrice: number | null; // มูลค่ารวมจากราคาซื้อ
  totalFromAverageCost: number | null; // มูลค่ารวมจากราคาทุนเฉลี่ย

  // Age Information
  daysAge: number | null; // อายุสินค้า (วัน)
  ageBucket: string | null; // ช่วงอายุสินค้า

  // Metadata
  createDate: Date;

  // Computed fields (backward compatibility)
  totalValueRow: number | null; // qtySafe * costSafe
  qtySafe: number | null; // coalesce(qtyFromThisDoc, 0)
  costSafe: number | null; // coalesce(averageCost, 0)
}

/**
 * Product Summary by Age Bucket
 */
export interface ProductAgeBucketSummary {
  prodCode: string;
  prodName: string;
  prodGrp: string | null;
  ageBuckets: {
    [key: string]: number; // ageBucket -> total value
  };
  totalValue: number;
  totalQty: number;
}

/**
 * Statistics Summary
 */
export interface InventoryStats {
  totalRecords: number;
  totalValue: number;
  totalQty: number;
  uniqueProducts: number;
  uniqueBranches: number;
  oldestDate: Date | null;
  newestDate: Date | null;
  averageAge: number | null;
}

/**
 * Filter Options for Inventory Query
 */
export interface InventoryFilters {
  corp?: string | null;
  branch?: string | null;
  prodCode?: string | null;
  prodName?: string | null;
  prodGrp?: string | null;
  ageBucket?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  minValue?: number | null;
  maxValue?: number | null;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  pagination?: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
}

/**
 * Available View Information
 */
export interface AvailableView {
  fullName: string; // VVPVSG_INVENTORY_001_VIEW_001
  customer: string; // PVSG
  area: string; // INVENTORY
  dashboard: string; // 001
  view: string; // VIEW_001
  description?: string; // Optional description
}

/**
 * View Metadata from SQL Server
 */
export interface ViewMetadata {
  tableName: string;
  schemaName: string;
  createdDate: Date;
  modifiedDate: Date;
}

/**
 * TODO CHECKLIST:
 * □ Create this file at src/lib/types/inventory.ts
 * □ Review all interface fields match SQL Server view columns
 * □ Add JSDoc comments for complex types
 * □ Export all types from index.ts if needed
 * □ Update existing components to use these types
 * □ Remove old Prisma-generated types
 */
