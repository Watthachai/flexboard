"use client";

import { useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DynamicXMLParser from "./dynamic-xml-parser";

interface DataColumn {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  sample: any;
}

interface ParsedData {
  columns: DataColumn[];
  rows: any[][];
  totalRows: number;
}

interface DataImportProps {
  onDataImport: (data: ParsedData) => void;
  onCancel: () => void;
}

export default function DataImport({
  onDataImport,
  onCancel,
}: DataImportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showXMLParser, setShowXMLParser] = useState(false);
  const [xmlContent, setXMLContent] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed:", e.target.files); // Debug log
    if (e.target.files && e.target.files[0]) {
      console.log("File selected:", e.target.files[0].name); // Debug log
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    console.log("handleFile called with:", selectedFile.name); // Debug log
    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const fileName = selectedFile.name.toLowerCase();
      console.log("Processing file:", fileName); // Debug log

      // ตรวจสอบประเภทไฟล์
      if (fileName.endsWith(".xml")) {
        console.log("Processing as XML file"); // Debug log
        const text = await selectedFile.text();
        setXMLContent(text);
        setShowXMLParser(true);
        setLoading(false);
        return;
      }

      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        console.log("Excel file detected"); // Debug log
        // สำหรับ Excel files ให้แปลงเป็น CSV format ก่อน
        // อ่านเป็น ArrayBuffer สำหรับ Excel
        const arrayBuffer = await selectedFile.arrayBuffer();
        // ในการใช้งานจริงอาจต้องใช้ library เช่น xlsx
        // ตอนนี้ให้ error message แนะนำให้ save เป็น CSV
        throw new Error(
          "Excel files are not supported yet. Please save as CSV format."
        );
      }

      // Parse CSV
      console.log("Processing as CSV file"); // Debug log
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);
      console.log("CSV parsed successfully:", parsed); // Debug log
    } catch (err) {
      console.error("Error processing file:", err); // Debug log
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text: string): ParsedData => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("File must have at least a header row and one data row");
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/['"]/g, ""));
    const dataRows = lines
      .slice(1)
      .map((line) =>
        line.split(",").map((cell) => cell.trim().replace(/['"]/g, ""))
      );

    // Detect column types from first few rows
    const columns: DataColumn[] = headers.map((name, index) => {
      const samples = dataRows.slice(0, 5).map((row) => row[index]);
      const type = detectColumnType(samples);
      return {
        name,
        type,
        sample: samples[0] || "",
      };
    });

    return {
      columns,
      rows: dataRows.slice(0, 100), // Preview first 100 rows
      totalRows: dataRows.length,
    };
  };

  const detectColumnType = (samples: string[]): DataColumn["type"] => {
    const nonEmpty = samples.filter((s) => s && s.trim());
    if (nonEmpty.length === 0) return "string";

    // Check if all are numbers
    if (nonEmpty.every((s) => !isNaN(Number(s)))) return "number";

    // Check if all are dates
    if (nonEmpty.every((s) => !isNaN(Date.parse(s)))) return "date";

    // Check if all are booleans
    if (
      nonEmpty.every((s) =>
        ["true", "false", "1", "0", "yes", "no"].includes(s.toLowerCase())
      )
    ) {
      return "boolean";
    }

    return "string";
  };

  const handleImport = () => {
    if (parsedData) {
      onDataImport(parsedData);
    }
  };

  const handleXMLDataParsed = (xmlResult: any) => {
    // แปลง XML result ให้เป็น ParsedData format
    const convertedData: ParsedData = {
      columns: xmlResult.columns.map((col: any) => ({
        name: col.name,
        type: col.type,
        sample: "",
      })),
      rows: xmlResult.data.map((row: any) =>
        xmlResult.columns.map((col: any) => row[col.name])
      ),
      totalRows: xmlResult.data.length,
    };

    setParsedData(convertedData);
    setShowXMLParser(false);
  };

  // แสดง Dynamic XML Parser
  if (showXMLParser && xmlContent) {
    return (
      <DynamicXMLParser
        xmlContent={xmlContent}
        onDataParsed={handleXMLDataParsed}
        onCancel={() => {
          setShowXMLParser(false);
          setXMLContent("");
          setFile(null);
        }}
      />
    );
  }

  if (parsedData) {
    return (
      <Card className="p-4 sm:p-6 lg:p-8 w-full">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Data Preview
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Found {parsedData.totalRows} rows with {parsedData.columns.length}{" "}
            columns
          </p>
        </div>

        {/* Column Types */}
        <div className="mb-4 sm:mb-6">
          <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            Column Types
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {parsedData.columns.map((col, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                  {col.name}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {col.type}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                  Sample: {col.sample}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Preview */}
        <div className="mb-4 sm:mb-6">
          <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            Data Preview (First 10 rows)
          </h4>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              {parsedData.rows.slice(0, 5).map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Row {rowIndex + 1}
                  </div>
                  <div className="space-y-2">
                    {row.map((cell, cellIndex) => (
                      <div key={cellIndex} className="flex justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {parsedData.columns[cellIndex]?.name}:
                        </span>
                        <span className="text-xs text-gray-900 dark:text-gray-100 max-w-32 truncate">
                          {cell}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="hidden sm:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {parsedData.columns.map((col, index) => (
                    <th
                      key={index}
                      className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {parsedData.rows.slice(0, 10).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100 max-w-32 lg:max-w-48 truncate"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show remaining rows count */}
          {parsedData.rows.length > 10 && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
              ... และอีก {parsedData.rows.length - 10} รายการ
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setParsedData(null)}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Choose Different File
          </Button>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              Import Data
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          Import Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Upload a CSV, Excel, or XML file to import data
        </p>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">
            {error}
          </p>
        </div>
      )}

      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 lg:p-12 text-center transition-all duration-300 cursor-pointer
          ${
            dragActive
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500 scale-[1.02]"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          }
          ${loading ? "pointer-events-none opacity-75" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto animate-spin rounded-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
            <p className="text-blue-600 dark:text-blue-400 font-medium text-sm sm:text-base">
              กำลังประมวลผลไฟล์...
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">
              📁
            </div>
            <div className="space-y-2">
              <p className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100">
                Drop your file here or click to browse
              </p>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Supports CSV, Excel (.xlsx), and XML files
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                CSV
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                Excel
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                XML
              </span>
            </div>
          </div>
        )}
      </div>

      {/* File Input and Actions */}
      <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xml"
          onChange={handleFileInput}
        />

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            onClick={() => {
              console.log("Button clicked!"); // Debug log
              console.log("File input ref:", fileInputRef.current); // Debug log
              fileInputRef.current?.click();
            }}
            className="w-full sm:w-auto px-6 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium"
            disabled={loading}
          >
            Select File
          </Button>

          {/* ปุ่มทดสอบด้วยข้อมูล sample */}
          <Button
            onClick={() => {
              console.log("Testing with sample CSV data"); // Debug log
              const sampleCSV = `name,age,city,salary
John Doe,30,Bangkok,50000
Jane Smith,25,Chiang Mai,45000
Bob Wilson,35,Phuket,55000
Alice Brown,28,Bangkok,48000`;

              const blob = new Blob([sampleCSV], { type: "text/csv" });
              const file = new File([blob], "sample.csv", {
                type: "text/csv",
              });
              handleFile(file);
            }}
            variant="outline"
            className="w-full sm:w-auto px-6 py-2 sm:py-3 text-sm sm:text-base"
            disabled={loading}
          >
            ทดสอบด้วยข้อมูล Sample
          </Button>
        </div>

        {file && (
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
              Selected: {file.name}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Size: {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-green-500 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Max file size: 10MB
          </div>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
