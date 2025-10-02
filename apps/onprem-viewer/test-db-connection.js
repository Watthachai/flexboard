/**
 * Database Connection Test Script
 * ใช้ทดสอบว่า DATABASE_URL ถูกต้องและ connect ได้หรือไม่
 *
 * วิธีใช้:
 * 1. ตรวจสอบว่ามี .env.production หรือ environment variable DATABASE_URL
 * 2. รัน: node test-db-connection.js
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" }); // Load .env.production

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // เปิด logging เพื่อ debug
});

async function testConnection() {
  console.log("=".repeat(60));
  console.log("🔍 Testing Database Connection...");
  console.log("=".repeat(60));

  // 1. เช็คว่ามี DATABASE_URL หรือไม่
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not found in environment variables!");
    console.log("\n📝 Solutions:");
    console.log("1. Create .env.production file with DATABASE_URL");
    console.log("2. Or set environment variable in system");
    console.log("3. Or set environment variable in PowerShell:");
    console.log('   $env:DATABASE_URL="sqlserver://..."');
    process.exit(1);
  }

  // แสดง connection string (ซ่อนรหัสผ่าน)
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl.replace(/password=([^;]+)/i, "password=****");
  console.log("\n📡 Connection String:");
  console.log(`   ${maskedUrl}`);

  try {
    // 2. ทดสอบ connection
    console.log("\n⏳ Step 1: Testing connection...");
    await prisma.$connect();
    console.log("   ✅ Connected to database successfully!");

    // 3. ทดสอบ query ข้อมูล
    console.log(
      "\n⏳ Step 2: Testing query on view VVPVSG_INVENTORY_001_VIEW_001..."
    );
    const count = await prisma.vVPVSG_INVENTORY_001_VIEW_001.count();
    console.log(
      `   ✅ Query successful! Total records: ${count.toLocaleString()}`
    );

    // 4. ทดสอบดึงข้อมูล 1 แถว
    console.log("\n⏳ Step 3: Fetching sample data...");
    const sample = await prisma.vVPVSG_INVENTORY_001_VIEW_001.findFirst();

    if (sample) {
      console.log("   ✅ Sample data retrieved successfully!");
      console.log("\n📊 Sample Record:");
      console.log(`   Corp: ${sample.corp}`);
      console.log(`   Branch: ${sample.branch}`);
      console.log(`   ProdCode: ${sample.prodCode}`);
      console.log(`   ProdName: ${sample.prodName}`);
      console.log(`   DataDate: ${sample.dataDate}`);
      console.log(`   QtyFromThisDoc: ${sample.qtyFromThisDoc}`);
      console.log(`   AverageCost: ${sample.averageCost}`);
    } else {
      console.log("   ⚠️  No data found in view (empty table)");
    }

    // 5. เช็คว่ามี Corp/Branch อะไรบ้าง
    console.log("\n⏳ Step 4: Getting distinct Corp and Branch...");
    const distinctCorps = await prisma.vVPVSG_INVENTORY_001_VIEW_001.findMany({
      select: { corp: true },
      distinct: ["corp"],
      take: 10,
    });
    console.log(
      `   ✅ Found ${distinctCorps.length} distinct Corps:`,
      distinctCorps.map((c) => c.corp).join(", ")
    );

    const distinctBranches =
      await prisma.vVPVSG_INVENTORY_001_VIEW_001.findMany({
        select: { branch: true },
        distinct: ["branch"],
        take: 10,
      });
    console.log(
      `   ✅ Found ${distinctBranches.length} distinct Branches:`,
      distinctBranches.map((b) => b.branch).join(", ")
    );

    // Success!
    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(60));
    console.log("\n✨ Database connection is working correctly!");
    console.log("You can now run: npm start");
    console.log("");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ CONNECTION TEST FAILED!");
    console.error("=".repeat(60));
    console.error("\n🔴 Error Details:");
    console.error(`   Type: ${error.constructor.name}`);
    console.error(`   Message: ${error.message}`);

    // แสดงวิธีแก้ปัญหาตาม error type
    console.log("\n📝 Troubleshooting:");

    if (error.message.includes("Environment variable not found")) {
      console.log("   → DATABASE_URL is not set correctly");
      console.log(
        "   → Check .env.production file or system environment variables"
      );
    } else if (error.message.includes("Login failed")) {
      console.log("   → Username or password is incorrect");
      console.log("   → Verify credentials in SQL Server Management Studio");
    } else if (error.message.includes("Could not connect")) {
      console.log("   → Cannot reach database server");
      console.log("   → Check network connection: ping PVG-FORMA01");
      console.log("   → Check if SQL Server is running");
      console.log("   → Check firewall settings");
    } else if (error.message.includes("Invalid object name")) {
      console.log("   → View VVPVSG_INVENTORY_001_VIEW_001 does not exist");
      console.log("   → Check database and view name spelling");
      console.log(
        "   → Run: SELECT * FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = 'VVPVSG_INVENTORY_001_VIEW_001'"
      );
    } else if (error.message.includes("instance name")) {
      console.log(
        "   → SQL Server instance name is not supported in connection string"
      );
      console.log("   → Use port number directly instead of \\FORMA");
      console.log(
        "   → Find port: SQL Server Configuration Manager → TCP/IP → IP Addresses → TCP Port"
      );
      console.log(
        "   → Example: sqlserver://PVG-FORMA01:49152 (not PVG-FORMA01\\FORMA)"
      );
    }

    console.log(
      "\n📖 For more help, see: docs/ONPREM_DEPLOYMENT_TROUBLESHOOTING.md"
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("");
  }
}

// เริ่มทดสอบ
testConnection();
