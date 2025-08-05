/**
 * Create Test License Script
 * สร้าง license ทดสอบใน Firestore
 */

const { db } = require("../config/firebase-real");

async function createTestLicense() {
  try {
    const tenantId = "test-company";
    const licenseKey = "FLX-TEST-001-002-ABCDEF-GHIJKL";

    // สร้าง license data
    const licenseData = {
      id: licenseKey,
      tenantId,
      maxUsers: 10,
      features: ["dashboard-viewer", "data-export"],
      dashboardIds: ["sales-dashboard", "analytics-dashboard"],
      isActive: true,
      expiryDate: "2025-12-31T23:59:59.000Z",
      companyName: "Test Company",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
    };

    // บันทึกลง Firestore
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("licenses")
      .doc(licenseKey)
      .set(licenseData);

    console.log("✅ Test license created successfully!");
    console.log("License Key:", licenseKey);
    console.log("Tenant ID:", tenantId);
    console.log("Features:", licenseData.features);
    console.log("Dashboard IDs:", licenseData.dashboardIds);
  } catch (error) {
    console.error("❌ Error creating test license:", error);
  }
}

// ตรวจสอบว่าไฟล์นี้ถูกเรียกโดยตรงหรือไม่
if (require.main === module) {
  createTestLicense().then(() => {
    console.log("Script completed");
    process.exit(0);
  });
}

module.exports = { createTestLicense };
