#!/usr/bin/env node

/**
 * Cron Worker for OnPrem Viewer
 * Runs ingest job every 5 minutes
 */

import cron from "node-cron";
import { ingestOnce } from "../src/lib/ingest/ingest-job.js";

const CRON_EXPR = process.env.CRON_EXPR || "*/5 * * * *"; // Every 5 minutes

console.log(`[cron-worker] Starting with schedule: ${CRON_EXPR}`);

// Run immediately on startup
console.log("[cron-worker] Running initial ingest...");
ingestOnce()
  .then(() => console.log("[cron-worker] Initial ingest completed"))
  .catch((err) => console.error("[cron-worker] Initial ingest failed:", err));

// Schedule regular runs
cron.schedule(
  CRON_EXPR,
  async () => {
    console.log(
      `[cron-worker] Running scheduled ingest at ${new Date().toISOString()}`
    );

    try {
      await ingestOnce();
      console.log("[cron-worker] Scheduled ingest completed");
    } catch (error) {
      console.error("[cron-worker] Scheduled ingest failed:", error);
    }
  },
  {
    timezone: "Asia/Bangkok",
  }
);

console.log("[cron-worker] Cron worker started successfully");

// Keep the process alive
process.on("SIGINT", () => {
  console.log("[cron-worker] Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[cron-worker] Shutting down gracefully...");
  process.exit(0);
});
