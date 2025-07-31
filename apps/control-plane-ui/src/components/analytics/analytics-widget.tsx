"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Target,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  BarChart3,
} from "lucide-react";
import { detectColumnType } from "@/lib/data-utils";
import { useUploadedDataContext } from "@/contexts/UploadedDataContext";

interface AnalyticsWidgetProps {
  widget: {
    id: string;
    type: string;
    title: string;
    config: any;
  };
  uploadedData?: any;
  onConfigChange?: (config: any) => void;
  isEditMode?: boolean;
}

export default function AnalyticsWidget({
  widget,
  uploadedData: propsUploadedData,
  onConfigChange,
  isEditMode = false,
}: AnalyticsWidgetProps) {
  // Use uploaded data from context first, then from props
  const { uploadedData: contextUploadedData } = useUploadedDataContext();
  const uploadedData = contextUploadedData || propsUploadedData;

  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [categoricalColumns, setCategoricalColumns] = useState<string[]>([]);
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any>({});

  // Widget configuration - read from dataSourceConfig
  const dataSourceConfig = widget.config?.dataSourceConfig || {};
  const columnMapping = dataSourceConfig.transformations || {};

  const [selectedMetric, setSelectedMetric] = useState(
    columnMapping.yAxis || widget.config?.selectedMetric || ""
  );
  const [selectedDimension, setSelectedDimension] = useState(
    columnMapping.xAxis || widget.config?.selectedDimension || ""
  );
  const [selectedGroupBy, setSelectedGroupBy] = useState(
    columnMapping.colorBy || widget.config?.selectedGroupBy || ""
  );
  const [targetValue, setTargetValue] = useState(
    widget.config?.targetValue || 0
  );

  // Process uploaded data
  useEffect(() => {
    if (!uploadedData) return;

    let processedData: any[] = [];

    if (Array.isArray(uploadedData)) {
      processedData = uploadedData;
    } else if (uploadedData.data && Array.isArray(uploadedData.data)) {
      processedData = uploadedData.data;
    } else if (uploadedData.rows && Array.isArray(uploadedData.rows)) {
      const rows = uploadedData.rows;
      const columns = uploadedData.columns || [];
      processedData = rows.map((row: any[]) => {
        const rowObject: any = {};
        columns.forEach((col: any, index: number) => {
          rowObject[col.name || col] = row[index];
        });
        return rowObject;
      });
    }

    if (processedData.length > 0) {
      setData(processedData);

      const allColumns = Object.keys(processedData[0]);
      setColumns(allColumns);

      // Analyze column types
      const numCols: string[] = [];
      const dateCols: string[] = [];
      const catCols: string[] = [];

      allColumns.forEach((col) => {
        const type = detectColumnType(processedData, col);
        if (type === "number") numCols.push(col);
        else if (type === "date") dateCols.push(col);
        else catCols.push(col);
      });

      setNumericColumns(numCols);
      setDateColumns(dateCols);
      setCategoricalColumns(catCols);

      // Set defaults if not configured
      if (!selectedMetric && numCols.length > 0) {
        setSelectedMetric(numCols[0]);
      }
      if (!selectedDimension && dateCols.length > 0) {
        setSelectedDimension(dateCols[0]);
      }
      if (!selectedGroupBy && catCols.length > 0) {
        setSelectedGroupBy(catCols[0]);
      }
    }
  }, [uploadedData]);

  // Sync configuration when widget config changes
  useEffect(() => {
    const dataSourceConfig = widget.config?.dataSourceConfig || {};
    const columnMapping = dataSourceConfig.transformations || {};

    if (columnMapping.yAxis && columnMapping.yAxis !== selectedMetric) {
      setSelectedMetric(columnMapping.yAxis);
    }
    if (columnMapping.xAxis && columnMapping.xAxis !== selectedDimension) {
      setSelectedDimension(columnMapping.xAxis);
    }
    if (columnMapping.colorBy && columnMapping.colorBy !== selectedGroupBy) {
      setSelectedGroupBy(columnMapping.colorBy);
    }
  }, [widget.config]);

  // Calculate analytics based on widget type
  useEffect(() => {
    if (data.length === 0 || !selectedMetric) return;

    switch (widget.type) {
      case "period-comparison":
        calculatePeriodComparison();
        break;
      case "target-comparison":
        calculateTargetComparison();
        break;
      case "peer-comparison":
        calculatePeerComparison();
        break;
      case "composition-analysis":
        calculateCompositionAnalysis();
        break;
      case "trend-analysis":
        calculateTrendAnalysis();
        break;
      case "interactive-chart":
        calculateInteractiveChart();
        break;
      default:
        break;
    }
  }, [
    data,
    selectedMetric,
    selectedDimension,
    selectedGroupBy,
    targetValue,
    widget.type,
  ]);

  const calculatePeriodComparison = () => {
    if (!selectedDimension) return;

    const grouped = data.reduce((acc: any, item) => {
      const period = item[selectedDimension];
      if (!acc[period]) acc[period] = [];
      acc[period].push(item);
      return acc;
    }, {});

    const periods = Object.keys(grouped).sort();
    const chartData = periods.map((period) => {
      const periodData = grouped[period];
      const value = periodData.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item[selectedMetric]) || 0);
      }, 0);

      return { period, value, count: periodData.length };
    });

    setChartData(chartData);

    // Calculate KPI
    if (chartData.length >= 2) {
      const current = chartData[chartData.length - 1];
      const previous = chartData[chartData.length - 2];
      const change = current.value - previous.value;
      const changePercent = previous.value
        ? (change / previous.value) * 100
        : 0;

      setKpiData({
        current: current.value,
        previous: previous.value,
        change,
        changePercent,
        trend: change >= 0 ? "up" : "down",
      });
    }
  };

  const calculateTargetComparison = () => {
    const actualValue = data.reduce((sum, item) => {
      return sum + (parseFloat(item[selectedMetric]) || 0);
    }, 0);

    const achievement = targetValue ? (actualValue / targetValue) * 100 : 0;
    const gap = actualValue - targetValue;

    setChartData([
      { name: "Target", value: targetValue },
      { name: "Actual", value: actualValue },
    ]);

    setKpiData({
      actual: actualValue,
      target: targetValue,
      achievement,
      gap,
      status: gap >= 0 ? "exceeded" : "below",
    });
  };

  const calculatePeerComparison = () => {
    if (!selectedGroupBy) return;

    const grouped = data.reduce((acc: any, item) => {
      const group = item[selectedGroupBy];
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});

    const peerData = Object.keys(grouped)
      .map((group) => {
        const groupData = grouped[group];
        const value = groupData.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item[selectedMetric]) || 0);
        }, 0);
        return { group, value, count: groupData.length };
      })
      .sort((a, b) => b.value - a.value);

    setChartData(peerData);

    setKpiData({
      topPerformer: peerData[0],
      totalGroups: peerData.length,
      rankings: peerData.map((item, index) => ({
        ...item,
        rank: index + 1,
        percentile: ((peerData.length - index) / peerData.length) * 100,
      })),
    });
  };

  const calculateCompositionAnalysis = () => {
    if (!selectedGroupBy) return;

    const total = data.reduce((sum, item) => {
      return sum + (parseFloat(item[selectedMetric]) || 0);
    }, 0);

    const grouped = data.reduce((acc: any, item) => {
      const group = item[selectedGroupBy];
      if (!acc[group]) acc[group] = 0;
      acc[group] += parseFloat(item[selectedMetric]) || 0;
      return acc;
    }, {});

    const compositionData = Object.keys(grouped)
      .map((group) => {
        const value = grouped[group];
        const percentage = total ? (value / total) * 100 : 0;
        return { group, value, percentage };
      })
      .sort((a, b) => b.value - a.value);

    setChartData(compositionData);

    setKpiData({
      total,
      largest: compositionData[0],
      distribution: compositionData,
    });
  };

  const calculateTrendAnalysis = () => {
    if (!selectedDimension) return;

    // Similar to period comparison but with trend analysis
    calculatePeriodComparison();
  };

  const calculateInteractiveChart = () => {
    if (!selectedDimension || !selectedMetric) return;

    let processedData = [];

    if (selectedGroupBy) {
      // If we have a group by dimension, create multi-series data
      const grouped = data.reduce((acc: any, item) => {
        const dimensionValue = item[selectedDimension];
        const groupValue = item[selectedGroupBy];

        if (!acc[dimensionValue]) {
          acc[dimensionValue] = {};
        }

        if (!acc[dimensionValue][groupValue]) {
          acc[dimensionValue][groupValue] = [];
        }

        acc[dimensionValue][groupValue].push(item);
        return acc;
      }, {});

      // Convert to chart data format
      processedData = Object.keys(grouped)
        .map((dimension) => {
          const entry: any = { dimension };

          Object.keys(grouped[dimension]).forEach((group) => {
            const groupData = grouped[dimension][group];
            const value = groupData.reduce((sum: number, item: any) => {
              return sum + (parseFloat(item[selectedMetric]) || 0);
            }, 0);

            entry[group] = value;
          });

          return entry;
        })
        .sort((a, b) => {
          // Try to sort by date if dimension is a date
          const dateA = new Date(a.dimension);
          const dateB = new Date(b.dimension);

          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return dateA.getTime() - dateB.getTime();
          }

          // Fall back to string comparison
          return a.dimension.localeCompare(b.dimension);
        });
    } else {
      // Simple single-series data
      const grouped = data.reduce((acc: any, item) => {
        const dimension = item[selectedDimension];
        if (!acc[dimension]) acc[dimension] = [];
        acc[dimension].push(item);
        return acc;
      }, {});

      processedData = Object.keys(grouped)
        .map((dimension) => {
          const dimensionData = grouped[dimension];
          const value = dimensionData.reduce((sum: number, item: any) => {
            return sum + (parseFloat(item[selectedMetric]) || 0);
          }, 0);

          return { dimension, value };
        })
        .sort((a, b) => {
          // Try to sort by date if dimension is a date
          const dateA = new Date(a.dimension);
          const dateB = new Date(b.dimension);

          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return dateA.getTime() - dateB.getTime();
          }

          // Fall back to string comparison
          return a.dimension.localeCompare(b.dimension);
        });
    }

    setChartData(processedData);

    // Calculate KPI data if possible
    if (processedData.length > 0) {
      const latestIndex = processedData.length - 1;
      let currentValue = 0;
      let previousValue = 0;

      if (selectedGroupBy) {
        // For grouped data, sum all group values for the latest period
        const latestPeriod = processedData[latestIndex];
        const previousPeriod = processedData[latestIndex - 1] || {};

        Object.keys(latestPeriod).forEach((key) => {
          if (key !== "dimension") {
            currentValue += latestPeriod[key] || 0;
          }
        });

        Object.keys(previousPeriod).forEach((key) => {
          if (key !== "dimension") {
            previousValue += previousPeriod[key] || 0;
          }
        });
      } else {
        // For single series, just use the latest value
        currentValue = processedData[latestIndex].value;
        previousValue =
          latestIndex > 0 ? processedData[latestIndex - 1].value : 0;
      }

      const change = currentValue - previousValue;
      const changePercent = previousValue ? (change / previousValue) * 100 : 0;

      setKpiData({
        current: currentValue,
        previous: previousValue,
        change,
        changePercent,
        trend: change >= 0 ? "up" : "down",
      });
    }
  };

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...widget.config, [key]: value };
    onConfigChange?.(newConfig);

    // Update local state
    switch (key) {
      case "selectedMetric":
        setSelectedMetric(value);
        break;
      case "selectedDimension":
        setSelectedDimension(value);
        break;
      case "selectedGroupBy":
        setSelectedGroupBy(value);
        break;
      case "targetValue":
        setTargetValue(value);
        break;
    }
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

    switch (widget.type) {
      case "analytics-period":
      case "analytics-trend":
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "analytics-target":
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "analytics-peer":
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="group" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "analytics-composition":
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="group"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ group, percentage }) =>
                  `${group}: ${percentage.toFixed(1)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${index * 45}, 70%, 50%)`}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "interactive-chart":
        if (selectedGroupBy) {
          // Multi-series chart
          const groupKeys =
            chartData.length > 0
              ? Object.keys(chartData[0]).filter((k) => k !== "dimension")
              : [];

          return (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dimension" />
                <YAxis />
                <Tooltip />
                {groupKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={`hsl(${index * 30}, 70%, 50%)`}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        } else {
          // Single series chart
          return (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dimension" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        }

      default:
        return (
          <div className="text-center text-gray-500">
            Chart type not supported
          </div>
        );
    }
  };

  const renderKPI = () => {
    if (!kpiData || Object.keys(kpiData).length === 0) return null;

    switch (widget.type) {
      case "analytics-period":
        return (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {kpiData.current?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Current Period</div>
              </div>
              <div
                className={`flex items-center ${kpiData.trend === "up" ? "text-green-600" : "text-red-600"}`}
              >
                {kpiData.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {kpiData.changePercent?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );

      case "analytics-target":
        return (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {kpiData.actual?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Actual</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">
                  {kpiData.achievement?.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Achievement</div>
              </div>
            </div>
          </div>
        );

      case "interactive-chart":
        return (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {kpiData.current?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Current Value</div>
              </div>
              <div
                className={`flex items-center ${kpiData.trend === "up" ? "text-green-600" : "text-red-600"}`}
              >
                {kpiData.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {kpiData.changePercent?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderControls = () => {
    if (!isEditMode) return null;

    return (
      <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded">
        <div className="flex items-center mb-2">
          <Settings className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Analytics Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Metric</label>
            <Select
              value={selectedMetric}
              onValueChange={(value) =>
                handleConfigUpdate("selectedMetric", value)
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(widget.type === "analytics-period" ||
            widget.type === "analytics-trend") && (
            <div>
              <label className="block text-xs font-medium mb-1">
                Time Dimension
              </label>
              <Select
                value={selectedDimension}
                onValueChange={(value) =>
                  handleConfigUpdate("selectedDimension", value)
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select dimension" />
                </SelectTrigger>
                <SelectContent>
                  {dateColumns.concat(categoricalColumns).map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(widget.type === "analytics-peer" ||
            widget.type === "analytics-composition") && (
            <div>
              <label className="block text-xs font-medium mb-1">Group By</label>
              <Select
                value={selectedGroupBy}
                onValueChange={(value) =>
                  handleConfigUpdate("selectedGroupBy", value)
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {categoricalColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {widget.type === "analytics-target" && (
            <div>
              <label className="block text-xs font-medium mb-1">
                Target Value
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) =>
                  handleConfigUpdate(
                    "targetValue",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full h-8 px-2 text-xs border border-gray-200 dark:border-gray-700 rounded"
                placeholder="Enter target"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!uploadedData) {
    return (
      <Card className="p-4 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
          <p className="text-xs">Upload data to enable analytics</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {renderControls()}
      {renderKPI()}
      <div className="flex-1">{renderChart()}</div>
    </div>
  );
}
