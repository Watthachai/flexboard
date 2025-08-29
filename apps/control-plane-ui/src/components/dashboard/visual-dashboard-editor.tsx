/**
 * React DnD Drag and Drop Dashboard Builder
 * Visual drag & drop interface for creating dashboards
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import WidgetLibrarySidebar from "../widget/widget-library-sidebar";
import DashboardCanvas from "./dashboard-canvas";
import { PropertiesTabPanel } from "./PropertiesTabPanel";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { UploadedDataProvider } from "@/contexts/UploadedDataContext";
import {
  cleanJsonData,
  extractDatasetFromMetadata,
  detectColumnType,
  calculateTotalQuantity,
  calculateTotalValue,
} from "@/lib/data-utils";
import {
  Save,
  Eye,
  Undo,
  Redo,
  Settings,
  BarChart3,
  ArrowLeft,
  Maximize,
  Minimize,
  Search,
  Share2,
} from "lucide-react";
import DashboardTemplateMarketplace from "../template/template-marketplace";
import DashboardExportImport from "../system/export-import-system";
import DataSourceInfo from "../data/data-source-info";
import DataViewerModal from "./data-viewer-modal";
import { WIDGET_LIBRARY } from "@/constants/widget-library";
import { WidgetType, Widget, DashboardConfig } from "@/types/dashboard-editor";

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

  // เพิ่ม state สำหรับเก็บข้อมูลที่ upload
  const [dashboardDataSource, setDashboardDataSource] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [uploadedData, setUploadedData] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Zustand store for managing active widget
  const { setActiveWidgetId, setMetadata } = useDashboardStore();

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
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [screenResolution, setScreenResolution] = useState({
    width: 0,
    height: 0,
  });
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasViewport, setCanvasViewport] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
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

  // Handle zoom functionality with proper coordinate transformation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const container = canvasContainerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom delta
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.min(Math.max(0.25, canvasScale + delta), 3);

        // Calculate new viewport position to zoom towards mouse
        const scaleDelta = newScale - canvasScale;
        const newViewportX =
          canvasViewport.x - (mouseX * scaleDelta) / canvasScale;
        const newViewportY =
          canvasViewport.y - (mouseY * scaleDelta) / canvasScale;

        setCanvasScale(newScale);
        setCanvasViewport({ x: newViewportX, y: newViewportY });
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
  }, [canvasScale, canvasViewport]);

  // Handle canvas panning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        setCanvasViewport({
          x: canvasViewport.x + deltaX,
          y: canvasViewport.y + deltaY,
        });

        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, canvasViewport]);

  // Add mouse down listener to canvas container
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle mouse or Alt+Left mouse
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    container.addEventListener("mousedown", handleMouseDown);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const canvasX = (screenX - canvasViewport.x) / canvasScale;
      const canvasY = (screenY - canvasViewport.y) / canvasScale;
      return { x: canvasX, y: canvasY };
    },
    [canvasScale, canvasViewport]
  );

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

      // เก็บข้อมูล dashboard และ data source config
      const dbData = dashboardData.data;
      setDashboardDataSource(dbData);

      // Parse uploaded data ถ้ามี
      if (dbData.dataSourceConfig?.uploadedData) {
        try {
          console.log(
            "Raw uploadedData from Firebase:",
            dbData.dataSourceConfig.uploadedData
          );

          // ใช้ utility function เพื่อทำความสะอาดข้อมูล
          let parsedData = dbData.dataSourceConfig.uploadedData;

          // ถ้าเป็น string ให้ parse
          if (typeof parsedData === "string") {
            parsedData = JSON.parse(parsedData);
          }

          // ทำความสะอาดข้อมูลที่อาจถูก serialize ซ้อนกัน
          parsedData = cleanJsonData(parsedData);

          console.log("Cleaned parsed data:", parsedData);

          // ตรวจสอบรูปแบบข้อมูลและแปลง
          let transformedData;

          if (parsedData.dataset?.record) {
            // รูปแบบใหม่: {dataset: {record: [...]}}
            console.log("Processing dataset.record format");
            const records = Array.isArray(parsedData.dataset.record)
              ? parsedData.dataset.record
              : [parsedData.dataset.record];

            // สร้าง columns จาก record แรก
            const columns =
              records.length > 0
                ? Object.keys(records[0]).map((key) => ({
                    name: key,
                    type: detectColumnType(records, key),
                  }))
                : [];

            transformedData = {
              columns,
              data: records,
              summary: {
                totalRows: records.length,
                totalQuantity: calculateTotalQuantity(records),
                totalValue: calculateTotalValue(records),
              },
            };
          } else if (parsedData.columns && parsedData.rows) {
            // รูปแบบเก่า: {columns: [...], rows: [...]}
            console.log("Converting rows/columns format to data array format");
            transformedData = {
              columns: parsedData.columns,
              data: parsedData.rows.map((row: any[]) => {
                const rowObject: any = {};
                parsedData.columns.forEach((col: any, index: number) => {
                  rowObject[col.name] = row[index];
                });
                return rowObject;
              }),
              summary: {
                totalRows: parsedData.totalRows || parsedData.rows.length,
                totalQuantity: 0,
                totalValue: 0,
              },
            };

            // คำนวณ summary จากข้อมูลจริง
            const numericColumns = parsedData.columns.filter(
              (col: any) => col.type === "number"
            );
            if (numericColumns.length > 0) {
              let totalQuantity = 0;
              let totalValue = 0;

              transformedData.data.forEach((row: any) => {
                numericColumns.forEach((col: any) => {
                  const value = parseFloat(row[col.name]) || 0;
                  if (
                    col.name.toLowerCase().includes("qty") ||
                    col.name.toLowerCase().includes("quantity")
                  ) {
                    totalQuantity += value;
                  }
                  if (
                    col.name.toLowerCase().includes("cost") ||
                    col.name.toLowerCase().includes("value") ||
                    col.name.toLowerCase().includes("price")
                  ) {
                    totalValue += value;
                  }
                });
              });

              transformedData.summary.totalQuantity = totalQuantity;
              transformedData.summary.totalValue = totalValue;
            }
          } else {
            // ใช้ข้อมูลเดิม
            console.log("Using original parsed data format");
            transformedData = parsedData;
          }

          console.log("Final transformed data:", transformedData);
          setUploadedData(transformedData);
        } catch (error) {
          console.error("Error parsing uploaded data:", error);
        }
      } else {
        console.log("No uploadedData found in dataSourceConfig");
      }

      // Fetch metadata for widgets
      const metadataResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}/metadata`
      );
      const metadataData = await metadataResponse.json();

      let dashboardConfig: DashboardConfig = {
        id: dashboardId,
        name: dbData.name || "New Dashboard",
        widgets: [],
        layout: [],
        layout_config: {
          columns: 24,
          rows: 16,
          gridSize: 40,
        },
        theme: dbData.settings?.theme || "light",
      };

      // If metadata exists, use it to build the dashboard config
      if (metadataData.success && metadataData.data?.metadata) {
        const metadata = metadataData.data.metadata;
        if (metadata.widgets && Array.isArray(metadata.widgets)) {
          dashboardConfig.widgets = metadata.widgets.map(
            (widget: Record<string, unknown>, index: number) =>
              ({
                id: (widget.id as string) || `widget-${index}`,
                type: (widget.type as WidgetType) || "kpi",
                title: (widget.title as string) || "Untitled Widget",
                x: index % 4,
                y: Math.floor(index / 4),
                width: 2,
                height: 2,
                config: (widget.config as Record<string, unknown>) || {},
              }) as Widget
          );
        }
      }

      setDashboard(dashboardConfig);
      setHistory([dashboardConfig]);
      setHistoryIndex(0);

      // Update Zustand store with metadata
      setMetadata({
        widgets: dashboardConfig.widgets,
        config: {
          theme: dashboardConfig.theme || "light",
          refreshInterval: 300000,
        },
      });
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

  // Add widget to dashboard with proper coordinate transformation
  const addWidget = useCallback(
    (type: WidgetType, screenX: number, screenY: number) => {
      const widgetDef = WIDGET_LIBRARY.find((w) => w.type === type);
      const defaultSize = widgetDef?.defaultSize || { width: 2, height: 2 };

      // Convert screen coordinates to canvas coordinates
      const canvasPos = screenToCanvas(screenX, screenY);

      const newWidget: Widget = {
        id: `widget-${Date.now()}`,
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        x: Math.round(canvasPos.x / dashboard.layout_config.gridSize),
        y: Math.round(canvasPos.y / dashboard.layout_config.gridSize),
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

      // Update Zustand store with metadata
      setActiveWidgetId(newWidget.id);
      setMetadata({
        widgets: newDashboard.widgets,
        config: {
          theme: newDashboard.theme || "light",
          refreshInterval: 300000,
        },
      });
    },
    [dashboard, saveToHistory, screenToCanvas, tenantId]
  );

  // Move widget with coordinate transformation
  const moveWidget = useCallback(
    (id: string, canvasX: number, canvasY: number) => {
      const newDashboard = {
        ...dashboard,
        widgets: dashboard.widgets.map((w) =>
          w.id === id
            ? {
                ...w,
                x: Math.max(
                  0,
                  Math.round(canvasX / dashboard.layout_config.gridSize)
                ),
                y: Math.max(
                  0,
                  Math.round(canvasY / dashboard.layout_config.gridSize)
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

  // Handle widget selection
  const handleSelectWidget = useCallback(
    (widgetId: string | null) => {
      setSelectedWidget(widgetId);
      setActiveWidgetId(widgetId);

      // Sync metadata to store to ensure getActiveWidgetConfig works
      setMetadata({
        widgets: dashboard.widgets,
        config: {
          theme: dashboard.theme || "light",
          refreshInterval: 300000,
        },
      });
    },
    [setActiveWidgetId, setMetadata, dashboard]
  );

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

    // Sync metadata to store
    setMetadata({
      widgets: updatedDashboard.widgets,
      config: {
        theme: updatedDashboard.theme || "light",
        refreshInterval: 300000,
      },
    });
  };

  const handleTemplateSelect = (template: { config: DashboardConfig }) => {
    setDashboard(template.config);
    setShowTemplateMarketplace(false);

    // Add to history
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), template.config]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleImport = (importedDashboard: DashboardConfig) => {
    setDashboard(importedDashboard);
    setShowExportImport(false);

    // Add to history
    setHistory((prev) => [
      ...prev.slice(0, historyIndex + 1),
      importedDashboard,
    ]);
    setHistoryIndex((prev) => prev + 1);
  };

  // Generate quick widgets from uploaded data
  const generateQuickWidgets = useCallback(() => {
    if (!uploadedData) return;

    // Type-safe access to uploaded data structure
    const dataObj = uploadedData as Record<string, unknown>;
    const columns =
      (dataObj.columns as Array<{
        name: string;
        type: string;
        displayName?: string;
      }>) || [];
    const data = (dataObj.data as Array<Record<string, unknown>>) || [];
    const summary = (dataObj.summary as Record<string, unknown>) || {};

    const newWidgets: Widget[] = [];
    let widgetId = 0;

    // Safe access to summary properties with defaults
    const totalRows = (summary.totalRows as number) || 0;
    const totalQuantity = (summary.totalQuantity as number) || 0;
    const totalValue = (summary.totalValue as number) || 0;

    // 1. สร้าง Summary KPI Widgets
    if (totalRows > 0) {
      newWidgets.push({
        id: `auto-kpi-total-${widgetId++}`,
        type: "kpi",
        title: "Total Records",
        x: 0,
        y: 0,
        width: 4,
        height: 3,
        config: {
          dataSource: "static",
          staticData: {
            value: totalRows,
            format: "number",
            color: "#3B82F6",
            trend: { value: 0, direction: "up" },
          },
          tenantId,
          widgetId: `auto-kpi-total-${widgetId}`,
        },
      });
    }

    if (totalQuantity > 0) {
      newWidgets.push({
        id: `auto-kpi-quantity-${widgetId++}`,
        type: "kpi",
        title: "Total Quantity",
        x: 4,
        y: 0,
        width: 4,
        height: 3,
        config: {
          dataSource: "static",
          staticData: {
            value: totalQuantity,
            format: "number",
            color: "#10B981",
            trend: { value: 0, direction: "up" },
          },
          tenantId,
          widgetId: `auto-kpi-quantity-${widgetId}`,
        },
      });
    }

    if (totalValue > 0) {
      newWidgets.push({
        id: `auto-kpi-value-${widgetId++}`,
        type: "kpi",
        title: "Total Value",
        x: 8,
        y: 0,
        width: 4,
        height: 3,
        config: {
          dataSource: "static",
          staticData: {
            value: totalValue,
            format: "currency",
            color: "#F59E0B",
            trend: { value: 0, direction: "up" },
          },
          tenantId,
          widgetId: `auto-kpi-value-${widgetId}`,
        },
      });
    }

    // 2. สร้าง Table Widget แสดงข้อมูลดิบ
    newWidgets.push({
      id: `auto-table-${widgetId++}`,
      type: "table",
      title: "Data Table",
      x: 0,
      y: 3,
      width: 24,
      height: 8,
      config: {
        dataSource: "static",
        staticData: {
          columns: columns.map((col) => ({
            key: col.name,
            title: col.displayName || col.name,
            type: col.type,
          })),
          data: data.slice(0, 50), // แสดง 50 แถวแรก
          pagination: true,
        },
        tenantId,
        widgetId: `auto-table-${widgetId}`,
      },
    }); // 3. สร้าง Chart Widget ถ้ามีข้อมูลที่เหมาะสม
    const numericColumns = columns.filter((col) => col?.type === "number");
    const stringColumns = columns.filter((col) => col?.type === "string");

    if (numericColumns.length > 0 && stringColumns.length > 0) {
      // สร้าง Bar Chart
      const groupByColumn = stringColumns[0].name;
      const valueColumn = numericColumns[0].name;

      // Group data for chart - with safe access
      const chartData = data.reduce((acc: Record<string, number>, row) => {
        if (!row) return acc;
        const key = (row[groupByColumn] as string) || "Unknown";
        const value = parseFloat((row[valueColumn] as string) || "0") || 0;
        acc[key] = (acc[key] || 0) + value;
        return acc;
      }, {});

      const chartDataArray = Object.entries(chartData)
        .map(([key, value]) => ({
          name: key.toString(),
          value: value as number,
        }))
        .sort((a, b) => b.value - a.value); // เรียงจากมากไปน้อย

      newWidgets.push({
        id: `auto-chart-${widgetId++}`,
        type: "chart",
        title: `${stringColumns[0].displayName || stringColumns[0].name} vs ${numericColumns[0].displayName || numericColumns[0].name}`,
        x: 0,
        y: 11,
        width: 12,
        height: 5,
        config: {
          dataSource: "static",
          staticData: {
            chartType: "bar",
            data: chartDataArray.slice(0, 10), // แสดง 10 รายการแรก
            xAxis: "name",
            yAxis: "value",
          },
          tenantId,
          widgetId: `auto-chart-${widgetId}`,
        },
      });

      // สร้าง Pie Chart ถ้ามีข้อมูลเหมาะสม
      if (chartDataArray.length <= 8) {
        newWidgets.push({
          id: `auto-pie-${widgetId++}`,
          type: "chart",
          title: `Distribution: ${stringColumns[0].displayName || stringColumns[0].name}`,
          x: 12,
          y: 11,
          width: 12,
          height: 5,
          config: {
            dataSource: "static",
            staticData: {
              chartType: "pie",
              data: chartDataArray.slice(0, 8),
            },
            tenantId,
            widgetId: `auto-pie-${widgetId}`,
          },
        });
      }
    }

    // 4. สร้าง Line Chart ถ้ามี Date column
    const dateColumns = columns.filter((col) => col?.type === "date");
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      const dateColumn = dateColumns[0].name;
      const valueColumn = numericColumns[0].name;

      // Group data by date
      const timeSeriesData = (data as Array<Record<string, unknown>>)
        .filter((row) => row && row[dateColumn] && row[valueColumn])
        .map((row) => ({
          date: new Date(row[dateColumn] as string).toISOString().split("T")[0],
          value: parseFloat((row[valueColumn] as string) || "0") || 0,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      if (timeSeriesData.length > 0) {
        newWidgets.push({
          id: `auto-line-${widgetId++}`,
          type: "chart",
          title: `Trend: ${numericColumns[0].displayName || numericColumns[0].name} Over Time`,
          x: 0,
          y: 16,
          width: 24,
          height: 4,
          config: {
            dataSource: "static",
            staticData: {
              chartType: "line",
              data: timeSeriesData,
              xAxis: "date",
              yAxis: "value",
            },
            tenantId,
            widgetId: `auto-line-${widgetId}`,
          },
        });
      }
    }

    // 5. สร้าง Summary Stats Widget
    if (numericColumns.length > 1) {
      const statsData = numericColumns.map((col) => {
        const values = data
          .map((row) => parseFloat((row?.[col.name] as string) || "0") || 0)
          .filter((val: number) => !isNaN(val) && val > 0);

        const sum = values.reduce((a: number, b: number) => a + b, 0);
        const avg = values.length > 0 ? sum / values.length : 0;
        const max = values.length > 0 ? Math.max(...values) : 0;
        const min = values.length > 0 ? Math.min(...values) : 0;

        return {
          column: col.displayName || col.name,
          sum: sum,
          avg: avg,
          max: max,
          min: min,
          count: values.length,
        };
      });

      newWidgets.push({
        id: `auto-stats-${widgetId++}`,
        type: "table",
        title: "Column Statistics",
        x: 12,
        y: 0,
        width: 12,
        height: 3,
        config: {
          dataSource: "static",
          staticData: {
            columns: [
              { key: "column", title: "Column", type: "string" },
              { key: "count", title: "Count", type: "number" },
              { key: "sum", title: "Sum", type: "number" },
              { key: "avg", title: "Average", type: "number" },
              { key: "min", title: "Min", type: "number" },
              { key: "max", title: "Max", type: "number" },
            ],
            data: statsData,
          },
          tenantId,
          widgetId: `auto-stats-${widgetId}`,
        },
      });
    }

    // เพิ่ม widgets ใหม่ลง dashboard
    const newDashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, ...newWidgets],
    };

    setDashboard(newDashboard);
    saveToHistory(newDashboard);

    // แสดงข้อความแจ้งเตือน
    alert(`Generated ${newWidgets.length} widgets from your uploaded data!`);
  }, [uploadedData, dashboard, saveToHistory, tenantId]);

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
    <UploadedDataProvider
      uploadedData={uploadedData}
      dashboards={dashboardDataSource ? [dashboardDataSource] : []}
      tenantId={tenantId}
    >
      <DndProvider backend={HTML5Backend}>
        <div
          className={`bg-gray-50 dark:bg-gray-900 flex flex-col ${isFullscreen ? "fixed inset-0 z-50 h-screen" : "h-screen"}`}
        >
          {/* Collaboration System 
        <CollaborationSystem
          dashboardId={dashboard.id}
          currentUserId="current-user"
          onUserChange={setCollaborationUsers}
        />
        */}

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

                {/* View Data Button */}
                {uploadedData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDataViewer(true)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    View Data
                  </Button>
                )}

                {/* Quick Widget Generator สำหรับข้อมูลที่ Upload */}
                {uploadedData &&
                  (() => {
                    const dataObj = uploadedData as Record<string, unknown>;
                    const summary =
                      (dataObj.summary as Record<string, unknown>) || {};
                    const totalRows = (summary.totalRows as number) || 0;
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateQuickWidgets()}
                        className="bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Quick Widgets from Data ({totalRows} rows)
                      </Button>
                    );
                  })()}
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
              <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <WidgetLibrarySidebar onAddWidget={addWidget} />

                {/* Data Source Info Panel */}
                {uploadedData && (
                  <DataSourceInfo
                    uploadedData={uploadedData}
                    onGenerateWidgets={generateQuickWidgets}
                  />
                )}
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
                  onSelectWidget={handleSelectWidget}
                  onMoveWidget={moveWidget}
                  onResizeWidget={resizeWidget}
                  onDeleteWidget={deleteWidget}
                  onDuplicateWidget={duplicateWidget}
                  onDropWidget={addWidget}
                  onUpdateWidget={updateWidget}
                  canvasScale={canvasScale}
                  canvasViewport={canvasViewport}
                  screenToCanvas={screenToCanvas}
                  uploadedData={uploadedData}
                  ref={gridRef}
                />
              </div>
            </div>

            {/* Properties Panel */}
            {!isPreviewMode && selectedWidget && (
              <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
                <div className="h-full overflow-y-auto">
                  <PropertiesTabPanel
                    selectedWidget={selectedWidget}
                    dashboard={dashboard}
                    tenantId={tenantId}
                    onUpdateWidget={(updates: Partial<Widget>) => {
                      updateWidget(selectedWidget, updates);
                    }}
                    onClose={() => handleSelectWidget(null)}
                  />
                </div>
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
                {uploadedData &&
                  (() => {
                    const dataObj = uploadedData as Record<string, unknown>;
                    const summary =
                      (dataObj.summary as Record<string, unknown>) || {};
                    const totalRows = (summary.totalRows as number) || 0;
                    return (
                      <span className="text-green-600 dark:text-green-400">
                        📊 Data Source: {totalRows} rows uploaded
                      </span>
                    );
                  })()}
                {selectedWidget && (
                  <span className="text-blue-600 dark:text-blue-400">
                    Selected:{" "}
                    {
                      dashboard.widgets.find((w) => w.id === selectedWidget)
                        ?.title
                    }
                    (
                    {dashboard.widgets.find((w) => w.id === selectedWidget)
                      ?.x || 0}
                    ,{" "}
                    {dashboard.widgets.find((w) => w.id === selectedWidget)
                      ?.y || 0}
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
                    📱 Preview: This is how it looks on {screenResolution.width}
                    ×{screenResolution.height} screen
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

          {/* Data Viewer Modal */}
          {showDataViewer && uploadedData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Dashboard Data View
                  </h2>
                  <button
                    onClick={() => setShowDataViewer(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <DataViewerModal uploadedData={uploadedData} />
                </div>
              </div>
            </div>
          )}

          {/* Export/Import Modal */}
          {showExportImport && (
            <DashboardExportImport
              dashboard={dashboard}
              onImport={handleImport}
              onClose={() => setShowExportImport(false)}
            />
          )}
        </div>
      </DndProvider>
    </UploadedDataProvider>
  );
}
