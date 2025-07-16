"use client";

import { Card } from "@/components/ui/card";

interface MetadataVersion {
  id: string;
  version: number;
  metadata: any;
  status: "draft" | "published" | "archived";
  createdAt: string;
  publishedAt?: string;
}

interface DashboardStatusBarProps {
  metadata: MetadataVersion | null;
}

export default function DashboardStatusBar({
  metadata,
}: DashboardStatusBarProps) {
  return (
    <Card className="p-4 mb-6 bg-card dark:bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Current Version
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              v{metadata?.version || 0}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Status
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  metadata?.status === "published"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : metadata?.status === "draft"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                }`}
              >
                {metadata?.status || "draft"}
              </div>
            </div>
          </div>
          {metadata?.publishedAt && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Last Published
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(metadata.publishedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
