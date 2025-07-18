/**
 * Multi-Connector Engine for On-Premise Agent (Native Drivers Version)
 * Supports multiple data sources with raw query execution
 */

import { Connection } from "tedious";
import mysql, { PoolOptions } from "mysql2/promise";
import { Pool } from "pg";

// Types
export interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  executionTime?: number;
  error?: string;
  metadata?: any;
}

export interface QueryRequest {
  dataSourceType: "sql" | "postgresql" | "mysql" | "api" | "firestore";
  query: string;
  params?: Record<string, any>;
  widgetId?: string;
  tenantId?: string;
}

export interface ConnectionConfig {
  sql?: {
    server: string;
    database: string;
    authentication: {
      type: "default" | "ntlm" | "azure-active-directory-password";
      options: {
        userName: string;
        password: string;
        domain?: string;
      };
    };
    options: {
      encrypt: boolean;
      trustServerCertificate: boolean;
      port?: number;
      requestTimeout?: number;
    };
  };
  postgresql?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
  };
  mysql?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
  };
  api?: {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
  };
  firestore?: {
    projectId: string;
    credentialsPath?: string;
  };
}

// Abstract base class for all connectors
abstract class DatabaseConnector {
  protected config: any;

  constructor(config: any) {
    this.config = config;
  }

  abstract testConnection(): Promise<boolean>;
  abstract executeQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<QueryResult>;
}

// SQL Server Connector using tedious
class SqlServerConnector extends DatabaseConnector {
  private connectionPool: Connection | null = null;

  async testConnection(): Promise<boolean> {
    try {
      if (!this.config) {
        console.log("[SQL Server] No configuration found");
        return false;
      }

      const connection = new Connection(this.config);

      return new Promise((resolve) => {
        connection.on("connect", () => {
          console.log("[SQL Server] Connection test successful");
          connection.close();
          resolve(true);
        });

        connection.on("error", (err) => {
          console.log("[SQL Server] Connection test failed:", err.message);
          resolve(false);
        });

        connection.connect();
      });
    } catch (error) {
      console.log("[SQL Server] Connection test failed:", error);
      return false;
    }
  }

  async executeQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const connection = new Connection(this.config);

      return new Promise((resolve) => {
        const results: any[] = [];
        const columns: string[] = [];
        let columnsDefined = false;

        connection.on("connect", () => {
          const request = new (require("tedious").Request)(
            query,
            (err: any) => {
              connection.close();
              if (err) {
                resolve({
                  success: false,
                  error: err.message,
                  executionTime: Date.now() - startTime,
                });
              } else {
                resolve({
                  success: true,
                  data: results,
                  columns,
                  rowCount: results.length,
                  executionTime: Date.now() - startTime,
                });
              }
            }
          );

          // Add parameters if provided
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              request.addParameter(
                key,
                require("tedious").TYPES.VarChar,
                value
              );
            });
          }

          request.on("row", (row: any) => {
            if (!columnsDefined) {
              columns.push(...row.map((col: any) => col.metadata.colName));
              columnsDefined = true;
            }
            results.push(row.map((col: any) => col.value));
          });

          connection.execSql(request);
        });

        connection.on("error", (err) => {
          resolve({
            success: false,
            error: err.message,
            executionTime: Date.now() - startTime,
          });
        });

        connection.connect();
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
      };
    }
  }
}

// PostgreSQL Connector using pg
class PostgreSQLConnector extends DatabaseConnector {
  private pool: Pool | null = null;

  async testConnection(): Promise<boolean> {
    try {
      if (!this.config) {
        console.log("[PostgreSQL] No configuration found");
        return false;
      }

      const pool = new Pool(this.config);
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      await pool.end();

      console.log("[PostgreSQL] Connection test successful");
      return true;
    } catch (error) {
      console.log("[PostgreSQL] Connection test failed:", error);
      return false;
    }
  }

  async executeQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const pool = new Pool(this.config);
      const client = await pool.connect();

      // Convert params to array format for pg
      const paramValues = params ? Object.values(params) : [];

      const result = await client.query(query, paramValues);

      client.release();
      await pool.end();

      return {
        success: true,
        data: result.rows,
        columns: result.fields?.map((field) => field.name) || [],
        rowCount: result.rowCount || 0,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
      };
    }
  }
}

// MySQL Connector using mysql2
class MySQLConnector extends DatabaseConnector {
  async testConnection(): Promise<boolean> {
    try {
      if (!this.config) {
        console.log("[MySQL] No configuration found");
        return false;
      }

      const connection = await mysql.createConnection(this.config);
      await connection.execute("SELECT 1");
      await connection.end();

      console.log("[MySQL] Connection test successful");
      return true;
    } catch (error) {
      console.log("[MySQL] Connection test failed:", error);
      return false;
    }
  }

  async executeQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const connection = await mysql.createConnection(this.config);

      // Convert params to array format for mysql2
      const paramValues = params ? Object.values(params) : [];

      const [rows, fields] = await connection.execute(query, paramValues);

      await connection.end();

      return {
        success: true,
        data: Array.isArray(rows) ? rows : [],
        columns: Array.isArray(fields) ? fields.map((field) => field.name) : [],
        rowCount: Array.isArray(rows) ? rows.length : 0,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
      };
    }
  }
}

