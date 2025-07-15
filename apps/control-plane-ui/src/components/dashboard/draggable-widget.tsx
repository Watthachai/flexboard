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
} from "lucide-react";
import { Widget, WidgetType, ItemTypes } from "./visual-dashboard-editor";

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
}: DraggableWidgetProps) {
  const [isResizing, setIsResizing] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.WIDGET,
    item: { id: widget.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isPreviewMode && !isResizing,
  });

  // Handle widget movement
  const handleMove = (deltaX: number, deltaY: number) => {
    const newX = widget.x * gridSize + deltaX;
    const newY = widget.y * gridSize + deltaY;
    onMove(widget.id, newX, newY);
  };

  // Handle widget resizing
  const handleResize = (deltaWidth: number, deltaHeight: number) => {
    const newWidth = widget.width * gridSize + deltaWidth;
    const newHeight = widget.height * gridSize + deltaHeight;
    onResize(widget.id, newWidth, newHeight);
  };

  const Icon = WIDGET_ICONS[widget.type];

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
      <Card className="h-full p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Widget Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
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
          <WidgetPreview widget={widget} />
        </div>

        {/* Resize Handle */}
        {isSelected && !isPreviewMode && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
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
            <GripHorizontal className="w-4 h-4 text-gray-400 rotate-45" />
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
          <div className="text-2xl font-bold text-blue-600">42</div>
          <div className="text-xs text-gray-500">Sample KPI</div>
        </div>
      );

    case "chart":
    case "line-chart":
      return (
        <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center">
          <Activity className="w-8 h-8 text-gray-400" />
        </div>
      );

    case "bar-chart":
      return (
        <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
      );

    case "pie-chart":
      return (
        <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center">
          <PieChart className="w-8 h-8 text-gray-400" />
        </div>
      );

    case "table":
      return (
        <div className="w-full">
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="bg-gray-100 p-1">Col 1</div>
            <div className="bg-gray-100 p-1">Col 2</div>
            <div className="bg-gray-100 p-1">Col 3</div>
            <div className="p-1">Data</div>
            <div className="p-1">Data</div>
            <div className="p-1">Data</div>
          </div>
        </div>
      );

    case "text":
      return (
        <div className="text-sm text-gray-600">Sample text content...</div>
      );

    case "image":
      return (
        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
          <Image className="w-8 h-8 text-gray-400" />
        </div>
      );

    case "date":
      return (
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString()}
        </div>
      );

    default:
      return <div className="text-xs text-gray-400">Widget Preview</div>;
  }
}
