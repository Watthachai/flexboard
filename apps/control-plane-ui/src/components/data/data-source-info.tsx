/**
 * Data Source Info Panel
 * แสดงข้อมูลเกี่ยวกับ data source ที่ upload
 */

"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database,
  FileText,
  BarChart3,
  Table,
  Hash,
  Type,
  Calendar,
} from "lucide-react";

interface DataSourceInfoProps {
  uploadedData: any;
  onGenerateWidgets: () => void;
}

export default function DataSourceInfo({
  uploadedData,
  onGenerateWidgets,
}: DataSourceInfoProps) {
  if (!uploadedData) {
    return (
      <Card className="p-4 m-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No data source available</p>
          <p className="text-xs mt-1">
            Create a new dashboard and upload data to get started
          </p>
        </div>
      </Card>
    );
  }

  const { columns = [], data = [], summary = {} } = uploadedData;

  // Safe access to summary properties with defaults
  const totalRows = summary.totalRows || 0;
  const totalQuantity = summary.totalQuantity || 0;
  const totalValue = summary.totalValue || 0;

  const numericColumns = columns.filter((col: any) => col?.type === "number");
  const stringColumns = columns.filter((col: any) => col?.type === "string");
  const dateColumns = columns.filter((col: any) => col?.type === "date");

  return (
    <Card className="p-4 m-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
          <FileText className="w-4 h-4 mr-2 text-green-600" />
          Uploaded Data Summary
        </h3>
        <Button
          size="sm"
          onClick={onGenerateWidgets}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Auto Generate Widgets
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {totalRows.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Total Rows
          </div>
        </div>

        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {columns.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Columns
          </div>
        </div>

        {totalQuantity > 0 && (
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {totalQuantity.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total Qty
            </div>
          </div>
        )}

        {totalValue > 0 && (
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              ฿{totalValue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total Value
            </div>
          </div>
        )}
      </div>

      {/* Column Types */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          <Hash className="w-3 h-3 mr-1 text-blue-500" />
          {numericColumns.length} Numeric
        </div>
        <div className="flex items-center text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          <Type className="w-3 h-3 mr-1 text-green-500" />
          {stringColumns.length} Text
        </div>
        <div className="flex items-center text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          <Calendar className="w-3 h-3 mr-1 text-purple-500" />
          {dateColumns.length} Date
        </div>
      </div>

      {/* Available Widget Types */}
      <div className="border-t pt-3">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Recommended Widget Types:
        </p>
        <div className="flex flex-wrap gap-1">
          <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
            KPI Cards
          </span>
          <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
            Data Table
          </span>
          {numericColumns.length > 0 && stringColumns.length > 0 && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
              Bar Charts
            </span>
          )}
          {numericColumns.length >= 2 && (
            <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
              Line Charts
            </span>
          )}
        </div>
      </div>

      {/* Quick Preview */}
      <details className="mt-3">
        <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
          Show Data Preview ({data.length} rows)
        </summary>
        <div className="mt-2 max-h-32 overflow-auto bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="text-xs">
            <div className="font-mono text-gray-600 dark:text-gray-400 mb-1">
              {columns.map((col: any) => col.displayName).join(" | ")}
            </div>
            {data.slice(0, 3).map((row: any, i: number) => (
              <div
                key={i}
                className="font-mono text-gray-800 dark:text-gray-200"
              >
                {columns
                  .map((col: any) => String(row[col.name] || ""))
                  .join(" | ")}
              </div>
            ))}
            {data.length > 3 && (
              <div className="text-gray-500 dark:text-gray-400 mt-1">
                ... and {data.length - 3} more rows
              </div>
            )}
          </div>
        </div>
      </details>
    </Card>
  );
}
