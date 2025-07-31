/**
 * Dashboard Editor Page - Code-based approach with XML Data Integration
 * รองรับการอัปโหลด XML เพื่อแสดงข้อมูลชั่วคราวและบันทึก column
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import DashboardManifestEditor from "@/components/dashboard/DashboardManifestEditor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Upload, Database, Eye } from "lucide-react";
import Link from "next/link";
import AppLayout from "@/components/layout/app-layout";

export default function DashboardEditorPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const dashboardId = params.dashboardId as string;

  // State management for XML data and columns
  const [xmlData, setXmlData] = useState<any>(null);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [savedColumns, setSavedColumns] = useState<string[]>([]);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    uploadedAt: string;
    size: number;
  } | null>(null);

  // Load saved columns on component mount
  useEffect(() => {
    loadSavedColumns();
    checkExistingUpload();
  }, [tenantId, dashboardId]);

  const checkExistingUpload = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/data-status`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasData && data.metadata) {
          setUploadedFile({
            name: data.metadata.fileName || "Previous Upload",
            uploadedAt: data.metadata.uploadedAt || new Date().toISOString(),
            size: data.metadata.fileSize || 0,
          });
          setAvailableColumns(data.metadata.availableColumns || []);

          // Also load the actual data for preview
          const dataResponse = await fetch(
            `/api/tenants/${tenantId}/data?limit=5`
          );
          if (dataResponse.ok) {
            const xmlData = await dataResponse.json();
            setXmlData(xmlData);
            setShowDataPreview(true);
          }
        }
      }
    } catch (error) {
      console.error("Failed to check existing upload:", error);
    }
  };

  const loadSavedColumns = async () => {
    try {
      setIsLoadingColumns(true);
      // Load saved columns from API
      const response = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}/columns`
      );
      if (response.ok) {
        const data = await response.json();
        setSavedColumns(data.columns || []);
      }
    } catch (error) {
      console.error("Failed to load saved columns:", error);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleXmlUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Read file content
      const fileContent = await file.text();

      // Send as JSON body since our API expects xmlContent field
      const response = await fetch(`/api/tenants/${tenantId}/upload-xml`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xmlContent: fileContent,
          fileName: file.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Received response data:", data);

        // Check if parsing was successful
        if (data.success && data.parseResult) {
          console.log("XML parsed successfully:", data.parseResult);

          // Update uploaded file info
          setUploadedFile({
            name: file.name,
            uploadedAt: data.uploadedAt,
            size: data.fileSize,
          });

          // Validate parseResult structure
          const parseResult = data.parseResult;
          if (parseResult && typeof parseResult === "object") {
            console.log("parseResult.records:", parseResult.records);
            console.log("parseResult.data:", parseResult.data); // Check if data is nested
            console.log(
              "parseResult.availableColumns:",
              parseResult.availableColumns
            );

            // Handle different possible data structures
            let records =
              parseResult.records ||
              parseResult.sampleRecords ||
              parseResult.data ||
              [];
            let columns =
              parseResult.availableColumns || parseResult.columns || [];

            // If records is empty but we have other data, try to extract it
            if (!records || records.length === 0) {
              // Check if data is nested under other keys
              const possibleDataKeys = [
                "items",
                "rows",
                "entries",
                "results",
                "sampleRecords",
              ];
              for (const key of possibleDataKeys) {
                if (parseResult[key] && Array.isArray(parseResult[key])) {
                  records = parseResult[key];
                  console.log(`Found data under key '${key}':`, records);
                  break;
                }
              }
            }

            // If columns is empty, try to extract from first record
            if (
              (!columns || columns.length === 0) &&
              records &&
              records.length > 0
            ) {
              columns = Object.keys(records[0]);
              console.log("Extracted columns from first record:", columns);
            }

            console.log("Final processed data:", {
              records,
              columns,
              totalRecords: records.length,
            });

            const processedData = {
              ...parseResult,
              records: records,
              totalRecords: records.length,
              availableColumns: columns,
            };

            setXmlData(processedData);
            setAvailableColumns(columns);
            setShowDataPreview(true);
          } else {
            console.error("Invalid parseResult structure:", parseResult);
            alert("Received invalid data structure from server");
          }
        } else {
          console.error("Parse failed:", data);
          const event = new CustomEvent("toast", {
            detail: {
              title: "Upload Failed",
              description: data.error || "Failed to parse XML file",
              type: "error",
            },
          });
          window.dispatchEvent(event);
        }
      } else {
        const errorData = await response.json();
        const event = new CustomEvent("toast", {
          detail: {
            title: "Upload Failed",
            description:
              errorData.details || errorData.error || "Unknown error occurred",
            type: "error",
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const event = new CustomEvent("toast", {
        detail: {
          title: "Upload Error",
          description:
            "Failed to upload file. Please check your connection and try again.",
          type: "error",
        },
      });
      window.dispatchEvent(event);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveColumns = async (columns: string[]) => {
    try {
      const response = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}/columns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ columns }),
        }
      );

      if (response.ok) {
        setSavedColumns(columns);
        // Show a subtle success indicator instead of alert
        const event = new CustomEvent("toast", {
          detail: {
            title: "Success",
            description: `${columns.length} columns saved successfully`,
            type: "success",
          },
        });
        window.dispatchEvent(event);
      } else {
        throw new Error("Failed to save columns");
      }
    } catch (error) {
      console.error("Save error:", error);
      // Show error toast instead of alert
      const event = new CustomEvent("toast", {
        detail: {
          title: "Error",
          description: "Failed to save columns. Please try again.",
          type: "error",
        },
      });
      window.dispatchEvent(event);
    }
  };

  const handleSave = () => {
    // Optional: Show success notification or redirect
    console.log("Dashboard manifest saved successfully!");
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Link
              href={`/tenants/${tenantId}/dashboards/${dashboardId}`}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboards
            </Link>
            <div className="hidden sm:block h-6 border-l border-border"></div>
            <h1 className="text-2xl font-bold text-foreground">
              Dashboard Editor
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mt-2">
          Edit your dashboard using code. Upload XML data to preview and save
          columns for chart creation.
        </p>
      </div>

      {/* Data Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* XML Upload */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-foreground">
            <Upload className="h-5 w-5 mr-2 text-primary" />
            Upload XML Data
          </h3>
          <div className="space-y-3">
            {!uploadedFile ? (
              <>
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleXmlUpload}
                  disabled={isUploading}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-colors"
                />
                {isUploading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <p className="text-sm text-primary">Uploading...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Uploaded{" "}
                        {new Date(uploadedFile.uploadedAt).toLocaleString()} •{" "}
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadedFile(null);
                      setXmlData(null);
                      setAvailableColumns([]);
                      setShowDataPreview(false);
                    }}
                    className="text-xs"
                  >
                    Upload New
                  </Button>
                </div>
              </div>
            )}
            {xmlData && (
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{xmlData.totalRecords || 0} records loaded</span>
              </div>
            )}
          </div>
        </Card>

        {/* Column Management */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-foreground">
            <Database className="h-5 w-5 mr-2 text-primary" />
            Available Columns
            {availableColumns.length > 0 && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {availableColumns.length}
              </span>
            )}
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {isLoadingColumns ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="h-4 bg-muted rounded animate-pulse flex-1 mr-2"></div>
                    <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : availableColumns.length > 0 ? (
              <div className="space-y-2">
                {availableColumns.map((column) => (
                  <div
                    key={column}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground truncate flex-1 mr-2">
                      {column}
                    </span>
                    <input
                      type="checkbox"
                      checked={savedColumns.includes(column)}
                      onChange={(e) => {
                        const newColumns = e.target.checked
                          ? [...savedColumns, column]
                          : savedColumns.filter((c) => c !== column);
                        handleSaveColumns(newColumns);
                      }}
                      className="rounded border-border focus:ring-primary focus:ring-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">
                  No columns detected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload an XML file to discover available columns
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Data Preview */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-foreground">
            <Eye className="h-5 w-5 mr-2 text-primary" />
            Data Preview
            {xmlData && (
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                Ready
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {xmlData ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-2xl font-bold text-foreground">
                      {xmlData.totalRecords || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Records</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-2xl font-bold text-foreground">
                      {savedColumns.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Selected
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowDataPreview(!showDataPreview)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {showDataPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <Eye className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">
                  Preview not available
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload XML data to enable preview
                </p>
              </div>
            )}

            {savedColumns.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="font-medium text-foreground mb-2 text-sm">
                  Selected Columns:
                </p>
                <div className="flex flex-wrap gap-1">
                  {savedColumns.slice(0, 3).map((column) => (
                    <span
                      key={column}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                    >
                      {column}
                    </span>
                  ))}
                  {savedColumns.length > 3 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      +{savedColumns.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Data Preview Table */}
      {showDataPreview && xmlData && (
        <Card className="mb-6 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Data Preview
            </h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>
                Showing{" "}
                {Math.min(
                  5,
                  (() => {
                    const records =
                      xmlData.records ||
                      xmlData.sampleRecords ||
                      xmlData.data ||
                      xmlData.items ||
                      [];
                    return records.length || 0;
                  })()
                )}{" "}
                of{" "}
                {(() => {
                  const records =
                    xmlData.records ||
                    xmlData.sampleRecords ||
                    xmlData.data ||
                    xmlData.items ||
                    [];
                  return xmlData.totalRecords || records.length || 0;
                })()}{" "}
                records
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden shadow-sm ring-1 ring-border rounded-lg">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      {availableColumns.slice(0, 10).map((column) => (
                        <th
                          key={column}
                          className="px-4 py-3 text-left text-sm font-medium text-foreground"
                        >
                          <div className="flex items-center space-x-1">
                            <span className="truncate">{column}</span>
                            {savedColumns.includes(column) && (
                              <span className="text-green-600 dark:text-green-400">
                                ✓
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {(() => {
                      // Get records with multiple fallback options
                      const records =
                        xmlData.records ||
                        xmlData.sampleRecords ||
                        xmlData.data ||
                        xmlData.items ||
                        [];

                      console.log("Rendering table with records:", records);
                      console.log("Records length:", records.length);
                      console.log(
                        "Available columns for table:",
                        availableColumns
                      );

                      if (!records || records.length === 0) {
                        return (
                          <tr>
                            <td
                              colSpan={Math.max(availableColumns.length, 1)}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              <div className="flex flex-col items-center space-y-2">
                                <Database className="h-8 w-8 text-muted-foreground/50" />
                                <span>No records found</span>
                                <span className="text-xs">
                                  Data structure:{" "}
                                  {JSON.stringify(
                                    Object.keys(xmlData || {}),
                                    null,
                                    2
                                  )}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return records
                        .slice(0, 5)
                        .map((record: any, index: number) => {
                          console.log(`Record ${index}:`, record);
                          return (
                            <tr
                              key={index}
                              className="hover:bg-muted/25 transition-colors"
                            >
                              {availableColumns.slice(0, 10).map((column) => {
                                const value = record[column];
                                console.log(`Column ${column} value:`, value);
                                return (
                                  <td
                                    key={column}
                                    className="px-4 py-3 text-sm text-muted-foreground"
                                  >
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={String(value || "")}
                                    >
                                      {value !== undefined && value !== null
                                        ? String(value).substring(0, 50)
                                        : "-"}
                                      {String(value || "").length > 50 && "..."}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {availableColumns.length > 10 && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Showing first 10 of {availableColumns.length} columns
            </p>
          )}
        </Card>
      )}

      {/* Editor */}
      <Card className="p-0 overflow-hidden">
        <DashboardManifestEditor
          tenantId={tenantId}
          dashboardId={dashboardId}
          onSave={handleSave}
          availableColumns={savedColumns} // Pass saved columns to editor
        />
      </Card>
    </AppLayout>
  );
}
