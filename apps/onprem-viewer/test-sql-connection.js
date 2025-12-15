#!/usr/bin/env node

/**
 * Test SQL Server Connection
 * วิธีใช้: node test-sql-connection.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function testConnection() {
  console.log("🔍 Testing SQL Server Connection...\n");
  console.log(
    "📝 Database URL:",
    process.env.DATABASE_URL?.replace(/password=[^;]+/, "password=***")
  );
  console.log("");

  try {
    // Test 1: Can we connect?
    console.log("Test 1: Testing connection...");
    await prisma.$connect();
    console.log("✅ Connection successful!\n");

    // Test 2: Can we query?
    console.log("Test 2: Testing query...");
    const result =
      await prisma.$queryRaw`SELECT @@VERSION as Version, @@SERVERNAME as ServerName, DB_NAME() as DatabaseName`;
    console.log("✅ Query successful!");
    console.log("📊 Server Info:");
    console.log(result);
    console.log("");

    // Test 3: Can we access the view?
    console.log("Test 3: Testing view access...");
    const count = await prisma.vVPVSG_INVENTORY_001_VIEW_001.count();
    console.log(`✅ View accessible! Found ${count} records\n`);

    // Test 4: Can we read data?
    console.log("Test 4: Testing data read (first 5 records)...");
    const records = await prisma.vVPVSG_INVENTORY_001_VIEW_001.findMany({
      take: 5,
    });
    console.log(`✅ Data read successful! Sample records:`, records.length);
    if (records.length > 0) {
      console.log("First record:", records[0]);
    }
    console.log("");

    console.log(
      "🎉 All tests passed! Database connection is working correctly."
    );
  } catch (error) {
    console.error("❌ Connection failed!\n");
    console.error("Error details:");
    console.error("- Message:", error.message);
    console.error("- Code:", error.code);
    console.error("- Meta:", error.meta);
    console.error("\n📋 Troubleshooting steps:");
    console.error("1. Check if SQL Server is running");
    console.error("2. Verify username and password in .env file");
    console.error(
      "3. Ensure SQL Server Authentication (Mixed Mode) is enabled"
    );
    console.error("4. Check if the login is enabled: ALTER LOGIN sa ENABLE;");
    console.error("5. Restart SQL Server after changing authentication mode");
    console.error("\nSee DATABASE_FIX_GUIDE.md for detailed instructions.");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
