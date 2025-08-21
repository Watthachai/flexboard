"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchManifest } from "@/lib/fetchConfig";
import { loadLocalFile } from "@/lib/loadLocalFile";
import {
  coerceTypes,
  applyTransforms,
  filterRows,
  groupAgg,
  sortLimit,
} from "@/lib/engine";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock API endpoint - ในการใช้งานจริงให้เปลี่ยนเป็น URL ของคุณ
const MANIFEST_URL =
  "http://localhost:3000/api/v1/tenants/pvs-co-ltd/dashboards/pvs-inventory-aging-report";

export default function ExpiryDashboard() {
  const [manifest, setManifest] = useState<any>(null);
  const [raw, setRaw] = useState<any[]>([]);
  const [picked, setPicked] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // ลองโหลด manifest จาก API หรือใช้ mock data ถ้าไม่มี
    fetchManifest(MANIFEST_URL)
      .then(setManifest)
      .catch((e) => {
        console.warn("Cannot fetch from API, using mock data:", e.message);
        // ใช้ mock data เผื่อ API ยังไม่พร้อม
        setManifest(getMockManifest());
      });
  }, []);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicked(file);
    try {
      const rows = await loadLocalFile(file);
      setRaw(rows);
      setError("");
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  if (error)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="text-red-400 bg-red-900/20 p-4 rounded">
          <h2 className="font-semibold mb-2">Error</h2>
          {error}
        </div>
      </div>
    );

  if (!manifest)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>กำลังโหลดคอนฟิก…</p>
        </div>
      </div>
    );

  const dataSource = manifest.dataSources[0]; // "uploaded-xml"

  // normalize + transforms once
  const prepared = useMemo(() => {
    if (!raw.length) return [];
    const typed = coerceTypes(
      raw,
      dataSource.fieldTypes,
      dataSource.dateParsing
    );
    return applyTransforms(typed, manifest.transforms);
  }, [raw, dataSource, manifest.transforms]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">{manifest.dashboardName}</h1>
          <p className="text-gray-400">{manifest.description}</p>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* File Upload */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">📁 Upload Data File</h2>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept={dataSource.accept.join(",")}
              onChange={onPick}
              className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {picked && (
              <span className="text-sm text-gray-400">
                {picked.name} ({prepared.length} rows)
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            รองรับไฟล์: {dataSource.accept.join(", ")} | ต้องมีหัวคอลัมน์ตรงกับ
            schema: {Object.keys(dataSource.fieldTypes || {}).join(", ")}
          </p>
        </div>

        {prepared.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-400">
              เลือกไฟล์ XML/CSV/JSON ที่หัวคอลัมน์ตรงกับ schema
              แล้วระบบจะเรนเดอร์อัตโนมัติ
            </p>
          </div>
        ) : (
          <Grid manifest={manifest} prepared={prepared} />
        )}
      </div>
    </div>
  );
}

function Grid({ manifest, prepared }: { manifest: any; prepared: any[] }) {
  const items = manifest.layout.desktop as any[];
  const columns = manifest.layout.columns || 12;

  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((slot: any) => (
        <div
          key={slot.widgetId}
          style={{
            gridColumn: `span ${slot.width}`,
            gridRow: `span ${slot.height}`,
          }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <RenderWidget
            widget={manifest.widgets.find((w: any) => w.id === slot.widgetId)}
            data={prepared}
          />
        </div>
      ))}
    </div>
  );
}

