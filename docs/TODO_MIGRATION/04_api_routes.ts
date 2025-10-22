/**
 * TODO #4: Update API Routes
 *
 * Priority: HIGH
 * Estimated Time: 45 minutes
 *
 * Files to update:
 * - app/api/inventory/raw/route.ts
 * - app/api/inventory/views/route.ts (NEW)
 * - app/api/inventory/stats/route.ts
 */

// ============================================================================
// FILE 1: app/api/inventory/raw/route.ts
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getInventoryData, buildViewName } from "@/lib/inventory-service";
import type { ViewConfig, InventoryFilters } from "@/lib/types/inventory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get view configuration from query params
    const config: ViewConfig = {
      customer: searchParams.get("customer") || "PVSG",
      area: searchParams.get("area") || "INVENTORY",
      dashboard: searchParams.get("dashboard") || "001",
      view: searchParams.get("view") || "VIEW_001",
    };

    // Get filters
    const filters: InventoryFilters = {
      corp: searchParams.get("corp"),
      branch: searchParams.get("branch"),
      prodCode: searchParams.get("prodCode"),
      prodName: searchParams.get("prodName"),
      prodGrp: searchParams.get("prodGrp"),
      ageBucket: searchParams.get("ageBucket"),
    };

    // Get pagination
    const noPagination = searchParams.get("noPagination") === "true";
    const pagination = noPagination
      ? undefined
      : {
          page: parseInt(searchParams.get("page") || "1"),
          pageSize: parseInt(searchParams.get("pageSize") || "1000"),
          orderBy: searchParams.get("orderBy") || undefined,
          orderDirection:
            (searchParams.get("orderDirection") as "ASC" | "DESC") || "ASC",
        };

    // Fetch data
    const data = await getInventoryData(config, filters, pagination);

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
      viewName: buildViewName(config),
    });
  } catch (error: any) {
    console.error("❌ API Error /api/inventory/raw:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch inventory data",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// FILE 2: app/api/inventory/views/route.ts (NEW FILE)
// ============================================================================

import { NextResponse } from "next/server";
import { getAvailableViews } from "@/lib/inventory-service";

/**
 * GET /api/inventory/views
 * Returns list of available views in database
 */
export async function GET() {
  try {
    const views = await getAvailableViews();

    return NextResponse.json({
      success: true,
      count: views.length,
      views,
    });
  } catch (error: any) {
    console.error("❌ API Error /api/inventory/views:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch available views",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// FILE 3: app/api/inventory/stats/route.ts
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getInventoryStats } from "@/lib/inventory-service";
import type { ViewConfig, InventoryFilters } from "@/lib/types/inventory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get view configuration
    const config: ViewConfig = {
      customer: searchParams.get("customer") || "PVSG",
      area: searchParams.get("area") || "INVENTORY",
      dashboard: searchParams.get("dashboard") || "001",
      view: searchParams.get("view") || "VIEW_001",
    };

    // Get filters
    const filters: InventoryFilters = {
      corp: searchParams.get("corp"),
      branch: searchParams.get("branch"),
      prodCode: searchParams.get("prodCode"),
      prodName: searchParams.get("prodName"),
      prodGrp: searchParams.get("prodGrp"),
      ageBucket: searchParams.get("ageBucket"),
    };

    // Fetch stats
    const stats = await getInventoryStats(config, filters);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("❌ API Error /api/inventory/stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch statistics",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// FILE 4: app/api/inventory/unique-values/route.ts (NEW FILE)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getUniqueValues } from "@/lib/inventory-service";
import type { ViewConfig } from "@/lib/types/inventory";

/**
 * GET /api/inventory/unique-values?column=corp&customer=PVSG&area=INVENTORY...
 * Returns unique values for a specific column (for filter dropdowns)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const column = searchParams.get("column") as
      | "corp"
      | "branch"
      | "prodGrp"
      | "ageBucket";
    if (!column) {
      return NextResponse.json(
        { success: false, error: "column parameter is required" },
        { status: 400 }
      );
    }

    const config: ViewConfig = {
      customer: searchParams.get("customer") || "PVSG",
      area: searchParams.get("area") || "INVENTORY",
      dashboard: searchParams.get("dashboard") || "001",
      view: searchParams.get("view") || "VIEW_001",
    };

    const values = await getUniqueValues(config, column);

    return NextResponse.json({
      success: true,
      column,
      values,
    });
  } catch (error: any) {
    console.error("❌ API Error /api/inventory/unique-values:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch unique values",
      },
      { status: 500 }
    );
  }
}

/**
 * TODO CHECKLIST:
 *
 * □ Update app/api/inventory/raw/route.ts
 *   - Replace Prisma queries with getInventoryData()
 *   - Add view config parameters
 *   - Test with different filters
 *   - Test pagination
 *
 * □ Create app/api/inventory/views/route.ts
 *   - New file to list available views
 *   - Returns array of AvailableView objects
 *   - Test returns all views starting with VV
 *
 * □ Update app/api/inventory/stats/route.ts
 *   - Replace Prisma aggregation with getInventoryStats()
 *   - Add view config parameters
 *   - Test calculations match old results
 *
 * □ Create app/api/inventory/unique-values/route.ts
 *   - New file for filter dropdown values
 *   - Returns unique values for corp, branch, prodGrp, ageBucket
 *   - Test with different view configs
 *
 * □ Remove old Prisma imports from all API routes
 *
 * □ Test all API routes with Postman or curl:
 *   - GET /api/inventory/raw?customer=PVSG&area=INVENTORY&dashboard=001
 *   - GET /api/inventory/views
 *   - GET /api/inventory/stats?corp=XXX
 *   - GET /api/inventory/unique-values?column=corp
 *
 * □ Add error handling and logging
 * □ Add request validation
 * □ Add rate limiting if needed
 */
