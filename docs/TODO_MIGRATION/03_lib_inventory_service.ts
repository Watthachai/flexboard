/**
 * TODO #3: Inventory Service Layer
 *
 * File: src/lib/inventory-service.ts
 * Priority: HIGH
 * Estimated Time: 1 hour
 *
 * Dependencies:
 * - lib/db.ts
 * - lib/types/inventory.ts
 */

import { getConnection, sql } from "./db";
import type {
  ViewConfig,
  DatabaseRecord,
  InventoryFilters,
  PaginationOptions,
  ProductAgeBucketSummary,
  InventoryStats,
  AvailableView,
} from "./types/inventory";

/**
 * Build view name from configuration
 * Format: VV{CUSTOMER}_{AREA}_{DASHBOARD}_{VIEW}
 *
 * @example
 * buildViewName({ customer: 'PVSG', area: 'INVENTORY', dashboard: '001', view: 'VIEW_001' })
 * // Returns: VVPVSG_INVENTORY_001_VIEW_001
 */
export function buildViewName(config: ViewConfig): string {
  const { customer, area, dashboard, view } = config;

  // Validate inputs to prevent SQL injection
  const validatePart = (part: string, name: string) => {
    if (!/^[A-Z0-9_]+$/i.test(part)) {
      throw new Error(
        `Invalid ${name}: ${part}. Only alphanumeric and underscore allowed.`
      );
    }
  };

  validatePart(customer, "customer");
  validatePart(area, "area");
  validatePart(dashboard, "dashboard");
  validatePart(view, "view");

  return `VV${customer}_${area}_${dashboard}_${view}`;
}

/**
 * Parse view name back to config
 * @example
 * parseViewName('VVPVSG_INVENTORY_001_VIEW_001')
 * // Returns: { customer: 'PVSG', area: 'INVENTORY', dashboard: '001', view: 'VIEW_001' }
 */
export function parseViewName(viewName: string): ViewConfig | null {
  const match = viewName.match(
    /^VV([A-Z0-9]+)_([A-Z0-9]+)_([A-Z0-9]+)_([A-Z0-9_]+)$/i
  );

  if (!match) {
    return null;
  }

  return {
    customer: match[1],
    area: match[2],
    dashboard: match[3],
    view: match[4],
  };
}

/**
 * Get inventory data from view
 */
