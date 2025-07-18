/**
 * Multi-Connector Engine for On-Premise Agent
 * รองรับการรัน Raw Query จากหลาย Data Source
 */

import { PrismaClient } from "../node_modules/.prisma/client";

// Type definitions
export interface QueryRequest {
  dataSourceType: "sql" | "postgresql" | "mysql" | "firestore" | "api";
  query: string;
  params?: Record<string, any>;
  widgetId?: string;
  tenantId?: string;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  executionTime?: number;
  error?: string;
  metadata?: {
    dataSource: string;
    query: string;
    params?: Record<string, any>;
  };
}

// ===== SQL Server Connector =====
export class SqlServerConnector {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async executeQuery(request: QueryRequest): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      console.log(
        `[SQL Server] Executing query: ${request.query.substring(0, 100)}...`
      );

      // ใช้ Prisma's raw query capability
      const result = await this.prisma.$queryRawUnsafe(
        request.query,
        ...(request.params ? Object.values(request.params) : [])
      );

      const executionTime = Date.now() - startTime;

      // Convert result to standard format
      const data = Array.isArray(result) ? result : [result];
      const columns = data.length > 0 ? Object.keys(data[0]) : [];

      return {
        success: true,
        data,
        columns,
        rowCount: data.length,
        executionTime,
        metadata: {
          dataSource: "sql",
          query: request.query,
          params: request.params,
        },
      };
    } catch (error) {
      console.error("[SQL Server] Query execution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
        metadata: {
          dataSource: "sql",
          query: request.query,
          params: request.params,
        },
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`;
      return true;
    } catch (error) {
      console.error("[SQL Server] Connection test failed:", error);
      return false;
    }
  }
}

// ===== PostgreSQL Connector =====
export class PostgreSQLConnector {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async executeQuery(request: QueryRequest): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      console.log(
        `[PostgreSQL] Executing query: ${request.query.substring(0, 100)}...`
      );

      // ใช้ Prisma's raw query capability สำหรับ PostgreSQL
      const result = await this.prisma.$queryRawUnsafe(
        request.query,
        ...(request.params ? Object.values(request.params) : [])
      );

      const executionTime = Date.now() - startTime;

      // Convert result to standard format
      const data = Array.isArray(result) ? result : [result];
      const columns = data.length > 0 ? Object.keys(data[0]) : [];

      return {
        success: true,
        data,
        columns,
        rowCount: data.length,
        executionTime,
        metadata: {
          dataSource: "postgresql",
          query: request.query,
          params: request.params,
        },
      };
    } catch (error) {
      console.error("[PostgreSQL] Query execution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
        metadata: {
          dataSource: "postgresql",
          query: request.query,
          params: request.params,
        },
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`;
      return true;
    } catch (error) {
      console.error("[PostgreSQL] Connection test failed:", error);
      return false;
    }
  }
}

// ===== MySQL Connector =====
export class MySQLConnector {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async executeQuery(request: QueryRequest): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      console.log(
        `[MySQL] Executing query: ${request.query.substring(0, 100)}...`
      );

      // ใช้ Prisma's raw query capability สำหรับ MySQL
      const result = await this.prisma.$queryRawUnsafe(
        request.query,
        ...(request.params ? Object.values(request.params) : [])
      );

      const executionTime = Date.now() - startTime;

      // Convert result to standard format
      const data = Array.isArray(result) ? result : [result];
      const columns = data.length > 0 ? Object.keys(data[0]) : [];

      return {
        success: true,
        data,
        columns,
        rowCount: data.length,
        executionTime,
        metadata: {
          dataSource: "mysql",
          query: request.query,
          params: request.params,
        },
      };
    } catch (error) {
      console.error("[MySQL] Query execution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
        metadata: {
          dataSource: "mysql",
          query: request.query,
          params: request.params,
        },
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`;
      return true;
    } catch (error) {
      console.error("[MySQL] Connection test failed:", error);
      return false;
    }
  }
}

// ===== API Connector =====
export class ApiConnector {
  async executeQuery(request: QueryRequest): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      console.log(`[API] Calling endpoint: ${request.query}`);

      // ใช้ query เป็น URL สำหรับ API calls
      const url = request.query;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if needed
          ...(request.params?.headers || {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      // Convert result to standard format
      const data = Array.isArray(result) ? result : [result];
      const columns = data.length > 0 ? Object.keys(data[0]) : [];

      return {
        success: true,
        data,
        columns,
        rowCount: data.length,
        executionTime,
        metadata: {
          dataSource: "api",
          query: request.query,
          params: request.params,
        },
      };
    } catch (error) {
      console.error("[API] Request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
        metadata: {
          dataSource: "api",
          query: request.query,
          params: request.params,
        },
      };
    }
  }

  async testConnection(): Promise<boolean> {
    // สำหรับ API เราไม่สามารถ test connection ทั่วไปได้
    return true;
  }
}

// ===== Main Multi-Connector Engine =====
export class MultiConnectorEngine {
  private sqlServerConnector: SqlServerConnector;
  private postgresConnector: PostgreSQLConnector;
  private mysqlConnector: MySQLConnector;
  private apiConnector: ApiConnector;

  constructor() {
    this.sqlServerConnector = new SqlServerConnector();
    this.postgresConnector = new PostgreSQLConnector();
    this.mysqlConnector = new MySQLConnector();
    this.apiConnector = new ApiConnector();
  }

  async executeQuery(request: QueryRequest): Promise<QueryResult> {
    console.log(
      `[Multi-Connector] Executing ${request.dataSourceType} query for widget ${request.widgetId}`
    );

    // ตรวจสอบและเตรียม parameters
    let params = request.params;
    if (typeof params === "string") {
      try {
        params = JSON.parse(params);
      } catch (error) {
        console.warn(
          "[Multi-Connector] Invalid JSON parameters, using empty object"
        );
        params = {};
      }
    }

    const processedRequest = {
      ...request,
      params: params || {},
    };

    // เลือก Connector ที่ถูกต้อง
    switch (request.dataSourceType) {
      case "sql":
        return await this.sqlServerConnector.executeQuery(processedRequest);

      case "postgresql":
        return await this.postgresConnector.executeQuery(processedRequest);

      case "mysql":
        return await this.mysqlConnector.executeQuery(processedRequest);

      case "api":
        return await this.apiConnector.executeQuery(processedRequest);

      default:
        return {
          success: false,
          error: `Unsupported data source type: ${request.dataSourceType}`,
          metadata: {
            dataSource: request.dataSourceType,
            query: request.query,
            params: request.params,
          },
        };
    }
  }

  async testAllConnections(): Promise<Record<string, boolean>> {
    const results = {
      sql: await this.sqlServerConnector.testConnection(),
      postgresql: await this.postgresConnector.testConnection(),
      mysql: await this.mysqlConnector.testConnection(),
      api: await this.apiConnector.testConnection(),
    };

    console.log("[Multi-Connector] Connection test results:", results);
    return results;
  }
}

// Export singleton instance
export const multiConnectorEngine = new MultiConnectorEngine();