// API Connector for REST endpoints
class ApiConnector extends DatabaseConnector {
  async testConnection(): Promise<boolean> {
    try {
      if (!this.config?.baseUrl) {
        console.log("[API] No base URL configured");
        return false;
      }

      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
        },
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      });

      console.log("[API] Connection test successful:", response.ok);
      return response.ok;
    } catch (error) {
      console.log("[API] Connection test failed:", error);
      return false;
    }
  }

  async executeQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.baseUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
        },
        body: JSON.stringify({ query, params }),
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      });

      const result = (await response.json()) as any;

      return {
        success: response.ok,
        data: result.data || [],
        columns: result.columns || [],
        rowCount: result.rowCount || 0,
        executionTime: Date.now() - startTime,
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
      };
    }
  }
}

// Firestore Connector (placeholder for now)
class FirestoreConnector extends DatabaseConnector {
  async testConnection(): Promise<boolean> {
    try {
      console.log("[Firestore] Connection test - configuration check");
      return !!this.config?.projectId;
    } catch (error) {
      console.log("[Firestore] Connection test failed:", error);
      return false;
    }
  }

  async executeQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // For now, return sample data
      // TODO: Implement real Firestore query execution
      return {
        success: true,
        data: [{ message: "Firestore connector not yet implemented" }],
        columns: ["message"],
        rowCount: 1,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
      };
    }
  }
}

// Main Multi-Connector Engine
export class MultiConnectorEngine {
  private connectors: Map<string, DatabaseConnector> = new Map();
  private config: ConnectionConfig;

  constructor(config?: ConnectionConfig) {
    this.config = config || this.getDefaultConfig();
    this.initializeConnectors();
  }

  private getDefaultConfig(): ConnectionConfig {
    return {
      sql: process.env.SQL_SERVER_CONNECTION_STRING
        ? {
            server: process.env.SQL_SERVER_HOST || "localhost",
            database: process.env.SQL_SERVER_DATABASE || "AdventureWorks2022",
            authentication: {
              type: "default",
              options: {
                userName: process.env.SQL_SERVER_USERNAME || "sa",
                password:
                  process.env.SQL_SERVER_PASSWORD || "YourStrong@Passw0rd",
              },
            },
            options: {
              encrypt: process.env.SQL_SERVER_ENCRYPT === "true",
              trustServerCertificate:
                process.env.SQL_SERVER_TRUST_CERT !== "false",
              port: process.env.SQL_SERVER_PORT
                ? parseInt(process.env.SQL_SERVER_PORT)
                : 1433,
              requestTimeout: 30000,
            },
          }
        : undefined,
      postgresql: process.env.POSTGRESQL_CONNECTION_STRING
        ? {
            host: process.env.POSTGRESQL_HOST || "localhost",
            port: process.env.POSTGRESQL_PORT
              ? parseInt(process.env.POSTGRESQL_PORT)
              : 5432,
            database: process.env.POSTGRESQL_DATABASE || "flexboard",
            user: process.env.POSTGRESQL_USERNAME || "postgres",
            password: process.env.POSTGRESQL_PASSWORD || "password",
            ssl: process.env.POSTGRESQL_SSL === "true",
          }
        : undefined,
      mysql: process.env.MYSQL_CONNECTION_STRING
        ? {
            host: process.env.MYSQL_HOST || "localhost",
            port: process.env.MYSQL_PORT
              ? parseInt(process.env.MYSQL_PORT)
              : 3306,
            database: process.env.MYSQL_DATABASE || "flexboard",
            user: process.env.MYSQL_USERNAME || "root",
            password: process.env.MYSQL_PASSWORD || "password",
            ssl: process.env.MYSQL_SSL === "true",
          }
        : undefined,
      api: {
        baseUrl: process.env.API_BASE_URL || "http://localhost:3000/api",
        apiKey: process.env.API_KEY || undefined,
        timeout: process.env.API_TIMEOUT
          ? parseInt(process.env.API_TIMEOUT)
          : 30000,
      },
      firestore: process.env.FIRESTORE_PROJECT_ID
        ? {
            projectId: process.env.FIRESTORE_PROJECT_ID,
            credentialsPath: process.env.FIRESTORE_CREDENTIALS_PATH,
          }
        : undefined,
    };
  }

  private initializeConnectors(): void {
    // Initialize SQL Server connector
    if (this.config.sql) {
      this.connectors.set("sql", new SqlServerConnector(this.config.sql));
    }

    // Initialize PostgreSQL connector
    if (this.config.postgresql) {
      this.connectors.set(
        "postgresql",
        new PostgreSQLConnector(this.config.postgresql)
      );
    }

    // Initialize MySQL connector
    if (this.config.mysql) {
      this.connectors.set("mysql", new MySQLConnector(this.config.mysql));
    }

    // Initialize API connector
    if (this.config.api) {
      this.connectors.set("api", new ApiConnector(this.config.api));
    }

    // Initialize Firestore connector
    if (this.config.firestore) {
      this.connectors.set(
        "firestore",
        new FirestoreConnector(this.config.firestore)
      );
    }
  }

  async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [type, connector] of this.connectors) {
      try {
        results[type] = await connector.testConnection();
      } catch (error) {
        console.log(`[${type}] Connection test error:`, error);
        results[type] = false;
      }
    }

    return results;
  }

  async executeQuery(request: QueryRequest): Promise<QueryResult> {
    const connector = this.connectors.get(request.dataSourceType);

    if (!connector) {
      return {
        success: false,
        error: `Unsupported data source type: ${request.dataSourceType}`,
        executionTime: 0,
      };
    }

    try {
      return await connector.executeQuery(request.query, request.params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: 0,
      };
    }
  }

  getAvailableConnectors(): string[] {
    return Array.from(this.connectors.keys());
  }

  getConnectorConfig(type: string): any {
    return this.config[type as keyof ConnectionConfig];
  }
}

// Export a singleton instance
export const multiConnectorEngine = new MultiConnectorEngine();
