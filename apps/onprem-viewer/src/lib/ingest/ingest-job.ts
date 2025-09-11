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

function mapXml(data: unknown): XmlRow[] {
  // Handle GraphData format (actual production data)
  if (data && typeof data === "object" && "GraphData" in data) {
    const graphData = data.GraphData as any;
    if (graphData?.Dataset1) {
      const items = Array.isArray(graphData.Dataset1)
        ? graphData.Dataset1
        : [graphData.Dataset1];
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
  }

  // Handle sample inventory format
  if (data && typeof data === "object" && "inventory" in data) {
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
    const pvs = data.PVS as any;
    if (pvs?.detail) {
      const items = Array.isArray(pvs.detail) ? pvs.detail : [pvs.detail];
      return items;
    }
  }

  return [];
}

export async function ingestOnce() {
  console.log(`[ingest] Scanning directory: ${INBOX}`);
  console.log(`[ingest] Using environment: XML_WATCH_DIR=${process.env.XML_WATCH_DIR}, XML_DATA_PATH=${process.env.XML_DATA_PATH}`);

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

      const done = await prisma.importLog.findUnique({
        where: { filename: full },
      });
      
      console.log(`[ingest] ${f.name} → Size: ${fileSize} bytes, Current mtime: ${mtime}, Last processed mtime: ${done?.lastMtime || 'none'}`);
      
      // Force re-process if file size is 0 (might be corrupted record)
      if (done && fileSize === 0 && done.recordsProcessed === 0) {
        console.log(`[ingest] ${f.name} → File size is 0, clearing import log to force re-process`);
        await prisma.importLog.delete({
          where: { filename: full },
        });
      }
      
      const updatedDone = await prisma.importLog.findUnique({
        where: { filename: full },
      });
      
      if (updatedDone && updatedDone.lastMtime === mtime) {
        console.log(`[ingest] Skipping ${f.name} (already processed)`);
        continue;
      }

      console.log(`[ingest] Processing ${f.name}... (mtime changed or first time)`);

      const xml = await fs.readFile(full, "utf8");
      const data = parser.parse(xml);
      const rows = mapXml(data);

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
      const batchSize = 100;
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

              await tx.inventoryRaw.upsert({
                where: { id },
                create: {
                  id,
                  dataDate: toDateYMD(r.DataDate),
                  corp: toString(r.Corp),
                  branch: toString(r.Branch),
                  prod: toString(r.Prod),
                  unitName: toString(r.UnitName),
                  docNumber: toString(r.DocNumber),
                  docDate: toDateYMD(r.DocDate),
                  qtyFromThisDoc: toNum(r.QtyFromThisDoc),
                  averageCost: toNum(r.AverageCost),
                },
                update: {
                  dataDate: toDateYMD(r.DataDate),
                  corp: toString(r.Corp),
                  branch: toString(r.Branch),
                  prod: toString(r.Prod),
                  unitName: toString(r.UnitName),
                  docNumber: toString(r.DocNumber),
                  docDate: toDateYMD(r.DocDate),
                  qtyFromThisDoc: toNum(r.QtyFromThisDoc),
                  averageCost: toNum(r.AverageCost),
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
            timeout: 30000, // 30 seconds timeout
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
              timeout: 30000,
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
        `[ingest] ${f.name} → Differential sync completed: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted (${rows.length} total from XML)`
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
        contains: filename
      }
    }
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
