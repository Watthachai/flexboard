import { prisma } from "../../../../lib/db/prisma";

export async function GET() {
  try {
    // Get import logs
    const importLogs = await prisma.importLog.findMany({
      orderBy: { processedAt: "desc" },
    });

    // Get total inventory count
    const totalInventory = await prisma.inventoryRaw.count();

    return Response.json({
      success: true,
      data: {
        importLogs,
        totalInventory,
      },
    });
  } catch (error) {
    console.error("Failed to get debug info:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to get debug info",
      },
      { status: 500 }
    );
  }
}
