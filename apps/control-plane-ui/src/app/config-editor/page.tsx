import ManifestEditor from "@/components/ManifestEditor";

// Config ที่ผู้ใช้ส่งมา - ใช้เป็น template
const userProvidedConfig = `{
  "schemaVersion": "1.3",
  "dashboardId": "xml-dashboard",
  "dashboardName": "XML Dashboard",
  "description": "Auto-generated from pvs.xml",
  "version": 3,
  "theme": {
    "dark": true,
    "brandColor": "#7c3aed",
    "radius": "20px",
    "statusColors": {
      "ok": "#10b981",
      "warning": "#f59e0b",
      "danger": "#ef4444"
    }
  },
  "formatters": {
    "qty": {
      "kind": "number",
      "precision": 0,
      "thousandsSep": ","
    },
    "date": {
      "kind": "date",
      "pattern": "dd MMM yyyy",
      "timezone": "Asia/Bangkok"
    },
    "days": {
      "kind": "number",
      "precision": 0,
      "suffix": " วัน"
    }
  },
  "dataSources": [
    {
      "id": "uploaded-xml",
      "type": "local",
      "accept": [".csv", ".json", ".xml"],
      "fieldTypes": {
        "DataDate": "date",
        "Corp": "string",
        "Branch": "string",
        "Prod": "string",
        "UnitName": "string",
        "DocNumber": "string",
        "DocDate": "date",
        "QtyFromThisDoc": "number",
        "AverageCost": "number"
      },
      "dateParsing": {
        "DataDate": "yyyy-MM-dd",
        "DocDate": "yyyy-MM-dd"
      }
    },
    {
      "id": "shelf-life-map",
      "type": "local",
      "accept": [".csv", ".json", ".xml"],
      "fieldTypes": {
        "Prod": "string",
        "ShelfLifeDays": "number"
      },
      "description": "เลือกไฟล์ mapping อายุสินค้า: คอลัมน์ Prod, ShelfLifeDays (จำนวนวัน)"
    }
  ],
  "transforms": [
    {
      "expr": "formatDate(DataDate,'yyyy-MM')",
      "as": "DataMonth"
    },
    {
      "as": "ShelfLifeDaysResolved",
      "expr": "coalesce(lookupDs('shelf-life-map','Prod','ShelfLifeDays'), 365)"
    },
    {
      "as": "ExpiryDate",
      "expr": "addDays(DocDate, ShelfLifeDaysResolved)"
    },
    {
      "as": "DaysToExpire",
      "expr": "dateDiff(DataDate, ExpiryDate, 'days')"
    },
    {
      "as": "NearExpiryFlag",
      "expr": "iif(DaysToExpire <= settings.nearExpiryDays && DaysToExpire >= 0, 1, 0)"
    },
    {
      "as": "ExpiredFlag",
      "expr": "iif(DaysToExpire < 0, 1, 0)"
    }
  ],
  "filters": {
    "global": []
  },
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 50,
    "desktop": [
      {
        "widgetId": "kpi-near-expiry",
        "x": 0,
        "y": 0,
        "width": 6,
        "height": 4
      },
      {
        "widgetId": "kpi-expired",
        "x": 6,
        "y": 0,
        "width": 6,
        "height": 4
      },
      {
        "widgetId": "bar-reason-prod",
        "x": 0,
        "y": 4,
        "width": 6,
        "height": 10
      },
      {
        "widgetId": "bar-reason-branch",
        "x": 6,
        "y": 4,
        "width": 6,
        "height": 10
      },
      {
        "widgetId": "action-export",
        "x": 0,
        "y": 14,
        "width": 12,
        "height": 2
      },
      {
        "widgetId": "table-action",
        "x": 0,
        "y": 16,
        "width": 12,
        "height": 12
      },
      {
        "widgetId": "line-near-expiry-trend",
        "x": 0,
        "y": 28,
        "width": 12,
        "height": 10
      }
    ],
    "mobile": [
      {
        "widgetId": "kpi-near-expiry"
      },
      {
        "widgetId": "kpi-expired"
      },
      {
        "widgetId": "bar-reason-prod"
      },
      {
        "widgetId": "bar-reason-branch"
      },
      {
        "widgetId": "action-export"
      },
      {
        "widgetId": "table-action"
      },
      {
        "widgetId": "line-near-expiry-trend"
      }
    ]
  },
  "widgets": [
    {
      "id": "kpi-near-expiry",
      "type": "kpi",
      "title": "สินค้าใกล้หมดอายุ (≤ 30 วัน)",
      "dataSource": "uploaded-xml",
      "query": {
        "measures": [
          {
            "field": "NearExpiryFlag",
            "agg": "sum",
            "as": "NearExpiry"
          }
        ]
      },
      "display": {
        "valueFormatter": "number",
        "severityRules": [
          {
            "if": "NearExpiry > 0",
            "color": "danger"
          },
          {
            "else": true,
            "color": "ok"
          }
        ]
      },
      "tooltip": {
        "template": "จำนวนสินค้าใกล้หมดอายุ: {{ NearExpiry }} รายการ"
      }
    },
    {
      "id": "kpi-expired",
      "type": "kpi",
      "title": "หมดอายุแล้ว",
      "dataSource": "uploaded-xml",
      "query": {
        "measures": [
          {
            "field": "ExpiredFlag",
            "agg": "sum",
            "as": "Expired"
          }
        ]
      },
      "display": {
        "valueFormatter": "number",
        "severityRules": [
          {
            "if": "Expired > 0",
            "color": "danger"
          },
          {
            "else": true,
            "color": "ok"
          }
        ]
      },
      "tooltip": {
        "template": "จำนวนหมดอายุแล้ว: {{ Expired }} รายการ"
      }
    },
    {
      "id": "bar-reason-prod",
      "type": "bar",
      "title": "สินค้า/ล็อตที่ใกล้หมดอายุ (เรียงจากวันคงเหลือน้อย)",
      "dataSource": "uploaded-xml",
      "query": {
        "dimensions": ["Prod", "DocNumber"],
        "measures": [
          {
            "field": "DaysToExpire",
            "agg": "min",
            "as": "MinDays"
          }
        ],
        "sort": [
          {
            "field": "MinDays",
            "dir": "asc"
          }
        ],
        "limit": 15,
        "filters": [
          {
            "field": "DaysToExpire",
            "op": "between",
            "value": [0, 60]
          }
        ]
      },
      "encoding": {
        "x": {
          "field": "MinDays",
          "type": "quantitative",
          "formatter": "days"
        },
        "y": {
          "field": "Prod",
          "type": "nominal"
        },
        "series": {
          "field": "DocNumber"
        }
      },
      "tooltip": {
        "template": "<b>{{ Prod }}</b><br/>ล็อต: {{ DocNumber }}<br/>คงเหลือ: {{ format MinDays 'days' }}"
      },
      "interactions": {
        "onBarClick": {
          "action": "crossFilter",
          "payload": {
            "field": "Prod",
            "from": "datum.Prod"
          }
        }
      }
    },
    {
      "id": "bar-reason-branch",
      "type": "bar",
      "title": "สาขาที่เสี่ยง (เรียงจากวันคงเหลือน้อยสุด)",
      "dataSource": "uploaded-xml",
      "query": {
        "dimensions": ["Branch"],
        "measures": [
          {
            "field": "DaysToExpire",
            "agg": "min",
            "as": "MinDays"
          }
        ],
        "sort": [
          {
            "field": "MinDays",
            "dir": "asc"
          }
        ],
        "limit": 10,
        "filters": [
          {
            "field": "DaysToExpire",
            "op": "between",
            "value": [
              0,
              {
                "fromSetting": "nearExpiryDays"
              }
            ]
          }
        ]
      },
      "encoding": {
        "x": {
          "field": "MinDays",
          "type": "quantitative",
          "formatter": "days"
        },
        "y": {
          "field": "Branch",
          "type": "nominal"
        }
      },
      "tooltip": {
        "template": "<b>{{ Branch }}</b><br/>คงเหลือ: {{ format MinDays 'days' }}"
      }
    },
    {
      "id": "action-export",
      "type": "actionBar",
      "title": "การกระทำ",
      "actions": [
        {
          "type": "exportCSV",
          "title": "Export รายการต้องจัดการ",
          "targetWidgetId": "table-action",
          "filename": "near-expiry_items.csv"
        }
      ]
    },
    {
      "id": "table-action",
      "type": "table",
      "title": "รายการต้องจัดการ (ใกล้หมดอายุ/หมดอายุ)",
      "dataSource": "uploaded-xml",
      "query": {
        "columns": [
          "Prod",
          "DocNumber",
          "DocDate",
          "DataDate",
          "ExpiryDate",
          "DaysToExpire",
          "QtyFromThisDoc",
          "UnitName",
          "Branch",
          "Corp"
        ],
        "sort": [
          {
            "field": "DaysToExpire",
            "dir": "asc"
          }
        ],
        "filters": [
          {
            "field": "DaysToExpire",
            "op": "lte",
            "value": 30
          }
        ]
      },
      "display": {
        "columnFormatters": {
          "DocDate": "date",
          "DataDate": "date",
          "ExpiryDate": "date",
          "DaysToExpire": "days",
          "QtyFromThisDoc": "qty"
        },
        "rowSeverityRules": [
          {
            "if": "DaysToExpire < 0",
            "color": "danger"
          },
          {
            "if": "DaysToExpire <= 7",
            "color": "danger"
          },
          {
            "if": "DaysToExpire <= 30",
            "color": "warning"
          }
        ],
        "pageSize": 20,
        "stickyHeader": true
      }
    },
    {
      "id": "line-near-expiry-trend",
      "type": "line",
      "title": "แนวโน้มจำนวนรายการใกล้หมดอายุต่อเดือน",
      "dataSource": "uploaded-xml",
      "query": {
        "dimensions": ["DataMonth"],
        "measures": [
          {
            "field": "NearExpiryFlag",
            "agg": "sum",
            "as": "NearExpiry"
          }
        ],
        "sort": [
          {
            "field": "DataMonth",
            "dir": "asc"
          }
        ]
      },
      "encoding": {
        "x": {
          "field": "DataMonth",
          "type": "temporal",
          "format": "month"
        },
        "y": {
          "field": "NearExpiry",
          "type": "quantitative"
        },
        "series": [
          {
            "field": "NearExpiry",
            "label": "Actual"
          },
          {
            "field": "NearExpiry_MA",
            "label": "3M MA",
            "style": {
              "dash": [4, 2]
            }
          }
        ]
      },
      "tooltip": {
        "template": "<b>{{ format DataMonth 'month' }}</b><br/>Actual: {{ NearExpiry }} รายการ<br/>3M MA: {{ NearExpiry_MA }}"
      },
      "analytics": {
        "movingAverage": {
          "field": "NearExpiry",
          "window": 3,
          "as": "NearExpiry_MA"
        }
      }
    }
  ],
  "referenceTables": {
    "shelfLifeDaysByProd": {
      "type": "inline",
      "key": "Prod",
      "valueField": "ShelfLifeDays",
      "rows": [
        {
          "Prod": "AE001-วัตถุระเบิด (ยี่ห้อA)",
          "ShelfLifeDays": 365
        },
        {
          "Prod": "PVI-ดินไฟฟ้า ชนิด IED",
          "ShelfLifeDays": 180
        }
      ],
      "defaultValue": 365
    }
  },
  "settings": {
    "nearExpiryDays": 45,
    "criticalDays": 14
  }
}`;

