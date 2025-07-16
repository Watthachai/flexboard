"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardPreviewProps {
  metadata: any;
  dashboardName: string;
}

interface Widget {
  id: string;
  type: string;
  title: string;
  config: any;
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface Tab {
  id: string;
  name: string;
  widgets: string[];
}

export default function DashboardPreview({
  metadata,
  dashboardName,
}: DashboardPreviewProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    if (metadata) {
      // Extract widgets and tabs from metadata
      const dashboardData = metadata.dashboards?.[0] || {};
      const widgetData = metadata.widgets || [];

      setWidgets(widgetData);
      setTabs(dashboardData.tabs || []);

      // Set first tab as active by default
      if (dashboardData.tabs && dashboardData.tabs.length > 0) {
        setActiveTab(dashboardData.tabs[0].id);
      }
    }
  }, [metadata]);

  const getActiveTabWidgets = () => {
    const activeTabData = tabs.find((tab) => tab.id === activeTab);
    if (!activeTabData) return [];

    return activeTabData.widgets
      .map((widgetId) => widgets.find((w) => w.id === widgetId))
      .filter(Boolean) as Widget[];
  };

  const renderWidget = (widget: Widget) => {
    const getWidgetIcon = (type: string) => {
      switch (type) {
        case "chart":
          return "📊";
        case "kpi":
          return "📈";
        case "table":
          return "📋";
        case "text":
          return "📄";
        case "gauge":
          return "⏱️";
        default:
          return "📦";
      }
    };

    const getWidgetColor = (type: string) => {
      switch (type) {
        case "chart":
          return "bg-blue-50 border-blue-200 text-blue-800";
        case "kpi":
          return "bg-green-50 border-green-200 text-green-800";
        case "table":
          return "bg-purple-50 border-purple-200 text-purple-800";
        case "text":
          return "bg-gray-50 border-gray-200 text-gray-800";
        case "gauge":
          return "bg-orange-50 border-orange-200 text-orange-800";
        default:
          return "bg-gray-50 border-gray-200 text-gray-800";
      }
    };

    return (
      <Card
        key={widget.id}
        className={`p-4 h-48 flex flex-col justify-between ${getWidgetColor(widget.type)}`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getWidgetIcon(widget.type)}</span>
              <h3 className="font-medium text-sm">
                {widget.title || "Untitled Widget"}
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {widget.type}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground mb-3">
            ID: {widget.id}
          </div>
        </div>

        {/* Widget preview content */}
        <div className="flex-1 flex items-center justify-center border border-dashed border-current/20 rounded">
          <div className="text-center text-xs text-muted-foreground">
            <div className="mb-1">{getWidgetIcon(widget.type)}</div>
            <div>{widget.type.toUpperCase()} Preview</div>
            {widget.config?.chartType && (
              <div className="mt-1 text-xs">({widget.config.chartType})</div>
            )}
          </div>
        </div>

        {/* Widget config info */}
        {widget.config && (
          <div className="mt-2 text-xs text-muted-foreground">
            {widget.config.dataSource && (
              <div>Source: {widget.config.dataSource}</div>
            )}
            {widget.config.refreshInterval && (
              <div>Refresh: {widget.config.refreshInterval}ms</div>
            )}
          </div>
        )}
      </Card>
    );
  };

  if (!metadata || !metadata.dashboards || metadata.dashboards.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground mb-4">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-lg font-medium">No Dashboard Data</h3>
          <p className="text-sm">
            No dashboard configuration found in metadata.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">{dashboardName}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div>
                <strong>Theme:</strong> {metadata.config?.theme || "light"}
              </div>
              <div>
                <strong>Refresh:</strong>{" "}
                {metadata.config?.refreshInterval
                  ? `${metadata.config.refreshInterval}ms`
                  : "Manual"}
              </div>
              <div>
                <strong>Widgets:</strong> {widgets.length}
              </div>
              <div>
                <strong>Tabs:</strong> {tabs.length}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Preview Mode
          </Badge>
        </div>
      </Card>

      {/* Tabs */}
      {tabs.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="text-sm"
              >
                {tab.name}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab && (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  {tabs.find((t) => t.id === activeTab)?.name} - Widgets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getActiveTabWidgets().map(renderWidget)}
                </div>

                {getActiveTabWidgets().length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-4xl mb-2">📝</div>
                    <h4 className="text-lg font-medium mb-1">No Widgets</h4>
                    <p className="text-sm">
                      This tab doesn't have any widgets yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* No Tabs - Show all widgets */}
      {tabs.length === 0 && widgets.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">All Widgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map(renderWidget)}
          </div>
        </Card>
      )}

      {/* No Widgets */}
      {widgets.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="text-lg font-medium mb-1">No Widgets</h3>
            <p className="text-sm">
              Start building your dashboard by adding widgets in the builder.
            </p>
          </div>
        </Card>
      )}

      {/* Metadata Debug Info (Development only) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="p-4">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              Debug: Raw Metadata
            </summary>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}
