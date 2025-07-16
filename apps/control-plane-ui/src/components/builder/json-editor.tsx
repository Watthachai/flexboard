"use client";

import { Card } from "@/components/ui/card";

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
  return (
    <Card className="p-6 bg-card dark:bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Dashboard Metadata
        </h2>
        {jsonError && (
          <div className="text-red-500 dark:text-red-400 text-sm">
            JSON Error: {jsonError}
          </div>
        )}
      </div>

      <div className="relative">
        <textarea
          value={jsonCode}
          onChange={(e) => onJsonChange(e.target.value)}
          className={`w-full h-96 p-4 font-mono text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
            jsonError
              ? "border-red-500 focus:border-red-500 dark:border-red-400 dark:focus:border-red-400"
              : "border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
          }`}
          placeholder="Enter your dashboard metadata JSON..."
          spellCheck={false}
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
