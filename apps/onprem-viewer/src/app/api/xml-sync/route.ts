/**
 * XML Sync Service Control API - Uses existing cron and ingest system
 */

import { NextResponse } from "next/server";
import { envConfig } from "@/config/env";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const xmlPath = envConfig.getXmlPath();

    // Check if directory exists and count XML files
    let pathExists = false;
    let fileCount = 0;

    try {
      const stats = fs.statSync(xmlPath);
      if (stats.isDirectory()) {
        pathExists = true;
        const files = fs.readdirSync(xmlPath);
        fileCount = files.filter((f) =>
          f.toLowerCase().endsWith(".xml")
        ).length;
      }
    } catch {
      pathExists = false;
    }

    // Check if service should be running (assume always in production)
    const isRunning =
      process.env.NODE_ENV === "production" ||
      process.env.CRON_ENABLED === "true";

    return NextResponse.json({
      success: true,
      isRunning,
      intervalMs: envConfig.syncIntervalMs,
      xmlPath,
      pathExists,
      fileCount,
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get XML sync status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get XML sync status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, xmlPath } = await request.json();

    switch (action) {
      case "triggerSync":
        try {
          // Import and run the ingest function directly
          const { ingestOnce } = await import("@/lib/ingest/ingest-job");
          await ingestOnce();

          return NextResponse.json({
            success: true,
            message: "Manual sync completed successfully",
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error ? error.message : "Manual sync failed",
            },
            { status: 500 }
          );
        }

      case "updatePath":
        if (!xmlPath || typeof xmlPath !== "string") {
          return NextResponse.json(
            { success: false, error: "Valid XML path is required" },
            { status: 400 }
          );
        }

        try {
          // Check if path exists (can be file or directory)
          let targetPath = xmlPath;

          // If it's a file, get the directory
          if (fs.existsSync(xmlPath)) {
            const stats = fs.statSync(xmlPath);
            if (stats.isFile()) {
              targetPath = path.dirname(xmlPath);
              console.log(`📁 File detected, using directory: ${targetPath}`);
            } else if (!stats.isDirectory()) {
              return NextResponse.json(
                {
                  success: false,
                  error: "Path is not a valid file or directory",
                },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              { success: false, error: "Path does not exist" },
              { status: 400 }
            );
          }

          // Update environment variable for this session
          process.env.XML_DATA_PATH = targetPath;
          process.env.XML_WATCH_DIR = targetPath;

          return NextResponse.json({
            success: true,
            message: `XML path updated to: ${targetPath}`,
            status: {
              xmlPath: targetPath,
              isRunning: false,
              intervalMs: 300000, // 5 minutes
            },
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to update XML path",
            },
            { status: 400 }
          );
        }

      case "start":
      case "stop":
      case "restart":
        return NextResponse.json({
          success: true,
          message: `${action} action noted. Use cron service 'npm run cron:dev' for background processing.`,
          isRunning: action === "start" || action === "restart",
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Use 'triggerSync', 'updatePath', 'start', 'stop', or 'restart'",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
