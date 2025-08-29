/**
 * Enhanced Widget Renderer
 * Maps new schema widget types to appropriate chart components
 */

"use client";

import React from "react";
import {
  KPIWidget,
  BarChartWidget,
  LineChartWidget,
  TableWidget,
  ActionBarWidget,
} from "./EnhancedCharts";

interface WidgetRendererProps {
  widget: any;
  data: any[];
  config: any;
}

// Data processor to handle queries and transforms
const processWidgetData = (widget: any, rawData: any[], config: any): any => {
  if (!rawData.length) return { processedData: [], value: null };

  // For KPI widgets
  if (widget.type === "kpi") {
    const measures = widget.query?.measures || [];
    if (measures.length > 0) {
      const measure = measures[0];
      let value = 0;

      // Calculate aggregation
      if (measure.agg === "sum") {
        value = rawData.reduce(
          (sum, row) => sum + (Number(row[measure.field]) || 0),
          0
        );
      } else if (measure.agg === "count") {
        value = rawData.length;
      } else if (measure.agg === "avg") {
        const sum = rawData.reduce(
          (sum, row) => sum + (Number(row[measure.field]) || 0),
          0
        );
        value = rawData.length > 0 ? sum / rawData.length : 0;
      }

      return { processedData: rawData, value };
    }
  }

  // For chart widgets (bar, line)
  if (["bar", "line", "pareto", "stackedBar"].includes(widget.type)) {
    const dimensions = widget.query?.dimensions || [];
    const measures = widget.query?.measures || [];

    if (dimensions.length > 0 && measures.length > 0) {
      const groupBy = dimensions[0];
      const measureField = measures[0].field;
      const measureAlias = measures[0].as || measureField;

      // Group by dimension and aggregate
      const grouped = rawData.reduce((acc, row) => {
        const key = row[groupBy];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as any);

      // Calculate aggregated values
      const processedData = Object.entries(grouped).map(([key, rows]) => {
        const rowsArray = rows as any[];
        let aggregatedValue = 0;

        if (measures[0].agg === "sum") {
          aggregatedValue = rowsArray.reduce(
            (sum, row) => sum + (Number(row[measureField]) || 0),
            0
          );
        } else if (measures[0].agg === "count") {
          aggregatedValue = rowsArray.length;
        } else if (measures[0].agg === "avg") {
          const sum = rowsArray.reduce(
            (sum, row) => sum + (Number(row[measureField]) || 0),
            0
          );
          aggregatedValue = rowsArray.length > 0 ? sum / rowsArray.length : 0;
        } else if (measures[0].agg === "min") {
          aggregatedValue = Math.min(
            ...rowsArray.map((row) => Number(row[measureField]) || 0)
          );
        } else if (measures[0].agg === "max") {
          aggregatedValue = Math.max(
            ...rowsArray.map((row) => Number(row[measureField]) || 0)
          );
        }

        return {
          [groupBy]: key,
          [measureAlias]: aggregatedValue,
          ...rowsArray[0], // Include other fields from first row
        };
      });

      // Apply sorting if specified
      if (widget.query.sort) {
        const sortField = widget.query.sort[0]?.field;
        const sortDir = widget.query.sort[0]?.dir || "asc";

        processedData.sort((a, b) => {
          const aVal = Number(a[sortField]) || 0;
          const bVal = Number(b[sortField]) || 0;
          return sortDir === "desc" ? bVal - aVal : aVal - bVal;
        });
      }

      // Apply limit if specified
      if (widget.query.limit) {
        return {
          processedData: processedData.slice(0, widget.query.limit),
          value: null,
        };
      }

      return { processedData, value: null };
    }
  }

  // For table widgets
  if (widget.type === "table") {
    let processedData = [...rawData];

    // Apply filters if specified
    if (widget.query?.filters) {
      widget.query.filters.forEach((filter: any) => {
        if (filter.op === "lte" && filter.value !== undefined) {
          processedData = processedData.filter(
            (row) => Number(row[filter.field]) <= Number(filter.value)
          );
        } else if (filter.op === "between" && Array.isArray(filter.value)) {
          processedData = processedData.filter((row) => {
            const val = Number(row[filter.field]);
            return val >= filter.value[0] && val <= filter.value[1];
          });
        }
      });
    }

    // Apply sorting
    if (widget.query?.sort) {
      const sortField = widget.query.sort[0]?.field;
      const sortDir = widget.query.sort[0]?.dir || "asc";

      processedData.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        // Handle different data types
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDir === "desc"
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        } else {
          const aNum = Number(aVal) || 0;
          const bNum = Number(bVal) || 0;
          return sortDir === "desc" ? bNum - aNum : aNum - bNum;
        }
      });
    }

    return { processedData, value: null };
  }

  // For actionBar widgets
  if (widget.type === "actionBar") {
    return { processedData: rawData, value: null };
  }

  return { processedData: rawData, value: null };
};

