/**
 * Dashboard Data Hook
 * สำหรับเข้าถึงข้อมูลที่ upload ใน Dashboard
 */

import { useState, useEffect, useMemo } from "react";
import { DataSourceUtils, ParsedUploadData } from "./data-source-utils";

interface DashboardData {
  id: string;
  name: string;
  dataSourceConfig?: {
    type: string;
    template?: string;
    uploadedData?: string;
  };
}

export function useDashboardData(dashboard: DashboardData | null) {
  const [uploadedData, setUploadedData] = useState<ParsedUploadData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboard?.dataSourceConfig?.uploadedData) {
      setUploadedData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsed = DataSourceUtils.parseUploadedData(
        dashboard.dataSourceConfig.uploadedData
      );
      if (parsed) {
        setUploadedData(parsed);
      } else {
        setError("Failed to parse uploaded data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [dashboard?.dataSourceConfig?.uploadedData]);

  // ฟังก์ชันสำหรับ query ข้อมูล
  const queryData = useMemo(() => {
    if (!uploadedData) return null;

    return {
      // สำหรับ Table Widget
      getTableData: (page = 1, pageSize = 10, filter?: string) => {
        const offset = (page - 1) * pageSize;
        return DataSourceUtils.queryData(
          uploadedData,
          filter,
          pageSize,
          offset
        );
      },

      // สำหรับ KPI Widget
      getKpiValue: (
        columnName: string,
        operation: "sum" | "avg" | "count" | "min" | "max" = "sum",
        filter?: string
      ) => {
        return DataSourceUtils.aggregateData(
          uploadedData,
          operation,
          columnName,
          filter
        );
      },

      // สำหรับ Chart Widget
      getChartData: (
        groupByColumn: string,
        valueColumn: string,
        operation: "sum" | "avg" | "count" = "sum"
      ) => {
        return DataSourceUtils.groupData(
          uploadedData,
          groupByColumn,
          valueColumn,
          operation
        );
      },

      // Get column suggestions
      getColumns: (purpose?: "groupBy" | "value" | "date") => {
        return purpose
          ? DataSourceUtils.getColumnSuggestions(uploadedData, purpose)
          : uploadedData.columns;
      },

      // Check widget support
      canSupport: (widgetType: string) => {
        return DataSourceUtils.canSupportWidgetType(uploadedData, widgetType);
      },

      // Get raw data
      getRawData: () => uploadedData,
    };
  }, [uploadedData]);

  return {
    uploadedData,
    queryData,
    loading,
    error,
    hasData: uploadedData !== null,
  };
}

// Widget Data Hook สำหรับ individual widgets
export function useWidgetData(
  dashboard: DashboardData | null,
  widgetConfig: {
    type: string;
    dataConfig?: {
      sourceType?: string;
      query?: string;
      columnName?: string;
      operation?: "sum" | "avg" | "count" | "min" | "max";
      groupBy?: string;
      valueColumn?: string;
      filter?: string;
      limit?: number;
      page?: number;
    };
  }
) {
  const {
    queryData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData(dashboard);
  const [widgetData, setWidgetData] = useState<
    | number
    | { label: string; value: number }[]
    | { data: Record<string, string | number>[]; totalCount: number }
    | ParsedUploadData
    | null
  >(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!queryData || !widgetConfig.dataConfig) {
      setWidgetData(null);
      return;
    }

    setLoading(true);

    try {
      const { dataConfig } = widgetConfig;
      let result = null;

      switch (widgetConfig.type) {
        case "kpi":
          if (dataConfig.columnName && dataConfig.operation) {
            result = queryData.getKpiValue(
              dataConfig.columnName,
              dataConfig.operation,
              dataConfig.filter
            );
          }
          break;

        case "chart":
          if (dataConfig.groupBy && dataConfig.valueColumn) {
            result = queryData.getChartData(
              dataConfig.groupBy,
              dataConfig.valueColumn,
              (dataConfig.operation as "sum" | "avg" | "count") || "sum"
            );
          }
          break;

        case "table":
          result = queryData.getTableData(
            dataConfig.page || 1,
            dataConfig.limit || 10,
            dataConfig.filter
          );
          break;

        default:
          result = queryData.getRawData();
      }

      setWidgetData(result);
    } catch (error) {
      console.error("Error processing widget data:", error);
      setWidgetData(null);
    } finally {
      setLoading(false);
    }
  }, [queryData, widgetConfig]);

  return {
    data: widgetData,
    loading: loading || dashboardLoading,
    error: dashboardError,
    refresh: () => {
      // ข้อมูลจาก file ไม่ต้อง refresh แต่สามารถ re-process ได้
      if (queryData) {
        // Trigger re-effect
        setWidgetData(null);
      }
    },
  };
}
