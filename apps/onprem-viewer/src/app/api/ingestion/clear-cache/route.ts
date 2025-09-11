import { NextRequest, NextResponse } from "next/server";
import { clearImportLogs, clearFileImportLog } from "../../../../lib/ingest/ingest-job";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (filename) {
      // Clear specific file's import log
      await clearFileImportLog(filename);
      return NextResponse.json({ 
        success: true, 
        message: `Import log cleared for ${filename}` 
      });
    } else {
      // Clear all import logs
      await clearImportLogs();
      return NextResponse.json({ 
        success: true, 
        message: "All import logs cleared" 
      });
    }
  } catch (error) {
    console.error("Error clearing import logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear import logs" },
      { status: 500 }
    );
  }
}