// Determine severity for KPI widgets
const getKPISeverity = (
  widget: any,
  value: number
): "ok" | "warning" | "danger" => {
  if (widget.display?.severityRules) {
    for (const rule of widget.display.severityRules) {
      if (rule.if && rule.if.includes("> 0") && value > 0) {
        return rule.color;
      } else if (rule.else) {
        return rule.color;
      }
    }
  }
  return "ok";
};

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  data,
  config,
}) => {
  const { processedData, value } = processWidgetData(widget, data, config);

  console.log(`🎯 Rendering widget "${widget.title}" (${widget.type}):`, {
    rawDataCount: data.length,
    processedDataCount: processedData.length,
    value,
    widgetType: widget.type,
  });

  switch (widget.type) {
    case "kpi":
      return (
        <KPIWidget
          data={processedData}
          title={widget.title}
          value={value || 0}
          formatter={widget.display?.valueFormatter}
          severity={getKPISeverity(widget, value || 0)}
          tooltip={widget.tooltip?.template?.replace(
            /\{\{\s*(\w+)\s*\}\}/g,
            String(value || 0)
          )}
        />
      );

    case "bar":
      const xField =
        widget.encoding?.x?.field || widget.query?.dimensions?.[0] || "x";
      const yField =
        widget.encoding?.y?.field ||
        widget.query?.measures?.[0]?.as ||
        widget.query?.measures?.[0]?.field ||
        "y";

      return (
        <BarChartWidget
          data={processedData}
          title={widget.title}
          xAxis={xField}
          yAxis={yField}
          formatter={
            widget.encoding?.x?.formatter || widget.encoding?.y?.formatter
          }
          tooltip={widget.tooltip}
        />
      );

    case "line":
      const xFieldLine =
        widget.encoding?.x?.field || widget.query?.dimensions?.[0] || "x";
      const yFieldLine =
        widget.encoding?.y?.field ||
        widget.query?.measures?.[0]?.as ||
        widget.query?.measures?.[0]?.field ||
        "y";

      return (
        <LineChartWidget
          data={processedData}
          title={widget.title}
          xAxis={xFieldLine}
          yAxis={yFieldLine}
          formatter={
            widget.encoding?.x?.formatter || widget.encoding?.y?.formatter
          }
          tooltip={widget.tooltip}
        />
      );

    case "table":
      const columns =
        widget.query?.columns || Object.keys(processedData[0] || {});

      return (
        <TableWidget
          data={processedData}
          title={widget.title}
          columns={columns}
          formatters={widget.display?.columnFormatters || {}}
          pageSize={widget.display?.pageSize || 20}
        />
      );

    case "actionBar":
      return (
        <ActionBarWidget
          title={widget.title}
          actions={widget.actions || []}
          data={processedData}
        />
      );

    case "pareto":
      // Fallback to bar chart for pareto visualization
      const xFieldPareto =
        widget.encoding?.x?.field || widget.query?.dimensions?.[0] || "x";
      const yFieldPareto =
        widget.encoding?.yLeft?.field ||
        widget.query?.measures?.[0]?.as ||
        widget.query?.measures?.[0]?.field ||
        "y";

      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {widget.title}
            </h3>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
              Pareto → Bar
            </span>
          </div>
          <div className="flex-1">
            <BarChartWidget
              data={processedData}
              title=""
              xAxis={yFieldPareto}
              yAxis={xFieldPareto}
              formatter={widget.encoding?.yLeft?.formatter}
              tooltip={widget.tooltip}
            />
          </div>
        </div>
      );

    case "stackedBar":
      // Fallback to bar chart for stacked bar visualization
      const xFieldStacked =
        widget.encoding?.x?.field || widget.query?.dimensions?.[0] || "x";
      const yFieldStacked =
        widget.encoding?.y?.field ||
        widget.query?.measures?.[0]?.as ||
        widget.query?.measures?.[0]?.field ||
        "y";

      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {widget.title}
            </h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              Stacked → Bar
            </span>
          </div>
          <div className="flex-1">
            <BarChartWidget
              data={processedData}
              title=""
              xAxis={yFieldStacked}
              yAxis={xFieldStacked}
              formatter={widget.encoding?.y?.formatter}
              tooltip={widget.tooltip}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="h-full flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">
            {widget.title}
          </h3>
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-sm">Unsupported widget type: {widget.type}</p>
              <div className="text-xs mt-2 p-2 bg-yellow-100 rounded">
                Available: kpi, bar, line, table, actionBar, pareto, stackedBar
              </div>
            </div>
          </div>
        </div>
      );
  }
};
