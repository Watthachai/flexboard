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
  LogOut,
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
    recordsCreated?: number;
    recordsUpdated?: number;
    recordsDeleted?: number;
    processedAt: string;
    status: "success" | "error";
  }>;
}

interface XmlSyncStatus {
  isRunning: boolean;
  intervalMs: number;
  xmlPath: string;
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
  const [xmlSyncStatus, setXmlSyncStatus] = useState<XmlSyncStatus>({
    isRunning: false,
    intervalMs: 300000,
    xmlPath: "",
  });
  const [loading, setLoading] = useState(true);
  const [customXmlPath, setCustomXmlPath] = useState("");
  const [isUpdatingPath, setIsUpdatingPath] = useState(false);

  // Real-time clock states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState({ minutes: 0, seconds: 0 });

  // Logout function
  const handleLogout = async () => {
    if (
      confirm(
        "Are you sure you want to logout? You will need to login again with your license key."
      )
    ) {
      try {
        // Call logout API
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        // Clear localStorage
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("userSession");
        }

        // Reload page to trigger re-authentication
        window.location.reload();
      } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to logout. Please try again.");
      }
    }
  };

  // Fetch ingestion status from API
  const fetchIngestionStatus = async () => {
    try {
      setLoading(true);

      // Get ingestion status from dedicated API
      const statusResponse = await fetch("/api/ingestion/status");
      const statusData = await statusResponse.json();

      // Get XML sync service status
      const syncResponse = await fetch("/api/xml-sync");
      const syncData = await syncResponse.json();

      if (statusData.success) {
        setIngestionStatus({
          lastRun: statusData.data.lastRun,
          nextRun: statusData.data.nextRun,
          totalFiles: statusData.data.totalFiles,
          totalRecords: statusData.data.totalRecords,
          status: statusData.data.status,
          recentFiles: statusData.data.recentFiles,
        });
      }

      if (syncData.success) {
        setXmlSyncStatus({
          isRunning: syncData.isRunning,
          intervalMs: syncData.intervalMs,
          xmlPath: syncData.xmlPath,
        });
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
      } catch {
        setIngestionStatus((prev) => ({ ...prev, status: "error" }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate countdown to next sync
  const updateCountdown = React.useCallback(() => {
    if (!ingestionStatus.lastRun) {
      setCountdown({ minutes: 5, seconds: 0 }); // Default 5 minutes if no last run
      return;
    }

    const lastRunTime = new Date(ingestionStatus.lastRun);
    const nextRunTime = new Date(
      lastRunTime.getTime() + xmlSyncStatus.intervalMs
    );
    const now = new Date();
    const timeDiff = nextRunTime.getTime() - now.getTime();

    if (timeDiff <= 0) {
      // Time for next sync has passed, should be running soon
      setCountdown({ minutes: 0, seconds: 0 });
    } else {
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      setCountdown({ minutes, seconds });
    }
  }, [ingestionStatus.lastRun, xmlSyncStatus.intervalMs]);

  useEffect(() => {
    fetchIngestionStatus();

    // Refresh status every 30 seconds
    const statusInterval = setInterval(fetchIngestionStatus, 30000);

    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(clockInterval);
      clearInterval(countdownInterval);
    };
  }, [updateCountdown]);

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

  // XML Sync Service Controls
  const handleXmlSyncAction = async (action: "start" | "stop" | "restart") => {
    try {
      setLoading(true);
      const response = await fetch("/api/xml-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      if (result.success) {
        // Update status immediately
        setXmlSyncStatus(result.status);
        console.log(`XML sync service ${action}ed successfully`);
      } else {
        console.error(`Failed to ${action} XML sync service:`, result.error);
      }
    } catch (error) {
      console.error(`Error ${action}ing XML sync service:`, error);
    } finally {
      setLoading(false);
      // Refresh status after action
      setTimeout(fetchIngestionStatus, 1000);
    }
  };

  // Update XML Path
  const handleUpdateXmlPath = async () => {
    if (!customXmlPath.trim()) return;

    try {
      setIsUpdatingPath(true);
      const response = await fetch("/api/xml-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePath",
          xmlPath: customXmlPath.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setXmlSyncStatus(result.status);
        setCustomXmlPath(""); // Clear input
        console.log(`XML path updated successfully`);
      } else {
        console.error(`Failed to update XML path:`, result.error);
        alert(`Failed to update XML path: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error updating XML path:`, error);
      alert(`Error updating XML path: ${error}`);
    } finally {
      setIsUpdatingPath(false);
      setTimeout(fetchIngestionStatus, 1000);
    }
  };

  // Trigger Manual Sync
  const handleManualSync = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/xml-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "triggerSync" }),
      });

      const result = await response.json();
      if (result.success) {
        console.log(`Manual sync completed successfully`);
        alert("Manual sync completed successfully!");
      } else {
        console.error(`Manual sync failed:`, result.error);
        alert(`Manual sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error during manual sync:`, error);
      alert(`Error during manual sync: ${error}`);
    } finally {
      setLoading(false);
      setTimeout(fetchIngestionStatus, 2000); // Give more time for sync to complete
    }
  };

  // Clear Import Cache
  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to clear the import cache? This will force all files to be re-processed.")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/ingestion/clear-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Clear all logs
      });

      const result = await response.json();
      if (result.success) {
        console.log(`Import cache cleared successfully`);
        alert("Import cache cleared successfully! Files will be re-processed on next sync.");
      } else {
        console.error(`Failed to clear cache:`, result.error);
        alert(`Failed to clear cache: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error clearing cache:`, error);
      alert(`Error clearing cache: ${error}`);
    } finally {
      setLoading(false);
      setTimeout(fetchIngestionStatus, 1000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-200">
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
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Auto-Ingestion Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
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
                      Current Time
                    </span>
                  </div>
                  <p className="text-lg font-mono text-gray-900 dark:text-white">
                    {currentTime.toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentTime.toLocaleDateString()}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <RefreshCw
                      className={`w-4 h-4 ${
                        countdown.minutes === 0 && countdown.seconds === 0
                          ? "text-green-500 animate-spin"
                          : "text-blue-500"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Next Sync In
                    </span>
                  </div>
                  <p className="text-lg font-mono text-gray-900 dark:text-white">
                    {String(countdown.minutes).padStart(2, "0")}:
                    {String(countdown.seconds).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {countdown.minutes === 0 && countdown.seconds === 0
                      ? "Running..."
                      : "Minutes:Seconds"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
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

          {/* XML Sync Service Control */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  XML Sync Service
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Background XML import service control
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      xmlSyncStatus.isRunning ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Service Status
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    xmlSyncStatus.isRunning
                      ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                  }`}
                >
                  {xmlSyncStatus.isRunning ? "Running" : "Stopped"}
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <strong>Sync Interval:</strong>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Math.floor(xmlSyncStatus.intervalMs / 1000 / 60)} minutes
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <strong>Status:</strong>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        xmlSyncStatus.isRunning
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {xmlSyncStatus.isRunning ? "🟢 Active" : "🔴 Inactive"}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <strong>XML Path:</strong>
                  <br />
                  <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs break-all">
                    {xmlSyncStatus.xmlPath || "Not configured"}
                  </code>
                </div>

                {/* XML Path Configuration */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Update XML Path:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customXmlPath}
                      onChange={(e) => setCustomXmlPath(e.target.value)}
                      placeholder="apps/onprem-viewer/inventory-files/VVPVGS_001_01.xml"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleUpdateXmlPath}
                      disabled={isUpdatingPath || !customXmlPath.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingPath ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={() => handleXmlSyncAction("start")}
                    disabled={loading || xmlSyncStatus.isRunning}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => handleXmlSyncAction("stop")}
                    disabled={loading || !xmlSyncStatus.isRunning}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Stop
                  </button>
                  <button
                    onClick={() => handleXmlSyncAction("restart")}
                    disabled={loading}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Restart
                  </button>
                </div>

                {/* Manual Sync Button */}
                <button
                  onClick={handleManualSync}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Syncing..." : "🔄 Trigger Manual Sync"}
                </button>

                {/* Clear Cache Button */}
                <button
                  onClick={handleClearCache}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? "Clearing..." : "🗑️ Clear Import Cache"}
                </button>
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
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  XML files processed
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
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Inventory items in database
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Sync Performance:</span>
                  <span>
                    {Math.round(
                      ingestionStatus.totalRecords /
                        Math.max(ingestionStatus.totalFiles, 1)
                    ).toLocaleString()}{" "}
                    records/file avg
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Last Sync Status:</span>
                  <span
                    className={
                      ingestionStatus.status === "running"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {ingestionStatus.status === "running"
                      ? "✅ Active"
                      : "⏸️ Idle"}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <strong>Note:</strong> Database total may differ from XML
                  record count due to deduplication. Records with duplicate IDs
                  are updated rather than creating new entries.
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
                        {file.recordCount.toLocaleString()} records from XML •{" "}
                        {new Date(file.processedAt).toLocaleString()}
                      </p>
                      {/* Differential sync statistics */}
                      {((file.recordsCreated || 0) > 0 ||
                        (file.recordsUpdated || 0) > 0 ||
                        (file.recordsDeleted || 0) > 0) && (
                        <div className="flex items-center space-x-3 mt-1">
                          {(file.recordsCreated || 0) > 0 && (
                            <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                              +{file.recordsCreated || 0} new
                            </span>
                          )}
                          {(file.recordsUpdated || 0) > 0 && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                              ~{file.recordsUpdated || 0} updated
                            </span>
                          )}
                          {(file.recordsDeleted || 0) > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                              -{file.recordsDeleted || 0} removed
                            </span>
                          )}
                        </div>
                      )}
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