export default function ConfigEditorPage() {
  const handleSave = (config: any) => {
    console.log("📄 Config saved:", config);
    // บันทึกลง localStorage และส่งไปยัง onprem-viewer (port 3002)
    localStorage.setItem("dashboard-config", JSON.stringify(config, null, 2));
    alert(
      "✅ Config saved successfully! ตอนนี้สามารถไปดูที่ http://localhost:3002/schema-test ได้แล้ว"
    );
  };

  const handlePreview = () => {
    // เปิดหน้าต่างใหม่ไปยัง onprem-viewer
    window.open("http://localhost:3002/schema-test", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Config Editor
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                แก้ไข dashboard configuration พร้อม real-time validation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                🔍 Preview Dashboard
              </button>
              <div className="text-sm text-gray-500">Port 3001</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-6 py-6">
        <ManifestEditor initialValue={userProvidedConfig} onSave={handleSave} />

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-800 font-medium mb-3">🎯 วิธีการใช้งาน</h3>
          <ol className="text-blue-700 text-sm space-y-2">
            <li>
              <strong>1.</strong> แก้ไข JSON config ในช่องด้านบน (มี real-time
              validation)
            </li>
            <li>
              <strong>2.</strong> ดู status badge เพื่อดูว่า config
              ถูกต้องหรือไม่
            </li>
            <li>
              <strong>3.</strong> กด "Save Config" เพื่อบันทึก (จะบันทึกลง
              localStorage)
            </li>
            <li>
              <strong>4.</strong> กด "Preview Dashboard" หรือไปที่{" "}
              <code className="bg-blue-100 px-1 rounded">
                http://localhost:3002/schema-test
              </code>{" "}
              เพื่อดู dashboard
            </li>
          </ol>
        </div>

        {/* Schema Info */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-green-800 font-medium mb-3">
            📋 JSON Schema Validation
          </h3>
          <div className="text-green-700 text-sm space-y-1">
            <p>
              • <strong>Schema Version:</strong> 1.3
            </p>
            <p>
              • <strong>Supported Widget Types:</strong> kpi, bar, line, pareto,
              stackedBar, table, actionBar
            </p>
            <p>
              • <strong>Data Source Types:</strong> local, url, inline
            </p>
            <p>
              • <strong>Validation:</strong> Real-time validation ขณะพิมพ์
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
