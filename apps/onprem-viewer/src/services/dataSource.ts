/**
 * Data Source Service - Handles local data connections
 */

import { sqlQueryService, type SQLConnectionConfig } from "./sqlQuery";

export interface DataSourceConfig {
  id: string;
  type: "sql" | "xml" | "csv" | "api";
  name: string;
  connectionString?: string;
  filePath?: string;
  apiEndpoint?: string;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
  queryTemplate?: string;
  tableName?: string; // Add table name for SQL queries
  lastSync?: string;
  status: "connected" | "disconnected" | "error";
}

export interface DataResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  error?: string;
}

class DataSourceService {
  async testConnection(
    config: DataSourceConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (config.type) {
        case "sql":
          return await this.testSQLConnection(config);
        case "xml":
        case "csv":
          return await this.testFileConnection(config);
        case "api":
          return await this.testAPIConnection(config);
        default:
          return { success: false, error: "Unsupported data source type" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async testSQLConnection(
    config: DataSourceConfig
  ): Promise<{ success: boolean; error?: string }> {
    if (!config.connectionString) {
      return { success: false, error: "Connection string is required" };
    }

    try {
      // Detect database type from connection string
      const dbType = this.detectDatabaseType(config.connectionString);

      const sqlConfig: SQLConnectionConfig = {
        type: dbType,
        connectionString: config.connectionString,
      };

      return await sqlQueryService.testConnection(sqlConfig);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "SQL connection failed",
      };
    }
  }

  private detectDatabaseType(
    connectionString: string
  ): "postgresql" | "mysql" | "sqlite" {
    if (
      connectionString.startsWith("postgresql://") ||
      connectionString.startsWith("postgres://")
    ) {
      return "postgresql";
    } else if (
      connectionString.startsWith("mysql://") ||
      connectionString.includes("mysql")
    ) {
      return "mysql";
    } else if (
      connectionString.startsWith("sqlite:") ||
      connectionString.includes(".db") ||
      connectionString.includes(".sqlite")
    ) {
      return "sqlite";
    }

    // Default to PostgreSQL if unclear
    return "postgresql";
  }

  private async testFileConnection(
    config: DataSourceConfig
  ): Promise<{ success: boolean; error?: string }> {
    if (!config.filePath) {
      return { success: false, error: "File path is required" };
    }

    // In a real implementation, this would check if file exists and is readable
    // For demo purposes, we'll check basic path format

    const extension = config.filePath.split(".").pop()?.toLowerCase();
    const expectedExtension = config.type;

    if (extension !== expectedExtension) {
      return {
        success: false,
        error: `File extension should be .${expectedExtension}`,
      };
    }

    // Simulate file access check
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true };
  }

  private async testAPIConnection(
    config: DataSourceConfig
  ): Promise<{ success: boolean; error?: string }> {
    if (!config.apiEndpoint) {
      return { success: false, error: "API endpoint is required" };
    }

    try {
      // Test actual API connection
      const response = await fetch(config.apiEndpoint, {
        method: "HEAD", // Use HEAD to test connectivity without downloading data
        headers: config.credentials?.apiKey
          ? {
              Authorization: `Bearer ${config.credentials.apiKey}`,
            }
          : undefined,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API returned ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async fetchData(
    config: DataSourceConfig,
    query?: string
  ): Promise<DataResult> {
    try {
      switch (config.type) {
        case "sql":
          return await this.fetchSQLData(config, query);
        case "xml":
          return await this.fetchXMLData(config);
        case "csv":
          return await this.fetchCSVData(config);
        case "api":
          return await this.fetchAPIData(config);
        default:
          return { success: false, error: "Unsupported data source type" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async fetchSQLData(
    config: DataSourceConfig,
    customQuery?: string
  ): Promise<DataResult> {
    if (!config.connectionString) {
      return { success: false, error: "Connection string is required" };
    }

    try {
      const dbType = this.detectDatabaseType(config.connectionString);

      const sqlConfig: SQLConnectionConfig = {
        type: dbType,
        connectionString: config.connectionString,
      };

      // Use custom query if provided, otherwise use the configured query template
      let query = customQuery || config.queryTemplate;

      if (!query) {
        // Generate a default query based on table name
        const tableName = config.tableName || "data_table";
        query = `SELECT * FROM ${tableName} LIMIT 100`;
      }

      const result = await sqlQueryService.executeQuery(sqlConfig, query);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          columns: result.columns,
        };
      } else {
        return {
          success: false,
          error: result.error || "SQL query failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "SQL execution failed",
      };
    }
  }

  // Method to execute widget-specific queries
  async fetchDataForWidget(
    config: DataSourceConfig,
    widget: any
  ): Promise<DataResult> {
    if (config.type === "sql") {
      try {
        const dbType = this.detectDatabaseType(config.connectionString!);

        const sqlConfig: SQLConnectionConfig = {
          type: dbType,
          connectionString: config.connectionString!,
        };

        // Generate widget-specific query
        const query = sqlQueryService.generateQueryFromWidget(
          widget,
          config.tableName
        );
        console.log(`Generated query for widget ${widget.id}:`, query);

        const result = await sqlQueryService.executeQuery(sqlConfig, query);

        return {
          success: result.success,
          data: result.data,
          columns: result.columns,
          error: result.error,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Widget query failed",
        };
      }
    } else {
      // For non-SQL sources, use regular fetchData
      return await this.fetchData(config);
    }
  }

  private async fetchXMLData(config: DataSourceConfig): Promise<DataResult> {
    // In a real implementation, this would parse the XML file
    // Return empty data until real XML parsing is implemented

    return {
      success: false,
      error: "XML data source not implemented yet",
      data: [],
      columns: [],
    };
  }

  private async fetchCSVData(config: DataSourceConfig): Promise<DataResult> {
    // In a real implementation, this would parse the CSV file
    // Return empty data until real CSV parsing is implemented

    return {
      success: false,
      error: "CSV data source not implemented yet",
      data: [],
      columns: [],
    };
  }

  private async fetchAPIData(config: DataSourceConfig): Promise<DataResult> {
    if (!config.apiEndpoint) {
      return { success: false, error: "API endpoint not configured" };
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (config.credentials?.apiKey) {
        headers["Authorization"] = `Bearer ${config.credentials.apiKey}`;
      }

      const response = await fetch(config.apiEndpoint, { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      // Try to extract array data and columns
      let arrayData = Array.isArray(data)
        ? data
        : data.data || data.results || [];
      let columns: string[] = [];

      if (arrayData.length > 0) {
        columns = Object.keys(arrayData[0]);
      }

      return {
        success: true,
        data: arrayData,
        columns,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  getConfiguredDataSources(): DataSourceConfig[] {
    try {
      const saved = localStorage.getItem("onprem-datasources");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to load data sources:", error);
      return [];
    }
  }

  saveDataSource(config: DataSourceConfig) {
    const existing = this.getConfiguredDataSources();
    const updated = existing.filter((ds) => ds.id !== config.id);
    updated.push(config);

    localStorage.setItem("onprem-datasources", JSON.stringify(updated));
  }

  removeDataSource(id: string) {
    const existing = this.getConfiguredDataSources();
    const updated = existing.filter((ds) => ds.id !== id);

    localStorage.setItem("onprem-datasources", JSON.stringify(updated));
  }
}

export const dataSourceService = new DataSourceService();
