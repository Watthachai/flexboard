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
import { Widget } from "@/types/dashboard-editor";
import { Settings, Palette, Database, Code, X } from "lucide-react";

interface WidgetPropertiesPanelProps {
  widget?: Widget;
  onUpdateWidget: (updates: Partial<Widget>) => void;
  onClose?: () => void;
}

export default function WidgetPropertiesPanel({
  widget,
  onUpdateWidget,
  onClose,
}: WidgetPropertiesPanelProps) {
  if (!widget) return null;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Properties
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
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
                value={(widget.config.backgroundColor as string) || "white"}
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
                value={(widget.config.textColor as string) || "black"}
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
                value={(widget.config.borderRadius as string) || "medium"}
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
              <Label htmlFor="data-source-type">Data Source Type</Label>
              <Select
                value={(widget.config.dataSourceType as string) || "sql"}
                onValueChange={(value) =>
                  onUpdateWidget({
                    config: {
                      ...widget.config,
                      dataSourceType: value as
                        | "sql"
                        | "postgresql"
                        | "mysql"
                        | "api"
                        | "firestore",
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sql">SQL Server</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="firestore">Firestore</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Raw Query Input - หัวใจของการปรับปรุง */}
            <div>
              <Label htmlFor="raw-query">
                Raw Query
                <span className="text-xs text-gray-500 ml-2">
                  (Copy & paste your query here)
                </span>
              </Label>
              <Textarea
                id="raw-query"
                value={(widget.config.query as string) || ""}
                onChange={(e) =>
                  onUpdateWidget({
                    config: { ...widget.config, query: e.target.value },
                  })
                }
                placeholder={
                  widget.config.dataSourceType === "sql" ||
                  widget.config.dataSourceType === "postgresql" ||
                  widget.config.dataSourceType === "mysql"
                    ? "SELECT column1, column2, SUM(column3) as total\nFROM table_name\nWHERE condition = 'value'\nGROUP BY column1, column2\nORDER BY total DESC"
                    : widget.config.dataSourceType === "firestore"
                      ? '// Firestore query structure\n{\n  "collection": "orders",\n  "where": [{"field": "status", "operator": "==", "value": "completed"}],\n  "orderBy": [{"field": "createdAt", "direction": "desc"}]\n}'
                      : "https://api.example.com/data"
                }
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* Query Parameters (Optional) */}
            <div>
              <Label htmlFor="query-params">
                Query Parameters (JSON)
                <span className="text-xs text-gray-500 ml-2">(Optional)</span>
              </Label>
              <Textarea
                id="query-params"
                value={(widget.config.params as string) || ""}
                onChange={(e) =>
                  onUpdateWidget({
                    config: { ...widget.config, params: e.target.value },
                  })
                }
                placeholder='{\n  "userId": "123",\n  "startDate": "2024-01-01",\n  "endDate": "2024-12-31"\n}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="refresh-interval">
                Refresh Interval (seconds)
              </Label>
              <Input
                id="refresh-interval"
                type="number"
                value={(widget.config.refreshInterval as number) || 30}
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

            {/* Query Test Button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // TODO: ใช้ API เพื่อทดสอบ Query
                  alert("Query testing functionality will be available soon!");
                }}
              >
                Test Query
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                This will send the query to the On-Premise Agent for testing
              </p>
            </div>
          </TabsContent>

          {/* Code Properties */}
          <TabsContent value="code" className="space-y-4">
            <div>
              <Label htmlFor="custom-css">Custom CSS</Label>
              <Textarea
                id="custom-css"
                value={(widget.config.customCss as string) || ""}
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
                value={(widget.config.customJs as string) || ""}
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
              value={(widget.config.value as string) || ""}
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
              value={(widget.config.unit as string) || ""}
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
              value={(widget.config.chartType as string) || "line"}
              onValueChange={(value) =>
                onUpdateWidget({
                  config: {
                    ...widget.config,
                    chartType: value as
                      | "line"
                      | "bar"
                      | "pie"
                      | "area"
                      | "doughnut",
                  },
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
            value={(widget.config.content as string) || ""}
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
            value={(widget.config.imageUrl as string) || ""}
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
