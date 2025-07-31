/**
 * Draggable Widget Component
 * Individual widget that can be moved and resized on the canvas
 */

"use client";

import React, { useState, useRef } from "react";
import { useDrag } from "react-dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Move,
  Settings,
  Copy,
  Trash2,
  GripHorizontal,
  BarChart3,
  PieChart,
  Activity,
  Table,
  Hash,
  Type,
  Image,
  Calendar,
  TrendingUp,
  Target,
  Users,
  Layers,
  LineChart,
  BarChart,
} from "lucide-react";
import { Widget, WidgetType, ItemTypes } from "@/types/dashboard-editor";
import { EnhancedWidgetPreview } from "./enhanced-widget-preview";

// Widget icons mapping
const WIDGET_ICONS: Record<
  WidgetType,
  React.ComponentType<{ className?: string }>
> = {
  kpi: Hash,
  chart: Activity,
  "bar-chart": BarChart3,
  "pie-chart": PieChart,
  "line-chart": Activity,
  table: Table,
  text: Type,
  image: Image,
  date: Calendar,
  gauge: Activity,
  progress: Activity,
  iframe: Type,
  map: Hash,
  calendar: Calendar,
  // Analytics widget icons
  "period-comparison": TrendingUp,
  "target-comparison": Target,
  "peer-comparison": Users,
  "composition-analysis": Layers,
  "trend-analysis": LineChart,
  "interactive-chart": BarChart,
};

interface DraggableWidgetProps {
  widget: Widget;
  isSelected: boolean;
  isPreviewMode: boolean;
  gridSize: number;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onConfigChange?: (config: any) => void;
  uploadedData?: any;
}

export default function DraggableWidget({
  widget,
  isSelected,
  isPreviewMode,
  gridSize,
  onSelect,
  onMove,
  onResize,
  onDelete,
  onDuplicate,
  onConfigChange,
  uploadedData,
}: DraggableWidgetProps) {
  const [isResizing, setIsResizing] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.WIDGET,
    item: { id: widget.id, x: widget.x, y: widget.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isPreviewMode && !isResizing,
    end: (item, monitor) => {
      // เมื่อการลากจบ ให้อัพเดทตำแหน่งจริง
      const dropResult = monitor.getDropResult();
      if (dropResult && monitor.didDrop()) {
        const clientOffset = monitor.getClientOffset();
        if (clientOffset) {
          // ใช้ตำแหน่งปัจจุบันของ widget เป็น grid units แล้ว
          // ไม่ต้องแปลงอีก
          console.log("Widget dropped at:", clientOffset);
        }
      }
    },
  });

  // Handle widget movement
  const handleMove = (deltaX: number, deltaY: number) => {
    // แปลงเป็น grid units
    const gridDeltaX = Math.floor(deltaX / gridSize);
    const gridDeltaY = Math.floor(deltaY / gridSize);
    const newX = widget.x + gridDeltaX;
    const newY = widget.y + gridDeltaY;
    onMove(widget.id, newX * gridSize, newY * gridSize);
  };

  // Handle widget resizing
  const handleResize = (deltaWidth: number, deltaHeight: number) => {
    // แปลงเป็น grid units
    const gridDeltaW = Math.ceil(deltaWidth / gridSize);
    const gridDeltaH = Math.ceil(deltaHeight / gridSize);
    const newWidth = widget.width + gridDeltaW;
    const newHeight = widget.height + gridDeltaH;
    onResize(widget.id, newWidth * gridSize, newHeight * gridSize);
  };

  const Icon = WIDGET_ICONS[widget.type] || Hash;

  const widgetStyle = {
    left: widget.x * gridSize,
    top: widget.y * gridSize,
    width: widget.width * gridSize,
    height: widget.height * gridSize,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={(element) => {
        widgetRef.current = element;
        if (!isPreviewMode) drag(element);
      }}
      className={`
        absolute cursor-move select-none
        ${isSelected ? "ring-2 ring-blue-400" : ""}
        ${isDragging ? "z-50" : "z-10"}
      `}
      style={widgetStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Card className="h-full p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
        {/* Widget Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {widget.title}
            </span>
          </div>

          {/* Widget Controls */}
          {isSelected && !isPreviewMode && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Open widget settings
                }}
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(widget.id);
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(widget.id);
                }}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          )}
        </div>

        {/* Widget Content */}
        <div className="flex-1 flex items-center justify-center">
          <EnhancedWidgetPreview
            widget={widget}
            uploadedData={uploadedData}
            onConfigChange={onConfigChange}
          />
        </div>

        {/* Resize Handle */}
        {isSelected && !isPreviewMode && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-tl"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);

              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = widget.width * gridSize;
              const startHeight = widget.height * gridSize;

              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                onResize(
                  widget.id,
                  Math.max(gridSize, startWidth + deltaX),
                  Math.max(gridSize, startHeight + deltaY)
                );
              };

              const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          >
            <GripHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500 rotate-45" />
          </div>
        )}
      </Card>
    </div>
  );
}

