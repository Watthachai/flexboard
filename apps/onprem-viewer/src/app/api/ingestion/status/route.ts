import { prisma } from "../../../../lib/db/prisma";

export async function GET() {
  try {
    // Get total record count
    const totalRecords = await prisma.inventoryRaw.count();

    // Get recent import logs
    const recentImports = await prisma.importLog.findMany({
      orderBy: { processedAt: "desc" },
      take: 10,
    });

    // Calculate next run time (every 5 minutes)
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);

    return Response.json({
      success: true,
      data: {
        totalRecords,
        totalFiles: recentImports.length,
        lastRun: recentImports[0]?.processedAt || null,
        nextRun: nextRun.toISOString(),
        status: "running",
        recentFiles: recentImports.map((log: any) => ({
          fileName: log.filename.split("/").pop() || log.filename,
          recordCount: log.recordsProcessed || 0,
          processedAt: log.processedAt,
          status: log.status === "SUCCESS" ? "success" : "error",
        })),
      },
    });
  } catch (error) {
    console.error("Failed to get ingestion status:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to get ingestion status",
      },
      { status: 500 }
    );
  }
}
