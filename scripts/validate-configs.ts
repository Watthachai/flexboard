#!/usr/bin/env node
/**
 * Validate all dashboard config files in the project
 * Usage: npm run validate:configs
 */

const fs = require("node:fs");
const path = require("node:path");

// Import จาก built package
const { validateConfig } = require("../packages/schema/dist/index.js");

const configFiles = [
  "examples/dashboard_config_expiry_v3.json",
  "templates/manager-overview-template.json",
  "templates/sales-dashboard-example.json",
  // เพิ่มไฟล์อื่น ๆ ที่ต้องการเช็ค
];

let failed = 0;
let passed = 0;

console.log("🔍 Validating dashboard config files...\n");

for (const configFile of configFiles) {
  const fullPath = path.resolve(configFile);

  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  ${configFile} - File not found, skipping`);
      continue;
    }

    const raw = fs.readFileSync(fullPath, "utf-8");
    const config = JSON.parse(raw);
    const result = validateConfig(config);

    if (result.valid) {
      console.log(`✅ ${configFile} - Valid`);
      passed++;
    } else {
      console.log(`❌ ${configFile} - Invalid`);
      result.errors.forEach((error: any) => {
        console.log(`   └─ ${error.path}: ${error.message}`);
      });
      failed++;
    }
  } catch (error) {
    console.log(
      `❌ ${configFile} - Parse error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log("\n💡 Fix the validation errors above before deploying.");
  process.exit(1);
} else {
  console.log("\n🎉 All dashboard configs are valid!");
  process.exit(0);
}
