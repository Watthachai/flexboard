/**
 * Dashboard Manifest Editor Component
 * Code editor for Dashboard as Code approac      const defaultTemplate = {
        schemaVersion: "1.0",
        dashboardId: dashboardId,
        dashboardName: dashboardId,
        description: "",
        version: 1,
        targetTeams: ["default"],
        layout: {
          type: "grid",
          columns: 12,
          rowHeight: 50,
        },
        widgets: [],
        dataSources: [
          {
            id: "uploaded-xml-data",
            name: "Uploaded XML Data",
            type: "xml",
            description: "Data from uploaded XML file",
            endpoint: `/api/tenants/${tenantId}/data`,
            refreshInterval: 300000,
          }
        ],
      };uggestions
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Download,
  Upload,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useDashboardManifestDetail } from "@/hooks/use-dashboard-manifest";
import { EnhancedWidgetPreview } from "@/components/widget/enhanced-widget-preview";

interface DashboardManifestEditorProps {
  tenantId: string;
  dashboardId: string;
  onSave?: () => void;
  availableColumns?: string[];
}

export default function DashboardManifestEditor({
  tenantId,
  dashboardId,
  onSave,
  availableColumns = [],
}: DashboardManifestEditorProps) {
  const {
    manifestContent,
    loading,
    error,
    saveManifest,
    getTemplate,
    refresh,
  } = useDashboardManifestDetail({
    tenantId,
    dashboardId,
    autoFetch: true,
  });

  const [editorContent, setEditorContent] = useState<string>("");
  const [isModified, setIsModified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);

  // Sync editor content when manifest loads
  useEffect(() => {
    if (manifestContent && !isModified) {
      try {
        // Validate that manifestContent is valid JSON before setting
        JSON.parse(manifestContent);
        setEditorContent(manifestContent);
      } catch (error) {
        console.error("Invalid manifest content received:", error);
        // Set a default valid template
        const defaultTemplate = {
          schemaVersion: "1.0",
          dashboardId: `${dashboardId}`,
          dashboardName: "New Dashboard",
          description: "",
          version: 1,
          targetTeams: ["default"],
          layout: {
            type: "grid",
            columns: 12,
            rowHeight: 50,
          },
          widgets: [],
          dataSources: [],
        };
        setEditorContent(JSON.stringify(defaultTemplate, null, 2));
      }
    } else if (!manifestContent && !isModified) {
      // Set default template if no content exists
      const defaultTemplate = {
        schemaVersion: "1.0",
        dashboardId: `${dashboardId}`,
        dashboardName: "New Dashboard",
        description: "",
        version: 1,
        targetTeams: ["default"],
        layout: {
          type: "grid",
          columns: 12,
          rowHeight: 50,
        },
        widgets: [],
        dataSources: [],
      };
      setEditorContent(JSON.stringify(defaultTemplate, null, 2));
    }
  }, [manifestContent, isModified, dashboardId]);

  // Validate content when it changes
  useEffect(() => {
    validateContent(editorContent);
  }, [editorContent]);

  const validateContent = (content: string) => {
    if (!content.trim()) {
      setValidationResult({ isValid: false, errors: ["Content is empty"] });
      return;
    }

    try {
      const parsed = JSON.parse(content);

      // Basic schema validation
      const errors: string[] = [];

      // Check for schemaVersion (with or without $)
      if (
        !parsed["$schemaVersion"] &&
        !parsed.$schemaVersion &&
        !parsed.schemaVersion
      ) {
        errors.push(
          "Missing required field: schemaVersion (or $schemaVersion)"
        );
      }

      if (!parsed.dashboardId) {
        errors.push("Missing required field: dashboardId");
      }

      if (!parsed.dashboardName) {
        errors.push("Missing required field: dashboardName");
      }

      if (!Array.isArray(parsed.widgets)) {
        errors.push("widgets must be an array");
      }

      if (errors.length > 0) {
        setValidationResult({ isValid: false, errors });
      } else {
        setValidationResult({ isValid: true, errors: [] });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid JSON";
      setValidationResult({
        isValid: false,
        errors: [`JSON Syntax Error: ${errorMessage}`],
      });
    }
  };

  // Safe JSON parser for preview components
  const safeJsonParse = (content: string, fallback: any = null) => {
    try {
      if (!content.trim()) return fallback;
      return JSON.parse(content);
    } catch {
      return fallback;
    }
  };

  const handleContentChange = (value: string) => {
    setEditorContent(value);
    setIsModified(value !== manifestContent);
  };

  const handleSave = async () => {
    if (!editorContent.trim() || !validationResult?.isValid) {
      return;
    }

    try {
      setSaving(true);
      await saveManifest(editorContent);
      setIsModified(false);
      onSave?.();
    } catch (error) {
      console.error("Failed to save manifest:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTemplate = async () => {
    try {
      const template = await getTemplate();
      setEditorContent(template);
      setIsModified(true);
    } catch (error) {
      console.error("Failed to load template:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editorContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-${dashboardId}-manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setEditorContent(content);
      setIsModified(true);
    };
    reader.readAsText(file);
  };

  const insertColumn = (column: string) => {
    // First check if we have any widgets/charts to insert the column into
    try {
      const parsed = JSON.parse(editorContent);

      if (!parsed.widgets || parsed.widgets.length === 0) {
        // No widgets exist, suggest creating a chart first
        alert(
          "Please add a chart widget first before inserting columns. Click 'Add Chart Template' to get started."
        );
        return;
      }

      // Find the first chart widget to insert column
      const columnRef = `"${column}"`;

      // Insert column reference at cursor position or at the end
      const newContent = editorContent + `\n// Column: ${columnRef}`;
      setEditorContent(newContent);
      setIsModified(true);
    } catch (error) {
      alert("Please fix JSON errors before inserting columns.");
    }
  };

  const insertChartTemplate = (
    chartType: "bar" | "line" | "pie" | "table" = "bar"
  ) => {
    try {
      const parsed = JSON.parse(editorContent);

      const chartTemplate = {
        id: `chart-${Date.now()}`,
        type: chartType,
        title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
        dataSource: "uploaded-data",
        config: {
          xAxis: availableColumns[0] || "category",
          yAxis: availableColumns[1] || "value",
          dataSource: "uploaded-data",
          tenantId: tenantId, // Add tenant ID for data fetching
          ...(chartType === "table" && {
            columns: availableColumns.slice(0, 5),
          }),
        },
        layout: {
          x: 0,
          y: 0,
          width: 6,
          height: 4,
        },
      };

      if (!parsed.widgets) {
        parsed.widgets = [];
      }

      parsed.widgets.push(chartTemplate);

      setEditorContent(JSON.stringify(parsed, null, 2));
      setIsModified(true);
    } catch (error) {
      console.error("Failed to insert chart template:", error);
      alert("Failed to insert chart template. Please check JSON format.");
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading manifest...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={refresh} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Dashboard Manifest Editor
          </h2>
          {isModified && (
            <Badge
              variant="outline"
              className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600"
            >
              Modified
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />

          <Button variant="outline" size="sm" onClick={handleLoadTemplate}>
            Load Template
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!editorContent.trim()}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>

          <Button
            onClick={handleSave}
            disabled={!validationResult?.isValid || saving}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Available Columns Helper */}
      {availableColumns.length > 0 && (
        <Card className="p-4 sm:p-6 bg-primary/5 border-primary/20 m-4 sm:m-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 ">
            <h4 className="text-sm font-medium text-foreground">
              Available Data Columns
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertChartTemplate("bar")}
                className="text-xs"
              >
                + Bar Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertChartTemplate("line")}
                className="text-xs"
              >
                + Line Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertChartTemplate("table")}
                className="text-xs"
              >
                + Table
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableColumns.map((column) => (
              <Badge
                key={column}
                variant="outline"
                className="text-primary border-primary/30 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => insertColumn(column)}
              >
                {column}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Add a chart template first, then click on column names to use
            them in your widgets
          </p>
        </Card>
      )}

      <Tabs defaultValue="editor" className="w-full p-4 sm:p-6">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {/* Validation Status */}
          <div className="flex items-center space-x-2">
            {validationResult?.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span
              className={`text-sm ${
                validationResult?.isValid
                  ? "text-green-700 dark:text-green-400"
                  : "text-destructive"
              }`}
            >
              {validationResult?.isValid ? (
                "Valid JSON manifest"
              ) : (
                <div>
                  <p>Invalid manifest:</p>
                  {validationResult?.errors.map((error, index) => (
                    <p key={index} className="ml-2">
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </span>
          </div>

          {/* Code Editor */}
          <Card className="p-0 overflow-hidden">
            <textarea
              value={editorContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-64 sm:h-96 p-4 font-mono text-sm border-none resize-none focus:outline-none bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Enter your dashboard manifest JSON here..."
            />
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="p-4 sm:p-6">
            {validationResult?.isValid ? (
              <div className="space-y-6">
                {/* Dashboard Info */}
                <div className="border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {(() => {
                          const parsed = safeJsonParse(editorContent);
                          return parsed?.dashboardName || "Untitled Dashboard";
                        })()}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const parsed = safeJsonParse(editorContent);
                          return (
                            parsed?.description || "No description provided"
                          );
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="px-2 py-1 bg-muted/50 rounded">
                        🖥️ Desktop Preview (1920×1080)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viewport Simulator */}
                <div className="space-y-4">
                  <div className="text-sm font-medium text-foreground">
                    OnPrem Viewer Simulation
                  </div>

                  {/* Desktop Frame */}
                  <div className="bg-slate-900 dark:bg-slate-950 p-1 rounded-lg shadow-2xl">
                    {/* Browser Frame */}
                    <div className="bg-slate-800 dark:bg-slate-900 rounded-t-md px-3 py-2 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-xs text-slate-400 ml-2">
                        OnPrem Dashboard Viewer - 1920×1080
                      </div>
                    </div>

                    {/* Application Frame */}
                    <div
                      className="bg-background border border-border relative overflow-hidden"
                      style={{
                        width: "100%",
                        aspectRatio: "16/9", // Simulate 1920x1080 aspect ratio
                        maxWidth: "960px", // Half scale for preview
                        height: "540px", // Half scale height
                      }}
                    >
                      {/* Top Navbar */}
                      <div className="absolute top-0 left-0 right-0 h-12 bg-primary/10 border-b border-border flex items-center px-4">
                        <div className="text-xs font-medium text-foreground">
                          📊 FlexBoard Viewer
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Tenant: Demo</span>
                          <div className="w-6 h-6 bg-muted rounded-full"></div>
                        </div>
                      </div>

                      {/* Sidebar */}
                      <div className="absolute top-12 left-0 w-16 bottom-0 bg-muted/30 border-r border-border flex flex-col items-center py-2">
                        <div className="text-xs text-muted-foreground rotate-90 whitespace-nowrap mt-8">
                          Navigation
                        </div>
                        <div className="mt-auto space-y-2">
                          <div className="w-8 h-8 bg-primary/20 rounded"></div>
                          <div className="w-8 h-8 bg-muted rounded"></div>
                          <div className="w-8 h-8 bg-muted rounded"></div>
                        </div>
                      </div>

                      {/* Main Dashboard Area */}
                      <div
                        className="absolute top-12 left-16 right-0 bottom-0 p-4 overflow-auto"
                        style={{
                          width: "calc(100% - 64px)", // Subtract sidebar width
                          height: "calc(100% - 48px)", // Subtract navbar height
                        }}
                      >
                        {(() => {
                          const parsed = safeJsonParse(editorContent);

                          // If JSON is invalid, show error message
                          if (!parsed) {
                            return (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center text-destructive">
                                  <div className="text-lg mb-1">⚠️</div>
                                  <p className="text-xs">
                                    Invalid JSON - Fix syntax errors to see
                                    preview
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          const widgets = parsed.widgets || [];
                          const layout = parsed.layout || {
                            columns: 12,
                            rowHeight: 50,
                          };

                          if (widgets.length === 0) {
                            return (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                  <div className="text-2xl mb-2">📊</div>
                                  <p className="font-medium">
                                    No widgets configured
                                  </p>
                                  <p className="text-xs">
                                    Add chart templates to see preview
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // Calculate actual dashboard area dimensions (in preview scale)
                          const dashboardWidth = 960 - 64 - 32; // Total width - sidebar - padding
                          const dashboardHeight = 540 - 48 - 32; // Total height - navbar - padding

                          // Calculate grid dimensions
                          const maxX = Math.max(
                            ...widgets.map(
                              (w: any) =>
                                (w.layout?.x || 0) + (w.layout?.width || 6)
                            )
                          );
                          const maxY = Math.max(
                            ...widgets.map(
                              (w: any) =>
                                (w.layout?.y || 0) + (w.layout?.height || 4)
                            )
                          );
                          const gridCols = Math.max(layout.columns || 12, maxX);
                          const gridRows = Math.max(6, maxY);

                          // Calculate cell dimensions
                          const cellWidth = dashboardWidth / gridCols;
                          const cellHeight = (layout.rowHeight || 50) * 0.5; // Half scale

                          return (
                            <div className="relative h-full">
                              {/* Grid Info Overlay */}
                              <div className="absolute top-2 left-2 z-10 flex items-center gap-2 text-xs bg-background/80 backdrop-blur-sm px-2 py-1 rounded border">
                                <span className="text-muted-foreground">
                                  {gridCols}×{gridRows} •{" "}
                                  {Math.round(cellWidth)}×
                                  {Math.round(cellHeight)}px cells
                                </span>
                              </div>

                              {/* Dashboard Grid Container */}
                              <div
                                className="relative w-full h-full"
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: `repeat(${gridCols}, ${cellWidth}px)`,
                                  gridTemplateRows: `repeat(${gridRows}, ${cellHeight}px)`,
                                  gap: "8px",
                                  padding: "4px",
                                }}
                              >
                                {/* Grid background */}
                                <div
                                  className="absolute inset-0 pointer-events-none opacity-10"
                                  style={{
                                    backgroundImage: `
                                      linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                                      linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                                    `,
                                    backgroundSize: `${cellWidth + 8}px ${cellHeight + 8}px`,
                                  }}
                                ></div>

                                {widgets.map((widget: any, index: number) => {
                                  const x = widget.layout?.x || 0;
                                  const y = widget.layout?.y || 0;
                                  const width = widget.layout?.width || 6;
                                  const height = widget.layout?.height || 4;

                                  return (
                                    <Card
                                      key={widget.id || index}
                                      className="relative bg-background/90 backdrop-blur-sm border-primary/20 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                      style={{
                                        gridColumn: `${x + 1} / ${x + width + 1}`,
                                        gridRow: `${y + 1} / ${y + height + 1}`,
                                      }}
                                    >
                                      <div className="p-2 h-full flex flex-col">
                                        {/* Widget Header */}
                                        <div className="flex items-center justify-between mb-1">
                                          <h5 className="font-medium text-foreground text-xs truncate">
                                            {widget.title ||
                                              `Widget ${index + 1}`}
                                          </h5>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs h-4 px-1"
                                          >
                                            {widget.type || "chart"}
                                          </Badge>
                                        </div>

                                        {/* Position Info */}
                                        <div className="text-xs text-muted-foreground mb-1 opacity-75">
                                          ({x},{y}) {width}×{height}
                                        </div>

                                        {/* Widget Preview - Use Real Component */}
                                        <div className="flex-1 rounded overflow-hidden min-h-[120px]">
                                          <EnhancedWidgetPreview
                                            widget={
                                              {
                                                id:
                                                  widget.id ||
                                                  `widget-${index}`,
                                                type: widget.type,
                                                title: widget.title,
                                                config: {
                                                  ...widget.config,
                                                  tenantId: tenantId,
                                                  dataSource: widget.dataSource,
                                                },
                                              } as any
                                            }
                                          />
                                        </div>

                                        {/* Widget Config - Condensed */}
                                        {(widget.config?.xAxis ||
                                          widget.config?.yAxis ||
                                          widget.config?.columns) && (
                                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5 opacity-75">
                                            {widget.config?.xAxis && (
                                              <div className="truncate">
                                                X: {widget.config.xAxis}
                                              </div>
                                            )}
                                            {widget.config?.yAxis && (
                                              <div className="truncate">
                                                Y: {widget.config.yAxis}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Info Panel */}
                  <div className="bg-muted/20 p-4 rounded-lg text-sm space-y-2">
                    <div className="font-medium text-foreground">
                      🖥️ Viewport Simulation Details:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>• Screen: 1920×1080 (scaled to 50% for preview)</div>
                      <div>• Navbar: 48px height</div>
                      <div>• Sidebar: 64px width (collapsible)</div>
                      <div>• Dashboard Area: ~1856×1032px actual size</div>
                      <div>• Grid cells scale automatically with viewport</div>
                      <div>
                        • Row height:{" "}
                        {(() => {
                          const parsed = safeJsonParse(editorContent);
                          return (parsed?.layout?.rowHeight || 50) + "px";
                        })()}{" "}
                        per row
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw JSON (Collapsible) */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Show Raw JSON
                  </summary>
                  <pre className="mt-2 text-xs text-foreground whitespace-pre-wrap overflow-auto max-h-64 bg-muted/30 p-4 rounded-md border">
                    {(() => {
                      const parsed = safeJsonParse(editorContent);
                      if (parsed) {
                        return JSON.stringify(parsed, null, 2);
                      }
                      return "Invalid JSON - cannot format";
                    })()}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive font-medium">
                  Cannot preview manifest
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Fix validation errors to see preview
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
