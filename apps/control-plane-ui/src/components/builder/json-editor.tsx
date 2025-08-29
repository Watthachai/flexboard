"use client";

import { Card } from "@/components/ui/card";
import { cleanJsonData } from "@/lib/data-utils";

interface JsonEditorProps {
  jsonCode: string;
  jsonError: string | null;
  onJsonChange: (value: string) => void;
}

export default function JsonEditor({
  jsonCode,
  jsonError,
  onJsonChange,
}: JsonEditorProps) {
  // ฟังก์ชันสำหรับทำความสะอาดและจัดรูปแบบ JSON
  const cleanAndFormatJson = () => {
    try {
      let parsed = JSON.parse(jsonCode);
      const cleanedData = cleanJsonData(parsed);
      const formatted = JSON.stringify(cleanedData, null, 2);
      onJsonChange(formatted);
    } catch (error) {
      console.error("Error cleaning and formatting JSON:", error);
    }
  };

  // ฟังก์ชันสำหรับแสดงเฉพาะข้อมูลตัวอย่าง (sample data)
  const showSampleData = () => {
    try {
      let parsed = JSON.parse(jsonCode);
      parsed = cleanJsonData(parsed);

      if (parsed.dataSourceConfig?.uploadedData?.dataset?.record) {
        const records = parsed.dataSourceConfig.uploadedData.dataset.record;
        const sampleRecord = Array.isArray(records)
          ? records.slice(0, 3)
          : [records];
        const sampleData = {
          ...parsed,
          dataSourceConfig: {
            ...parsed.dataSourceConfig,
            uploadedData: {
              dataset: {
                record: sampleRecord,
                totalRecords: Array.isArray(records) ? records.length : 1,
                note: "Showing first 3 records only",
              },
            },
          },
        };
        const formatted = JSON.stringify(sampleData, null, 2);
        onJsonChange(formatted);
      } else {
        // ถ้าไม่มี record data ให้แสดงทั้งหมดแต่จัดรูปแบบ
        const formatted = JSON.stringify(parsed, null, 2);
        onJsonChange(formatted);
      }
    } catch (error) {
      console.error("Error showing sample data:", error);
    }
  };

  return (
    <Card className="p-6 bg-card dark:bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Dashboard Metadata
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={cleanAndFormatJson}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
          >
            Clean & Format
          </button>
          <button
            onClick={showSampleData}
            className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-md transition-colors"
          >
            Show Sample
          </button>
          {jsonError && (
            <div className="text-red-500 dark:text-red-400 text-sm">
              JSON Error: {jsonError}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={jsonCode}
          onChange={(e) => onJsonChange(e.target.value)}
          className={`w-full h-[500px] p-4 font-mono text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y ${
            jsonError
              ? "border-red-500 focus:border-red-500 dark:border-red-400 dark:focus:border-red-400"
              : "border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
          }`}
          placeholder={`{
  "name": "My Dashboard",
  "description": "Dashboard description",
  "dataSourceConfig": {
    "type": "upload",
    "uploadedData": {
      "dataset": {
        "record": [
          {
            "date": "2024-01-01",
            "value": 100
          }
        ]
      }
    }
  }
}`}
          spellCheck={false}
          style={{
            lineHeight: "1.5",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          }}
        />
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-2">
          <strong className="text-gray-900 dark:text-gray-100">Tip:</strong>{" "}
          This JSON defines your dashboard structure, widgets, and
          configuration.
        </p>
        <p>
          Save as draft to test changes, then publish when ready to deploy to
          agents.
        </p>
      </div>
    </Card>
  );
}
