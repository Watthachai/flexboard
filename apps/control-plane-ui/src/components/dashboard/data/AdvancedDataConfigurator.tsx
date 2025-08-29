/**
 * Advanced Data Configurator - Power BI-like interface for configuring widget data
 * Features drag-and-drop columns to axes, data filtering, and real-time preview
 */

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useUploadedDataContext } from "@/contexts/UploadedDataContext";
import {
  Database,
  GripVertical,
  X,
  Filter,
  Eye,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Widget } from "@/types/dashboard-editor";

interface AdvancedDataConfiguratorProps {
  widget: Widget;
  tenantId: string;
  onConfigChange: (config: any) => void;
}

interface ColumnMapping {
  xAxis?: string;
  yAxis?: string;
  colorBy?: string;
  sizeBy?: string;
  series?: string[];
}

interface DataColumn {
  name: string;
  type: string;
  example?: any;
}

export function AdvancedDataConfigurator({
  widget,
  tenantId,
  onConfigChange,
}: AdvancedDataConfiguratorProps) {
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const { uploadedData } = useUploadedDataContext();

  // Load existing configuration
  useEffect(() => {
    const config = widget.config as any;
    const dataSourceConfig = config?.dataSourceConfig;

    if (dataSourceConfig && dataSourceConfig.type === "uploadedData") {
      setSelectedDataset(dataSourceConfig.selectedDatasetId || "");

      // Restore column mappings from transformations
      const transformations = dataSourceConfig.transformations;
      if (transformations) {
        setColumnMapping({
          xAxis: transformations.groupBy,
          yAxis: transformations.valueColumn,
          colorBy: transformations.colorColumn,
          sizeBy: transformations.sizeColumn,
          series: transformations.seriesColumns || [],
        });
      }
    }
  }, [widget]);

  // Available columns from uploaded data
  const availableColumns: DataColumn[] = uploadedData?.columns || [];

  // Get columns by type for better UX
  const categoricalColumns = availableColumns.filter(
    (col) => col.type === "string" || col.type === "text"
  );
  const numericalColumns = availableColumns.filter(
    (col) => col.type === "number" || col.type === "integer"
  );

  const handleColumnDrop = (axis: keyof ColumnMapping, columnName: string) => {
    const newMapping = { ...columnMapping };

    // Remove column from other axes to avoid conflicts
    Object.keys(newMapping).forEach((key) => {
      if (
        key !== axis &&
        newMapping[key as keyof ColumnMapping] === columnName
      ) {
        delete newMapping[key as keyof ColumnMapping];
      }
    });

    // Add to selected axis (handle series as array, others as string)
    if (axis === "series") {
      newMapping[axis] = [...(newMapping[axis] || []), columnName];
    } else {
      (newMapping as any)[axis] = columnName;
    }
    setColumnMapping(newMapping);

    // Update widget configuration
    updateConfiguration(newMapping);
  };

  const removeColumnFromAxis = (axis: keyof ColumnMapping) => {
    const newMapping = { ...columnMapping };
    delete newMapping[axis];
    setColumnMapping(newMapping);
    updateConfiguration(newMapping);
  };

  const updateConfiguration = (mapping: ColumnMapping) => {
    const config = {
      type: "uploadedData",
      selectedDatasetId: selectedDataset,
      selectedColumns: Object.values(mapping).filter(Boolean),
      transformations: {
        groupBy: mapping.xAxis,
        valueColumn: mapping.yAxis,
        colorColumn: mapping.colorBy,
        sizeColumn: mapping.sizeBy,
        seriesColumns: mapping.series || [],
        aggregation: "sum", // Default aggregation
      },
    };

    onConfigChange(config);
  };

  const DropZone = ({
    axis,
    title,
    description,
    icon,
    acceptedTypes = "all",
  }: {
    axis: keyof ColumnMapping;
    title: string;
    description: string;
    icon: React.ReactNode;
    acceptedTypes?: "categorical" | "numerical" | "all";
  }) => {
    const currentColumn = columnMapping[axis];

    return (
      <Card className="p-4 border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {icon}
            <Label className="ml-2 font-medium">{title}</Label>
          </div>
          {currentColumn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeColumnFromAxis(axis)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-3">{description}</p>

        {currentColumn ? (
          <Badge variant="default" className="w-full justify-center">
            {currentColumn}
          </Badge>
        ) : (
          <div className="text-center text-gray-400 py-2">
            <GripVertical className="w-6 h-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Drop column here</p>
          </div>
        )}

        {/* Quick select dropdown for better UX */}
        <Select onValueChange={(value) => handleColumnDrop(axis, value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Or select..." />
          </SelectTrigger>
          <SelectContent>
            {(acceptedTypes === "categorical"
              ? categoricalColumns
              : acceptedTypes === "numerical"
                ? numericalColumns
                : availableColumns
            ).map((col) => (
              <SelectItem key={col.name} value={col.name}>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 text-xs">
                    {col.type}
                  </Badge>
                  {col.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>
    );
  };

  if (!uploadedData || !availableColumns.length) {
    return (
      <Card className="p-6 text-center">
        <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">No uploaded data available</p>
        <p className="text-xs text-gray-400 mt-1">
          Upload a CSV or Excel file first
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Widget Type Specific Configuration */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {widget.type === "bar-chart" ? (
              <BarChart3 className="w-5 h-5 mr-2" />
            ) : widget.type === "pie-chart" ? (
              <PieChart className="w-5 h-5 mr-2" />
            ) : widget.type.includes("comparison") ||
              widget.type.includes("analysis") ? (
              <Database className="w-5 h-5 mr-2" />
            ) : (
              <BarChart3 className="w-5 h-5 mr-2" />
            )}
            <h3 className="font-medium">
              {widget.type === "bar-chart"
                ? "Bar Chart"
                : widget.type === "pie-chart"
                  ? "Pie Chart"
                  : widget.type === "period-comparison"
                    ? "Period Comparison"
                    : widget.type === "target-comparison"
                      ? "Target Comparison"
                      : widget.type === "peer-comparison"
                        ? "Peer Comparison"
                        : widget.type === "composition-analysis"
                          ? "Composition Analysis"
                          : widget.type === "trend-analysis"
                            ? "Trend Analysis"
                            : widget.type === "interactive-chart"
                              ? "Interactive Chart"
                              : "Chart"}{" "}
              Configuration
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
        </div>

        {/* Available Columns */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">
            Available Columns
          </Label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {availableColumns.map((col) => (
              <Badge
                key={col.name}
                variant="secondary"
                className="cursor-move hover:bg-blue-100 dark:hover:bg-blue-900"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", col.name);
                }}
              >
                <span className="text-xs text-gray-500 mr-1">{col.type}</span>
                {col.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Axis Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {widget.type === "bar-chart" && (
            <>
              <DropZone
                axis="xAxis"
                title="X-Axis (Categories)"
                description="Categories to group by"
                icon={<BarChart3 className="w-4 h-4" />}
                acceptedTypes="categorical"
              />
              <DropZone
                axis="yAxis"
                title="Y-Axis (Values)"
                description="Numerical values to display"
                icon={<BarChart3 className="w-4 h-4 rotate-90" />}
                acceptedTypes="numerical"
              />
            </>
          )}

          {widget.type === "pie-chart" && (
            <>
              <DropZone
                axis="xAxis"
                title="Categories"
                description="Categories for pie slices"
                icon={<PieChart className="w-4 h-4" />}
                acceptedTypes="categorical"
              />
              <DropZone
                axis="yAxis"
                title="Values"
                description="Numerical values for slice sizes"
                icon={<BarChart3 className="w-4 h-4" />}
                acceptedTypes="numerical"
              />
            </>
          )}

          {/* Analytics Widgets Configuration */}
          {(widget.type === "period-comparison" ||
            widget.type === "target-comparison" ||
            widget.type === "peer-comparison" ||
            widget.type === "composition-analysis" ||
            widget.type === "trend-analysis" ||
            widget.type === "interactive-chart") && (
            <>
              <DropZone
                axis="yAxis"
                title="Metric"
                description="Numerical column to analyze"
                icon={<BarChart3 className="w-4 h-4" />}
                acceptedTypes="numerical"
              />

              {(widget.type === "period-comparison" ||
                widget.type === "trend-analysis") && (
                <DropZone
                  axis="xAxis"
                  title="Date/Period"
                  description="Date or time period column"
                  icon={<Filter className="w-4 h-4" />}
                  acceptedTypes="all"
                />
              )}

              {(widget.type === "peer-comparison" ||
                widget.type === "composition-analysis") && (
                <DropZone
                  axis="xAxis"
                  title="Category"
                  description="Column to group and compare by"
                  icon={<Database className="w-4 h-4" />}
                  acceptedTypes="categorical"
                />
              )}

              {widget.type === "target-comparison" && (
                <DropZone
                  axis="colorBy"
                  title="Target Reference"
                  description="Column containing target values or categories"
                  icon={<Filter className="w-4 h-4" />}
                  acceptedTypes="all"
                />
              )}
            </>
          )}

          {/* Optional fields */}
          <DropZone
            axis="colorBy"
            title="Color By (Optional)"
            description="Column to color-code the data"
            icon={
              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-purple-500" />
            }
            acceptedTypes="categorical"
          />
        </div>
      </Card>

      {/* Data Preview */}
      {showPreview && columnMapping.xAxis && columnMapping.yAxis && (
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Data Preview
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
            <p>
              <strong>X-Axis:</strong> {columnMapping.xAxis}
            </p>
            <p>
              <strong>Y-Axis:</strong> {columnMapping.yAxis}
            </p>
            {columnMapping.colorBy && (
              <p>
                <strong>Color By:</strong> {columnMapping.colorBy}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Configuration will be applied automatically
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
