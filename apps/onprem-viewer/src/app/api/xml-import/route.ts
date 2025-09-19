/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * XML Import API - Handles XML file processing and database updates
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { UniversalXmlParser } from "@/lib/xml-parser";
import { envConfig } from "@/config/env";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    console.log("🔄 Starting XML import process...");

    // Get XML file path from environment config
    const xmlFilePath = envConfig.getXmlPath();
    console.log(`📁 Looking for XML file at: ${xmlFilePath}`);

    // Check if file exists
    if (!fs.existsSync(xmlFilePath)) {
      console.error(`❌ XML file not found at: ${xmlFilePath}`);
      return NextResponse.json(
        { success: false, error: "XML file not found" },
        { status: 404 }
      );
    }

    // Get file stats
    const fileStats = fs.statSync(xmlFilePath);
    const lastModified = fileStats.mtime;

    // Check if we need to process (has file been modified since last import?)
    const lastImport = await prisma.importLog.findFirst({
      where: { filename: xmlFilePath },
      orderBy: { processedAt: "desc" },
    });

    if (lastImport && lastImport.processedAt >= lastModified) {
      console.log("⏭️ File hasn't changed since last import, skipping...");
      return NextResponse.json({
        success: true,
        message: "File already up to date",
        skipped: true,
        lastImport: lastImport.processedAt,
      });
    }

    // Read and parse XML file
    console.log("📖 Reading XML file...");
    const xmlContent = fs.readFileSync(xmlFilePath, "utf-8");
    const parseResult = UniversalXmlParser.parse(xmlContent);
    const xmlData = parseResult.records;

    if (!xmlData || xmlData.length === 0) {
      throw new Error("No data found in XML file");
    }

    console.log(`✅ Parsed ${xmlData.length} records from XML`);

    // Start transaction for data import
    const result = await prisma.$transaction(async (tx) => {
      // Clear existing data (optional - you might want to keep historical data)
      // await tx.inventoryRaw.deleteMany({});

      // Insert new data
      let recordsProcessed = 0;
      const batchSize = 100;

      for (let i = 0; i < xmlData.length; i += batchSize) {
        const batch = xmlData.slice(i, i + batchSize);

        await tx.inventoryRaw.createMany({
          data: batch.map((item: Record<string, any>) => ({
            id: item.id
              ? parseInt(item.id)
              : Math.floor(Math.random() * 1000000),
            branch: String(item.branch || ""),
            corp: String(item.corp || ""),
            prod: String(item.prod || ""),
            unitName: String(item.unitName || ""),
            docNumber: String(item.docNumber || item.docNum || ""),
            docDate: item.docDate ? new Date(item.docDate) : new Date(),
            dataDate: item.dataDate ? new Date(item.dataDate) : new Date(),
            qtyFromThisDoc: parseFloat(item.qtyFromThisDoc || item.qty) || 0,
            averageCost: parseFloat(item.averageCost || item.unitPrice) || 0,
          })),
        });

        recordsProcessed += batch.length;
        console.log(
          `📊 Processed ${recordsProcessed}/${xmlData.length} records`
        );
      }

      // Log this import
      await tx.importLog.create({
        data: {
          filename: xmlFilePath,
          lastMtime: BigInt(Math.floor(lastModified.getTime())),
          recordsProcessed,
          status: "SUCCESS",
          processedAt: new Date(),
        },
      });

      return { recordsProcessed };
    });

    console.log(
      `✅ XML import completed successfully: ${result.recordsProcessed} records`
    );

    return NextResponse.json({
      success: true,
      message: "XML import completed successfully",
      recordsProcessed: result.recordsProcessed,
      filename: path.basename(xmlFilePath),
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ XML import failed:", error);

    // Log failed import
    try {
      await prisma.importLog.create({
        data: {
          filename: envConfig.getXmlPath(),
          lastMtime: BigInt(0),
          recordsProcessed: 0,
          status: "ERROR",
          processedAt: new Date(),
        },
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check import status
export async function GET() {
  try {
    const recentImport = await prisma.importLog.findFirst({
      orderBy: { processedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      lastImport: recentImport,
      xmlPath: envConfig.getXmlPath(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to get import status" },
      { status: 500 }
    );
  }
}
