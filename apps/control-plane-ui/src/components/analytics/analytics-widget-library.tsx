"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Target,
  Users,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

interface AnalyticsWidgetLibraryProps {
  onAddWidget: (type: string, screenX: number, screenY: number) => void;
  uploadedData?: any;
}

// Analytics widget definitions with comparison capabilities
export const ANALYTICS_WIDGETS = [
  {
    id: "period-comparison",
    name: "Period Comparison",
    icon: Calendar,
    description: "Compare metrics across time periods",
    type: "analytics-period",
    category: "comparison",
    defaultSize: { width: 8, height: 6 },
    color: "bg-blue-500",
  },
  {
    id: "target-comparison",
    name: "Target vs Actual",
    icon: Target,
    description: "Compare actual values against targets",
    type: "analytics-target",
    category: "comparison",
    defaultSize: { width: 6, height: 5 },
    color: "bg-green-500",
  },
  {
    id: "peer-comparison",
    name: "Peer Ranking",
    icon: Users,
    description: "Rank and compare across groups",
    type: "analytics-peer",
    category: "comparison",
    defaultSize: { width: 8, height: 6 },
    color: "bg-purple-500",
  },
  {
    id: "composition-analysis",
    name: "Composition Analysis",
    icon: Activity,
    description: "Analyze data composition and percentages",
    type: "analytics-composition",
    category: "composition",
    defaultSize: { width: 6, height: 5 },
    color: "bg-orange-500",
  },
  {
    id: "trend-analysis",
    name: "Trend Analysis",
    icon: TrendingUp,
    description: "Advanced trend analysis with forecasting",
    type: "analytics-trend",
    category: "analysis",
    defaultSize: { width: 10, height: 6 },
    color: "bg-indigo-500",
  },
  {
    id: "interactive-chart",
    name: "Interactive Chart",
    icon: BarChart3,
    description: "Interactive chart with drill-down capabilities",
    type: "analytics-interactive",
    category: "interactive",
    defaultSize: { width: 8, height: 6 },
    color: "bg-cyan-500",
  },
];

export default function AnalyticsWidgetLibrary({
  onAddWidget,
  uploadedData,
}: AnalyticsWidgetLibraryProps) {
  // Check if we have data to enable analytics widgets
  const hasData = uploadedData && (uploadedData.data || uploadedData.rows);
  const dataInfo = hasData
    ? {
        rows: uploadedData.data?.length || uploadedData.rows?.length || 0,
        columns: uploadedData.columns?.length || 0,
      }
    : null;

  const handleDragStart = (e: React.DragEvent, widgetType: string) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: widgetType,
        category: "analytics",
      })
    );
  };

  const handleClick = (widgetType: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    onAddWidget(widgetType, centerX, centerY);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
          Advanced Analytics
        </h3>

        {hasData && dataInfo ? (
          <div className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Data Ready: {dataInfo.rows} rows, {dataInfo.columns} columns
          </div>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Upload data to enable analytics widgets
          </div>
        )}
      </div>

      <div className="space-y-2">
        {ANALYTICS_WIDGETS.map((widget) => {
          const IconComponent = widget.icon;
          const isEnabled = hasData;

          return (
            <Card
              key={widget.id}
              className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md border ${
                isEnabled
                  ? "hover:border-blue-300 dark:hover:border-blue-600"
                  : "opacity-50 cursor-not-allowed"
              }`}
              draggable={isEnabled}
              onDragStart={(e) => isEnabled && handleDragStart(e, widget.type)}
              onClick={(e) => isEnabled && handleClick(widget.type, e)}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded ${widget.color} flex items-center justify-center flex-shrink-0`}
                >
                  <IconComponent className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {widget.name}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {widget.category}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {widget.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {widget.defaultSize.width}×{widget.defaultSize.height}
                    </span>
                    {isEnabled && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        Drag to add
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Analytics Features Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
          Analytics Features
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• PowerBI-style comparisons</li>
          <li>• Interactive drill-down</li>
          <li>• Real-time filtering</li>
          <li>• Automatic insights</li>
          <li>• Export capabilities</li>
        </ul>
      </div>
    </div>
  );
}