function RenderWidget({ widget, data }: { widget: any; data: any[] }) {
  const title = widget.title;

  // build dataset from query
  const derived = useMemo(() => {
    const afterFilter = filterRows(data, widget.query?.filters);
    const grouped = groupAgg(
      afterFilter,
      widget.query?.dimensions,
      widget.query?.measures
    );
    const sortedLim = sortLimit(
      grouped,
      widget.query?.sort,
      widget.query?.limit
    );
    return sortedLim;
  }, [data, widget]);

  if (widget.type === "kpi") {
    const valKey =
      widget.query?.measures?.[0]?.as || widget.query?.measures?.[0]?.field;
    const value = derived[0]?.[valKey] ?? 0;
    const severity = getSeverity(value, widget.display?.severityRules);

    return (
      <div>
        <div className="text-sm text-gray-400 mb-2">{title}</div>
        <div className={`text-4xl font-bold ${getSeverityColor(severity)}`}>
          {formatValue(value, widget.display?.valueFormatter)}
        </div>
        {widget.display?.severityRules && (
          <div className="text-xs text-gray-500 mt-1">
            Status:{" "}
            <span className={getSeverityColor(severity)}>{severity}</span>
          </div>
        )}
      </div>
    );
  }

  if (widget.type === "bar") {
    const xKey = widget.encoding?.x?.field;
    const yKey = widget.encoding?.y?.field;

    return (
      <div className="h-full w-full">
        <div className="mb-4 text-sm text-gray-400">{title}</div>
        <div style={{ height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={derived}
              layout="vertical"
              margin={{ left: 80, right: 20 }}
            >
              <XAxis type="number" dataKey={xKey} stroke="#9CA3AF" />
              <YAxis
                type="category"
                dataKey={yKey}
                width={120}
                stroke="#9CA3AF"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#374151",
                  border: "1px solid #6B7280",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey={xKey} fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (widget.type === "table") {
    const cols: string[] =
      widget.query?.columns || Object.keys(derived[0] || {});

    return (
      <div className="h-full overflow-auto">
        <div className="mb-4 text-sm text-gray-400">{title}</div>
        <div className="overflow-x-auto">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-600">
                {cols.map((c) => (
                  <th
                    key={c}
                    className="text-left py-3 px-4 font-medium text-gray-300"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {derived.slice(0, 100).map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-700 hover:bg-gray-700/50"
                >
                  {cols.map((c) => {
                    const v = r[c];
                    const fmt = widget.display?.columnFormatters?.[c];
                    return (
                      <td key={c} className="py-2 px-4">
                        {formatValue(v, fmt)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-400">
      <div className="mb-2 text-sm">{title}</div>
      <div>Unsupported widget type: {widget.type}</div>
    </div>
  );
}

function formatValue(v: any, kind?: string) {
  if (v == null) return "-";
  if (kind === "qty") return Number(v).toLocaleString();
  if (kind === "money")
    return (
      "฿" +
      Number(v).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  if (kind === "days") return Number(v).toLocaleString();
  if (kind === "date") {
    // ถ้าค่าเป็น dayjs: แปลงเป็น string
    if (typeof v?.format === "function") return v.format("DD MMM YYYY");
    return String(v);
  }
  return String(v);
}

function getSeverity(value: number, rules?: any[]): string {
  if (!rules?.length) return "normal";

  for (const rule of rules) {
    if (rule.condition === ">=" && value >= rule.threshold) return rule.level;
    if (rule.condition === "<=" && value <= rule.threshold) return rule.level;
    if (rule.condition === ">" && value > rule.threshold) return rule.level;
    if (rule.condition === "<" && value < rule.threshold) return rule.level;
  }
  return "normal";
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-400";
    case "warning":
      return "text-yellow-400";
    case "good":
      return "text-green-400";
    default:
      return "text-white";
  }
}

// Mock data เผื่อ API ยังไม่พร้อม
function getMockManifest() {
  return {
    dashboardName: "PVS Inventory Aging Report",
    description: "Track product aging and expiry status",
    dataSources: [
      {
        id: "uploaded-xml",
        name: "Uploaded XML Data",
        type: "upload",
        accept: [".xml", ".csv", ".json"],
        fieldTypes: {
          ProductID: "string",
          ProductName: "string",
          QtyFromThisDoc: "number",
          AverageCost: "number",
          DocDate: "date",
          DataDate: "date",
        },
        dateParsing: {
          DocDate: "YYYY-MM-DD",
          DataDate: "YYYY-MM-DD",
        },
      },
    ],
    transforms: [
      {
        as: "DaysAge",
        expr: "dateDiff(DataDate, DocDate, 'days')",
      },
      {
        as: "AgeBucket",
        expr: "case( DaysAge <= 90, '0-90', DaysAge <= 180, '91-180', DaysAge <= 365, '181-365', true, '>365' )",
      },
      {
        as: "TotalValueRow",
        expr: "QtyFromThisDoc * AverageCost",
      },
    ],
    widgets: [
      {
        id: "total-items",
        type: "kpi",
        title: "Total Items",
        query: {
          measures: [
            { field: "ProductID", agg: "countDistinct", as: "total_items" },
          ],
        },
        display: {
          valueFormatter: "qty",
        },
      },
      {
        id: "total-value",
        type: "kpi",
        title: "Total Value",
        query: {
          measures: [{ field: "TotalValueRow", agg: "sum", as: "total_value" }],
        },
        display: {
          valueFormatter: "money",
          severityRules: [
            { condition: ">=", threshold: 1000000, level: "critical" },
            { condition: ">=", threshold: 500000, level: "warning" },
            { condition: "<", threshold: 500000, level: "good" },
          ],
        },
      },
      {
        id: "aging-by-bucket",
        type: "bar",
        title: "Value by Age Bucket",
        query: {
          dimensions: ["AgeBucket"],
          measures: [{ field: "TotalValueRow", agg: "sum", as: "total_value" }],
          sort: [{ field: "total_value", dir: "desc" }],
        },
        encoding: {
          x: { field: "total_value" },
          y: { field: "AgeBucket" },
        },
      },
      {
        id: "product-details",
        type: "table",
        title: "Product Details",
        query: {
          columns: [
            "ProductID",
            "ProductName",
            "QtyFromThisDoc",
            "AverageCost",
            "DaysAge",
            "AgeBucket",
            "TotalValueRow",
          ],
          sort: [{ field: "DaysAge", dir: "desc" }],
          limit: 50,
        },
        display: {
          columnFormatters: {
            QtyFromThisDoc: "qty",
            AverageCost: "money",
            TotalValueRow: "money",
            DaysAge: "days",
          },
        },
      },
    ],
    layout: {
      columns: 12,
      desktop: [
        { widgetId: "total-items", width: 3, height: 1 },
        { widgetId: "total-value", width: 3, height: 1 },
        { widgetId: "aging-by-bucket", width: 6, height: 2 },
        { widgetId: "product-details", width: 12, height: 3 },
      ],
    },
  };
}
