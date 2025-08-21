/**
 * Real Table Widget with Recharts-style data processing
 * Supports complex queries, filtering, sorting, and formatting
 */

import React, { useState } from "react";

interface RealTableWidgetProps {
  data: any[];
  config: any;
  height?: number;
}

export default function RealTableWidget({
  data,
  config,
  height = 300,
}: RealTableWidgetProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Process data according to query config
  const { processedData, columns } = processTableData(
    data,
    config.query,
    sortField,
    sortOrder
  );

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-full h-full bg-white border rounded-lg p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📋</div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="w-full h-full bg-white border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-800">
          {config?.title || "Data Table"}
        </h3>
        <p className="text-sm text-gray-500">
          {processedData.length} rows • {columns.length} columns
        </p>
      </div>

      <div
        className="overflow-auto border border-gray-200 rounded-lg"
        style={{ height: height - 80 }}
      >
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.field}
                  className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 border-b"
                  onClick={() => handleSort(column.field)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {sortField === column.field && (
                      <span className="text-blue-600">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, index) => (
              <tr
                key={index}
                className={`border-b hover:bg-gray-50 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-25"
                }`}
              >
                {columns.map((column) => (
                  <td key={column.field} className="px-4 py-3">
                    <div
                      className={getConditionalStyling(
                        row[column.field],
                        column,
                        config.conditionalFormatting
                      )}
                    >
                      {formatCellValue(row[column.field], column.formatter)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function processTableData(
  data: any[],
  query: any,
  sortField?: string | null,
  sortOrder?: "asc" | "desc"
) {
  if (!data || data.length === 0) {
    return { processedData: [], columns: [] };
  }

  // Apply filters first
  let filteredData = data;
  if (query?.filters && query.filters.length > 0) {
    filteredData = data.filter((row) => {
      return query.filters.every((filter: any) => {
        const fieldValue = row[filter.field];
        switch (filter.operator) {
          case "equals":
            return fieldValue === filter.value;
          case "not_equals":
            return fieldValue !== filter.value;
          case "greater_than":
            return Number(fieldValue) > Number(filter.value);
          case "less_than":
            return Number(fieldValue) < Number(filter.value);
          case "contains":
            return String(fieldValue)
              .toLowerCase()
              .includes(String(filter.value).toLowerCase());
          case "in":
            return (
              Array.isArray(filter.value) && filter.value.includes(fieldValue)
            );
          default:
            return true;
        }
      });
    });
  }

  // Determine columns
  let columns: Array<{ field: string; title: string; formatter?: string }> = [];

  if (query?.dimensions && query?.measures) {
    // Use specified dimensions and measures
    query.dimensions.forEach((dim: string) => {
      columns.push({
        field: dim,
        title: formatTitle(dim),
        formatter: "text",
      });
    });

    query.measures.forEach((measure: any) => {
      columns.push({
        field: measure.field,
        title: measure.title || formatTitle(measure.field),
        formatter: measure.formatter || "number",
      });
    });
  } else {
    // Auto-detect columns from data
    if (filteredData.length > 0) {
      Object.keys(filteredData[0]).forEach((key) => {
        columns.push({
          field: key,
          title: formatTitle(key),
          formatter: detectFormatter(filteredData[0][key]),
        });
      });
    }
  }

  // Apply aggregation if specified
  let processedData = filteredData;
  if (
    query?.dimensions &&
    query?.measures &&
    query.measures.some((m: any) => m.aggregation)
  ) {
    processedData = aggregateTableData(filteredData, query);
  }

  // Apply sorting
  if (sortField) {
    processedData = [...processedData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        const result = aVal.localeCompare(bVal);
        return sortOrder === "desc" ? -result : result;
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortOrder === "desc" ? numB - numA : numA - numB;
    });
  } else if (query?.sort) {
    const sortField = query.sort.field;
    const sortOrder = query.sort.order || "asc";
    processedData = [...processedData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        const result = aVal.localeCompare(bVal);
        return sortOrder === "desc" ? -result : result;
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortOrder === "desc" ? numB - numA : numA - numB;
    });
  }

  // Apply limit
  if (query?.limit) {
    processedData = processedData.slice(0, query.limit);
  }

  return { processedData, columns };
}

function aggregateTableData(data: any[], query: any) {
  const dimensions = query.dimensions || [];
  const measures = query.measures || [];

  // Group by dimensions
  const grouped = data.reduce((acc, row) => {
    const key = dimensions.map((dim: string) => row[dim]).join("|");
    if (!acc[key]) {
      acc[key] = {
        dimensions: dimensions.reduce((dimObj: any, dim: string) => {
          dimObj[dim] = row[dim];
          return dimObj;
        }, {}),
        measures: measures.reduce((measObj: any, measure: any) => {
          measObj[measure.field] = { values: [], count: 0, sum: 0 };
          return measObj;
        }, {}),
      };
    }

    measures.forEach((measure: any) => {
      const value = Number(row[measure.field]) || 0;
      acc[key].measures[measure.field].values.push(value);
      acc[key].measures[measure.field].count += 1;
      acc[key].measures[measure.field].sum += value;
    });

    return acc;
  }, {});

  // Apply aggregations
  return Object.values(grouped).map((group: any) => {
    const result = { ...group.dimensions };

    measures.forEach((measure: any) => {
      const measureData = group.measures[measure.field];
      switch (measure.aggregation) {
        case "sum":
          result[measure.field] = measureData.sum;
          break;
        case "count":
          result[measure.field] = measureData.count;
          break;
        case "avg":
          result[measure.field] =
            measureData.count > 0 ? measureData.sum / measureData.count : 0;
          break;
        case "min":
          result[measure.field] = Math.min(...measureData.values);
          break;
        case "max":
          result[measure.field] = Math.max(...measureData.values);
          break;
        default:
          result[measure.field] = measureData.sum;
      }
    });

    return result;
  });
}

function formatTitle(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function detectFormatter(value: any): string {
  if (typeof value === "number") {
    if (value > 1000000 || String(value).includes(".")) {
      return "number";
    }
    return "qty";
  }
  if (typeof value === "string" && !isNaN(Date.parse(value))) {
    return "date";
  }
  return "text";
}

function formatCellValue(value: any, formatter?: string): string {
  if (value === null || value === undefined) {
    return "-";
  }

  switch (formatter) {
    case "number":
      return Number(value).toLocaleString();
    case "qty":
      return Number(value).toLocaleString("th-TH");
    case "money":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(Number(value));
    case "percentage":
      return `${Number(value).toFixed(1)}%`;
    case "date":
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("th-TH");
      }
      return String(value);
    case "days":
      return `${Number(value)} days`;
    default:
      return String(value);
  }
}

function getConditionalStyling(
  value: any,
  column: any,
  conditionalFormatting?: any
): string {
  let className = "";

  if (conditionalFormatting && conditionalFormatting.rules) {
    const numValue = Number(value);
    for (const rule of conditionalFormatting.rules) {
      if (rule.field === column.field || !rule.field) {
        if (evaluateCondition(numValue, rule.condition)) {
          className = getConditionalClass(rule.severity || rule.color);
          break;
        }
      }
    }
  }

  return className;
}

function evaluateCondition(value: number, condition: any): boolean {
  if (!condition) return false;

  switch (condition.operator) {
    case "greater_than":
      return value > Number(condition.value);
    case "less_than":
      return value < Number(condition.value);
    case "equals":
      return value === Number(condition.value);
    case "between":
      return value >= Number(condition.min) && value <= Number(condition.max);
    default:
      return false;
  }
}

function getConditionalClass(severity: string): string {
  switch (severity) {
    case "danger":
    case "red":
      return "text-red-600 bg-red-50 font-medium";
    case "warning":
    case "yellow":
      return "text-yellow-600 bg-yellow-50 font-medium";
    case "ok":
    case "green":
      return "text-green-600 bg-green-50 font-medium";
    default:
      return "";
  }
}