export async function getInventoryData(
  config: ViewConfig,
  filters?: InventoryFilters,
  pagination?: PaginationOptions
): Promise<DatabaseRecord[]> {
  const pool = await getConnection();
  const viewName = buildViewName(config);

  // Base query
  let query = `
    SELECT 
      dataDate, corp, branch,
      prodCode, prodName, prodGrp,
      unitName, docNumber, docDate,
      qtyFromThisDoc, buyPrice, averageCost,
      totalFromBuyPrice, totalFromAverageCost,
      daysAge, ageBucket, createDate,
      totalValueRow, qtySafe, costSafe
    FROM [shareddata].[dbo].[${viewName}]
    WHERE 1=1
  `;

  const request = pool.request();

  // Add filters
  if (filters) {
    if (filters.corp) {
      query += ` AND corp = @corp`;
      request.input("corp", sql.NVarChar, filters.corp);
    }

    if (filters.branch) {
      query += ` AND branch = @branch`;
      request.input("branch", sql.NVarChar, filters.branch);
    }

    if (filters.prodCode) {
      query += ` AND prodCode LIKE @prodCode`;
      request.input("prodCode", sql.NVarChar, `%${filters.prodCode}%`);
    }

    if (filters.prodName) {
      query += ` AND prodName LIKE @prodName`;
      request.input("prodName", sql.NVarChar, `%${filters.prodName}%`);
    }

    if (filters.prodGrp) {
      query += ` AND prodGrp = @prodGrp`;
      request.input("prodGrp", sql.NVarChar, filters.prodGrp);
    }

    if (filters.ageBucket) {
      query += ` AND ageBucket = @ageBucket`;
      request.input("ageBucket", sql.NVarChar, filters.ageBucket);
    }

    if (filters.dateFrom) {
      query += ` AND dataDate >= @dateFrom`;
      request.input("dateFrom", sql.DateTime, filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ` AND dataDate <= @dateTo`;
      request.input("dateTo", sql.DateTime, filters.dateTo);
    }

    if (filters.minValue !== null && filters.minValue !== undefined) {
      query += ` AND totalFromAverageCost >= @minValue`;
      request.input("minValue", sql.Decimal(18, 2), filters.minValue);
    }

    if (filters.maxValue !== null && filters.maxValue !== undefined) {
      query += ` AND totalFromAverageCost <= @maxValue`;
      request.input("maxValue", sql.Decimal(18, 2), filters.maxValue);
    }
  }

  // Add ordering
  if (pagination?.orderBy) {
    const validColumns = [
      "dataDate",
      "corp",
      "branch",
      "prodCode",
      "prodName",
      "prodGrp",
      "docNumber",
      "docDate",
      "qtyFromThisDoc",
      "averageCost",
      "totalFromAverageCost",
      "daysAge",
      "ageBucket",
    ];

    if (validColumns.includes(pagination.orderBy)) {
      const direction = pagination.orderDirection === "DESC" ? "DESC" : "ASC";
      query += ` ORDER BY ${pagination.orderBy} ${direction}`;
    }
  } else {
    query += ` ORDER BY dataDate DESC, prodCode ASC`;
  }

  // Add pagination
  if (pagination) {
    const offset = (pagination.page - 1) * pagination.pageSize;
    query += ` OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`;
    request.input("offset", sql.Int, offset);
    request.input("pageSize", sql.Int, pagination.pageSize);
  }

  const result = await request.query(query);
  return result.recordset as DatabaseRecord[];
}

/**
 * Get inventory statistics
 */
export async function getInventoryStats(
  config: ViewConfig,
  filters?: InventoryFilters
): Promise<InventoryStats> {
  const pool = await getConnection();
  const viewName = buildViewName(config);

  let query = `
    SELECT 
      COUNT(*) as totalRecords,
      SUM(ISNULL(totalFromAverageCost, 0)) as totalValue,
      SUM(ISNULL(qtyFromThisDoc, 0)) as totalQty,
      COUNT(DISTINCT prodCode) as uniqueProducts,
      COUNT(DISTINCT branch) as uniqueBranches,
      MIN(dataDate) as oldestDate,
      MAX(dataDate) as newestDate,
      AVG(CAST(ISNULL(daysAge, 0) AS FLOAT)) as averageAge
    FROM [shareddata].[dbo].[${viewName}]
    WHERE 1=1
  `;

  const request = pool.request();

  // Add same filters as getInventoryData
  if (filters) {
    if (filters.corp) {
      query += ` AND corp = @corp`;
      request.input("corp", sql.NVarChar, filters.corp);
    }
    // ... (copy filter logic from above)
  }

  const result = await request.query(query);
  return result.recordset[0] as InventoryStats;
}

/**
 * Get available views from database
 */
export async function getAvailableViews(): Promise<AvailableView[]> {
  const pool = await getConnection();

  const result = await pool.request().query(`
    SELECT 
      TABLE_NAME as tableName,
      TABLE_SCHEMA as schemaName
    FROM INFORMATION_SCHEMA.VIEWS 
    WHERE TABLE_NAME LIKE 'VV%'
    ORDER BY TABLE_NAME
  `);

  return result.recordset
    .map((row: any) => {
      const parsed = parseViewName(row.tableName);
      if (!parsed) return null;

      return {
        fullName: row.tableName,
        customer: parsed.customer,
        area: parsed.area,
        dashboard: parsed.dashboard,
        view: parsed.view,
      } as AvailableView;
    })
    .filter((v): v is AvailableView => v !== null);
}

/**
 * Get unique values for filter dropdowns
 */
export async function getUniqueValues(
  config: ViewConfig,
  column: "corp" | "branch" | "prodGrp" | "ageBucket"
): Promise<string[]> {
  const pool = await getConnection();
  const viewName = buildViewName(config);

  // Validate column name to prevent SQL injection
  const validColumns = ["corp", "branch", "prodGrp", "ageBucket"];
  if (!validColumns.includes(column)) {
    throw new Error(`Invalid column: ${column}`);
  }

  const result = await pool.request().query(`
    SELECT DISTINCT ${column} as value
    FROM [shareddata].[dbo].[${viewName}]
    WHERE ${column} IS NOT NULL
    ORDER BY ${column}
  `);

  return result.recordset.map((row: any) => row.value);
}

/**
 * Get product summary grouped by age buckets
 */
export async function getProductAgeSummary(
  config: ViewConfig,
  filters?: InventoryFilters
): Promise<ProductAgeBucketSummary[]> {
  const pool = await getConnection();
  const viewName = buildViewName(config);

  let query = `
    SELECT 
      prodCode,
      prodName,
      prodGrp,
      ageBucket,
      SUM(ISNULL(totalFromAverageCost, 0)) as bucketValue,
      SUM(ISNULL(qtyFromThisDoc, 0)) as bucketQty
    FROM [shareddata].[dbo].[${viewName}]
    WHERE 1=1
  `;

  const request = pool.request();

  // Add filters (same as above)
  if (filters) {
    // ... copy filter logic
  }

  query += `
    GROUP BY prodCode, prodName, prodGrp, ageBucket
    ORDER BY prodCode, ageBucket
  `;

  const result = await request.query(query);

  // Group by product
  const productMap = new Map<string, ProductAgeBucketSummary>();

  for (const row of result.recordset) {
    const key = row.prodCode;

    if (!productMap.has(key)) {
      productMap.set(key, {
        prodCode: row.prodCode,
        prodName: row.prodName,
        prodGrp: row.prodGrp,
        ageBuckets: {},
        totalValue: 0,
        totalQty: 0,
      });
    }

    const product = productMap.get(key)!;
    product.ageBuckets[row.ageBucket || "Unknown"] = row.bucketValue;
    product.totalValue += row.bucketValue;
    product.totalQty += row.bucketQty;
  }

  return Array.from(productMap.values());
}

/**
 * TODO CHECKLIST:
 * □ Create this file at src/lib/inventory-service.ts
 * □ Test buildViewName() with various inputs
 * □ Test parseViewName() with valid/invalid names
 * □ Test getInventoryData() with different filters
 * □ Test pagination logic
 * □ Test getAvailableViews() returns correct list
 * □ Test SQL injection prevention (try malicious inputs)
 * □ Add error handling for all functions
 * □ Add logging for debugging
 * □ Optimize queries for performance
 */
