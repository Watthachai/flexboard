"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  extractDatasetFromMetadata,
  detectColumnType,
  formatDataValue,
} from "@/lib/data-utils";

interface DataViewerProps {
  jsonCode: string;
}

interface DataRecord {
  [key: string]: any;
}

interface CleanedData {
  dataset?: {
    record: DataRecord[];
  };
}

export default function DataViewer({ jsonCode }: DataViewerProps) {
  const [data, setData] = useState<DataRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!jsonCode) return;

    const dataset = extractDatasetFromMetadata(jsonCode);
    setData(dataset.records);
    setColumns(dataset.columns);
    setTotalRecords(dataset.totalRecords);
  }, [jsonCode]);

  // คำนวณข้อมูลสำหรับหน้าปัจจุบัน
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  // ฟังก์ชันตรวจสอบประเภทข้อมูล
  const getColumnType = (columnName: string): string => {
    return detectColumnType(data, columnName);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "number":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "date":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "boolean":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (totalRecords === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload data through the dashboard creation process to see it here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Data Overview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalRecords.toLocaleString()} records with {columns.length}{" "}
              columns
            </p>
          </div>
          <Badge variant="secondary">
            Page {currentPage} of {totalPages}
          </Badge>
        </div>
      </Card>

      {/* Column Types */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
          Column Information
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {columns.map((column) => {
            const type = getColumnType(column);
            return (
              <div
                key={column}
                className="flex flex-col items-center p-2 border rounded-lg"
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate w-full text-center">
                  {column}
                </div>
                <Badge className={`text-xs mt-1 ${getTypeColor(type)}`}>
                  {type}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="text-left p-3 font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((record, index) => (
                <tr
                  key={startIndex + index}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="p-3 text-sm text-gray-900 dark:text-gray-100 max-w-48 truncate"
                      title={formatDataValue(record[column])}
                    >
                      {formatDataValue(record[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of{" "}
              {totalRecords} records
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
