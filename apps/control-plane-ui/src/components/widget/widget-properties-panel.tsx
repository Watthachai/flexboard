/**
 * Widget Properties Panel
 * Right sidebar panel for editing selected widget properties
 */

"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Widget } from "../dashboard/visual-dashboard-editor";
import { Settings, Palette, Database, Code, X } from "lucide-react";

interface WidgetPropertiesPanelProps {
  widget?: Widget;
  onUpdateWidget: (updates: Partial<Widget>) => void;
}

export default function WidgetPropertiesPanel({
  widget,
  onUpdateWidget,
}: WidgetPropertiesPanelProps) {
  if (!widget) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
          <Button variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="style">
              <Palette className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* General Properties */}
          <TabsContent value="general" className="space-y-4">
            <div>
              <Label htmlFor="widget-title">Title</Label>
              <Input
                id="widget-title"
                value={widget.title}
                onChange={(e) => onUpdateWidget({ title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="widget-width">Width</Label>
                <Input
                  id="widget-width"
                  type="number"
                  value={widget.width}
                  onChange={(e) =>
                    onUpdateWidget({ width: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="widget-height">Height</Label>
                <Input
                  id="widget-height"
                  type="number"
                  value={widget.height}
                  onChange={(e) =>
                    onUpdateWidget({ height: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="widget-x">X Position</Label>
                <Input
                  id="widget-x"
                  type="number"
                  value={widget.x}
                  onChange={(e) =>
                    onUpdateWidget({ x: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="widget-y">Y Position</Label>
                <Input
                  id="widget-y"
                  type="number"
                  value={widget.y}
                  onChange={(e) =>
                    onUpdateWidget({ y: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            {/* Widget-specific properties */}
            <WidgetSpecificProperties
              widget={widget}
              onUpdateWidget={onUpdateWidget}
            />
          </TabsContent>

          {/* Style Properties */}
          <TabsContent value="style" className="space-y-4">
            <div>
              <Label htmlFor="background-color">Background Color</Label>
              <Select
                value={widget.config.backgroundColor || "white"}
                onValueChange={(value) =>
                  onUpdateWidget({
                    config: { ...widget.config, backgroundColor: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <Select
                value={widget.config.textColor || "black"}
                onValueChange={(value) =>
                  onUpdateWidget({
                    config: { ...widget.config, textColor: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="border-radius">Border Radius</Label>
              <Select
                value={widget.config.borderRadius || "medium"}
                onValueChange={(value) =>
                  onUpdateWidget({
                    config: { ...widget.config, borderRadius: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Data Properties */}
          <TabsContent value="data" className="space-y-4">
            <div>
              <Label htmlFor="data-source">Data Source</Label>
              <Select
                value={widget.config.dataSource || "none"}
                onValueChange={(value) =>
                  onUpdateWidget({
                    config: { ...widget.config, dataSource: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                  <SelectItem value="database">Database Query</SelectItem>
                  <SelectItem value="static">Static Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {widget.config.dataSource === "api" && (
              <div>
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input
                  id="api-endpoint"
                  value={widget.config.apiEndpoint || ""}
                  onChange={(e) =>
                    onUpdateWidget({
                      config: { ...widget.config, apiEndpoint: e.target.value },
                    })
                  }
                  placeholder="https://api.example.com/data"
                />
              </div>
            )}

            {widget.config.dataSource === "database" && (
              <div>
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea
                  id="sql-query"
                  value={widget.config.sqlQuery || ""}
                  onChange={(e) =>
                    onUpdateWidget({
                      config: { ...widget.config, sqlQuery: e.target.value },
                    })
                  }
                  placeholder="SELECT * FROM table_name"
                  rows={4}
                />
              </div>
            )}

            <div>
              <Label htmlFor="refresh-interval">
                Refresh Interval (seconds)
              </Label>
              <Input
                id="refresh-interval"
                type="number"
                value={widget.config.refreshInterval || 30}
                onChange={(e) =>
                  onUpdateWidget({
                    config: {
                      ...widget.config,
                      refreshInterval: parseInt(e.target.value) || 30,
                    },
                  })
                }
              />
            </div>
          </TabsContent>

          {/* Code Properties */}
          <TabsContent value="code" className="space-y-4">
            <div>
              <Label htmlFor="custom-css">Custom CSS</Label>
              <Textarea
                id="custom-css"
                value={widget.config.customCss || ""}
                onChange={(e) =>
                  onUpdateWidget({
                    config: { ...widget.config, customCss: e.target.value },
                  })
                }
                placeholder=".widget { color: blue; }"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="custom-js">Custom JavaScript</Label>
              <Textarea
                id="custom-js"
                value={widget.config.customJs || ""}
                onChange={(e) =>
                  onUpdateWidget({
                    config: { ...widget.config, customJs: e.target.value },
                  })
                }
                placeholder="// Custom widget logic"
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Widget-specific property configurations
function WidgetSpecificProperties({
  widget,
  onUpdateWidget,
}: {
  widget: Widget;
  onUpdateWidget: (updates: Partial<Widget>) => void;
}) {
  switch (widget.type) {
    case "kpi":
      return (
        <>
          <div>
            <Label htmlFor="kpi-value">Value</Label>
            <Input
              id="kpi-value"
              value={widget.config.value || ""}
              onChange={(e) =>
                onUpdateWidget({
                  config: { ...widget.config, value: e.target.value },
                })
              }
              placeholder="42"
            />
          </div>
          <div>
            <Label htmlFor="kpi-unit">Unit</Label>
            <Input
              id="kpi-unit"
              value={widget.config.unit || ""}
              onChange={(e) =>
                onUpdateWidget({
                  config: { ...widget.config, unit: e.target.value },
                })
              }
              placeholder="%"
            />
          </div>
        </>
      );

    case "chart":
    case "line-chart":
    case "bar-chart":
    case "pie-chart":
      return (
        <>
          <div>
            <Label htmlFor="chart-type">Chart Type</Label>
            <Select
              value={widget.config.chartType || "line"}
              onValueChange={(value) =>
                onUpdateWidget({
                  config: { ...widget.config, chartType: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case "text":
      return (
        <div>
          <Label htmlFor="text-content">Text Content</Label>
          <Textarea
            id="text-content"
            value={widget.config.content || ""}
            onChange={(e) =>
              onUpdateWidget({
                config: { ...widget.config, content: e.target.value },
              })
            }
            placeholder="Enter your text content..."
            rows={3}
          />
        </div>
      );

    case "image":
      return (
        <div>
          <Label htmlFor="image-url">Image URL</Label>
          <Input
            id="image-url"
            value={widget.config.imageUrl || ""}
            onChange={(e) =>
              onUpdateWidget({
                config: { ...widget.config, imageUrl: e.target.value },
              })
            }
            placeholder="https://example.com/image.jpg"
          />
        </div>
      );

    default:
      return null;
  }
}
