import { prisma } from "../../../../lib/db/prisma";

export async function GET() {
  try {
    // Get total record count from SQL Server view
    const totalRecords = await prisma.vVPVSG_INVENTORY_001_VIEW_001.count();

    // Since we migrated to SQL Server, there's no import log table anymore
    // Return basic status based on database connection
    return Response.json({
      success: true,
      data: {
        totalRecords,
        totalFiles: 0, // No longer tracking files (direct SQL Server connection)
        lastRun: null, // No longer applicable
        nextRun: null, // No longer applicable
        status: "idle", // Direct database, no ingestion needed
        recentFiles: [],
        message: "Using direct SQL Server connection - no ingestion needed",
      },
    });
  } catch (error) {
    console.error("Failed to get database status:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to get database status",
      },
      { status: 500 }
    );
  }
}
