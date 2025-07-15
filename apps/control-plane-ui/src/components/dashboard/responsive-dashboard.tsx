/**
 * Mobile Responsive Dashboard
 * Adaptive layouts and touch-friendly interactions
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  Maximize2,
  Minimize2,
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Settings,
  Grid,
  List,
} from "lucide-react";

interface ResponsiveBreakpoint {
  name: string;
  width: number;
  icon: any;
  columns: number;
  maxWidgets: number;
}

const BREAKPOINTS: ResponsiveBreakpoint[] = [
  { name: "Mobile", width: 375, icon: Smartphone, columns: 1, maxWidgets: 3 },
  { name: "Tablet", width: 768, icon: Tablet, columns: 2, maxWidgets: 6 },
  { name: "Desktop", width: 1024, icon: Monitor, columns: 3, maxWidgets: 12 },
  { name: "Large", width: 1440, icon: Monitor, columns: 4, maxWidgets: 16 },
];

interface MobileWidget {
  id: string;
  title: string;
  type: string;
  priority: number; // Higher priority shows first on mobile
  mobileHeight: "small" | "medium" | "large";
  isCollapsible: boolean;
}

interface ResponsiveDashboardProps {
  widgets: MobileWidget[];
  onWidgetReorder: (widgets: MobileWidget[]) => void;
}

export default function ResponsiveDashboard({
  widgets,
  onWidgetReorder,
}: ResponsiveDashboardProps) {
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<ResponsiveBreakpoint>(BREAKPOINTS[2]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [collapsedWidgets, setCollapsedWidgets] = useState<Set<string>>(
    new Set()
  );

  // Detect screen size and update breakpoint
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const breakpoint =
        BREAKPOINTS.slice()
          .reverse()
          .find((bp) => width >= bp.width) || BREAKPOINTS[0];
      setCurrentBreakpoint(breakpoint);

      // Auto-close sidebar on mobile
      if (breakpoint.name === "Mobile") {
        setSidebarOpen(false);
      }
    };

    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape"
      );
    };

    updateBreakpoint();
    updateOrientation();

    window.addEventListener("resize", updateBreakpoint);
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateBreakpoint);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  // Sort widgets by priority for mobile
  const sortedWidgets = [...widgets].sort((a, b) => b.priority - a.priority);

  const toggleWidgetCollapse = (widgetId: string) => {
    setCollapsedWidgets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  const getWidgetHeight = (widget: MobileWidget) => {
    if (collapsedWidgets.has(widget.id)) return "h-12";

    switch (widget.mobileHeight) {
      case "small":
        return "h-32";
      case "medium":
        return "h-48";
      case "large":
        return "h-64";
      default:
        return "h-48";
    }
  };

  const getGridCols = () => {
    return `grid-cols-${currentBreakpoint.columns}`;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <Grid className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Sidebar */}
        <div
          className={`
          bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0
          ${sidebarOpen ? "w-64" : "w-0"} md:w-64
          ${currentBreakpoint.name === "Mobile" && sidebarOpen ? "absolute inset-y-0 z-50" : ""}
        `}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Controls</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Device Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Preview
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BREAKPOINTS.map((bp) => (
                  <Button
                    key={bp.name}
                    variant={
                      currentBreakpoint.name === bp.name ? "default" : "outline"
                    }
                    size="sm"
                    className="flex items-center justify-center p-2"
                    onClick={() => setCurrentBreakpoint(bp)}
                  >
                    <bp.icon className="w-4 h-4 mr-1" />
                    <span className="text-xs">{bp.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Breakpoint Info */}
            <Card className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <currentBreakpoint.icon className="w-4 h-4" />
                <span className="font-medium">{currentBreakpoint.name}</span>
                <Badge variant="outline">{currentBreakpoint.width}px+</Badge>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Columns: {currentBreakpoint.columns}</div>
                <div>Max widgets: {currentBreakpoint.maxWidgets}</div>
                <div>Orientation: {orientation}</div>
              </div>
            </Card>

            {/* View Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
              </div>
            </div>

            {/* Widget Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Priority (Mobile)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sortedWidgets.map((widget, index) => (
                  <div
                    key={widget.id}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                  >
                    <span className="text-xs font-medium w-4">{index + 1}</span>
                    <span className="text-xs flex-1 truncate">
                      {widget.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {widget.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Responsive Dashboard
                </h1>
                <p className="text-gray-600">
                  Currently viewing: {currentBreakpoint.name} (
                  {currentBreakpoint.width}px+)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                >
                  {viewMode === "grid" ? (
                    <List className="w-4 h-4 mr-1" />
                  ) : (
                    <Grid className="w-4 h-4 mr-1" />
                  )}
                  {viewMode === "grid" ? "List View" : "Grid View"}
                </Button>
              </div>
            </div>

            {/* Widgets */}
            {viewMode === "grid" ? (
              <div className={`grid gap-4 ${getGridCols()}`}>
                {sortedWidgets
                  .slice(0, currentBreakpoint.maxWidgets)
                  .map((widget) => (
                    <ResponsiveWidget
                      key={widget.id}
                      widget={widget}
                      isCollapsed={collapsedWidgets.has(widget.id)}
                      onToggleCollapse={() => toggleWidgetCollapse(widget.id)}
                      breakpoint={currentBreakpoint}
                      className={getWidgetHeight(widget)}
                    />
                  ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedWidgets
                  .slice(0, currentBreakpoint.maxWidgets)
                  .map((widget) => (
                    <ResponsiveWidget
                      key={widget.id}
                      widget={widget}
                      isCollapsed={collapsedWidgets.has(widget.id)}
                      onToggleCollapse={() => toggleWidgetCollapse(widget.id)}
                      breakpoint={currentBreakpoint}
                      className="h-auto"
                      listView
                    />
                  ))}
              </div>
            )}

            {/* Overflow indicator */}
            {widgets.length > currentBreakpoint.maxWidgets && (
              <Card className="p-4 mt-4 text-center">
                <p className="text-gray-600">
                  {widgets.length - currentBreakpoint.maxWidgets} more widgets
                  available in larger view
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const nextBp = BREAKPOINTS.find(
                      (bp) => bp.maxWidgets > currentBreakpoint.maxWidgets
                    );
                    if (nextBp) setCurrentBreakpoint(nextBp);
                  }}
                >
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Switch to Larger View
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && currentBreakpoint.name === "Mobile" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function ResponsiveWidget({
  widget,
  isCollapsed,
  onToggleCollapse,
  breakpoint,
  className,
  listView = false,
}: {
  widget: MobileWidget;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  breakpoint: ResponsiveBreakpoint;
  className: string;
  listView?: boolean;
}) {
  return (
    <Card
      className={`${className} overflow-hidden transition-all duration-300`}
    >
      {/* Widget Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-sm truncate">{widget.title}</h3>
          <Badge variant="outline" className="text-xs">
            {widget.type}
          </Badge>
        </div>
        <div className="flex items-center space-x-1">
          {widget.isCollapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-1 h-6 w-6"
            >
              {isCollapsed ? (
                <Maximize2 className="w-3 h-3" />
              ) : (
                <Minimize2 className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <div className="p-3 flex-1">
          {listView ? (
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(Math.random() * 1000)}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">vs last period</div>
                <div className="text-sm font-medium text-green-600">+12.5%</div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {Math.floor(Math.random() * 1000)}
                </div>
                <div className="text-xs text-gray-500">Sample Data</div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Sample data for demonstration
export const SAMPLE_MOBILE_WIDGETS: MobileWidget[] = [
  {
    id: "revenue",
    title: "Revenue",
    type: "KPI",
    priority: 10,
    mobileHeight: "small",
    isCollapsible: true,
  },
  {
    id: "orders",
    title: "Orders",
    type: "KPI",
    priority: 9,
    mobileHeight: "small",
    isCollapsible: true,
  },
  {
    id: "conversion",
    title: "Conversion Rate",
    type: "KPI",
    priority: 8,
    mobileHeight: "small",
    isCollapsible: true,
  },
  {
    id: "sales-chart",
    title: "Sales Trend",
    type: "Chart",
    priority: 7,
    mobileHeight: "large",
    isCollapsible: true,
  },
  {
    id: "customers",
    title: "Active Customers",
    type: "KPI",
    priority: 6,
    mobileHeight: "small",
    isCollapsible: true,
  },
  {
    id: "performance",
    title: "Performance",
    type: "Chart",
    priority: 5,
    mobileHeight: "medium",
    isCollapsible: true,
  },
];
