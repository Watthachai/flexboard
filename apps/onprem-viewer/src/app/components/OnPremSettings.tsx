/**
 * OnPrem Settings Component
 * Displays auto-ingestion status and system information
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Database,
  File,
  Settings as SettingsIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface IngestionStatus {
  lastRun: string | null;
  nextRun: string | null;
  totalFiles: number;
  totalRecords: number;
  status: "running" | "idle" | "error";
  recentFiles: Array<{
    fileName: string;
    recordCount: number;
    processedAt: string;
    status: "success" | "error";
  }>;
}

export default function OnPremSettings() {
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>({
    lastRun: null,
    nextRun: null,
    totalFiles: 0,
    totalRecords: 0,
    status: "idle",
    recentFiles: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch ingestion status from API
  const fetchIngestionStatus = async () => {
    try {
      setLoading(true);

      // Get ingestion status from dedicated API
      const statusResponse = await fetch("/api/ingestion/status");
      const statusData = await statusResponse.json();

      if (statusData.success) {
        setIngestionStatus({
          lastRun: statusData.data.lastRun,
          nextRun: statusData.data.nextRun,
          totalFiles: statusData.data.totalFiles,
          totalRecords: statusData.data.totalRecords,
          status: statusData.data.status,
          recentFiles: statusData.data.recentFiles,
        });
      } else {
        throw new Error(statusData.error || "Failed to fetch status");
      }
    } catch (error) {
      console.error("Failed to fetch ingestion status:", error);

      // Fallback to health endpoint
      try {
        const healthResponse = await fetch("/api/health");
        const healthData = await healthResponse.json();

        setIngestionStatus((prev) => ({
          ...prev,
          status: healthData.status === "ok" ? "running" : "error",
          lastRun: healthData.timestamp,
        }));
      } catch (healthError) {
        setIngestionStatus((prev) => ({ ...prev, status: "error" }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngestionStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchIngestionStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (ingestionStatus.status) {
      case "running":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (ingestionStatus.status) {
      case "running":
        return "Active";
      case "error":
        return "Error";
      default:
        return "Idle";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your data ingestion and system preferences
          </p>
        </div>
        <button
          onClick={fetchIngestionStatus}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Auto-Ingestion Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Auto-Ingestion Status
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automated XML file processing
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon()}
                  <span className="font-medium text-gray-900 dark:text-white">
                    System Status
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ingestionStatus.status === "running"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                      : ingestionStatus.status === "error"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                  }`}
                >
                  {getStatusText()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Run
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ingestionStatus.lastRun
                      ? new Date(ingestionStatus.lastRun).toLocaleString()
                      : "Never"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Next Run
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ingestionStatus.nextRun
                      ? new Date(ingestionStatus.nextRun).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-medium">Schedule:</span> Every 5 minutes
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Files are automatically scanned from the inventory-files
                  directory
                </p>
              </div>
            </div>
          </div>

          {/* Data Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Data Statistics
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current database contents
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Files
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {ingestionStatus.totalFiles}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Records
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {ingestionStatus.totalRecords.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Files */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <File className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Files
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recently processed files
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {ingestionStatus.recentFiles.length > 0 ? (
                ingestionStatus.recentFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div
                      className={`p-1.5 rounded ${
                        file.status === "success"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {file.status === "success" ? (
                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.recordCount.toLocaleString()} records •{" "}
                        {new Date(file.processedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <File className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No files processed yet</p>
                  <p className="text-xs mt-1">
                    Place XML files in the inventory-files directory
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                System Information
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Platform
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {typeof window !== "undefined"
                    ? navigator.platform
                    : "Server"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Agent
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {typeof window !== "undefined"
                    ? navigator.userAgent.split(" ")[0]
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Browser Language
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {typeof window !== "undefined" ? navigator.language : "en"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timezone
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {typeof window !== "undefined"
                    ? Intl.DateTimeFormat().resolvedOptions().timeZone
                    : "UTC"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
