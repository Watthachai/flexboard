/**
 * Quick Setup Helper - Helps users quickly configure widgets with uploaded data
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useUploadedDataContext } from "@/contexts/UploadedDataContext";
import {
  Zap,
  PieChart,
  BarChart3,
  Table,
  TrendingUp,
  Database,
} from "lucide-react";

interface QuickSetupHelperProps {
  widgetId: string;
  widgetType: string;
}

export function QuickSetupHelper({
  widgetId,
  widgetType,
}: QuickSetupHelperProps) {
  const { updateWidgetConfig } = useDashboardStore();
  let uploadedData = null;
  try {
    const context = useUploadedDataContext();
    uploadedData = context.uploadedData;
    console.log("QuickSetupHelper - uploadedData:", uploadedData);
  } catch (error) {
    // Not within UploadedDataContext, return null silently
    console.log("QuickSetupHelper - Not within UploadedDataContext");
    return null;
  }

  if (!uploadedData || !uploadedData.columns) {
    console.log("QuickSetupHelper - No uploaded data or columns");
    return null;
  }

  console.log("QuickSetupHelper - Rendering for widget:", widgetId, widgetType);

  const setupPieChartWithData = () => {
    // For pie chart, we need a category column and a value column
    const categoryColumns = uploadedData.columns.filter(
      (col: any) => col.type === "string" || col.type === "text"
    );
    const valueColumns = uploadedData.columns.filter(
      (col: any) => col.type === "number" || col.type === "integer"
    );

    if (categoryColumns.length > 0 && valueColumns.length > 0) {
      const categoryColumn = categoryColumns[0].name;
      const valueColumn = valueColumns[0].name;

      updateWidgetConfig(widgetId, {
        dataSourceConfig: {
          type: "uploadedData",
          selectedColumns: [categoryColumn, valueColumn],
          transformations: {
            groupBy: categoryColumn,
            valueColumn: valueColumn,
            aggregation: "sum",
          },
        },
      });
    }
  };

  const setupBarChartWithData = () => {
    // Similar setup for bar chart
    const categoryColumns = uploadedData.columns.filter(
      (col: any) => col.type === "string" || col.type === "text"
    );
    const valueColumns = uploadedData.columns.filter(
      (col: any) => col.type === "number" || col.type === "integer"
    );

    if (categoryColumns.length > 0 && valueColumns.length > 0) {
      const categoryColumn = categoryColumns[0].name;
      const valueColumn = valueColumns[0].name;

      updateWidgetConfig(widgetId, {
        dataSourceConfig: {
          type: "uploadedData",
          selectedColumns: [categoryColumn, valueColumn],
          transformations: {
            groupBy: categoryColumn,
            valueColumn: valueColumn,
            aggregation: "sum",
          },
        },
      });
    }
  };

  const setupTableWithData = () => {
    // For table, show first few columns
    const firstColumns = uploadedData.columns
      .slice(0, 5)
      .map((col: any) => col.name);

    updateWidgetConfig(widgetId, {
      dataSourceConfig: {
        type: "uploadedData",
        selectedColumns: firstColumns,
        transformations: {},
      },
    });
  };

  const getQuickSetupOptions = () => {
    const options = [];

    if (widgetType === "pie-chart") {
      options.push({
        icon: PieChart,
        label: "Use Uploaded Data for Pie Chart",
        description: "Group by category and sum values",
        action: setupPieChartWithData,
        color: "bg-blue-500",
      });
    }

    if (widgetType === "bar-chart") {
      options.push({
        icon: BarChart3,
        label: "Use Uploaded Data for Bar Chart",
        description: "Group by category and sum values",
        action: setupBarChartWithData,
        color: "bg-green-500",
      });
    }

    if (widgetType === "table") {
      options.push({
        icon: Table,
        label: "Use Uploaded Data for Table",
        description: "Show first 5 columns",
        action: setupTableWithData,
        color: "bg-purple-500",
      });
    }

    return options;
  };

  const quickOptions = getQuickSetupOptions();

  if (quickOptions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center mb-3">
        <Zap className="w-5 h-5 text-blue-500 mr-2" />
        <h4 className="font-medium text-blue-900 dark:text-blue-100">
          Quick Setup Available!
        </h4>
        <Badge variant="secondary" className="ml-2 text-xs">
          {uploadedData.totalRows || uploadedData.rows?.length || 0} rows
        </Badge>
      </div>

      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        ตรวจพบข้อมูลที่อัปโหลด คุณสามารถใช้ข้อมูลนี้กับ widget ได้ทันที
      </p>

      <div className="space-y-2">
        {quickOptions.map((option, index) => {
          const IconComponent = option.icon;
          return (
            <Button
              key={index}
              onClick={option.action}
              variant="outline"
              className="w-full justify-start text-left h-auto p-3 hover:bg-white dark:hover:bg-gray-800"
            >
              <div
                className={`w-8 h-8 rounded ${option.color} flex items-center justify-center mr-3`}
              >
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
          <Database className="w-3 h-3 mr-1" />
          Available columns:
        </div>
        <div className="flex flex-wrap gap-1">
          {uploadedData.columns.slice(0, 6).map((col: any, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {col.name} ({col.type})
            </Badge>
          ))}
          {uploadedData.columns.length > 6 && (
            <Badge variant="secondary" className="text-xs">
              +{uploadedData.columns.length - 6} more
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
