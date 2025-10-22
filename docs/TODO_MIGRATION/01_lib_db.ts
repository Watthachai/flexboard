/**
 * TODO #1: Database Connection Layer
 *
 * File: src/lib/db.ts
 * Priority: HIGH
 * Estimated Time: 30 minutes
 */

import sql from "mssql";

// Configuration from environment variables
const config: sql.config = {
  server: process.env.DB_SERVER || "PVG-FORMA01\\FORMA",
  database: process.env.DB_DATABASE || "shareddata",
  user: process.env.DB_USER || "fm1234",
  password: process.env.DB_PASSWORD || "x2y2",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Connection pool singleton
let pool: sql.ConnectionPool | null = null;

/**
 * Get or create database connection pool
 * @returns SQL Server connection pool
 */
export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    try {
      console.log("🔌 Connecting to SQL Server...");
      pool = await sql.connect(config);
      console.log("✅ Connected to SQL Server successfully");

      // Handle connection errors
      pool.on("error", (err) => {
        console.error("❌ SQL Server connection error:", err);
        pool = null; // Reset pool on error
      });
    } catch (error) {
      console.error("❌ Failed to connect to SQL Server:", error);
      throw new Error(
        `Database connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return pool;
}

/**
 * Close database connection pool
 */
export async function closeConnection(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      console.log("✅ Database connection closed");
    } catch (error) {
      console.error("❌ Error closing database connection:", error);
      throw error;
    }
  }
}

/**
 * Execute a test query to check connection
 * @returns true if connection is working
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getConnection();
    const result = await connection.request().query("SELECT 1 AS test");
    return result.recordset.length > 0;
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return false;
  }
}

// Export sql for direct access if needed
export { sql };

/**
 * USAGE EXAMPLE:
 *
 * import { getConnection, sql } from '@/lib/db';
 *
 * const pool = await getConnection();
 * const result = await pool.request()
 *   .input('prodCode', sql.NVarChar, 'ABC123')
 *   .query('SELECT * FROM Products WHERE prodCode = @prodCode');
 *
 * console.log(result.recordset);
 */

/**
 * TODO CHECKLIST:
 * □ Create this file at src/lib/db.ts
 * □ Install mssql package: npm install mssql
 * □ Install types: npm install --save-dev @types/mssql
 * □ Update .env with DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD
 * □ Test connection with testConnection()
 * □ Add error logging/monitoring
 * □ Test connection pooling behavior
 */
