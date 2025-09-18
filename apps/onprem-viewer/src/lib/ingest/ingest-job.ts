/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs/promises";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "../db/prisma";

const INBOX =
  process.env.XML_WATCH_DIR || process.env.XML_DATA_PATH || "./inventory-files";
const parser = new XMLParser({ ignoreAttributes: false });

type XmlRow = {
  ID: string | number;
  DataDate: string; // yyyy-MM-dd
  Corp: string;
  Branch: string;
  Prod: string;
  UnitName: string;
  DocNumber: string;
  DocDate: string; // yyyy-MM-dd
  QtyFromThisDoc: string;
  AverageCost: string;
};

function toDateYMD(s?: string | Date | number) {
  if (!s) return new Date();
  if (s instanceof Date) return s;
  if (typeof s === "number") return new Date(s);
  if (typeof s === "string") {
    // Handle various date formats
    if (s.includes("T") || s.includes(" ")) {
      return new Date(s);
    }
    return new Date(`${s}T00:00:00`);
  }
  return new Date();
}

function toNum(s?: string | number) {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  if (typeof s === "string") {
    const n = Number(s.trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toString(s?: string | number | null): string {
  if (s === null || s === undefined) return "";
  if (typeof s === "string") return s.trim();
  return String(s);
}

// Compute derived fields for performance optimization
function computeDerivedFields(
  dataDate: Date,
  docDate: Date,
  qty: number,
  cost: number
) {
  const qtySafe = Number.isFinite(qty) ? qty : 0;
  const costSafe = Number.isFinite(cost) ? cost : 0;
  const totalValueRow = qtySafe * costSafe;

  // Calculate days age
  const daysAge = Math.floor(
    (dataDate.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate age bucket
  let ageBucket: string;
  if (daysAge > 365) {
    ageBucket = ">365";
  } else if (daysAge > 180) {
    ageBucket = "181-365";
  } else if (daysAge > 90) {
    ageBucket = "91-180";
  } else {
    ageBucket = "0-90";
  }

  return {
    qtySafe,
    costSafe,
    totalValueRow,
    daysAge,
    ageBucket,
  };
}

function mapXml(data: unknown): XmlRow[] {
  console.log(`[mapXml] Input data type: ${typeof data}`);
  console.log(
    `[mapXml] Input data keys:`,
    data && typeof data === "object" ? Object.keys(data) : "N/A"
  );

  // Handle GraphData format (actual production data)
  if (data && typeof data === "object" && "GraphData" in data) {
    console.log(`[mapXml] Found GraphData format`);
    const graphData = data.GraphData as any;

    // Check for DataSet1 (with capital S)
    if (graphData?.DataSet1) {
      const items = Array.isArray(graphData.DataSet1)
        ? graphData.DataSet1
        : [graphData.DataSet1];
      console.log(`[mapXml] GraphData.DataSet1 contains ${items.length} items`);
      return items.map((item: any) => ({
        ID: item.ID || "",
        DataDate: item.DataDate || "",
        Corp: item.Corp || "",
        Branch: item.Branch || "",
        Prod: item.Prod || "",
        UnitName: item.UnitName || "",
        DocNumber: item.DocNumber || "",
        DocDate: item.DocDate || "",
        QtyFromThisDoc: item.QtyFromThisDoc || 0,
        AverageCost: item.AverageCost || 0,
      }));
    }
    // Check for Dataset1 (lowercase s) - fallback
    else if (graphData?.Dataset1) {
      const items = Array.isArray(graphData.Dataset1)
        ? graphData.Dataset1
        : [graphData.Dataset1];
      console.log(`[mapXml] GraphData.Dataset1 contains ${items.length} items`);
      return items.map((item: any) => ({
        ID: item.ID || "",
        DataDate: item.DataDate || "",
        Corp: item.Corp || "",
        Branch: item.Branch || "",
        Prod: item.Prod || "",
        UnitName: item.UnitName || "",
        DocNumber: item.DocNumber || "",
        DocDate: item.DocDate || "",
        QtyFromThisDoc: item.QtyFromThisDoc || 0,
        AverageCost: item.AverageCost || 0,
      }));
    } else {
      console.log(`[mapXml] GraphData found but no DataSet1 or Dataset1`);
      console.log(
        `[mapXml] Available keys in GraphData:`,
        Object.keys(graphData)
      );
    }
  }

  // Handle sample inventory format
  if (data && typeof data === "object" && "inventory" in data) {
    console.log(`[mapXml] Found inventory format`);
    const inventory = data.inventory as any;
    if (inventory?.item) {
      const items = Array.isArray(inventory.item)
        ? inventory.item
        : [inventory.item];
      return items.map(
        (item: {
          id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          price?: number;
        }) => ({
          ID: item.id || "",
          DataDate: new Date().toISOString().split("T")[0],
          Corp: "Sample Corp",
          Branch: "Main Branch",
          Prod: item.name || "",
          UnitName: item.category || "",
          DocNumber: `DOC-${item.id}`,
          DocDate: new Date().toISOString().split("T")[0],
          QtyFromThisDoc: item.quantity || 0,
          AverageCost: item.price || 0,
        })
      );
    }
  }

  // Handle PVS format (original)
  if (data && typeof data === "object" && "PVS" in data) {
    console.log(`[mapXml] Found PVS format`);
    const pvs = data.PVS as any;
    if (pvs?.detail) {
      const items = Array.isArray(pvs.detail) ? pvs.detail : [pvs.detail];
      console.log(`[mapXml] PVS.detail contains ${items.length} items`);
      return items;
    } else {
      console.log(`[mapXml] PVS found but no detail`);
    }
  }

  console.log(`[mapXml] No recognized XML format found, returning empty array`);
  return [];
}

export async function ingestOnce() {
  console.log(`[ingest] Scanning directory: ${INBOX}`);
  console.log(
    `[ingest] Using environment: XML_WATCH_DIR=${process.env.XML_WATCH_DIR}, XML_DATA_PATH=${process.env.XML_DATA_PATH}`
  );
  console.log(
    `[ingest] ⚡ FORCE RE-INGEST MODE: Files will be processed every time regardless of cache`
  );

  try {
    const entries = await fs.readdir(INBOX, { withFileTypes: true });
    const files = entries.filter(
      (e) => e.isFile() && e.name.toLowerCase().endsWith(".xml")
    );

    console.log(`[ingest] Found ${files.length} XML files`);

    for (const f of files) {
      const full = path.join(INBOX, f.name);
      console.log(`[ingest] Full path: ${full}`);

      const st = await fs.stat(full);
      const mtime = BigInt(Math.floor(st.mtimeMs));
      const fileSize = st.size;

      console.log(
        `[ingest] ${f.name} → Size: ${fileSize} bytes, Always processing (cache disabled)`
      );

      console.log(`[ingest] Processing ${f.name}... (force re-ingest mode)`);

      const xml = await fs.readFile(full, "utf8");
      console.log(
        `[ingest] ${f.name} → XML file size: ${xml.length} characters`
      );
      console.log(
        `[ingest] ${f.name} → XML preview (first 500 chars):`,
        xml.substring(0, 500)
      );

      const data = parser.parse(xml);
      console.log(
        `[ingest] ${f.name} → Parsed XML structure:`,
        JSON.stringify(data, null, 2).substring(0, 1000)
      );

      const rows = mapXml(data);
      console.log(`[ingest] ${f.name} → Mapped ${rows.length} rows`);
      if (rows.length > 0) {
        console.log(`[ingest] ${f.name} → Sample row:`, rows[0]);
      }

      // Collect all IDs from XML file for differential sync
      const xmlIds = new Set(rows.map((r) => Number(r.ID)));
      console.log(
        `[ingest] ${f.name} → Found ${xmlIds.size} unique IDs in XML`
      );

      // Get existing IDs in database to determine what to delete
      const existingRecords = await prisma.inventoryRaw.findMany({
        select: { id: true },
      });
      const existingIds = new Set(existingRecords.map((r) => r.id));
      console.log(
        `[ingest] Database contains ${existingIds.size} existing records`
      );

      // Find IDs to delete (exist in DB but not in XML)
      const idsToDelete = Array.from(existingIds).filter(
        (id) => !xmlIds.has(id)
      );
      console.log(`[ingest] Found ${idsToDelete.length} records to delete`);

      // Process in batches to avoid transaction timeout
      const batchSize = 2000; // Optimized for large datasets (200-300k rows)
      let processedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;

      // First, upsert all records from XML
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        await prisma.$transaction(
          async (tx) => {
            for (const r of batch) {
              const id = Number(r.ID);
              const wasExisting = existingIds.has(id);

              const dataDate = toDateYMD(r.DataDate);
              const docDate = toDateYMD(r.DocDate);
              const qty = toNum(r.QtyFromThisDoc);
              const cost = toNum(r.AverageCost);

              // Compute derived fields for performance
              const derived = computeDerivedFields(
                dataDate,
                docDate,
                qty,
                cost
              );

              await tx.inventoryRaw.upsert({
                where: { id },
                create: {
                  id,
                  dataDate,
                  corp: toString(r.Corp),
                  branch: toString(r.Branch),
                  prod: toString(r.Prod),
                  unitName: toString(r.UnitName),
                  docNumber: toString(r.DocNumber),
                  docDate,
                  qtyFromThisDoc: qty,
                  averageCost: cost,
                  // Add computed fields
                  qtySafe: derived.qtySafe,
                  costSafe: derived.costSafe,
                  totalValueRow: derived.totalValueRow,
                  daysAge: derived.daysAge,
                  ageBucket: derived.ageBucket,
                },
                update: {
                  dataDate,
                  corp: toString(r.Corp),
                  branch: toString(r.Branch),
                  prod: toString(r.Prod),
                  unitName: toString(r.UnitName),
                  docNumber: toString(r.DocNumber),
                  docDate,
                  qtyFromThisDoc: qty,
                  averageCost: cost,
                  // Update computed fields
                  qtySafe: derived.qtySafe,
                  costSafe: derived.costSafe,
                  totalValueRow: derived.totalValueRow,
                  daysAge: derived.daysAge,
                  ageBucket: derived.ageBucket,
                },
              });

              if (wasExisting) {
                updatedCount++;
              } else {
                createdCount++;
              }
            }
          },
          {
            timeout: 60000, // 60 seconds timeout for larger batches
          }
        );

        processedCount += batch.length;
        console.log(
          `[ingest] ${f.name} → ${processedCount}/${rows.length} rows processed (${createdCount} new, ${updatedCount} updated)`
        );
      }

      // Second, delete records that are no longer in XML
      let deletedCount = 0;
      if (idsToDelete.length > 0) {
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
          const batch = idsToDelete.slice(i, i + batchSize);

          await prisma.$transaction(
            async (tx) => {
              const result = await tx.inventoryRaw.deleteMany({
                where: {
                  id: { in: batch },
                },
              });
              deletedCount += result.count;
            },
            {
              timeout: 60000, // 60 seconds timeout for larger batches
            }
          );
        }
        console.log(
          `[ingest] ${f.name} → Deleted ${deletedCount} obsolete records`
        );
      }

      // Update import log after successful processing
      await prisma.importLog.upsert({
        where: { filename: full },
        create: {
          filename: full,
          lastMtime: mtime,
          recordsProcessed: rows.length,
          recordsCreated: createdCount,
          recordsUpdated: updatedCount,
          recordsDeleted: deletedCount,
          status: "SUCCESS",
        },
        update: {
          lastMtime: mtime,
          processedAt: new Date(),
          recordsProcessed: rows.length,
          recordsCreated: createdCount,
          recordsUpdated: updatedCount,
          recordsDeleted: deletedCount,
          status: "SUCCESS",
        },
      });

      console.log(
        `[ingest] ${f.name} → Force re-ingest completed: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted (${rows.length} total from XML)`
      );
    }
  } catch (error) {
    console.error("[ingest] Error:", error);
    throw error;
  }
}

// Function to clear all import logs and force re-ingest
export async function clearImportLogs() {
  console.log("[ingest] Clearing all import logs to force re-ingest...");
  await prisma.importLog.deleteMany({});
  console.log("[ingest] All import logs cleared");
}

// Function to clear specific file's import log
export async function clearFileImportLog(filename: string) {
  console.log(`[ingest] Clearing import log for: ${filename}`);
  await prisma.importLog.deleteMany({
    where: {
      filename: {
        contains: filename,
      },
    },
  });
  console.log(`[ingest] Import log cleared for ${filename}`);
}

// Auto-run if called directly (ES module way)
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestOnce()
    .then(() => {
      console.log("[ingest] Complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[ingest] Failed:", error);
      process.exit(1);
    });
}
