/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Settings Component
 * Contains file upload functionality and system preferences
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  File,
  Settings as SettingsIcon,
  FolderOpen,
  Building2,
} from "lucide-react";
import { UniversalXmlParser } from "../../lib/xml-parser";

interface SettingsProps {
  onDataUploaded?: (data: any[]) => void;
  manifest?: any;
  uploadedData?: any[];
}

interface FilePathHistory {
  path: string;
  fileName: string;
  timestamp: number;
  platform: string;
}

interface DefaultCompanySettings {
  defaultCompany: string;
  enableDefaultCompany: boolean;
}

export default function Settings({
  onDataUploaded,
  uploadedData = [],
}: SettingsProps) {
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [filePathHistory, setFilePathHistory] = useState<FilePathHistory[]>([]);
  const [lastUsedPath, setLastUsedPath] = useState<string>("");
  const [currentActiveFile, setCurrentActiveFile] = useState<{
    fileName: string;
    timestamp: number;
    recordCount: number;
    path: string;
  } | null>(null);
  const [defaultCompanySettings, setDefaultCompanySettings] =
    useState<DefaultCompanySettings>({
      defaultCompany: "TKPV-TKPV CO., LTD.",
      enableDefaultCompany: true,
    });
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);

  // Load file path history and current active file from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("filePathHistory");
      if (savedHistory) {
        setFilePathHistory(JSON.parse(savedHistory));
      }

      const savedLastPath = localStorage.getItem("lastUsedFilePath");
      if (savedLastPath) {
        setLastUsedPath(savedLastPath);
      }

      // Load current active file info
      const uploadedData = localStorage.getItem("uploadedData");
      const uploadedFileName = localStorage.getItem("uploadedFileName");
      const uploadedTimestamp = localStorage.getItem("uploadedDataTimestamp");

      if (uploadedData && uploadedFileName) {
        try {
          const data = JSON.parse(uploadedData);
          setCurrentActiveFile({
            fileName: uploadedFileName,
            timestamp: uploadedTimestamp
              ? parseInt(uploadedTimestamp)
              : Date.now(),
            recordCount: data.length,
            path: savedLastPath || "Unknown",
          });

          // Extract available companies from uploaded data
          const companies = [
            ...new Set(data.map((item: any) => item.corp).filter(Boolean)),
          ] as string[];
          setAvailableCompanies(companies);
        } catch (error) {
          console.error("Failed to load active file info:", error);
        }
      }

      // Load default company settings
      const savedDefaultSettings = localStorage.getItem(
        "defaultCompanySettings"
      );
      if (savedDefaultSettings) {
        try {
          setDefaultCompanySettings(JSON.parse(savedDefaultSettings));
        } catch (error) {
          console.error("Failed to load default company settings:", error);
        }
      }
    }
  }, []);

  // Save file path to history
  const saveFilePathToHistory = (filePath: string, fileName: string) => {
    const platform = navigator.platform.toLowerCase().includes("win")
      ? "Windows"
      : navigator.platform.toLowerCase().includes("mac")
      ? "macOS"
      : "Other";

    const newEntry: FilePathHistory = {
      path: filePath,
      fileName,
      timestamp: Date.now(),
      platform,
    };

    const updatedHistory = [
      newEntry,
      ...filePathHistory.filter((item) => item.path !== filePath),
    ].slice(0, 10); // Keep only last 10 entries

    setFilePathHistory(updatedHistory);
    setLastUsedPath(filePath);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("filePathHistory", JSON.stringify(updatedHistory));
      localStorage.setItem("lastUsedFilePath", filePath);
    }
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileUploading(true);
    setUploadStatus(`Processing ${file.name}...`);

    try {
      const filePath =
        (file as any).path || file.webkitRelativePath || file.name;
      saveFilePathToHistory(filePath, file.name);

      const text = await file.text();
      let data: any[] = [];

      if (file.name.endsWith(".csv")) {
        // Parse CSV
        data = parseCSV(text);
      } else if (file.name.endsWith(".json")) {
        // Parse JSON
        data = JSON.parse(text);
        if (!Array.isArray(data)) {
          data = [data];
        }
      } else if (file.name.endsWith(".xml")) {
        // Parse XML using UniversalXmlParser
        try {
          const result = UniversalXmlParser.parse(text);
          data = result.records || [];
        } catch (xmlError) {
          throw new Error(
            `Failed to parse XML: ${
              xmlError instanceof Error
                ? xmlError.message
                : "Invalid XML format"
            }`
          );
        }
      } else {
        throw new Error(
          "Unsupported file format. Please upload CSV, JSON, or XML files."
        );
      }

      // Save uploaded data to localStorage
      const timestamp = Date.now();
      if (typeof window !== "undefined") {
        localStorage.setItem("uploadedData", JSON.stringify(data));
        localStorage.setItem("uploadedDataTimestamp", timestamp.toString());
        localStorage.setItem("uploadedFileName", file.name);
      }

      // Extract available companies from new data
      const companies = [
        ...new Set(data.map((item: any) => item.corp).filter(Boolean)),
      ] as string[];
      setAvailableCompanies(companies);

      // Update current active file state
      setCurrentActiveFile({
        fileName: file.name,
        timestamp: timestamp,
        recordCount: data.length,
        path: filePath,
      });

      if (onDataUploaded) {
        onDataUploaded(data);
      }

      setUploadStatus(
        `Successfully processed ${file.name} (${data.length} records)`
      );

      // Auto-clear status after 3 seconds
      setTimeout(() => {
        setUploadStatus("");
      }, 3000);
    } catch (error) {
      console.error("File upload error:", error);
      setUploadStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setUploadStatus("");
      }, 5000);
    } finally {
      setFileUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  // Simple CSV parser
  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split("\n");
    const headers = lines[0]
      .split(",")
      .map((header) => header.trim().replace(/"/g, ""));

    return lines.slice(1).map((line) => {
      const values = line
        .split(",")
        .map((value) => value.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });
  };

  // Save default company settings
  const saveDefaultCompanySettings = (settings: DefaultCompanySettings) => {
    setDefaultCompanySettings(settings);
    if (typeof window !== "undefined") {
      localStorage.setItem("defaultCompanySettings", JSON.stringify(settings));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your data uploads and system preferences
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Current Active File Status */}
          {currentActiveFile && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    Currently Active File
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      In Use
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This file is currently powering your dashboards
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    File Name:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono">
                    {currentActiveFile.fileName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Records:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white font-semibold">
                    {currentActiveFile.recordCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Loaded:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(currentActiveFile.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    File Path:
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all mt-1 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {currentActiveFile.path}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data File Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Data File Upload
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload CSV, JSON, or XML files
                </p>
              </div>
            </div>

            {/* File Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-all duration-200"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                    </div>
                    <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Support: CSV, JSON, XML files
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept=".csv,.json,.xml"
                    onChange={handleFileUpload}
                    disabled={fileUploading}
                  />
                </label>
              </div>

              {/* Upload Status */}
              {uploadStatus && (
                <div
                  className={`p-4 rounded-lg text-sm font-medium ${
                    uploadStatus.includes("Error")
                      ? "bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800"
                      : uploadStatus.includes("Successfully")
                      ? "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  }`}
                >
                  {uploadStatus}
                </div>
              )}

              {/* Upload Progress */}
              {fileUploading && (
                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-3 rounded-full animate-pulse transition-all duration-300"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Current Data Info */}
          {uploadedData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <File className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Current Data
                </h2>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Records:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {uploadedData.length}
                    </span>
                  </div>
                  {uploadedData.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Columns:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Object.keys(uploadedData[0]).length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Default Company Settings Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Default Company Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set default company for dashboard startup
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Enable Default Company Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-select Default Company
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Automatically select default company when opening dashboard
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={defaultCompanySettings.enableDefaultCompany}
                    onChange={(e) => {
                      saveDefaultCompanySettings({
                        ...defaultCompanySettings,
                        enableDefaultCompany: e.target.checked,
                      });
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Company Selection */}
              {defaultCompanySettings.enableDefaultCompany && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Default Company
                  </label>

                  {availableCompanies.length > 0 ? (
                    <select
                      value={defaultCompanySettings.defaultCompany}
                      onChange={(e) => {
                        saveDefaultCompanySettings({
                          ...defaultCompanySettings,
                          defaultCompany: e.target.value,
                        });
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-white text-gray-900"
                    >
                      <option value="">Select a company...</option>
                      {availableCompanies.map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        <span className="font-medium">
                          No companies available.
                        </span>
                        <br />
                        Upload data first to see available companies.
                      </p>
                    </div>
                  )}

                  {/* Manual Input Option */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Or enter manually:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., TKPV-TKPV CO., LTD."
                      value={defaultCompanySettings.defaultCompany}
                      onChange={(e) => {
                        saveDefaultCompanySettings({
                          ...defaultCompanySettings,
                          defaultCompany: e.target.value,
                        });
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-white text-gray-900 text-sm"
                    />
                  </div>

                  {/* Preview */}
                  {defaultCompanySettings.defaultCompany && (
                    <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        <span className="font-medium">Current default:</span>{" "}
                        {defaultCompanySettings.defaultCompany}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        This company will be automatically selected when you
                        open the dashboard.
                      </p>
                    </div>
                  )}

                  {/* Info box */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      <span className="font-medium">💡 Tip:</span> After setting
                      a default company, refresh the dashboard page to see it
                      automatically selected.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Path History Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  File Path History
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recent upload locations
                </p>
              </div>
            </div>

            {lastUsedPath && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-medium">Last used:</span>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 break-all font-mono">
                  {lastUsedPath}
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filePathHistory.length > 0 ? (
                filePathHistory.map((entry, index) => {
                  const isCurrentlyActive =
                    currentActiveFile?.path === entry.path &&
                    currentActiveFile?.fileName === entry.fileName;

                  return (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-4 rounded-lg transition-colors ${
                        isCurrentlyActive
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded ${
                          isCurrentlyActive
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-gray-200 dark:bg-gray-600"
                        }`}
                      >
                        <File
                          className={`w-3 h-3 ${
                            isCurrentlyActive
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {entry.fileName}
                          </p>
                          {isCurrentlyActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 animate-pulse">
                              ● Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                          {entry.path}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              isCurrentlyActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                : "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                            }`}
                          >
                            {entry.platform}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <File className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No upload history</p>
                  <p className="text-xs mt-1">
                    Upload a file to see the path history
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
                  {navigator.platform}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Agent
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {navigator.userAgent.split(" ")[0]}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Browser Language
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {navigator.language}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timezone
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
