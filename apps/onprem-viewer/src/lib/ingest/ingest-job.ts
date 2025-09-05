import fs from "fs/promises";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "../db/prisma";

const INBOX = process.env.XML_WATCH_DIR || "./inventory-files";
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

  try {
    const entries = await fs.readdir(INBOX, { withFileTypes: true });
    const files = entries.filter(
      (e) => e.isFile() && e.name.toLowerCase().endsWith(".xml")
    );

    console.log(`[ingest] Found ${files.length} XML files`);

    for (const f of files) {
      const full = path.join(INBOX, f.name);
      const st = await fs.stat(full);
      const mtime = BigInt(Math.floor(st.mtimeMs));

      const done = await prisma.importLog.findUnique({
        where: { filename: full },
      });
      if (done && done.lastMtime === mtime) {
        console.log(`[ingest] Skipping ${f.name} (already processed)`);
        continue;
      }

      console.log(`[ingest] Processing ${f.name}...`);

      const xml = await fs.readFile(full, "utf8");
      const data = parser.parse(xml);
      const rows = mapXml(data);

      // Process in batches to avoid transaction timeout
      const batchSize = 100;
      let processedCount = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        await prisma.$transaction(
          async (tx) => {
            for (const r of batch) {
              await tx.inventoryRaw.upsert({
                where: { id: Number(r.ID) },
                create: {
                  id: Number(r.ID),
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
            }
          },
          {
            timeout: 30000, // 30 seconds timeout
          }
        );

        processedCount += batch.length;
        console.log(
          `[ingest] ${f.name} → ${processedCount}/${rows.length} rows processed`
        );
      }

      // Update import log after successful processing
      await prisma.importLog.upsert({
        where: { filename: full },
        create: {
          filename: full,
          lastMtime: mtime,
          recordsProcessed: rows.length,
          status: "SUCCESS",
        },
        update: {
          lastMtime: mtime,
          processedAt: new Date(),
          recordsProcessed: rows.length,
          status: "SUCCESS",
        },
      });

      console.log(
        `[ingest] ${f.name} → ${rows.length} rows processed successfully`
      );
    }
  } catch (error) {
    console.error("[ingest] Error:", error);
    throw error;
  }
}

// Auto-run if called directly
if (require.main === module) {
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
