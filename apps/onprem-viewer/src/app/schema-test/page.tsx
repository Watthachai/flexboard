"use client";

import DashboardRenderer from "@/components/DashboardRenderer";
import { validateConfig } from "@flexboard/schema";

export default function SchemaTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Runtime
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                แสดง dashboard จาก validated configuration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  window.open("http://localhost:3001/config-editor", "_blank")
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ✏️ Edit Config
              </button>
              <div className="text-sm text-gray-500">Port 3002</div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <DashboardRenderer
        configSource="file"
        fallbackConfig={{
          schemaVersion: "1.3",
          dashboardId: "xml-dashboard",
          dashboardName: "XML Dashboard Demo",
          description: "Schema-driven dashboard with sample data",
          version: 3,
          layout: {
            type: "grid",
            columns: 12,
            rowHeight: 50,
            desktop: [
              {
                widgetId: "kpi-near-expiry",
                x: 0,
                y: 0,
                width: 6,
                height: 4,
              },
              {
                widgetId: "kpi-expired",
                x: 6,
                y: 0,
                width: 6,
                height: 4,
              },
              {
                widgetId: "bar-reason-prod",
                x: 0,
                y: 4,
                width: 6,
                height: 10,
              },
              {
                widgetId: "bar-reason-branch",
                x: 6,
                y: 4,
                width: 6,
                height: 10,
              },
              {
                widgetId: "action-export",
                x: 0,
                y: 14,
                width: 12,
                height: 2,
              },
              {
                widgetId: "table-action",
                x: 0,
                y: 16,
                width: 12,
                height: 12,
              },
            ],
          },
          widgets: [
            {
              id: "kpi-near-expiry",
              type: "kpi",
              title: "สินค้าใกล้หมดอายุ (≤ 30 วัน)",
              dataSource: "uploaded-xml",
              query: {
                measures: [
                  {
                    field: "NearExpiryFlag",
                    agg: "sum",
                    as: "NearExpiry",
                  },
                ],
              },
              display: {
                valueFormatter: "number",
                severityRules: [
                  {
                    if: "NearExpiry > 0",
                    color: "danger",
                  },
                  {
                    else: true,
                    color: "ok",
                  },
                ],
              },
              tooltip: {
                template: "จำนวนสินค้าใกล้หมดอายุ: {{ NearExpiry }} รายการ",
              },
            },
            {
              id: "kpi-expired",
              type: "kpi",
              title: "หมดอายุแล้ว",
              dataSource: "uploaded-xml",
              query: {
                measures: [
                  {
                    field: "ExpiredFlag",
                    agg: "sum",
                    as: "Expired",
                  },
                ],
              },
              display: {
                valueFormatter: "number",
                severityRules: [
                  {
                    if: "Expired > 0",
                    color: "danger",
                  },
                  {
                    else: true,
                    color: "ok",
                  },
                ],
              },
              tooltip: {
                template: "จำนวนหมดอายุแล้ว: {{ Expired }} รายการ",
              },
            },
            {
              id: "bar-reason-prod",
              type: "bar",
              title: "สินค้า/ล็อตที่ใกล้หมดอายุ",
              dataSource: "uploaded-xml",
              query: {
                dimensions: ["Prod"],
                measures: [
                  {
                    field: "DaysToExpire",
                    agg: "min",
                    as: "MinDays",
                  },
                ],
                sort: [
                  {
                    field: "MinDays",
                    dir: "asc",
                  },
                ],
                limit: 10,
              },
              encoding: {
                x: {
                  field: "MinDays",
                  type: "quantitative",
                  formatter: "days",
                },
                y: {
                  field: "Prod",
                  type: "nominal",
                },
              },
              tooltip: {
                template: "{{ Prod }}: คงเหลือ {{ format MinDays 'days' }}",
              },
            },
            {
              id: "bar-reason-branch",
              type: "bar",
              title: "สาขาที่เสี่ยง",
              dataSource: "uploaded-xml",
              query: {
                dimensions: ["Branch"],
                measures: [
                  {
                    field: "DaysToExpire",
                    agg: "min",
                    as: "MinDays",
                  },
                ],
                sort: [
                  {
                    field: "MinDays",
                    dir: "asc",
                  },
                ],
                limit: 8,
              },
              encoding: {
                x: {
                  field: "MinDays",
                  type: "quantitative",
                  formatter: "days",
                },
                y: {
                  field: "Branch",
                  type: "nominal",
                },
              },
              tooltip: {
                template:
                  "{{ Branch }}: วันคงเหลือต่ำสุด {{ format MinDays 'days' }}",
              },
            },
            {
              id: "action-export",
              type: "actionBar",
              title: "การกระทำ",
              actions: [
                {
                  type: "exportCSV",
                  title: "Export รายการต้องจัดการ",
                  filename: "near-expiry_items.csv",
                },
              ],
            },
            {
              id: "table-action",
              type: "table",
              title: "รายการต้องจัดการ (ใกล้หมดอายุ/หมดอายุ)",
              dataSource: "uploaded-xml",
              query: {
                columns: [
                  "Prod",
                  "DocNumber",
                  "DocDate",
                  "ExpiryDate",
                  "DaysToExpire",
                  "QtyFromThisDoc",
                  "Branch",
                ],
                sort: [
                  {
                    field: "DaysToExpire",
                    dir: "asc",
                  },
                ],
                filters: [
                  {
                    field: "DaysToExpire",
                    op: "lte",
                    value: 30,
                  },
                ],
              },
              display: {
                columnFormatters: {
                  DocDate: "date",
                  ExpiryDate: "date",
                  DaysToExpire: "days",
                  QtyFromThisDoc: "qty",
                },
                pageSize: 15,
              },
            },
          ],
          dataSources: [
            {
              id: "uploaded-xml",
              type: "local",
              accept: [".csv", ".json", ".xml"],
            },
          ],
        }}
      />
    </div>
  );
}
