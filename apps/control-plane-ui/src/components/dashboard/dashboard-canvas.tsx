/**
 * Dashboard Canvas
 * Main canvas area where widgets can be dropped, moved and resized
 */

"use client";

import React, { forwardRef, useRef, useEffect, useState } from "react";
import { useDrop } from "react-dnd";
import {
  DashboardConfig,
  Widget,
  WidgetType,
  ItemTypes,
} from "@/types/dashboard-editor";
import DraggableWidget from "../widget/draggable-widget";

interface DashboardCanvasProps {
  dashboard: DashboardConfig;
  selectedWidget: string | null;
  isPreviewMode: boolean;
  onSelectWidget: (widgetId: string | null) => void;
  onMoveWidget: (id: string, x: number, y: number) => void;
  onResizeWidget: (id: string, width: number, height: number) => void;
  onDeleteWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
  onDropWidget: (type: WidgetType, x: number, y: number) => void;
}

const DashboardCanvas = forwardRef<HTMLDivElement, DashboardCanvasProps>(
  (
    {
      dashboard,
      selectedWidget,
      isPreviewMode,
      onSelectWidget,
      onMoveWidget,
      onResizeWidget,
      onDeleteWidget,
      onDuplicateWidget,
      onDropWidget,
    },
    ref
  ) => {
    const [{ isOver }, drop] = useDrop({
      accept: [ItemTypes.NEW_WIDGET, ItemTypes.WIDGET],
      drop: (item: { type?: WidgetType; id?: string }, monitor) => {
        const clientOffset = monitor.getClientOffset();
        if (clientOffset && ref && "current" in ref && ref.current) {
          const canvasRect = ref.current.getBoundingClientRect();
          const x = clientOffset.x - canvasRect.left;
          const y = clientOffset.y - canvasRect.top;

          if (item.type) {
            // ลาก widget ใหม่จาก library
            onDropWidget(item.type, x, y);
          } else if (item.id) {
            // เลื่อน widget ที่มีอยู่แล้ว
            onMoveWidget(item.id, x, y);
          }
        }
        return { moved: true };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    // Combine refs
    const setRef = (element: HTMLDivElement | null) => {
      drop(element);
      if (ref) {
        if (typeof ref === "function") {
          ref(element);
        } else {
          ref.current = element;
        }
      }
    };

    const { columns, rows, gridSize } = dashboard.layout;

    // คำนวณขนาด canvas ให้เต็มพื้นที่ที่มี
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({
      width: columns * gridSize,
      height: rows * gridSize,
    });

    // Update canvas size based on container
    useEffect(() => {
      const updateSize = () => {
        if (containerRef.current) {
          const container = containerRef.current;
          const availableWidth = container.clientWidth - 32; // padding
          const availableHeight = container.clientHeight - 32;

          // คำนวณขนาดที่เหมาะสม
          const calculatedWidth = Math.max(availableWidth, columns * gridSize);
          const calculatedHeight = Math.max(availableHeight, rows * gridSize);

          setCanvasSize({ width: calculatedWidth, height: calculatedHeight });
        }
      };

      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, [columns, rows, gridSize]);

    return (
      <div ref={containerRef} className="p-4 h-full w-full overflow-auto">
        <div
          ref={setRef}
          className={`
            relative bg-white dark:bg-gray-800 border-2 border-dashed rounded-lg mx-auto
            ${isOver ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"}
            ${isPreviewMode ? "border-solid border-gray-200 dark:border-gray-700" : ""}
          `}
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
          }}
          onClick={() => !isPreviewMode && onSelectWidget(null)}
        >
          {/* Grid Background */}
          {!isPreviewMode && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }}
            />
          )}

          {/* Drop Zone Message */}
          {dashboard.widgets.length === 0 && !isPreviewMode && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-lg font-medium mb-2">
                  Drag widgets here to start building
                </div>
                <div className="text-sm">
                  Choose from the widget library on the left
                </div>
              </div>
            </div>
          )}

          {/* Widgets */}
          {dashboard.widgets.map((widget) => (
            <DraggableWidget
              key={widget.id}
              widget={widget}
              isSelected={selectedWidget === widget.id}
              isPreviewMode={isPreviewMode}
              gridSize={gridSize}
              onSelect={() => onSelectWidget(widget.id)}
              onMove={onMoveWidget}
              onResize={onResizeWidget}
              onDelete={onDeleteWidget}
              onDuplicate={onDuplicateWidget}
            />
          ))}
        </div>
      </div>
    );
  }
);

DashboardCanvas.displayName = "DashboardCanvas";

export default DashboardCanvas;
