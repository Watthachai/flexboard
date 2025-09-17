/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");
    const corp = searchParams.get("corp");
    const prod = searchParams.get("prod");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "2000");
    const noPagination = searchParams.get("noPagination") === "true";

    // Build where clause
    const where: any = {};

    if (branch) where.branch = branch;
    if (corp) where.corp = corp;
    if (prod) where.prod = { contains: prod };

    if (fromDate || toDate) {
      where.dataDate = {};
      if (fromDate) where.dataDate.gte = new Date(fromDate);
      if (toDate) where.dataDate.lte = new Date(toDate);
    }

    // Get total count
    const totalRecords = await prisma.inventoryRaw.count({ where });

    // Apply pagination only if not disabled
    const queryOptions: any = {
      where,
      orderBy: { docDate: "desc" },
    };

    if (!noPagination) {
      queryOptions.skip = (page - 1) * pageSize;
      queryOptions.take = pageSize;
    }

    const rows = await prisma.inventoryRaw.findMany(queryOptions);

    // Transform to PascalCase to match manifest expectations
    const transformedRows = rows.map((row) => ({
      ...row,
      // Add PascalCase fields for manifest compatibility
      DataDate: row.dataDate,
      DocDate: row.docDate,
      DocNumber: row.docNumber,
      QtyFromThisDoc: row.qtyFromThisDoc,
      AverageCost: row.averageCost,
      Corp: row.corp,
      Branch: row.branch,
      Prod: row.prod,
      UnitName: row.unitName,
    }));

    // Return data with both camelCase and PascalCase fields
    return NextResponse.json({
      success: true,
      count: transformedRows.length,
      totalRecords,
      page: noPagination ? 1 : page,
      pageSize: noPagination ? totalRecords : pageSize,
      totalPages: !noPagination ? Math.ceil(totalRecords / pageSize) : 1,
      rows: transformedRows,
    });
  } catch (error) {
    console.error("[inventory/raw] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory data" },
      { status: 500 }
    );
  }
}
