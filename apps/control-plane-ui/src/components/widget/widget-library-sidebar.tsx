/**
 * Widget Library Sidebar
 * Displays draggable widgets that can be added to dashboard
 */

"use client";

import React from "react";
import { useDrag } from "react-dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  WIDGET_LIBRARY,
  ItemTypes,
  WidgetType,
} from "./visual-dashboard-editor";

interface DraggableWidgetProps {
  type: WidgetType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  onAddWidget: (type: WidgetType, x: number, y: number) => void;
}

function DraggableWidget({
  type,
  name,
  icon: Icon,
  onAddWidget,
}: DraggableWidgetProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.NEW_WIDGET,
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={(node) => {
        drag(node);
        dragPreview(node);
      }}
      className={`
        cursor-move p-3 bg-white border border-gray-200 rounded-lg
        hover:border-blue-300 hover:bg-blue-50 transition-all
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{name}</span>
      </div>
    </div>
  );
}

interface WidgetLibrarySidebarProps {
  onAddWidget: (type: WidgetType, x: number, y: number) => void;
}

export default function WidgetLibrarySidebar({
  onAddWidget,
}: WidgetLibrarySidebarProps) {
  // Group widgets by category
  const widgetsByCategory = WIDGET_LIBRARY.reduce(
    (acc, widget) => {
      if (!acc[widget.category]) {
        acc[widget.category] = [];
      }
      acc[widget.category].push(widget);
      return acc;
    },
    {} as Record<string, typeof WIDGET_LIBRARY>
  );

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Widget Library
        </h2>

        {Object.entries(widgetsByCategory).map(([category, widgets]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              {category}
            </h3>
            <div className="space-y-2">
              {widgets.map((widget) => (
                <DraggableWidget
                  key={widget.type}
                  type={widget.type}
                  name={widget.name}
                  icon={widget.icon}
                  category={widget.category}
                  onAddWidget={onAddWidget}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
