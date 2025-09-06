/**
 * XML Import Background Service - Runs XML sync every 5 minutes
 * This service uses the existing ingest job system
 */

import { envConfig } from "@/config/env";

class XmlImportService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private currentXmlPath: string;

  constructor() {
    this.currentXmlPath = envConfig.getXmlPath();
    console.log("🔧 XmlImportService initialized");
  }

  /**
   * Start the background XML import service
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️ XML import service is already running");
      return;
    }

    console.log("🚀 Starting XML import background service...");
    this.isRunning = true;

    // Run immediately on start
    this.runImport();

    // Then run every 5 minutes
    this.intervalId = setInterval(() => {
      this.runImport();
    }, envConfig.syncIntervalMs);

    console.log(
      `✅ XML import service started (every ${
        envConfig.syncIntervalMs / 1000
      }s)`
    );
  }

  /**
   * Stop the background service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🛑 XML import service stopped");
  }

  /**
   * Check if service is running
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: envConfig.syncIntervalMs,
      xmlPath: this.currentXmlPath,
    };
  }

  /**
   * Update XML path
   */
  updateXmlPath(newPath: string) {
    // Basic validation
    if (
      !newPath ||
      typeof newPath !== "string" ||
      newPath.trim().length === 0
    ) {
      throw new Error("Invalid XML path provided");
    }

    this.currentXmlPath = newPath.trim();
    console.log(`📁 XML path updated to: ${newPath}`);

    // Restart service to use new path
    if (this.isRunning) {
      this.stop();
      setTimeout(() => this.start(), 1000);
    }
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync() {
    console.log("🔄 Triggering manual XML sync...");
    return this.runImport();
  }

  /**
   * Run single import operation
   */
  private async runImport() {
    try {
      console.log(`🔄 [${new Date().toISOString()}] Running XML import...`);

      // Call our XML import API endpoint
      const response = await fetch(
        `http://localhost:${envConfig.port}/api/xml-import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Import failed: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();

      if (result.skipped) {
        console.log("⏭️ XML import skipped - file unchanged");
      } else {
        console.log(
          `✅ XML import completed: ${result.recordsProcessed} records processed`
        );
      }
    } catch (error) {
      console.error(`❌ XML import failed:`, error);
    }
  }
}

// Create singleton instance
export const xmlImportService = new XmlImportService();

// Auto-start in development and production
if (typeof window === "undefined") {
  // Only run on server-side
  console.log("🚀 Auto-starting XML import service...");
  xmlImportService.start();
}

export default xmlImportService;
