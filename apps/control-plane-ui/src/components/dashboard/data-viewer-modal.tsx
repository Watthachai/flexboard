"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Users,
  Activity,
  BarChart3,
  Minus,
} from "lucide-react";
import {
  detectColumnType,
  formatDataValue,
  calculateTotalQuantity,
  calculateTotalValue,
  extractDatasetFromMetadata,
  cleanJsonData,
} from "@/lib/data-utils";

interface DataViewerModalProps {
  uploadedData: Record<string, unknown>;
}

interface DataRecord {
  [key: string]: any;
}

export default function DataViewerModal({
  uploadedData,
}: DataViewerModalProps) {
  const [data, setData] = useState<DataRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const [categoricalColumns, setCategoricalColumns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalValue: 0,
  });

  // Comparison states
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>("");
  const [comparisonType, setComparisonType] = useState<
    "period" | "target" | "peer" | "composition"
  >("period");
  const [targetValue, setTargetValue] = useState<number>(0);

  // Analysis results
  const [kpiComparisons, setKpiComparisons] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    if (uploadedData) {
      try {
        console.log("Raw uploadedData:", uploadedData);

        let processedData: DataRecord[] = [];

        // Try multiple data extraction methods
        if (Array.isArray(uploadedData)) {
          // Direct array
          processedData = uploadedData as DataRecord[];
        } else if (uploadedData.data && Array.isArray(uploadedData.data)) {
          // Data in .data property (most common structure from visual editor)
          processedData = uploadedData.data as DataRecord[];
        } else if (
          uploadedData.records &&
          Array.isArray(uploadedData.records)
        ) {
          // Data in .records property
          processedData = uploadedData.records as DataRecord[];
        } else if (uploadedData.rows && Array.isArray(uploadedData.rows)) {
          // Data in .rows property (legacy format)
          const rows = uploadedData.rows as any[];
          const columns = uploadedData.columns as any[];
          if (columns && Array.isArray(columns)) {
            processedData = rows.map((row: any[]) => {
              const rowObject: any = {};
              columns.forEach((col: any, index: number) => {
                rowObject[col.name || col] = row[index];
              });
              return rowObject;
            });
          }
        } else {
          // Try the original extractDatasetFromMetadata approach
          const dataString =
            typeof uploadedData === "string"
              ? uploadedData
              : JSON.stringify(uploadedData);

          const parsedData = extractDatasetFromMetadata(dataString);
          if (parsedData?.records && Array.isArray(parsedData.records)) {
            processedData = parsedData.records;
          }
        }

        console.log("Processed data length:", processedData.length);
        console.log("Sample processed data:", processedData.slice(0, 2));

        if (processedData.length > 0) {
          const cleanData = processedData.map((item: any, index: number) => {
            const cleanedItem = cleanJsonData(item);
            return { ...cleanedItem, __rowId: index };
          });

          setData(cleanData);
          setTotalRecords(cleanData.length);

          const allColumns = Object.keys(cleanData[0]).filter(
            (key) => key !== "__rowId"
          );
          setColumns(allColumns);

          console.log("Columns found:", allColumns);

          // Analyze column types for comparison features
          const numCols: string[] = [];
          const dateCols: string[] = [];
          const catCols: string[] = [];

          allColumns.forEach((col) => {
            const type = detectColumnType(cleanData, col);
            if (type === "number") numCols.push(col);
            else if (type === "date") dateCols.push(col);
            else catCols.push(col);
          });

          setNumericColumns(numCols);
          setDateColumns(dateCols);
          setCategoricalColumns(catCols);

          console.log(
            "Column types - Numeric:",
            numCols,
            "Date:",
            dateCols,
            "Categorical:",
            catCols
          );

          // Set default selections
          if (numCols.length > 0) setSelectedMetric(numCols[0]);
          if (dateCols.length > 0) setSelectedDimension(dateCols[0]);
          if (catCols.length > 0) setSelectedGroupBy(catCols[0]);

          calculateSummary(cleanData);
        } else {
          console.log("No data found in any expected structure");
          setData([]);
          setTotalRecords(0);
        }
      } catch (error) {
        console.error("Error processing uploaded data:", error);
        setData([]);
        setTotalRecords(0);
      }
    }
  }, [uploadedData]);

  // Helper function to calculate summary statistics
  const calculateSummary = (records: DataRecord[]) => {
    setSummary({
      totalQuantity: calculateTotalQuantity(records),
      totalValue: calculateTotalValue(records),
    });
  };

  // Comparison calculation functions
  const calculatePeriodComparison = () => {
    if (!selectedMetric || !selectedDimension || data.length === 0) return [];

    // Group data by time period
    const groupedData = data.reduce((acc: any, item) => {
      const period = item[selectedDimension];
      if (!acc[period]) acc[period] = [];
      acc[period].push(item);
      return acc;
    }, {});

    const periods = Object.keys(groupedData).sort();
    const chartData = periods.map((period) => {
      const periodData = groupedData[period];
      const value = periodData.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item[selectedMetric]) || 0);
      }, 0);

      return {
        period,
        value,
        count: periodData.length,
      };
    });

    // Calculate KPI comparisons
    const kpis = [];
    if (chartData.length >= 2) {
      const current = chartData[chartData.length - 1];
      const previous = chartData[chartData.length - 2];
      const change = current.value - previous.value;
      const changePercent = previous.value
        ? (change / previous.value) * 100
        : 0;

      kpis.push({
        title: "การเปลี่ยนแปลงจากช่วงก่อน",
        value: current.value,
        change,
        changePercent,
        trend: change >= 0 ? "up" : "down",
        icon: change >= 0 ? TrendingUp : TrendingDown,
      });
    }

    setChartData(chartData);
    setKpiComparisons(kpis);
    return chartData;
  };

  const calculateTargetComparison = () => {
    if (!selectedMetric || !targetValue || data.length === 0) return [];

    const actualValue = data.reduce((sum, item) => {
      return sum + (parseFloat(item[selectedMetric]) || 0);
    }, 0);

    const achievement = targetValue ? (actualValue / targetValue) * 100 : 0;
    const gap = actualValue - targetValue;

    const kpis = [
      {
        title: "เปรียบเทียบกับเป้าหมาย",
        value: actualValue,
        target: targetValue,
        achievement,
        gap,
        trend: gap >= 0 ? "up" : "down",
        icon: Target,
      },
    ];

    const chartData = [
      { name: "เป้าหมาย", value: targetValue },
      { name: "ผลจริง", value: actualValue },
      { name: "ส่วนต่าง", value: Math.abs(gap) },
    ];

    setChartData(chartData);
    setKpiComparisons(kpis);
    return chartData;
  };

  const calculatePeerComparison = () => {
    if (!selectedMetric || !selectedGroupBy || data.length === 0) return [];

    // Group data by peer dimension
    const groupedData = data.reduce((acc: any, item) => {
      const group = item[selectedGroupBy];
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});

    const peerData = Object.keys(groupedData)
      .map((group) => {
        const groupData = groupedData[group];
        const value = groupData.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item[selectedMetric]) || 0);
        }, 0);

        return {
          group,
          value,
          count: groupData.length,
        };
      })
      .sort((a, b) => b.value - a.value);

    // Calculate rankings and percentiles
    const rankings = peerData.map((item, index) => ({
      ...item,
      rank: index + 1,
      percentile: ((peerData.length - index) / peerData.length) * 100,
    }));

    const kpis = rankings.slice(0, 3).map((item, index) => ({
      title: `อันดับ ${item.rank}: ${item.group}`,
      value: item.value,
      rank: item.rank,
      percentile: item.percentile,
      trend: "neutral",
      icon: index === 0 ? TrendingUp : index === 1 ? Minus : TrendingDown,
    }));

    setRankingData(rankings);
    setChartData(rankings);
    setKpiComparisons(kpis);
    return rankings;
  };

  const calculateCompositionComparison = () => {
    if (!selectedMetric || !selectedGroupBy || data.length === 0) return [];

    // Calculate total and parts
    const total = data.reduce((sum, item) => {
      return sum + (parseFloat(item[selectedMetric]) || 0);
    }, 0);

    const groupedData = data.reduce((acc: any, item) => {
      const group = item[selectedGroupBy];
      if (!acc[group]) acc[group] = 0;
      acc[group] += parseFloat(item[selectedMetric]) || 0;
      return acc;
    }, {});

    const compositionData = Object.keys(groupedData)
      .map((group) => {
        const value = groupedData[group];
        const percentage = total ? (value / total) * 100 : 0;

        return {
          group,
          value,
          percentage,
          total,
        };
      })
      .sort((a, b) => b.value - a.value);

    // Create heatmap data for detailed breakdown
    const heatmapData = compositionData.map((item, index) => ({
      ...item,
      intensity: item.percentage / 100,
      color: `hsl(${200 + index * 20}, 70%, ${70 - item.percentage}%)`,
    }));

    const kpis = compositionData.slice(0, 3).map((item) => ({
      title: `${item.group}`,
      value: item.value,
      percentage: item.percentage,
      total,
      trend: "neutral",
      icon: Activity,
    }));

    setHeatmapData(heatmapData);
    setChartData(compositionData);
    setKpiComparisons(kpis);
    return compositionData;
  };

  // Effect to recalculate when comparison parameters change
  useEffect(() => {
    if (data.length === 0) return;

    switch (comparisonType) {
      case "period":
        calculatePeriodComparison();
        break;
      case "target":
        calculateTargetComparison();
        break;
      case "peer":
        calculatePeerComparison();
        break;
      case "composition":
        calculateCompositionComparison();
        break;
    }
  }, [
    selectedMetric,
    selectedDimension,
    selectedGroupBy,
    comparisonType,
    targetValue,
    data,
  ]);

  // คำนวณข้อมูลสำหรับหน้าปัจจุบัน
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  // ฟังก์ชันตรวจสอบประเภทข้อมูล
  const getColumnType = (columnName: string): string => {
    return detectColumnType(data, columnName);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "number":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "date":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "boolean":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (totalRecords === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            The uploaded data could not be processed or is empty.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Analytics Interface */}
      <Tabs
        value={comparisonType}
        onValueChange={(value: any) => setComparisonType(value)}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="period" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            เปรียบเทียบช่วงเวลา
          </TabsTrigger>
          <TabsTrigger value="target" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            เปรียบเทียบเป้าหมาย
          </TabsTrigger>
          <TabsTrigger value="peer" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            เปรียบเทียบกลุ่ม
          </TabsTrigger>
          <TabsTrigger value="composition" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            ส่วนประกอบ
          </TabsTrigger>
        </TabsList>

        {/* Configuration Controls */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                เลือกตัวชี้วัด
              </label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกตัวชี้วัด" />
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

            {comparisonType === "period" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  มิติเวลา
                </label>
                <Select
                  value={selectedDimension}
                  onValueChange={setSelectedDimension}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกมิติเวลา" />
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

            {comparisonType === "target" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  เป้าหมาย
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) =>
                    setTargetValue(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="ระบุเป้าหมาย"
                />
              </div>
            )}

            {(comparisonType === "peer" ||
              comparisonType === "composition") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  กลุ่มเปรียบเทียบ
                </label>
                <Select
                  value={selectedGroupBy}
                  onValueChange={setSelectedGroupBy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกลุ่ม" />
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
          </div>
        </Card>

        {/* KPI Cards */}
        {kpiComparisons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpiComparisons.map((kpi, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <kpi.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{kpi.title}</span>
                  </div>
                  {kpi.trend !== "neutral" && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        kpi.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {kpi.trend === "up" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {kpi.changePercent && `${kpi.changePercent.toFixed(1)}%`}
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {kpi.value?.toLocaleString()}
                </div>
                {kpi.target && (
                  <div className="text-sm text-gray-600">
                    เป้าหมาย: {kpi.target.toLocaleString()} (
                    {kpi.achievement?.toFixed(1)}%)
                  </div>
                )}
                {kpi.change && (
                  <div
                    className={`text-sm ${kpi.change >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    เปลี่ยนแปลง: {kpi.change >= 0 ? "+" : ""}
                    {kpi.change.toLocaleString()}
                  </div>
                )}
                {kpi.rank && (
                  <div className="text-sm text-gray-600">
                    อันดับ {kpi.rank} (Top {kpi.percentile?.toFixed(0)}%)
                  </div>
                )}
                {kpi.percentage && (
                  <div className="text-sm text-gray-600">
                    {kpi.percentage.toFixed(1)}% ของทั้งหมด
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <TabsContent value="period">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">แนวโน้มตามช่วงเวลา</h3>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="target">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              เปรียบเทียบกับเป้าหมาย
            </h3>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                  <ReferenceLine
                    y={targetValue}
                    stroke="red"
                    strokeDasharray="5 5"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="peer">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              การจัดอันดับและเปรียบเทียบ
            </h3>
            {rankingData.length > 0 && (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="group" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">ตารางอันดับ</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">
                            อันดับ
                          </th>
                          <th className="border border-gray-300 p-2 text-left">
                            กลุ่ม
                          </th>
                          <th className="border border-gray-300 p-2 text-right">
                            ค่า
                          </th>
                          <th className="border border-gray-300 p-2 text-right">
                            Percentile
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankingData.map((item: any, index) => (
                          <tr
                            key={index}
                            className={index < 3 ? "bg-yellow-50" : ""}
                          >
                            <td className="border border-gray-300 p-2">
                              {item.rank}
                            </td>
                            <td className="border border-gray-300 p-2">
                              {item.group}
                            </td>
                            <td className="border border-gray-300 p-2 text-right">
                              {item.value.toLocaleString()}
                            </td>
                            <td className="border border-gray-300 p-2 text-right">
                              {item.percentile.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="composition">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">องค์ประกอบและสัดส่วน</h3>
            {chartData.length > 0 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="group"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ group, percentage }) =>
                          `${group}: ${percentage.toFixed(1)}%`
                        }
                      >
                        {chartData.map((entry: any, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${index * 45}, 70%, 50%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div>
                    <h4 className="font-medium mb-2">Heat Map Table</h4>
                    <div className="space-y-2">
                      {heatmapData.map((item: any, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded"
                          style={{ backgroundColor: item.color }}
                        >
                          <span className="font-medium">{item.group}</span>
                          <div className="text-right">
                            <div className="font-bold">
                              {item.value.toLocaleString()}
                            </div>
                            <div className="text-sm opacity-80">
                              {item.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Summary for reference */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">ข้อมูลสรุป</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {totalRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">รายการทั้งหมด</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {numericColumns.length}
            </div>
            <div className="text-sm text-gray-600">ตัวชี้วัดตัวเลข</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {dateColumns.length}
            </div>
            <div className="text-sm text-gray-600">มิติเวลา</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {categoricalColumns.length}
            </div>
            <div className="text-sm text-gray-600">กลุ่มข้อมูล</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
