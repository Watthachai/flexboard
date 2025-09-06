/**
 * XML Sync Auto-Start Service
 * Ensures XML sync service is running when app starts
 */

// Auto-start XML import service in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  console.log("🚀 Auto-starting XML sync service...");

  // Start the XML import service
  import("./xmlImportService")
    .then(({ xmlImportService }) => {
      xmlImportService.start();
      console.log("✅ XML sync service auto-started successfully");
    })
    .catch((error) => {
      console.error("❌ Failed to auto-start XML sync service:", error);
    });
}

const autoStartService = {};
export default autoStartService;
