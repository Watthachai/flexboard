/**
 * Dashboard Export/Import System
 * Export dashboards as JSON, PNG, PDF, or share links
 */

"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Upload,
  Share2,
  FileJson,
  Image,
  FileText,
  Link,
  Copy,
  Check,
  Globe,
  Lock,
  Calendar,
  Settings,
} from "lucide-react";
import { DashboardConfig } from "./visual-dashboard-editor";

interface ExportOptions {
  format: "json" | "png" | "pdf";
  includeData: boolean;
  resolution?: "low" | "medium" | "high";
  pageSize?: "a4" | "letter" | "custom";
}

interface ShareOptions {
  isPublic: boolean;
  requiresAuth: boolean;
  expiresAt?: Date;
  permissions: "view" | "edit" | "admin";
  allowComments: boolean;
}

interface DashboardExportImportProps {
  dashboard: DashboardConfig;
  onImport: (dashboard: DashboardConfig) => void;
  onClose: () => void;
}

export default function DashboardExportImport({
  dashboard,
  onImport,
  onClose,
}: DashboardExportImportProps) {
  const [activeTab, setActiveTab] = useState("export");
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "json",
    includeData: true,
    resolution: "high",
    pageSize: "a4",
  });
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    isPublic: false,
    requiresAuth: true,
    permissions: "view",
    allowComments: true,
  });
  const [shareLink, setShareLink] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState("");

  const handleExport = async () => {
    setIsExporting(true);

    try {
      switch (exportOptions.format) {
        case "json":
          await exportAsJSON();
          break;
        case "png":
          await exportAsPNG();
          break;
        case "pdf":
          await exportAsPDF();
          break;
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = async () => {
    const exportData = {
      ...dashboard,
      exportedAt: new Date().toISOString(),
      version: "1.0",
      includeData: exportOptions.includeData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dashboard.name || "dashboard"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPNG = async () => {
    // Mock PNG export - in real implementation, would capture canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const width =
      exportOptions.resolution === "high"
        ? 1920
        : exportOptions.resolution === "medium"
          ? 1280
          : 800;
    const height = Math.round(width * 0.75);

    canvas.width = width;
    canvas.height = height;

    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#333333";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(dashboard.name || "Dashboard", width / 2, height / 2);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dashboard.name || "dashboard"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const exportAsPDF = async () => {
    // Mock PDF export - in real implementation, would use a PDF library
    console.log("Exporting as PDF...");
    // Simulate PDF generation
    setTimeout(() => {
      const blob = new Blob([`PDF content for ${dashboard.name}`], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dashboard.name || "dashboard"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const generateShareLink = () => {
    const baseUrl = "https://flexboard.app/shared";
    const shareId = Math.random().toString(36).substring(2, 15);
    const link = `${baseUrl}/${shareId}`;
    setShareLink(link);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    try {
      const parsedData = JSON.parse(importData);
      if (parsedData && typeof parsedData === "object") {
        onImport(parsedData as DashboardConfig);
        onClose();
      }
    } catch (error) {
      console.error("Failed to parse import data:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-5/6 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Export & Share</h2>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
            </TabsList>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Export Dashboard</h3>

                {/* Format Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          value: "json",
                          label: "JSON",
                          icon: FileJson,
                          desc: "Configuration only",
                        },
                        {
                          value: "png",
                          label: "PNG",
                          icon: Image,
                          desc: "Image screenshot",
                        },
                        {
                          value: "pdf",
                          label: "PDF",
                          icon: FileText,
                          desc: "Report format",
                        },
                      ].map((format) => (
                        <Card
                          key={format.value}
                          className={`p-4 cursor-pointer transition-colors ${
                            exportOptions.format === format.value
                              ? "ring-2 ring-blue-500 bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() =>
                            setExportOptions((prev) => ({
                              ...prev,
                              format: format.value as any,
                            }))
                          }
                        >
                          <div className="text-center">
                            <format.icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                            <div className="font-medium">{format.label}</div>
                            <div className="text-xs text-gray-500">
                              {format.desc}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Additional Options */}
                  {exportOptions.format === "json" && (
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeData}
                          onChange={(e) =>
                            setExportOptions((prev) => ({
                              ...prev,
                              includeData: e.target.checked,
                            }))
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Include sample data</span>
                      </label>
                    </div>
                  )}

                  {exportOptions.format === "png" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution
                      </label>
                      <select
                        value={exportOptions.resolution}
                        onChange={(e) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            resolution: e.target.value as any,
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low (800px)</option>
                        <option value="medium">Medium (1280px)</option>
                        <option value="high">High (1920px)</option>
                      </select>
                    </div>
                  )}

                  {exportOptions.format === "pdf" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Size
                      </label>
                      <select
                        value={exportOptions.pageSize}
                        onChange={(e) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            pageSize: e.target.value as any,
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full mt-6"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting
                    ? "Exporting..."
                    : `Export as ${exportOptions.format.toUpperCase()}`}
                </Button>
              </div>
            </TabsContent>

            {/* Share Tab */}
            <TabsContent value="share" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Share Dashboard</h3>

                <div className="space-y-4">
                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visibility
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={!shareOptions.isPublic}
                          onChange={() =>
                            setShareOptions((prev) => ({
                              ...prev,
                              isPublic: false,
                            }))
                          }
                          className="rounded"
                        />
                        <Lock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          Private - Only people with the link
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={shareOptions.isPublic}
                          onChange={() =>
                            setShareOptions((prev) => ({
                              ...prev,
                              isPublic: true,
                            }))
                          }
                          className="rounded"
                        />
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          Public - Anyone can view
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <select
                      value={shareOptions.permissions}
                      onChange={(e) =>
                        setShareOptions((prev) => ({
                          ...prev,
                          permissions: e.target.value as any,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="view">View only</option>
                      <option value="edit">Can edit</option>
                      <option value="admin">Full admin</option>
                    </select>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={shareOptions.requiresAuth}
                        onChange={(e) =>
                          setShareOptions((prev) => ({
                            ...prev,
                            requiresAuth: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Require authentication</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={shareOptions.allowComments}
                        onChange={(e) =>
                          setShareOptions((prev) => ({
                            ...prev,
                            allowComments: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Allow comments</span>
                    </label>
                  </div>

                  {/* Expiration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Expiration
                    </label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <input
                        type="datetime-local"
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                        onChange={(e) =>
                          setShareOptions((prev) => ({
                            ...prev,
                            expiresAt: e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Generate Link */}
                {!shareLink ? (
                  <Button onClick={generateShareLink} className="w-full mt-6">
                    <Share2 className="w-4 h-4 mr-2" />
                    Generate Share Link
                  </Button>
                ) : (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input value={shareLink} readOnly className="flex-1" />
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(shareLink)}
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={generateShareLink}
                      className="w-full"
                    >
                      Generate New Link
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Import Tab */}
            <TabsContent value="import" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Import Dashboard</h3>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Dashboard File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <div className="text-sm text-gray-600 mb-2">
                        Drop your dashboard JSON file here, or
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("file-input")?.click()
                        }
                      >
                        Browse Files
                      </Button>
                      <input
                        id="file-input"
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                    </div>
                    {importFile && (
                      <div className="text-sm text-gray-600 mt-2">
                        Selected: {importFile.name}
                      </div>
                    )}
                  </div>

                  {/* Manual Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or paste JSON directly
                    </label>
                    <Textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste your dashboard JSON configuration here..."
                      className="min-h-32"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={!importData.trim()}
                  className="w-full mt-6"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Dashboard
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
