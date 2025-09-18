/**
 * Inventory KPI API - SQL Pushdown Implementation
 * Returns key performance indicators using pre-computed fields
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
      `[KPI API] Filters: corps=${corps.length}, branches=${branches.length}, dateRange=${dateFrom}-${dateTo}`
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

    // Use SQL aggregation with pre-computed fields for maximum performance
    const kpiResults = await Promise.all([
      // Total value by age bucket
      prisma.inventoryRaw.aggregate({
        where: { ...whereClause, ageBucket: "0-90" },
        _sum: { totalValueRow: true, qtySafe: true },
        _count: true,
      }),
      prisma.inventoryRaw.aggregate({
        where: { ...whereClause, ageBucket: "91-180" },
        _sum: { totalValueRow: true, qtySafe: true },
        _count: true,
      }),
      prisma.inventoryRaw.aggregate({
        where: { ...whereClause, ageBucket: "181-365" },
        _sum: { totalValueRow: true, qtySafe: true },
        _count: true,
      }),
      prisma.inventoryRaw.aggregate({
        where: { ...whereClause, ageBucket: ">365" },
        _sum: { totalValueRow: true, qtySafe: true },
        _count: true,
      }),
      // Overall totals
      prisma.inventoryRaw.aggregate({
        where: whereClause,
        _sum: { totalValueRow: true, qtySafe: true },
        _count: true,
      }),
    ]);

    const [
      bucket_0_90,
      bucket_91_180,
      bucket_181_365,
      bucket_365_plus,
      totals,
    ] = kpiResults;

    const kpiData = {
      // Age bucket values
      value_0_90: bucket_0_90._sum.totalValueRow || 0,
      value_91_180: bucket_91_180._sum.totalValueRow || 0,
      value_181_365: bucket_181_365._sum.totalValueRow || 0,
      value_365_plus: bucket_365_plus._sum.totalValueRow || 0,

      // Age bucket quantities
      qty_0_90: bucket_0_90._sum.qtySafe || 0,
      qty_91_180: bucket_91_180._sum.qtySafe || 0,
      qty_181_365: bucket_181_365._sum.qtySafe || 0,
      qty_365_plus: bucket_365_plus._sum.qtySafe || 0,

      // Age bucket counts
      count_0_90: bucket_0_90._count || 0,
      count_91_180: bucket_91_180._count || 0,
      count_181_365: bucket_181_365._count || 0,
      count_365_plus: bucket_365_plus._count || 0,

      // Totals
      totalValue: totals._sum.totalValueRow || 0,
      totalQty: totals._sum.qtySafe || 0,
      totalRecords: totals._count || 0,

      // Percentages
      percent_0_90: totals._sum.totalValueRow
        ? ((bucket_0_90._sum.totalValueRow || 0) / totals._sum.totalValueRow) *
          100
        : 0,
      percent_91_180: totals._sum.totalValueRow
        ? ((bucket_91_180._sum.totalValueRow || 0) /
            totals._sum.totalValueRow) *
          100
        : 0,
      percent_181_365: totals._sum.totalValueRow
        ? ((bucket_181_365._sum.totalValueRow || 0) /
            totals._sum.totalValueRow) *
          100
        : 0,
      percent_365_plus: totals._sum.totalValueRow
        ? ((bucket_365_plus._sum.totalValueRow || 0) /
            totals._sum.totalValueRow) *
          100
        : 0,
    };

    console.log(
      `[KPI API] Total records: ${kpiData.totalRecords}, Total value: ${kpiData.totalValue}`
    );

    return NextResponse.json({
      success: true,
      data: kpiData,
      performanceMode: "sql-pushdown",
      executionTime: Date.now(),
    });
  } catch (error) {
    console.error("[KPI API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch KPI data" },
      { status: 500 }
    );
  }
}
