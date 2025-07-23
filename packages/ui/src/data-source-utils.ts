/**
 * Data Source Utilities
 * สำหรับจัดการข้อมูลที่ upload และ parse กลับมาใช้งาน
 */

export interface ParsedUploadData {
  columns: {
    name: string;
    type: "string" | "number" | "date";
    displayName: string;
  }[];
  data: Record<string, string | number>[];
  summary: {
    totalRows: number;
    dateRange: { from: string; to: string };
    uniqueProducts: number;
    totalQuantity: number;
    totalValue: number;
  };
}

export class DataSourceUtils {
  /**
   * Parse JSON string กลับเป็น object
   */
  static parseUploadedData(
    uploadedDataString: string
  ): ParsedUploadData | null {
    try {
      const parsed = JSON.parse(uploadedDataString);

      // Validate structure
      if (!parsed.columns || !Array.isArray(parsed.columns)) {
        console.error("Invalid uploaded data: missing columns");
        return null;
      }

      if (!parsed.data || !Array.isArray(parsed.data)) {
        console.error("Invalid uploaded data: missing data");
        return null;
      }

      return parsed as ParsedUploadData;
    } catch (error) {
      console.error("Error parsing uploaded data:", error);
      return null;
    }
  }

  /**
   * Query uploaded data โดยใช้ JavaScript filter
   */
  static queryData(
    uploadedData: ParsedUploadData,
    filter?: string,
    limit?: number,
    offset?: number
  ): {
    data: Record<string, string | number>[];
    totalCount: number;
  } {
    let filteredData = uploadedData.data;

    // Apply JavaScript filter if provided
    if (filter) {
      try {
        // Create a safe evaluation context
        const filterFunction = new Function(
          "data",
          `return data.filter(row => ${filter})`
        );
        filteredData = filterFunction(uploadedData.data);
      } catch (error) {
        console.error("Error applying filter:", error);
        // Fallback to original data if filter fails
      }
    }

    const totalCount = filteredData.length;

    // Apply pagination
    if (offset !== undefined && limit !== undefined) {
      filteredData = filteredData.slice(offset, offset + limit);
    } else if (limit !== undefined) {
      filteredData = filteredData.slice(0, limit);
    }

    return {
      data: filteredData,
      totalCount,
    };
  }

  /**
   * Aggregate data สำหรับ KPI widgets
   */
  static aggregateData(
    uploadedData: ParsedUploadData,
    operation: "sum" | "avg" | "count" | "min" | "max",
    columnName: string,
    filter?: string
  ): number {
    const { data } = this.queryData(uploadedData, filter);

    const values = data
      .map((row) => row[columnName])
      .filter((val) => val !== undefined && val !== null && val !== "")
      .map((val) => (typeof val === "number" ? val : parseFloat(String(val))))
      .filter((val) => !isNaN(val));

    if (values.length === 0) return 0;

    switch (operation) {
      case "sum":
        return values.reduce((sum, val) => sum + val, 0);
      case "avg":
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case "count":
        return values.length;
      case "min":
        return Math.min(...values);
      case "max":
        return Math.max(...values);
      default:
        return 0;
    }
  }

  /**
   * Group data สำหรับ Chart widgets
   */
  static groupData(
    uploadedData: ParsedUploadData,
    groupByColumn: string,
    valueColumn: string,
    operation: "sum" | "avg" | "count" = "sum"
  ): { label: string; value: number }[] {
    const { data } = this.queryData(uploadedData);

    const groups: Record<string, number[]> = {};

    data.forEach((row) => {
      const groupKey = String(row[groupByColumn] || "Unknown");
      const value =
        typeof row[valueColumn] === "number"
          ? row[valueColumn]
          : parseFloat(String(row[valueColumn])) || 0;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(value);
    });

    return Object.entries(groups).map(([label, values]) => {
      let aggregatedValue = 0;

      switch (operation) {
        case "sum":
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
          break;
        case "avg":
          aggregatedValue =
            values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case "count":
          aggregatedValue = values.length;
          break;
      }

      return { label, value: aggregatedValue };
    });
  }

  /**
   * Get column suggestions based on data type
   */
  static getColumnSuggestions(
    uploadedData: ParsedUploadData,
    purpose: "groupBy" | "value" | "date"
  ): { name: string; displayName: string; type: string }[] {
    return uploadedData.columns.filter((col) => {
      switch (purpose) {
        case "groupBy":
          return col.type === "string";
        case "value":
          return col.type === "number";
        case "date":
          return col.type === "date";
        default:
          return true;
      }
    });
  }

  /**
   * Validate if uploaded data can support specific widget type
   */
  static canSupportWidgetType(
    uploadedData: ParsedUploadData,
    widgetType: string
  ): { supported: boolean; requirements?: string[] } {
    const numericColumns = uploadedData.columns.filter(
      (col) => col.type === "number"
    );
    const stringColumns = uploadedData.columns.filter(
      (col) => col.type === "string"
    );

    switch (widgetType) {
      case "kpi":
        return {
          supported: numericColumns.length > 0,
          requirements:
            numericColumns.length === 0
              ? ["At least one numeric column required"]
              : undefined,
        };

      case "chart":
        return {
          supported: numericColumns.length > 0 && stringColumns.length > 0,
          requirements:
            numericColumns.length === 0 || stringColumns.length === 0
              ? ["At least one numeric and one text column required"]
              : undefined,
        };

      case "table":
        return {
          supported: uploadedData.columns.length > 0,
          requirements:
            uploadedData.columns.length === 0
              ? ["At least one column required"]
              : undefined,
        };

      default:
        return { supported: true };
    }
  }
}