// Widget Preview Component
function WidgetPreview({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case "kpi":
      return (
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            42
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sample KPI
          </div>
        </div>
      );

    case "chart":
    case "line-chart":
      return (
        <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
          <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      );

    case "bar-chart":
      return (
        <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      );

    case "pie-chart":
      return (
        <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center">
          <PieChart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      );

    case "table":
      return (
        <div className="w-full">
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="bg-gray-100 dark:bg-gray-600 p-1 text-gray-900 dark:text-white">
              Col 1
            </div>
            <div className="bg-gray-100 dark:bg-gray-600 p-1 text-gray-900 dark:text-white">
              Col 2
            </div>
            <div className="bg-gray-100 dark:bg-gray-600 p-1 text-gray-900 dark:text-white">
              Col 3
            </div>
            <div className="p-1 text-gray-700 dark:text-gray-300">Data</div>
            <div className="p-1 text-gray-700 dark:text-gray-300">Data</div>
            <div className="p-1 text-gray-700 dark:text-gray-300">Data</div>
          </div>
        </div>
      );

    case "text":
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Sample text content...
        </div>
      );

    case "image":
      return (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
          <Image className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      );

    case "date":
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString()}
        </div>
      );

    // Analytics Widget Previews
    case "period-comparison":
      return (
        <div className="w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-blue-500" />
          <div className="ml-2 text-xs text-blue-600 dark:text-blue-400">
            Period Compare
          </div>
        </div>
      );

    case "target-comparison":
      return (
        <div className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
          <Target className="w-8 h-8 text-green-500" />
          <div className="ml-2 text-xs text-green-600 dark:text-green-400">
            Target Compare
          </div>
        </div>
      );

    case "peer-comparison":
      return (
        <div className="w-full h-full bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center">
          <Users className="w-8 h-8 text-purple-500" />
          <div className="ml-2 text-xs text-purple-600 dark:text-purple-400">
            Peer Compare
          </div>
        </div>
      );

    case "composition-analysis":
      return (
        <div className="w-full h-full bg-orange-50 dark:bg-orange-900/20 rounded flex items-center justify-center">
          <Layers className="w-8 h-8 text-orange-500" />
          <div className="ml-2 text-xs text-orange-600 dark:text-orange-400">
            Composition
          </div>
        </div>
      );

    case "trend-analysis":
      return (
        <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/20 rounded flex items-center justify-center">
          <LineChart className="w-8 h-8 text-indigo-500" />
          <div className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
            Trend Analysis
          </div>
        </div>
      );

    case "interactive-chart":
      return (
        <div className="w-full h-full bg-teal-50 dark:bg-teal-900/20 rounded flex items-center justify-center">
          <BarChart className="w-8 h-8 text-teal-500" />
          <div className="ml-2 text-xs text-teal-600 dark:text-teal-400">
            Interactive Chart
          </div>
        </div>
      );

    default:
      return (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Widget Preview
        </div>
      );
  }
}

// Named export for better compatibility
export { DraggableWidget };
