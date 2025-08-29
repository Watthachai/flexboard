/**
 * SQL Query Service - Handles real SQL database connections and queries
 */

import { Pool as PgPool, PoolConfig as PgPoolConfig } from "pg";
import mysql, {
  Pool as MySQLPool,
  PoolOptions as MySQLPoolOptions,
} from "mysql2/promise";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export interface SQLConnectionConfig {
  type: "postgresql" | "mysql" | "sqlite";
  connectionString: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  error?: string;
}

class SQLQueryService {
  private pgPools: Map<string, PgPool> = new Map();
  private mysqlPools: Map<string, MySQLPool> = new Map();
  private sqliteConnections: Map<string, Database> = new Map();

  async testConnection(
    config: SQLConnectionConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (config.type) {
        case "postgresql":
          return await this.testPostgreSQLConnection(config);
        case "mysql":
          return await this.testMySQLConnection(config);
        case "sqlite":
          return await this.testSQLiteConnection(config);
        default:
          return { success: false, error: "Unsupported database type" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async executeQuery(
    config: SQLConnectionConfig,
    query: string,
    params: any[] = []
  ): Promise<QueryResult> {
    try {
      switch (config.type) {
        case "postgresql":
          return await this.executePostgreSQLQuery(config, query, params);
        case "mysql":
          return await this.executeMySQLQuery(config, query, params);
        case "sqlite":
          return await this.executeSQLiteQuery(config, query, params);
        default:
          return { success: false, error: "Unsupported database type" };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Query execution failed",
      };
    }
  }

  private async testPostgreSQLConnection(
    config: SQLConnectionConfig
  ): Promise<{ success: boolean; error?: string }> {
    let client;
    try {
      const pgConfig: PgPoolConfig = this.parseConnectionString(
        config.connectionString,
        config.type
      );

      const pool = new PgPool({
        ...pgConfig,
        max: 1, // Test with single connection
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 5000,
      });

      client = await pool.connect();
      await client.query("SELECT 1");

      await pool.end();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "PostgreSQL connection failed",
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  private async testMySQLConnection(
    config: SQLConnectionConfig
  ): Promise<{ success: boolean; error?: string }> {
    let connection;
    try {
      const mysqlConfig = this.parseConnectionString(
        config.connectionString,
        config.type
      );

      connection = await mysql.createConnection({
        ...mysqlConfig,
        timeout: 5000,
      });

      await connection.execute("SELECT 1");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "MySQL connection failed",
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  private async testSQLiteConnection(
    config: SQLConnectionConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const dbPath = config.connectionString.replace("sqlite:", "");

      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      await db.get("SELECT 1");
      await db.close();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "SQLite connection failed",
      };
    }
  }

  private async executePostgreSQLQuery(
    config: SQLConnectionConfig,
    query: string,
    params: any[] = []
  ): Promise<QueryResult> {
    const poolKey = config.connectionString;

    try {
      let pool = this.pgPools.get(poolKey);

      if (!pool) {
        const pgConfig: PgPoolConfig = this.parseConnectionString(
          config.connectionString,
          config.type
        );
        pool = new PgPool({
          ...pgConfig,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });
        this.pgPools.set(poolKey, pool);
      }

      const client = await pool.connect();
      try {
        const result = await client.query(query, params);

        return {
          success: true,
          data: result.rows,
          columns: result.fields
            ? result.fields.map((field) => field.name)
            : [],
          rowCount: result.rowCount || 0,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "PostgreSQL query failed",
      };
    }
  }

  private async executeMySQLQuery(
    config: SQLConnectionConfig,
    query: string,
    params: any[] = []
  ): Promise<QueryResult> {
    const poolKey = config.connectionString;

    try {
      let pool = this.mysqlPools.get(poolKey);

      if (!pool) {
        const mysqlConfig = this.parseConnectionString(
          config.connectionString,
          config.type
        );
        pool = mysql.createPool({
          ...mysqlConfig,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
        this.mysqlPools.set(poolKey, pool);
      }

      const [rows, fields] = await pool.execute(query, params);

      return {
        success: true,
        data: Array.isArray(rows) ? rows : [],
        columns: Array.isArray(fields)
          ? fields.map((field: any) => field.name)
          : [],
        rowCount: Array.isArray(rows) ? rows.length : 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "MySQL query failed",
      };
    }
  }

  private async executeSQLiteQuery(
    config: SQLConnectionConfig,
    query: string,
    params: any[] = []
  ): Promise<QueryResult> {
    const dbKey = config.connectionString;

    try {
      let db = this.sqliteConnections.get(dbKey);

      if (!db) {
        const dbPath = config.connectionString.replace("sqlite:", "");
        db = await open({
          filename: dbPath,
          driver: sqlite3.Database,
        });
        this.sqliteConnections.set(dbKey, db);
      }

      const isSelect = query.trim().toLowerCase().startsWith("select");

      if (isSelect) {
        const rows = await db.all(query, params);
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        return {
          success: true,
          data: rows,
          columns: columns,
          rowCount: rows.length,
        };
      } else {
        const result = await db.run(query, params);

        return {
          success: true,
          data: [],
          columns: [],
          rowCount: result.changes || 0,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "SQLite query failed",
      };
    }
  }

  private parseConnectionString(connectionString: string, dbType: string): any {
    try {
      if (dbType === "postgresql") {
        if (
          connectionString.startsWith("postgresql://") ||
          connectionString.startsWith("postgres://")
        ) {
          return { connectionString };
        } else {
          // Parse individual components
          const url = new URL(connectionString);
          return {
            host: url.hostname,
            port: parseInt(url.port) || 5432,
            database: url.pathname.slice(1),
            user: url.username,
            password: url.password,
            ssl: url.searchParams.get("ssl") === "true",
          };
        }
      } else if (dbType === "mysql") {
        if (connectionString.startsWith("mysql://")) {
          const url = new URL(connectionString);
          return {
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            database: url.pathname.slice(1),
            user: url.username,
            password: url.password,
          };
        } else {
          // Assume it's a direct config object string
          return { uri: connectionString };
        }
      } else if (dbType === "sqlite") {
        return connectionString.replace("sqlite:", "");
      }

      return {};
    } catch (error) {
      console.error("Failed to parse connection string:", error);
      return {};
    }
  }

  generateQueryFromWidget(widget: any, tableName?: string): string {
    const xAxis = widget.config?.xAxis;
    const yAxis = widget.config?.yAxis;
    const columns = widget.config?.columns || [];
    const table = tableName || widget.config?.tableName || "data_table";

    if (widget.type === "table") {
      if (columns.length > 0) {
        return `SELECT ${columns.join(", ")} FROM ${table} LIMIT 100`;
      }
      return `SELECT * FROM ${table} LIMIT 100`;
    } else if (xAxis && yAxis) {
      // For charts, group by yAxis and aggregate xAxis
      if (widget.type === "bar" || widget.type === "line") {
        return `
          SELECT 
            ${yAxis} as name,
            AVG(CAST(${xAxis} AS DECIMAL)) as value,
            COUNT(*) as count
          FROM ${table} 
          WHERE ${xAxis} IS NOT NULL AND ${yAxis} IS NOT NULL
          GROUP BY ${yAxis}
          ORDER BY value DESC
          LIMIT 20
        `.trim();
      }
    }

    // Default query
    return `SELECT * FROM ${table} LIMIT 10`;
  }

  async closeAllConnections(): Promise<void> {
    // Close PostgreSQL pools
    for (const [key, pool] of this.pgPools) {
      try {
        await pool.end();
      } catch (error) {
        console.error(`Failed to close PostgreSQL pool ${key}:`, error);
      }
    }
    this.pgPools.clear();

    // Close MySQL pools
    for (const [key, pool] of this.mysqlPools) {
      try {
        await pool.end();
      } catch (error) {
        console.error(`Failed to close MySQL pool ${key}:`, error);
      }
    }
    this.mysqlPools.clear();

    // Close SQLite connections
    for (const [key, db] of this.sqliteConnections) {
      try {
        await db.close();
      } catch (error) {
        console.error(`Failed to close SQLite connection ${key}:`, error);
      }
    }
    this.sqliteConnections.clear();
  }
}

export const sqlQueryService = new SQLQueryService();
