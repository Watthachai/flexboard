/**
 * Dashboard Canvas
 * Main canvas area where widgets can be dropped, moved and resized
 */

"use client";

import React, { forwardRef } from "react";
import { useDrop } from "react-dnd";
import {
  DashboardConfig,
  Widget,
  WidgetType,
  ItemTypes,
} from "./visual-dashboard-editor";
import DraggableWidget from "./draggable-widget";

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
      accept: ItemTypes.NEW_WIDGET,
      drop: (item: { type: WidgetType }, monitor) => {
        const clientOffset = monitor.getClientOffset();
        if (clientOffset && ref && "current" in ref && ref.current) {
          const canvasRect = ref.current.getBoundingClientRect();
          const x = clientOffset.x - canvasRect.left;
          const y = clientOffset.y - canvasRect.top;
          onDropWidget(item.type, x, y);
        }
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
    const canvasWidth = columns * gridSize;
    const canvasHeight = rows * gridSize;

    return (
      <div className="p-4 h-full">
        <div
          ref={setRef}
          className={`
            relative bg-white border-2 border-dashed rounded-lg
            ${isOver ? "border-blue-400 bg-blue-50" : "border-gray-300"}
            ${isPreviewMode ? "border-solid border-gray-200" : ""}
          `}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            minWidth: "100%",
            minHeight: "600px",
          }}
          onClick={() => !isPreviewMode && onSelectWidget(null)}
        >
          {/* Grid Background */}
          {!isPreviewMode && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
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
