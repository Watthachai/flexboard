/**
 * Context for sharing uploaded data throughout the dashboard
 */

import React, { createContext, useContext, ReactNode } from "react";

interface UploadedDataContextType {
  uploadedData: any;
  dashboards: any[];
  tenantId: string;
}

const UploadedDataContext = createContext<UploadedDataContextType | undefined>(
  undefined
);

interface UploadedDataProviderProps {
  children: ReactNode;
  uploadedData: any;
  dashboards?: any[];
  tenantId: string;
}

export function UploadedDataProvider({
  children,
  uploadedData,
  dashboards = [],
  tenantId,
}: UploadedDataProviderProps) {
  return (
    <UploadedDataContext.Provider
      value={{
        uploadedData,
        dashboards,
        tenantId,
      }}
    >
      {children}
    </UploadedDataContext.Provider>
  );
}

export function useUploadedDataContext() {
  const context = useContext(UploadedDataContext);
  if (context === undefined) {
    throw new Error(
      "useUploadedDataContext must be used within an UploadedDataProvider"
    );
  }
  return context;
}

// Hook for getting data for a specific widget
export function useWidgetDataSource(widget: any) {
  const { uploadedData, dashboards } = useUploadedDataContext();

  if (!widget?.config?.dataSourceConfig) {
    return null;
  }

  const config = widget.config.dataSourceConfig;

  // Handle static data (from quick generation)
  if (config.type === "static" && widget.config.staticData) {
    return widget.config.staticData;
  }

  // Handle uploaded data source
  if (config.type === "uploadedData") {
    const selectedDatasetId = config.selectedDatasetId;
    const selectedColumns = config.selectedColumns || [];
    const transformations = config.transformations || {};

    // If no specific dataset is selected, use the global uploaded data
    let sourceData = null;

    if (selectedDatasetId) {
      // Find the dashboard with the matching ID
      const targetDashboard = dashboards.find(
        (d) => d.id === selectedDatasetId
      );
      if (targetDashboard?.dataSourceConfig?.uploadedData) {
        try {
          sourceData = JSON.parse(
            targetDashboard.dataSourceConfig.uploadedData
          );
        } catch (error) {
          console.error("Error parsing dashboard uploaded data:", error);
        }
      }
    } else if (uploadedData) {
      // Use the global uploaded data
      sourceData = uploadedData;
    }

    if (!sourceData) {
      return null;
    }

    // Convert rows format to object format for easier processing
    let processedData: any[] = [];

    if (sourceData.columns && sourceData.rows) {
      // Convert {columns: [...], rows: [...]} format to array of objects
      const columnNames = sourceData.columns.map((col: any) => col.name || col);
      processedData = sourceData.rows.map((row: any[]) => {
        const obj: any = {};
        columnNames.forEach((colName: string, index: number) => {
          obj[colName] = row[index];
        });
        return obj;
      });
    } else if (Array.isArray(sourceData.data)) {
      // Data is already in object format
      processedData = sourceData.data;
    } else if (Array.isArray(sourceData)) {
      // Data is an array of objects
      processedData = sourceData;
    }

    // Apply column filtering
    if (selectedColumns.length > 0) {
      processedData = processedData.map((row: any) => {
        const filteredRow: any = {};
        selectedColumns.forEach((columnName: string) => {
          if (row.hasOwnProperty(columnName)) {
            filteredRow[columnName] = row[columnName];
          }
        });
        return filteredRow;
      });
    }

    // Apply transformations
    if (transformations.groupBy) {
      // Group by specified column
      const grouped = processedData.reduce((acc: any, row: any) => {
        const key = row[transformations.groupBy];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {});

      // Apply aggregation if specified
      if (transformations.aggregation && transformations.valueColumn) {
        processedData = Object.entries(grouped).map(
          ([key, group]: [string, any]) => {
            const values = group.map(
              (item: any) => parseFloat(item[transformations.valueColumn]) || 0
            );

            let aggregatedValue = 0;
            switch (transformations.aggregation) {
              case "sum":
                aggregatedValue = values.reduce(
                  (sum: number, val: number) => sum + val,
                  0
                );
                break;
              case "avg":
                aggregatedValue =
                  values.reduce((sum: number, val: number) => sum + val, 0) /
                  values.length;
                break;
              case "count":
                aggregatedValue = values.length;
                break;
              case "max":
                aggregatedValue = Math.max(...values);
                break;
              case "min":
                aggregatedValue = Math.min(...values);
                break;
              default:
                aggregatedValue = values.reduce(
                  (sum: number, val: number) => sum + val,
                  0
                );
            }

            return {
              label: key,
              name: key,
              value: aggregatedValue,
              [transformations.groupBy]: key,
              [transformations.valueColumn]: aggregatedValue,
            };
          }
        );
      } else {
        // Just return grouped data without aggregation
        processedData = Object.entries(grouped).map(
          ([key, group]: [string, any]) => ({
            label: key,
            name: key,
            value: group.length,
            data: group,
          })
        );
      }
    }

    // Apply filters
    if (transformations.filters && Array.isArray(transformations.filters)) {
      transformations.filters.forEach((filter: any) => {
        if (filter.column && filter.operator && filter.value !== undefined) {
          processedData = processedData.filter((row: any) => {
            const rowValue = row[filter.column];
            const filterValue = filter.value;

            switch (filter.operator) {
              case "equals":
                return rowValue == filterValue;
              case "not_equals":
                return rowValue != filterValue;
              case "greater_than":
                return parseFloat(rowValue) > parseFloat(filterValue);
              case "less_than":
                return parseFloat(rowValue) < parseFloat(filterValue);
              case "contains":
                return String(rowValue)
                  .toLowerCase()
                  .includes(String(filterValue).toLowerCase());
              default:
                return true;
            }
          });
        }
      });
    }

    // Apply sorting
    if (transformations.orderBy) {
      processedData.sort((a: any, b: any) => {
        const aVal = a[transformations.orderBy];
        const bVal = b[transformations.orderBy];

        if (transformations.orderDirection === "desc") {
          return bVal > aVal ? 1 : -1;
        } else {
          return aVal > bVal ? 1 : -1;
        }
      });
    }

    return processedData;
  }

  return null;
}
