"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface XMLDataRow {
  [key: string]: string | number;
}

interface XMLParseResult {
  columns: {
    name: string;
    type: "string" | "number" | "date";
    displayName: string;
  }[];
  data: XMLDataRow[];
  summary: {
    totalRows: number;
    dateRange: { from: string; to: string };
    uniqueProducts: number;
    totalQuantity: number;
    totalValue: number;
  };
}

interface XMLParserProps {
  xmlContent: string;
  onDataParsed: (result: XMLParseResult) => void;
  onCancel: () => void;
}

export default function DynamicXMLParser({
  xmlContent,
  onDataParsed,
  onCancel,
}: XMLParserProps) {
  const [parseResult, setParseResult] = useState<XMLParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectColumnType = (
    samples: string[]
  ): "string" | "number" | "date" => {
    if (samples.length === 0) return "string";

    // ตรวจสอบว่าเป็นตัวเลข
    const numberCount = samples.filter((sample) => {
      const num = parseFloat(sample);
      return !isNaN(num) && isFinite(num);
    }).length;

    // ตรวจสอบว่าเป็น date
    const dateCount = samples.filter((sample) => {
      // รองรับ format หลายแบบ
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      ];

      return (
        datePatterns.some((pattern) => pattern.test(sample.trim())) ||
        !isNaN(Date.parse(sample))
      );
    }).length;

    const threshold = samples.length * 0.7; // 70% threshold

    if (dateCount >= threshold) return "date";
    if (numberCount >= threshold) return "number";
    return "string";
  };

  const parseXMLContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

      // ตรวจสอบ error ใน XML
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        throw new Error("รูปแบบ XML ไม่ถูกต้อง");
      }

      // หา elements ทั้งหมดที่มี children (ไม่ใช่ text nodes)
      const allElements = xmlDoc.querySelectorAll("*");
      const elementStructures = new Map<string, Element[]>();

      // วิเคราะห์ structure ของ XML
      allElements.forEach((element) => {
        if (element.children.length > 0) {
          // สร้าง signature ของ element จาก child tag names
          const childTags = Array.from(element.children)
            .map((child) => child.tagName)
            .sort()
            .join(",");

          if (childTags) {
            if (!elementStructures.has(childTags)) {
              elementStructures.set(childTags, []);
            }
            elementStructures.get(childTags)!.push(element);
          }
        }
      });

      // หา structure ที่มี elements มากที่สุด (น่าจะเป็นข้อมูลหลัก)
      let maxCount = 0;
      let mainStructure = "";

      elementStructures.forEach((elements, structure) => {
        if (elements.length > maxCount) {
          maxCount = elements.length;
          mainStructure = structure;
        }
      });

      if (maxCount === 0) {
        throw new Error("ไม่พบโครงสร้างข้อมูลที่ซ้ำกันใน XML");
      }

      const mainElements = elementStructures.get(mainStructure)!;

      // ดึง column names จาก first element
      const firstElement = mainElements[0];
      const columnNames = Array.from(firstElement.children).map(
        (child) => child.tagName
      );

      // สร้าง columns definition
      const columns = columnNames.map((tagName) => {
        // ตรวจสอบ data type จาก sample values
        const samples = mainElements
          .slice(0, Math.min(10, mainElements.length))
          .map((element) => {
            const childElement = element.querySelector(tagName);
            return childElement?.textContent || "";
          })
          .filter((val) => val.trim());

        const type = detectColumnType(samples);

        return {
          name: tagName,
          type,
          displayName: formatDisplayName(tagName),
        };
      });

      // แปลงข้อมูล
      const data: XMLDataRow[] = [];
      const uniqueValues = new Map<string, Set<string>>();

      mainElements.forEach((element) => {
        const row: XMLDataRow = {};

        columnNames.forEach((tagName) => {
          const childElement = element.querySelector(tagName);
          const textContent = childElement?.textContent || "";

          // Convert ตาม type
          const column = columns.find((c) => c.name === tagName);
          if (column?.type === "number") {
            const numValue = parseFloat(textContent);
            row[tagName] = isNaN(numValue) ? 0 : numValue;
          } else {
            row[tagName] = textContent;
          }

          // Track unique values for summary
          if (!uniqueValues.has(tagName)) {
            uniqueValues.set(tagName, new Set());
          }
          uniqueValues.get(tagName)!.add(textContent);
        });

        data.push(row);
      });

      // สร้าง dynamic summary
      const summary = {
        totalRows: data.length,
        dateRange: extractDateRange(data, columns),
        uniqueProducts: getUniqueCount(data, columns),
        totalQuantity: getTotalQuantity(data, columns),
        totalValue: getTotalValue(data, columns),
      };

      const result: XMLParseResult = {
        columns,
        data,
        summary,
      };

      setParseResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ไม่สามารถประมวลผล XML ได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayName = (tagName: string): string => {
    // แปลง camelCase หรือ PascalCase เป็น readable text
    return tagName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const extractDateRange = (
    data: XMLDataRow[],
    columns: any[]
  ): { from: string; to: string } => {
    const dateColumns = columns.filter((col) => col.type === "date");
    if (dateColumns.length === 0) return { from: "", to: "" };

    const allDates: string[] = [];
    data.forEach((row) => {
      dateColumns.forEach((col) => {
        const dateValue = row[col.name];
        if (dateValue && typeof dateValue === "string") {
          allDates.push(dateValue);
        }
      });
    });

    allDates.sort();
    return {
      from: allDates[0] || "",
      to: allDates[allDates.length - 1] || "",
    };
  };

  const getUniqueCount = (data: XMLDataRow[], columns: any[]): number => {
    // หา column ที่น่าจะเป็น "product" หรือ "item"
    const productColumn = columns.find(
      (col) =>
        col.name.toLowerCase().includes("prod") ||
        col.name.toLowerCase().includes("item") ||
        col.name.toLowerCase().includes("name") ||
        col.name.toLowerCase().includes("title")
    );

    if (!productColumn) return 0;

    const uniqueItems = new Set();
    data.forEach((row) => {
      const value = row[productColumn.name];
      if (value) uniqueItems.add(value);
    });

    return uniqueItems.size;
  };

  const getTotalQuantity = (data: XMLDataRow[], columns: any[]): number => {
    // หา column ที่น่าจะเป็น quantity
    const qtyColumn = columns.find(
      (col) =>
        col.name.toLowerCase().includes("qty") ||
        col.name.toLowerCase().includes("quantity") ||
        col.name.toLowerCase().includes("amount") ||
        col.name.toLowerCase().includes("count")
    );

    if (!qtyColumn || qtyColumn.type !== "number") return 0;

    return data.reduce((sum, row) => {
      const value = row[qtyColumn.name];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  };

  const getTotalValue = (data: XMLDataRow[], columns: any[]): number => {
    // พยายามคำนวณ total value จาก quantity * cost หรือหา value column
    const qtyColumn = columns.find(
      (col) =>
        col.name.toLowerCase().includes("qty") ||
        col.name.toLowerCase().includes("quantity")
    );

    const costColumn = columns.find(
      (col) =>
        col.name.toLowerCase().includes("cost") ||
        col.name.toLowerCase().includes("price") ||
        col.name.toLowerCase().includes("value")
    );

    const valueColumn = columns.find(
      (col) =>
        col.name.toLowerCase().includes("total") ||
        col.name.toLowerCase().includes("amount") ||
        col.name.toLowerCase().includes("revenue")
    );

    if (
      qtyColumn &&
      costColumn &&
      qtyColumn.type === "number" &&
      costColumn.type === "number"
    ) {
      return data.reduce((sum, row) => {
        const qty = (row[qtyColumn.name] as number) || 0;
        const cost = (row[costColumn.name] as number) || 0;
        return sum + qty * cost;
      }, 0);
    } else if (valueColumn && valueColumn.type === "number") {
      return data.reduce((sum, row) => {
        const value = (row[valueColumn.name] as number) || 0;
        return sum + value;
      }, 0);
    }

    return 0;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("th-TH").format(num);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-foreground">กำลังประมวลผล XML...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 md:p-6">
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 mb-4">
            ❌ เกิดข้อผิดพลาด
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={parseXMLContent} variant="outline">
              ลองใหม่
            </Button>
            <Button onClick={onCancel} variant="outline">
              ยกเลิก
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!parseResult) {
    return (
      <Card className="p-4 md:p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            พร้อมประมวลผล XML
          </h3>
          <p className="text-muted-foreground mb-6">
            ระบบจะวิเคราะห์โครงสร้าง XML อัตโนมัติและแปลงเป็นข้อมูลตาราง
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={parseXMLContent}>เริ่มประมวลผล</Button>
            <Button onClick={onCancel} variant="outline">
              ยกเลิก
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const { columns, data, summary } = parseResult;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          สรุปข้อมูล XML
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(summary.totalRows)}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">
              รายการทั้งหมด
            </div>
          </div>
          {summary.uniqueProducts > 0 && (
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(summary.uniqueProducts)}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                รายการเฉพาะ
              </div>
            </div>
          )}
          {summary.totalQuantity > 0 && (
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(summary.totalQuantity)}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                จำนวนรวม
              </div>
            </div>
          )}
          {summary.totalValue > 0 && (
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(summary.totalValue)}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                มูลค่ารวม
              </div>
            </div>
          )}
          {summary.dateRange.from && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="text-sm font-medium text-foreground">
                {summary.dateRange.from}
              </div>
              <div className="text-xs text-muted-foreground">ถึง</div>
              <div className="text-sm font-medium text-foreground">
                {summary.dateRange.to}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Data Preview */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          ตัวอย่างข้อมูล (5 รายการแรก)
        </h3>
        <div className="overflow-hidden rounded-lg border border-border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 dark:bg-gray-800/50">
                  {columns.map((col, index) => (
                    <th
                      key={col.name}
                      className={`px-3 md:px-6 py-3 text-left font-medium text-foreground text-sm md:text-base border-b border-border dark:border-gray-700 ${
                        index !== columns.length - 1
                          ? "border-r border-border dark:border-gray-700"
                          : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate">{col.displayName}</div>
                        <span className="text-xs text-muted-foreground">
                          ({col.type})
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-background dark:bg-gray-900/20">
                {data.slice(0, 5).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={col.name}
                        className={`px-3 md:px-6 py-3 text-sm md:text-base text-foreground ${
                          rowIndex !== data.slice(0, 5).length - 1
                            ? "border-b border-border dark:border-gray-700"
                            : ""
                        } ${
                          colIndex !== columns.length - 1
                            ? "border-r border-border dark:border-gray-700"
                            : ""
                        }`}
                      >
                        <div className="min-w-0 max-w-[150px] md:max-w-[200px] lg:max-w-none">
                          <div
                            className="truncate"
                            title={String(row[col.name])}
                          >
                            {col.type === "number" &&
                            typeof row[col.name] === "number"
                              ? formatNumber(row[col.name] as number)
                              : String(row[col.name])}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {data.length > 5 && (
          <p className="text-sm text-muted-foreground mt-2">
            ... และอีก {data.length - 5} รายการ
          </p>
        )}
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 justify-end">
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full sm:w-auto"
        >
          ยกเลิก
        </Button>
        <Button
          onClick={() => onDataParsed(parseResult)}
          className="w-full sm:w-auto"
        >
          ใช้ข้อมูลนี้
        </Button>
      </div>
    </div>
  );
}
