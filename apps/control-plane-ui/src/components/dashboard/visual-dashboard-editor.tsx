/**
 * React DnD Drag and Drop Dashboard Builder
 * Visual drag & drop interface for creating dashboards
 */

"use client";

import React, { useState, useCallback, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import DashboardTemplateMarketplace from "../template/template-marketplace";
import CollaborationSystem from "../system/collaboration-system";
import DashboardExportImport from "../system/export-import-system";

// Widget Types
export type WidgetType =
  | "kpi"
  | "chart"
  | "table"
  | "text"
  | "image"
  | "date"
  | "bar-chart"
  | "pie-chart"
  | "line-chart";

// Widget Configuration Interface
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, any>;
  data?: any;
}

// Dashboard Configuration
export interface DashboardConfig {
  id: string;
  name: string;
  widgets: Widget[];
  layout: {
    columns: number;
    rows: number;
    gridSize: number;
  };
  theme: string;
}

// Widget Library Items
const WIDGET_LIBRARY: Array<{
  type: WidgetType;
  name: string;
  icon: React.ComponentType;
  defaultSize: { width: number; height: number };
  category: string;
}> = [
  {
    type: "kpi",
    name: "KPI Card",
    icon: Hash,
    defaultSize: { width: 2, height: 1 },
    category: "Metrics",
  },
  {
    type: "chart",
    name: "Line Chart",
    icon: Activity,
    defaultSize: { width: 4, height: 3 },
    category: "Charts",
  },
  {
    type: "bar-chart",
    name: "Bar Chart",
    icon: BarChart3,
    defaultSize: { width: 4, height: 3 },
    category: "Charts",
  },
  {
    type: "pie-chart",
    name: "Pie Chart",
    icon: PieChart,
    defaultSize: { width: 3, height: 3 },
    category: "Charts",
  },
  {
    type: "table",
    name: "Data Table",
    icon: Table,
    defaultSize: { width: 6, height: 4 },
    category: "Data",
  },
  {
    type: "text",
    name: "Text Widget",
    icon: Type,
    defaultSize: { width: 3, height: 1 },
    category: "Content",
  },
  {
    type: "image",
    name: "Image",
    icon: Image,
    defaultSize: { width: 2, height: 2 },
    category: "Content",
  },
  {
    type: "date",
    name: "Date Range",
    icon: Calendar,
    defaultSize: { width: 2, height: 1 },
    category: "Controls",
  },
];

// Drag Item Types
const ItemTypes = {
  WIDGET: "widget",
  NEW_WIDGET: "new_widget",
};

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
    layout: {
      columns: 12,
      rows: 8,
      gridSize: 60,
    },
    theme: "light",
  });

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [history, setHistory] = useState<DashboardConfig[]>([dashboard]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showTemplateMarketplace, setShowTemplateMarketplace] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [collaborationUsers, setCollaborationUsers] = useState<any[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

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
      const newWidget: Widget = {
        id: `widget-${Date.now()}`,
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        x: Math.round(x / dashboard.layout.gridSize),
        y: Math.round(y / dashboard.layout.gridSize),
        width:
          WIDGET_LIBRARY.find((w) => w.type === type)?.defaultSize.width || 2,
        height:
          WIDGET_LIBRARY.find((w) => w.type === type)?.defaultSize.height || 2,
        config: {},
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
                x: Math.round(x / dashboard.layout.gridSize),
                y: Math.round(y / dashboard.layout.gridSize),
              }
            : w
        ),
      };

      setDashboard(newDashboard);
    },
    [dashboard]
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
                  Math.round(width / dashboard.layout.gridSize)
                ),
                height: Math.max(
                  1,
                  Math.round(height / dashboard.layout.gridSize)
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

  const handleTemplateSelect = (template: any) => {
    setDashboard(template.config);
    setShowTemplateMarketplace(false);

    // Add to history
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), template.config]);
    setHistoryIndex((prev) => prev + 1);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Collaboration System */}
        <CollaborationSystem
          dashboardId={dashboard.id}
          currentUserId="current-user"
          onUserChange={setCollaborationUsers}
        />

        {/* Main Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {dashboard.name}
              </h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex === 0}
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex === history.length - 1}
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </div>

              {/* New Advanced Features */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreviewMode ? "Edit" : "Preview"}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Widget Library Sidebar */}
          {!isPreviewMode && <WidgetLibrarySidebar onAddWidget={addWidget} />}

          {/* Dashboard Canvas */}
          <div className="flex-1 overflow-auto">
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

          {/* Properties Panel */}
          {!isPreviewMode && selectedWidget && (
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
            />
          )}
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

// Export for use in other files
export { WIDGET_LIBRARY, ItemTypes };
