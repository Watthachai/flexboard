import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Filter parameters
    const branch = searchParams.get("branch");
    const corp = searchParams.get("corp");
    const prodCode = searchParams.get("prodCode");
    const prodName = searchParams.get("prodName");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Date filters (for global filters - consistent with other APIs)
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Multi-value filters (for global filters)
    const corps = searchParams.get("corps")?.split(",") || [];
    const branches = searchParams.get("branches")?.split(",") || [];

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "2000");
    const noPagination = searchParams.get("noPagination") === "true";

    // Sorting parameters
    const sortBy = searchParams.get("sortBy") || "docDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    console.log(
      `[Raw API] Filters: corps=${corps.length}, branches=${
        branches.length
      }, dateRange=${dateFrom || fromDate}-${
        dateTo || toDate
      }, page=${page}, pageSize=${pageSize}`
    );

    // Build where clause with proper typing
    const where: Prisma.VVPVSG_INVENTORY_001_VIEW_001WhereInput = {};

    // Single value filters (backward compatibility)
    if (branch) where.branch = branch;
    if (corp) where.corp = corp;
    if (prodCode) where.prodCode = { contains: prodCode };
    if (prodName) where.prodName = { contains: prodName };

    // Multi-value filters (global filters)
    if (corps.length > 0) where.corp = { in: corps };
    if (branches.length > 0) where.branch = { in: branches };

    // Date filters (support both parameter names)
    const finalDateFrom = dateFrom || fromDate;
    const finalDateTo = dateTo || toDate;

    if (finalDateFrom || finalDateTo) {
      where.dataDate = {};
      if (finalDateFrom) where.dataDate.gte = new Date(finalDateFrom);
      if (finalDateTo) where.dataDate.lte = new Date(finalDateTo);
    }

    // Get total count for pagination
    const totalRecords = await prisma.vVPVSG_INVENTORY_001_VIEW_001.count({
      where,
    });

    // Build order by clause
    const validSortFields = [
      "docDate",
      "dataDate",
      "prodCode",
      "prodName",
      "corp",
      "branch",
      "daysAge",
    ];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "docDate";
    const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

    // Apply pagination and sorting
    const queryOptions: Prisma.VVPVSG_INVENTORY_001_VIEW_001FindManyArgs = {
      where,
      orderBy: { [orderByField]: orderByDirection },
    };

    if (!noPagination) {
      queryOptions.skip = (page - 1) * pageSize;
      queryOptions.take = pageSize;
    }

    const startTime = Date.now();
    const rows = await prisma.vVPVSG_INVENTORY_001_VIEW_001.findMany(
      queryOptions
    );
    const queryTime = Date.now() - startTime;

    // Transform to PascalCase for manifest compatibility
    const transformedRows = rows.map((row) => ({
      // PascalCase fields for manifest compatibility
      DataDate: row.dataDate,
      DocDate: row.docDate,
      DocNumber: row.docNumber,
      Corp: row.corp,
      Branch: row.branch,
      ProdCode: row.prodCode,
      ProdName: row.prodName,
      ProdGrp: row.prodGrp,
      UnitName: row.unitName,
      QtyFromThisDoc: row.qtyFromThisDoc,
      BuyPrice: row.buyPrice,
      AverageCost: row.averageCost,
      TotalFromBuyPrice: row.totalFromBuyPrice,
      TotalFromAverageCost: row.totalFromAverageCost,
      DaysAge: row.daysAge,
      AgeBucket: row.ageBucket,
      CreateDate: row.createDate,
    }));

    // Return data with performance info
    return NextResponse.json({
      success: true,
      count: transformedRows.length,
      totalRecords,
      page: noPagination ? 1 : page,
      pageSize: noPagination ? totalRecords : pageSize,
      totalPages: !noPagination ? Math.ceil(totalRecords / pageSize) : 1,
      rows: transformedRows,
      performanceMode: "sql-pushdown",
      queryTimeMs: queryTime,
    });
  } catch (error) {
    console.error("[inventory/raw] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory data" },
      { status: 500 }
    );
  }
}
