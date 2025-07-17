/**
 * React DnD Drag and Drop Dashboard Builder
 * Visual drag & drop interface for creating dashboards
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import WidgetLibrarySidebar from "../widget/widget-library-sidebar";
import DashboardCanvas from "./dashboard-canvas";
import WidgetPropertiesPanel from "../widget/widget-properties-panel";
import {
  Save,
  Eye,
  Undo,
  Redo,
  Grid,
  Settings,
  Trash2,
  Copy,
  Move,
  RotateCcw,
  BarChart3,
  PieChart,
  Activity,
  Table,
  Hash,
  Type,
  Image,
  Calendar,
  Search,
  Share2,
  ArrowLeft,
  Maximize,
  Minimize,
} from "lucide-react";
import DashboardTemplateMarketplace from "../template/template-marketplace";
import CollaborationSystem from "../system/collaboration-system";
import DashboardExportImport from "../system/export-import-system";
import { WIDGET_LIBRARY } from "@/constants/widget-library";
import {
  WidgetType,
  Widget,
  DashboardConfig,
  ItemTypes,
} from "@/types/dashboard-editor";

export default function VisualDashboardEditor({
  dashboardId,
  tenantId,
}: {
  dashboardId: string;
  tenantId: string;
}) {
  const [dashboard, setDashboard] = useState<DashboardConfig>({
    id: dashboardId,
    name: "New Dashboard",
    widgets: [],
    layout: [],
    layout_config: {
      columns: 24, // เพิ่มจาก 12 เป็น 24 columns
      rows: 16, // เพิ่มจาก 8 เป็น 16 rows
      gridSize: 40, // ลดขนาด grid จาก 60 เป็น 40 เพื่อให้พอดีกับจอ
    },
    theme: "light",
  });

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DashboardConfig[]>([dashboard]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showTemplateMarketplace, setShowTemplateMarketplace] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [collaborationUsers, setCollaborationUsers] = useState<any[]>([]);
  const [canvasResolution, setCanvasResolution] = useState({
    width: 0,
    height: 0,
  });
  const [screenResolution, setScreenResolution] = useState({
    width: 0,
    height: 0,
  });
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasViewport, setCanvasViewport] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  // Track screen resolution
  useEffect(() => {
    const updateScreenResolution = () => {
      setScreenResolution({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateScreenResolution();
    window.addEventListener("resize", updateScreenResolution);
    return () => window.removeEventListener("resize", updateScreenResolution);
  }, []);

  // Handle zoom functionality
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.min(Math.max(0.25, canvasScale + delta), 3);

        setCanvasScale(newScale);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setCanvasScale(1);
        setCanvasViewport({ x: 0, y: 0 });
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvasScale]);

  // Load dashboard data from API
  useEffect(() => {
    fetchDashboardData();
  }, [dashboardId, tenantId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard info
      const dashboardResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}`
      );
      const dashboardData = await dashboardResponse.json();

      if (!dashboardData.success) {
        throw new Error(dashboardData.error || "Failed to fetch dashboard");
      }

      // Fetch metadata for widgets
      const metadataResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}/metadata`
      );
      const metadataData = await metadataResponse.json();

      let dashboardConfig: DashboardConfig = {
        id: dashboardId,
        name: dashboardData.data.name,
        widgets: [],
        layout: [],
        layout_config: {
          columns: 24, // เพิ่ม columns เพื่อให้มี resolution สูงขึ้น
          rows: 16, // เพิ่ม rows
          gridSize: 40, // ลดขนาด grid
        },
        theme: "light",
      };

      // If metadata exists, use it to build the dashboard config
      if (metadataData.success && metadataData.data?.metadata) {
        const metadata = metadataData.data.metadata;
        if (metadata.widgets && Array.isArray(metadata.widgets)) {
          dashboardConfig.widgets = metadata.widgets.map(
            (widget: any, index: number) => ({
              id: widget.id || `widget-${index}`,
              type: widget.type || "kpi",
              title: widget.title || "Untitled Widget",
              x: index % 4,
              y: Math.floor(index / 4),
              width: 2,
              height: 2,
              config: widget.config || {},
            })
          );
        }
      }

      setDashboard(dashboardConfig);
      setHistory([dashboardConfig]);
      setHistoryIndex(0);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Save dashboard to API
  const saveDashboard = async () => {
    try {
      setSaving(true);

      // Convert dashboard to metadata format
      const metadata = {
        config: {
          theme: dashboard.theme,
          refreshInterval: 300000,
        },
        widgets: dashboard.widgets.map((widget) => ({
          id: widget.id,
          type: widget.type,
          title: widget.title,
          config: widget.config,
        })),
        dashboards: [
          {
            id: dashboardId,
            name: dashboard.name,
            slug: dashboardId,
            tabs: [
              {
                id: "main",
                name: "Main",
                widgets: dashboard.widgets.map((w) => w.id),
              },
            ],
          },
        ],
      };

      const response = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}/metadata`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metadata,
            createdBy: "admin", // TODO: Get from auth context
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save dashboard");
      }

      alert("Dashboard saved successfully!");
    } catch (error) {
      console.error("Error saving dashboard:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save dashboard"
      );
    } finally {
      setSaving(false);
    }
  };

  // Save to history for undo/redo
  const saveToHistory = useCallback(
    (newDashboard: DashboardConfig) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDashboard);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  // Add widget to dashboard
  const addWidget = useCallback(
    (type: WidgetType, x: number, y: number) => {
      const widgetDef = WIDGET_LIBRARY.find((w) => w.type === type);
      const defaultSize = widgetDef?.defaultSize || { width: 2, height: 2 };

      // Calculate proper pixel size based on grid
      const pixelWidth = defaultSize.width * dashboard.layout_config.gridSize;
      const pixelHeight = defaultSize.height * dashboard.layout_config.gridSize;

      const newWidget: Widget = {
        id: `widget-${Date.now()}`,
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        x: Math.round(x / dashboard.layout_config.gridSize),
        y: Math.round(y / dashboard.layout_config.gridSize),
        width: defaultSize.width,
        height: defaultSize.height,
        config: {
          dataSource: "api",
          refreshInterval: 30000,
          tenantId: tenantId,
          widgetId: `widget-${Date.now()}`,
        },
      };

      const newDashboard = {
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget],
      };

      setDashboard(newDashboard);
      saveToHistory(newDashboard);
      setSelectedWidget(newWidget.id);
    },
    [dashboard, saveToHistory]
  );

  // Move widget
  const moveWidget = useCallback(
    (id: string, x: number, y: number) => {
      const newDashboard = {
        ...dashboard,
        widgets: dashboard.widgets.map((w) =>
          w.id === id
            ? {
                ...w,
                x: Math.max(
                  0,
                  Math.round(x / dashboard.layout_config.gridSize)
                ),
                y: Math.max(
                  0,
                  Math.round(y / dashboard.layout_config.gridSize)
                ),
              }
            : w
        ),
      };

      setDashboard(newDashboard);
      saveToHistory(newDashboard);
    },
    [dashboard, saveToHistory]
  );

  // Resize widget
  const resizeWidget = useCallback(
    (id: string, width: number, height: number) => {
      const newDashboard = {
        ...dashboard,
        widgets: dashboard.widgets.map((w) =>
          w.id === id
            ? {
                ...w,
                width: Math.max(
                  1,
                  Math.round(width / dashboard.layout_config.gridSize)
                ),
                height: Math.max(
                  1,
                  Math.round(height / dashboard.layout_config.gridSize)
                ),
              }
            : w
        ),
      };

      setDashboard(newDashboard);
      saveToHistory(newDashboard);
    },
    [dashboard, saveToHistory]
  );

  // Delete widget
  const deleteWidget = useCallback(
    (id: string) => {
      const newDashboard = {
        ...dashboard,
        widgets: dashboard.widgets.filter((w) => w.id !== id),
      };

      setDashboard(newDashboard);
      saveToHistory(newDashboard);
      setSelectedWidget(null);
    },
    [dashboard, saveToHistory]
  );

  // Duplicate widget
  const duplicateWidget = useCallback(
    (id: string) => {
      const widget = dashboard.widgets.find((w) => w.id === id);
      if (!widget) return;

      const newWidget: Widget = {
        ...widget,
        id: `widget-${Date.now()}`,
        x: widget.x + 1,
        y: widget.y + 1,
        title: `${widget.title} Copy`,
      };

      const newDashboard = {
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget],
      };

      setDashboard(newDashboard);
      saveToHistory(newDashboard);
      setSelectedWidget(newWidget.id);
    },
    [dashboard, saveToHistory]
  );

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDashboard(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDashboard(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Update widget properties
  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const updatedDashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      ),
    };
    setDashboard(updatedDashboard);
    saveToHistory(updatedDashboard);
  };

  const handleTemplateSelect = (template: any) => {
    setDashboard(template.config);
    setShowTemplateMarketplace(false);

    // Add to history
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), template.config]);
    setHistoryIndex((prev) => prev + 1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-2">Error: {error}</p>
          <Button onClick={fetchDashboardData} size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`bg-gray-50 dark:bg-gray-900 flex flex-col ${isFullscreen ? "fixed inset-0 z-50 h-screen" : "h-screen"}`}
      >
        {/* Collaboration System */}
        <CollaborationSystem
          dashboardId={dashboard.id}
          currentUserId="current-user"
          onUserChange={setCollaborationUsers}
        />

        {/* Main Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Back to JSON Editor Link */}
              <Link
                href={`/tenants/${tenantId}/dashboards/${dashboardId}`}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to JSON Editor
              </Link>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Visual Dashboard Editor
              </h1>

              {dashboard.name && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  - {dashboard.name}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Undo/Redo */}
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex === 0}
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </Button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCanvasScale(Math.max(0.25, canvasScale - 0.25))
                  }
                  disabled={canvasScale <= 0.25}
                  title="Zoom Out"
                >
                  <span className="text-xs">-</span>
                </Button>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {Math.round(canvasScale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCanvasScale(Math.min(3, canvasScale + 0.25))
                  }
                  disabled={canvasScale >= 3}
                  title="Zoom In"
                >
                  <span className="text-xs">+</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCanvasScale(1);
                    setCanvasViewport({ x: 0, y: 0 });
                  }}
                  title="Reset Zoom (Ctrl+0)"
                >
                  <span className="text-xs">100%</span>
                </Button>
              </div>

              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </Button>

              {/* Save Button */}
              <Button
                size="sm"
                onClick={saveDashboard}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Secondary Toolbar */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {/* Templates and Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateMarketplace(true)}
              >
                <Search className="w-4 h-4 mr-1" />
                Templates
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportImport(true)}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share & Export
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Preview Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreviewMode ? "Edit Mode" : "Preview Mode"}
              </Button>

              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Widget Library Sidebar */}
          {!isPreviewMode && (
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <WidgetLibrarySidebar onAddWidget={addWidget} />
            </div>
          )}

          {/* Dashboard Canvas */}
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <div
              style={{
                transform: `scale(${canvasScale}) translate(${canvasViewport.x}px, ${canvasViewport.y}px)`,
                transformOrigin: "top left",
                transition: "transform 0.1s ease-out",
              }}
            >
              <DashboardCanvas
                dashboard={dashboard}
                selectedWidget={selectedWidget}
                isPreviewMode={isPreviewMode}
                onSelectWidget={setSelectedWidget}
                onMoveWidget={moveWidget}
                onResizeWidget={resizeWidget}
                onDeleteWidget={deleteWidget}
                onDuplicateWidget={duplicateWidget}
                onDropWidget={addWidget}
                ref={gridRef}
              />
            </div>
          </div>

          {/* Properties Panel */}
          {!isPreviewMode && selectedWidget && (
            <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
              <WidgetPropertiesPanel
                widget={dashboard.widgets.find((w) => w.id === selectedWidget)}
                onUpdateWidget={(updates: Partial<Widget>) => {
                  const newDashboard = {
                    ...dashboard,
                    widgets: dashboard.widgets.map((w) =>
                      w.id === selectedWidget ? { ...w, ...updates } : w
                    ),
                  };
                  setDashboard(newDashboard);
                  saveToHistory(newDashboard);
                }}
                onClose={() => setSelectedWidget(null)}
              />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span>
                Grid: {dashboard.layout_config.columns}×
                {dashboard.layout_config.rows} (
                {dashboard.layout_config.gridSize}px)
              </span>
              <span>
                Canvas:{" "}
                {dashboard.layout_config.columns *
                  dashboard.layout_config.gridSize}
                ×
                {dashboard.layout_config.rows *
                  dashboard.layout_config.gridSize}
                px
              </span>
              <span>Widgets: {dashboard.widgets.length}</span>
              {selectedWidget && (
                <span className="text-blue-600 dark:text-blue-400">
                  Selected:{" "}
                  {
                    dashboard.widgets.find((w) => w.id === selectedWidget)
                      ?.title
                  }
                  (
                  {dashboard.widgets.find((w) => w.id === selectedWidget)?.x ||
                    0}
                  ,{" "}
                  {dashboard.widgets.find((w) => w.id === selectedWidget)?.y ||
                    0}
                  ) [
                  {dashboard.widgets.find((w) => w.id === selectedWidget)
                    ?.width || 0}
                  ×
                  {dashboard.widgets.find((w) => w.id === selectedWidget)
                    ?.height || 0}
                  ]
                </span>
              )}
            </div>
            <div className="flex items-center space-x-6">
              <span>
                Screen: {screenResolution.width}×{screenResolution.height}px
              </span>
              <span>Zoom: {Math.round(canvasScale * 100)}%</span>
              <span className="text-xs text-gray-400">
                Ctrl+Scroll to zoom, Ctrl+0 to reset
              </span>
              {isPreviewMode && (
                <span className="text-green-600 dark:text-green-400">
                  📱 Preview: This is how it looks on {screenResolution.width}×
                  {screenResolution.height} screen
                </span>
              )}
              <span
                className={`px-2 py-1 rounded text-xs ${isPreviewMode ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"}`}
              >
                {isPreviewMode ? "Preview Mode" : "Edit Mode"}
              </span>
            </div>
          </div>
        </div>

        {/* Template Marketplace Modal */}
        {showTemplateMarketplace && (
          <DashboardTemplateMarketplace
            onSelectTemplate={handleTemplateSelect}
            onClose={() => setShowTemplateMarketplace(false)}
          />
        )}

        {/* Export/Import Modal */}
        {showExportImport && (
          <DashboardExportImport
            dashboard={dashboard}
            onImport={handleTemplateSelect}
            onClose={() => setShowExportImport(false)}
          />
        )}
      </div>
    </DndProvider>
  );
}
