/**
 * Properties Tab Panel - Tabbed interface for Data and Widget Properties
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataPropertiesPanel } from "./data/DataPropertiesPanel";
import WidgetPropertiesPanel from "../widget/widget-properties-panel";
import { Widget, DashboardConfig } from "@/types/dashboard-editor";
import { Database, Settings, X } from "lucide-react";

interface PropertiesTabPanelProps {
  selectedWidget: string;
  dashboard: DashboardConfig;
  tenantId: string;
  onUpdateWidget: (updates: Partial<Widget>) => void;
  onClose: () => void;
}

export function PropertiesTabPanel({
  selectedWidget,
  dashboard,
  tenantId,
  onUpdateWidget,
  onClose,
}: PropertiesTabPanelProps) {
  const [activeTab, setActiveTab] = useState<"data" | "properties">("data");

  const widget = dashboard.widgets.find((w: Widget) => w.id === selectedWidget);

  if (!widget) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {widget.title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("data")}
          className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "data"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }`}
        >
          <Database className="w-4 h-4 mr-2" />
          Data
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "properties"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }`}
        >
          <Settings className="w-4 h-4 mr-2" />
          Properties
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "data" && (
          <div className="p-4">
            <DataPropertiesPanel
              tenantId={tenantId}
              widget={widget}
              onUpdateWidget={onUpdateWidget}
            />
          </div>
        )}

        {activeTab === "properties" && (
          <div className="p-4">
            <WidgetPropertiesPanel
              widget={widget}
              onUpdateWidget={onUpdateWidget}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
