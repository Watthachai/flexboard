/**
 * Inventory Summary API - SQL Pushdown Implementation
 * Returns aggregated data using pre-computed fields for better performance
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters from query params
    const corps = searchParams.get("corps")?.split(",") || [];
    const branches = searchParams.get("branches")?.split(",") || [];
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    console.log(
      `[Summary API] Filters: corps=${corps.length}, branches=${branches.length}, dateRange=${dateFrom}-${dateTo}`
    );

    // Build WHERE clause
    const whereClause: Prisma.InventoryRawWhereInput = {};

    if (corps.length > 0) {
      whereClause.corp = { in: corps };
    }

    if (branches.length > 0) {
      whereClause.branch = { in: branches };
    }

    if (dateFrom && dateTo) {
      whereClause.dataDate = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    }

    // Use SQL pushdown with pre-computed fields
    const summaryData = await prisma.inventoryRaw.groupBy({
      by: ["prod", "unitName"],
      where: whereClause,
      _sum: {
        // Use pre-computed fields for better performance
        qtySafe: true,
        totalValueRow: true,
      },
      // Group by age bucket for conditional sums
      orderBy: {
        prod: "asc",
      },
    });

    // Get age bucket breakdown using separate queries for better performance
    const ageBucketSums = await Promise.all([
      // 0-90 days
      prisma.inventoryRaw.groupBy({
        by: ["prod", "unitName"],
        where: { ...whereClause, ageBucket: "0-90" },
        _sum: { qtySafe: true, totalValueRow: true },
      }),
      // 91-180 days
      prisma.inventoryRaw.groupBy({
        by: ["prod", "unitName"],
        where: { ...whereClause, ageBucket: "91-180" },
        _sum: { qtySafe: true, totalValueRow: true },
      }),
      // 181-365 days
      prisma.inventoryRaw.groupBy({
        by: ["prod", "unitName"],
        where: { ...whereClause, ageBucket: "181-365" },
        _sum: { qtySafe: true, totalValueRow: true },
      }),
      // >365 days
      prisma.inventoryRaw.groupBy({
        by: ["prod", "unitName"],
        where: { ...whereClause, ageBucket: ">365" },
        _sum: { qtySafe: true, totalValueRow: true },
      }),
    ]);

    // Combine results
    const productMap = new Map();

    // Initialize with total sums
    summaryData.forEach((item) => {
      const key = `${item.prod}|${item.unitName}`;
      productMap.set(key, {
        prod: item.prod,
        unitName: item.unitName,
        totalQty: item._sum.qtySafe || 0,
        totalValue: item._sum.totalValueRow || 0,
        qty_0_90: 0,
        val_0_90: 0,
        qty_91_180: 0,
        val_91_180: 0,
        qty_181_365: 0,
        val_181_365: 0,
        qty_365_plus: 0,
        val_365_plus: 0,
      });
    });

    // Add age bucket breakdowns
    const ageBucketKeys = [
      ["qty_0_90", "val_0_90"],
      ["qty_91_180", "val_91_180"],
      ["qty_181_365", "val_181_365"],
      ["qty_365_plus", "val_365_plus"],
    ];

    ageBucketSums.forEach((bucketData, index) => {
      const [qtyKey, valKey] = ageBucketKeys[index];
      bucketData.forEach((item) => {
        const key = `${item.prod}|${item.unitName}`;
        const existing = productMap.get(key);
        if (existing) {
          existing[qtyKey] = item._sum.qtySafe || 0;
          existing[valKey] = item._sum.totalValueRow || 0;
        }
      });
    });

    const result = Array.from(productMap.values());

    console.log(`[Summary API] Returned ${result.length} product summaries`);

    return NextResponse.json({
      success: true,
      rows: result, // Use 'rows' instead of 'data' for consistency
      count: result.length,
      totalRecords: result.length,
      performanceMode: "sql-pushdown",
    });
  } catch (error) {
    console.error("[Summary API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch summary data" },
      { status: 500 }
    );
  }
}
