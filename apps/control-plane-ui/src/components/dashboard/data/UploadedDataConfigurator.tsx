/**
 * Uploaded Data Configurator - Advanced PowerBI-like data transformation interface
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Widget } from "@/types/dashboard-editor";
import {
  Upload,
  CheckSquare,
  Filter,
  RefreshCw,
  AlertCircle,
  Database,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Group,
  Calculator,
  SortAsc,
} from "lucide-react";

interface UploadedDataset {
  id: string;
  name: string;
  columns: Array<{
    name: string;
    type: string;
    displayName?: string;
  }>;
  totalRows: number;
  uploadedAt: string;
}

interface DataTransformation {
  selectedColumns: string[];
  groupBy: string[];
  aggregations: Array<{
    column: string;
    function: "SUM" | "COUNT" | "AVG" | "MIN" | "MAX";
    alias?: string;
  }>;
  filters: Array<{
    column: string;
    operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN";
    value: string;
  }>;
  orderBy: Array<{
    column: string;
    direction: "ASC" | "DESC";
  }>;
  limit?: number;
}

interface UploadedDataConfiguratorProps {
  widget: Widget;
  tenantId: string;
  onConfigChange: (config: {
    type: string;
    selectedDatasetId?: string;
    selectedColumns?: string[];
    transformations?: DataTransformation;
  }) => void;
}

export function UploadedDataConfigurator({
  widget,
  tenantId,
  onConfigChange,
}: UploadedDataConfiguratorProps) {
  const [availableDatasets, setAvailableDatasets] = useState<UploadedDataset[]>(
    []
  );
  const [selectedDataset, setSelectedDataset] =
    useState<UploadedDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    columns: true,
    groupBy: false,
    aggregations: false,
    filters: false,
    orderBy: false,
  });

  // Current configuration from widget
  const currentConfig = (widget.config as any)?.dataSourceConfig || {};
  const selectedDatasetId = currentConfig.selectedDatasetId;
  const transformations: DataTransformation = currentConfig.transformations || {
    selectedColumns: [],
    groupBy: [],
    aggregations: [],
    filters: [],
    orderBy: [],
    limit: undefined,
  };

  // Fetch available uploaded datasets
  useEffect(() => {
    fetchUploadedDatasets();
  }, [tenantId]);

  const fetchUploadedDatasets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboards for this tenant to find uploaded data
      const response = await fetch(`/api/tenants/${tenantId}/dashboards`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch datasets");
      }

      // Extract uploaded data from all dashboards
      const datasets: UploadedDataset[] = [];

      data.data.forEach((dashboard: Record<string, unknown>) => {
        const dataSourceConfig = dashboard.dataSourceConfig as
          | Record<string, unknown>
          | undefined;
        if (dataSourceConfig?.uploadedData) {
          try {
            const uploadedData = JSON.parse(
              dataSourceConfig.uploadedData as string
            );

            if (uploadedData.columns && Array.isArray(uploadedData.columns)) {
              datasets.push({
                id: dashboard.id as string,
                name: (dashboard.name as string) || `Dataset ${dashboard.id}`,
                columns: uploadedData.columns,
                totalRows:
                  uploadedData.totalRows || uploadedData.rows?.length || 0,
                uploadedAt:
                  (dashboard.updatedAt as string) ||
                  (dashboard.createdAt as string) ||
                  new Date().toISOString(),
              });
            }
          } catch (e) {
            console.warn(
              `Failed to parse uploaded data for dashboard ${dashboard.id}:`,
              e
            );
          }
        }
      });

      setAvailableDatasets(datasets);
    } catch (err) {
      console.error("Error fetching uploaded datasets:", err);
      setError(err instanceof Error ? err.message : "Failed to load datasets");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Load selected dataset details when selectedDatasetId changes
  useEffect(() => {
    if (selectedDatasetId && availableDatasets.length > 0) {
      const dataset = availableDatasets.find((d) => d.id === selectedDatasetId);
      setSelectedDataset(dataset || null);
    }
  }, [selectedDatasetId, availableDatasets]);

  const handleDatasetSelect = (datasetId: string) => {
    const dataset = availableDatasets.find((d) => d.id === datasetId);
    setSelectedDataset(dataset || null);

    const newTransformations: DataTransformation = {
      selectedColumns: [],
      groupBy: [],
      aggregations: [],
      filters: [],
      orderBy: [],
      limit: undefined,
    };

    onConfigChange({
      type: "uploadedData",
      selectedDatasetId: datasetId,
      selectedColumns: [],
      transformations: newTransformations,
    });
  };

  // Helper function to update transformations
  const updateTransformations = (updates: Partial<DataTransformation>) => {
    const newTransformations = { ...transformations, ...updates };
    onConfigChange({
      type: "uploadedData",
      selectedDatasetId,
      selectedColumns: newTransformations.selectedColumns,
      transformations: newTransformations,
    });
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleColumnToggle = (columnName: string, checked: boolean) => {
    const newSelectedColumns = checked
      ? [...transformations.selectedColumns, columnName]
      : transformations.selectedColumns.filter(
          (col: string) => col !== columnName
        );

    updateTransformations({ selectedColumns: newSelectedColumns });
  };

  const handleSelectAllColumns = () => {
    if (!selectedDataset) return;
    const allColumnNames = selectedDataset.columns.map((col) => col.name);
    updateTransformations({ selectedColumns: allColumnNames });
  };

  const handleClearAllColumns = () => {
    updateTransformations({ selectedColumns: [] });
  };

  // Group By handlers
  const addGroupBy = (column: string) => {
    if (!transformations.groupBy.includes(column)) {
      updateTransformations({
        groupBy: [...transformations.groupBy, column],
      });
    }
  };

  const removeGroupBy = (column: string) => {
    updateTransformations({
      groupBy: transformations.groupBy.filter((col) => col !== column),
    });
  };

  // Aggregation handlers
  const addAggregation = () => {
    const newAggregation = {
      column: selectedDataset?.columns[0]?.name || "",
      function: "SUM" as const,
      alias: "",
    };
    updateTransformations({
      aggregations: [...transformations.aggregations, newAggregation],
    });
  };

  const updateAggregation = (
    index: number,
    updates: Partial<(typeof transformations.aggregations)[0]>
  ) => {
    const newAggregations = [...transformations.aggregations];
    newAggregations[index] = { ...newAggregations[index], ...updates };
    updateTransformations({ aggregations: newAggregations });
  };

  const removeAggregation = (index: number) => {
    updateTransformations({
      aggregations: transformations.aggregations.filter((_, i) => i !== index),
    });
  };

  // Filter handlers
  const addFilter = () => {
    const newFilter = {
      column: selectedDataset?.columns[0]?.name || "",
      operator: "=" as const,
      value: "",
    };
    updateTransformations({
      filters: [...transformations.filters, newFilter],
    });
  };

  const updateFilter = (
    index: number,
    updates: Partial<DataTransformation["filters"][0]>
  ) => {
    const newFilters = [...transformations.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    updateTransformations({ filters: newFilters });
  };

  const removeFilter = (index: number) => {
    updateTransformations({
      filters: transformations.filters.filter((_, i) => i !== index),
    });
  };

  // Order By handlers
  const addOrderBy = () => {
    const newOrderBy = {
      column: selectedDataset?.columns[0]?.name || "",
      direction: "ASC" as const,
    };
    updateTransformations({
      orderBy: [...transformations.orderBy, newOrderBy],
    });
  };

  const updateOrderBy = (
    index: number,
    updates: Partial<DataTransformation["orderBy"][0]>
  ) => {
    const newOrderBy = [...transformations.orderBy];
    newOrderBy[index] = { ...newOrderBy[index], ...updates };
    updateTransformations({ orderBy: newOrderBy });
  };

  const removeOrderBy = (index: number) => {
    updateTransformations({
      orderBy: transformations.orderBy.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading uploaded datasets...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-500 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUploadedDatasets}
          className="mt-3"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dataset Selection */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">
            <Upload className="w-4 h-4 mr-2 text-green-500" />
            Select Uploaded Data
          </Label>

          <Select
            value={selectedDatasetId || ""}
            onValueChange={handleDatasetSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose from uploaded datasets..." />
            </SelectTrigger>
            <SelectContent>
              {availableDatasets.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No uploaded datasets found</p>
                  <p className="text-xs">
                    Upload data first in dashboard settings
                  </p>
                </div>
              ) : (
                availableDatasets.map((dataset) => (
                  <SelectItem key={dataset.id} value={dataset.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{dataset.name}</div>
                        <div className="text-xs text-gray-500">
                          {dataset.totalRows} rows • {dataset.columns.length}{" "}
                          columns
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {new Date(dataset.uploadedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Data Transformation UI */}
      {selectedDataset && (
        <div className="space-y-4">
          {/* Column Selection */}
          <Card className="p-4">
            <div className="space-y-3">
              <button
                onClick={() => toggleSection("columns")}
                className="flex items-center justify-between w-full text-left"
              >
                <Label className="text-sm font-medium flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-blue-500" />
                  Select Columns
                </Label>
                {expandedSections.columns ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {expandedSections.columns && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Selected: {transformations.selectedColumns.length} of{" "}
                      {selectedDataset.columns.length} columns
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllColumns}
                        disabled={
                          transformations.selectedColumns.length ===
                          selectedDataset.columns.length
                        }
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllColumns}
                        disabled={transformations.selectedColumns.length === 0}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {selectedDataset.columns.map((column) => {
                      const isSelected =
                        transformations.selectedColumns.includes(column.name);
                      return (
                        <label
                          key={column.name}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleColumnToggle(
                                column.name,
                                checked as boolean
                              )
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {column.displayName || column.name}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {column.type}
                              </Badge>
                              {column.name !==
                                (column.displayName || column.name) && (
                                <span className="text-xs text-gray-500 truncate">
                                  {column.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Group By */}
          <Card className="p-4">
            <div className="space-y-3">
              <button
                onClick={() => toggleSection("groupBy")}
                className="flex items-center justify-between w-full text-left"
              >
                <Label className="text-sm font-medium flex items-center">
                  <Group className="w-4 h-4 mr-2 text-purple-500" />
                  Group By ({transformations.groupBy.length})
                </Label>
                {expandedSections.groupBy ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {expandedSections.groupBy && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {transformations.groupBy.map((column, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <span className="text-sm">{column}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGroupBy(column)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Select onValueChange={(value) => addGroupBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add column to group by..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDataset.columns
                        .filter(
                          (col) => !transformations.groupBy.includes(col.name)
                        )
                        .map((column) => (
                          <SelectItem key={column.name} value={column.name}>
                            {column.displayName || column.name} ({column.type})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>

          {/* Aggregations */}
          <Card className="p-4">
            <div className="space-y-3">
              <button
                onClick={() => toggleSection("aggregations")}
                className="flex items-center justify-between w-full text-left"
              >
                <Label className="text-sm font-medium flex items-center">
                  <Calculator className="w-4 h-4 mr-2 text-orange-500" />
                  Aggregations ({transformations.aggregations.length})
                </Label>
                {expandedSections.aggregations ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {expandedSections.aggregations && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {transformations.aggregations.map((agg, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Aggregation {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAggregation(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Function</Label>
                            <Select
                              value={agg.function}
                              onValueChange={(value) =>
                                updateAggregation(index, {
                                  function: value as any,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SUM">SUM</SelectItem>
                                <SelectItem value="COUNT">COUNT</SelectItem>
                                <SelectItem value="AVG">AVERAGE</SelectItem>
                                <SelectItem value="MIN">MIN</SelectItem>
                                <SelectItem value="MAX">MAX</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Column</Label>
                            <Select
                              value={agg.column}
                              onValueChange={(value) =>
                                updateAggregation(index, { column: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedDataset.columns
                                  .filter(
                                    (col) =>
                                      col.type === "number" ||
                                      agg.function === "COUNT"
                                  )
                                  .map((column) => (
                                    <SelectItem
                                      key={column.name}
                                      value={column.name}
                                    >
                                      {column.displayName || column.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Alias (optional)</Label>
                          <Input
                            placeholder="Custom name for this calculation"
                            value={agg.alias || ""}
                            onChange={(e) =>
                              updateAggregation(index, {
                                alias: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAggregation}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Aggregation
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Filters */}
          <Card className="p-4">
            <div className="space-y-3">
              <button
                onClick={() => toggleSection("filters")}
                className="flex items-center justify-between w-full text-left"
              >
                <Label className="text-sm font-medium flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-red-500" />
                  Filters ({transformations.filters.length})
                </Label>
                {expandedSections.filters ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {expandedSections.filters && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {transformations.filters.map((filter, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Filter {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFilter(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Column</Label>
                            <Select
                              value={filter.column}
                              onValueChange={(value) =>
                                updateFilter(index, { column: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedDataset.columns.map((column) => (
                                  <SelectItem
                                    key={column.name}
                                    value={column.name}
                                  >
                                    {column.displayName || column.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Operator</Label>
                            <Select
                              value={filter.operator}
                              onValueChange={(value) =>
                                updateFilter(index, { operator: value as any })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="=">=</SelectItem>
                                <SelectItem value="!=">!=</SelectItem>
                                <SelectItem value=">">{">"}</SelectItem>
                                <SelectItem value="<">{"<"}</SelectItem>
                                <SelectItem value=">=">{">="}</SelectItem>
                                <SelectItem value="<=">{"<="}</SelectItem>
                                <SelectItem value="LIKE">LIKE</SelectItem>
                                <SelectItem value="IN">IN</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Value</Label>
                            <Input
                              placeholder="Filter value"
                              value={filter.value}
                              onChange={(e) =>
                                updateFilter(index, { value: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFilter}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Filter
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Order By */}
          <Card className="p-4">
            <div className="space-y-3">
              <button
                onClick={() => toggleSection("orderBy")}
                className="flex items-center justify-between w-full text-left"
              >
                <Label className="text-sm font-medium flex items-center">
                  <SortAsc className="w-4 h-4 mr-2 text-indigo-500" />
                  Order By ({transformations.orderBy.length})
                </Label>
                {expandedSections.orderBy ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {expandedSections.orderBy && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {transformations.orderBy.map((order, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Sort {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOrderBy(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Column</Label>
                            <Select
                              value={order.column}
                              onValueChange={(value) =>
                                updateOrderBy(index, { column: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedDataset.columns.map((column) => (
                                  <SelectItem
                                    key={column.name}
                                    value={column.name}
                                  >
                                    {column.displayName || column.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Direction</Label>
                            <Select
                              value={order.direction}
                              onValueChange={(value) =>
                                updateOrderBy(index, {
                                  direction: value as any,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ASC">Ascending</SelectItem>
                                <SelectItem value="DESC">Descending</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOrderBy}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sort
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Limit */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Limit Results</Label>
              <Input
                type="number"
                placeholder="Max number of rows (optional)"
                value={transformations.limit || ""}
                onChange={(e) =>
                  updateTransformations({
                    limit: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </Card>

          {/* Preview Summary */}
          {(transformations.selectedColumns.length > 0 ||
            transformations.groupBy.length > 0 ||
            transformations.aggregations.length > 0) && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Configuration Summary
                </h4>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>
                    • Selected Columns: {transformations.selectedColumns.length}
                  </p>
                  {transformations.groupBy.length > 0 && (
                    <p>• Group By: {transformations.groupBy.join(", ")}</p>
                  )}
                  {transformations.aggregations.length > 0 && (
                    <p>• Aggregations: {transformations.aggregations.length}</p>
                  )}
                  {transformations.filters.length > 0 && (
                    <p>• Filters: {transformations.filters.length}</p>
                  )}
                  {transformations.orderBy.length > 0 && (
                    <p>• Sort: {transformations.orderBy.length} columns</p>
                  )}
                  {transformations.limit && (
                    <p>• Limit: {transformations.limit} rows</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
