/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");
    const corp = searchParams.get("corp");

    // Build where clause
    const where: any = {};
    if (branch) where.branch = branch;
    if (corp) where.corp = corp;

    // Calculate KPIs directly in database using raw SQL for better performance
    const agingStats = await prisma.$queryRaw`
      SELECT 
        -- Calculate age buckets based on date difference
        CASE 
          WHEN julianday(dataDate) - julianday(docDate) > 365 THEN '>365'
          WHEN julianday(dataDate) - julianday(docDate) > 180 THEN '181-365'
          WHEN julianday(dataDate) - julianday(docDate) > 90 THEN '91-180'
          WHEN julianday(dataDate) - julianday(docDate) >= 0 THEN '0-90'
          ELSE 'Expired'
        END as ageBucket,
        
        -- Sum quantities and values
        COUNT(*) as recordCount,
        SUM(COALESCE(qtyFromThisDoc, 0)) as totalQty,
        SUM(COALESCE(qtyFromThisDoc, 0) * COALESCE(averageCost, 0)) as totalValue
        
      FROM InventoryRaw 
      GROUP BY ageBucket
    `;

    // Transform to KPI format
    const kpis = {
      "0-90": { qty: 0, value: 0, records: 0 },
      "91-180": { qty: 0, value: 0, records: 0 },
      "181-365": { qty: 0, value: 0, records: 0 },
      ">365": { qty: 0, value: 0, records: 0 },
      Expired: { qty: 0, value: 0, records: 0 },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    agingStats.forEach((row: any) => {
      const ageBucket = row.ageBucket as keyof typeof kpis;
      if (ageBucket in kpis) {
        kpis[ageBucket] = {
          qty: Number(row.totalQty),
          value: Number(row.totalValue),
          records: Number(row.recordCount),
        };
      }
    });

    // Calculate totals
    const totals = Object.values(kpis).reduce(
      (acc, curr) => ({
        qty: acc.qty + curr.qty,
        value: acc.value + curr.value,
        records: acc.records + curr.records,
      }),
      { qty: 0, value: 0, records: 0 }
    );

    return NextResponse.json({
      success: true,
      kpis,
      totals,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[inventory/kpis] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate KPIs" },
      { status: 500 }
    );
  }
}
