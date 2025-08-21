"use client";

import { useState, useEffect } from "react";
import { validateConfig } from "@flexboard/schema";
import { WidgetRenderer } from "../app/components/charts/WidgetRenderer";

// Sample data for demonstration
const generateSampleData = () => {
  const sampleData = [];
  const products = [
    "AE001-วัตถุระเบิด (ยี่ห้อA)",
    "PVI-ดินไฟฟ้า ชนิด IED",
    "MK-หินปูน",
    "TX-สารเคมี",
  ];
  const branches = [
    "สาขาเชียงใหม่",
    "สาขาขอนแก่น",
    "สาขาหาดใหญ่",
    "สาขาราชบุรี",
  ];

  for (let i = 0; i < 50; i++) {
    const docDate = new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    );
    const daysToExpire = Math.floor(Math.random() * 120) - 30; // -30 to 90 days

    sampleData.push({
      DataDate: "2024-12-01",
      Corp: "บริษัท ABC จำกัด",
      Branch: branches[Math.floor(Math.random() * branches.length)],
      Prod: products[Math.floor(Math.random() * products.length)],
      UnitName: "หน่วย",
      DocNumber: `DOC${String(i + 1).padStart(3, "0")}`,
      DocDate: docDate.toISOString().split("T")[0],
      QtyFromThisDoc: Math.floor(Math.random() * 1000) + 100,
      AverageCost: Math.floor(Math.random() * 5000) + 1000,
      DataMonth: docDate.toISOString().substr(0, 7),
      ShelfLifeDaysResolved: 365,
      ExpiryDate: new Date(docDate.getTime() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      DaysToExpire: daysToExpire,
      NearExpiryFlag: daysToExpire <= 30 && daysToExpire >= 0 ? 1 : 0,
      ExpiredFlag: daysToExpire < 0 ? 1 : 0,
    });
  }

  return sampleData;
};

// Layout adapter for new schema format
const adaptLayoutFromSchema = (config: any) => {
  // If config has layout.desktop structure (new schema)
  if (config.layout?.desktop && Array.isArray(config.layout.desktop)) {
    const layoutMap = new Map();

    // Create layout map from desktop layout
    config.layout.desktop.forEach((item: any) => {
      console.log(
        `📐 Layout mapping: ${item.widgetId} -> (${item.x}, ${item.y}) ${item.width}×${item.height}`
      );
      layoutMap.set(item.widgetId, {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      });
    });

    // Add layout to widgets with auto-layout for missing widgets
    let nextAutoY = 0;
    const adaptedWidgets =
      config.widgets?.map((widget: any, index: number) => {
        const existingLayout = layoutMap.get(widget.id);

        if (existingLayout) {
          // Update nextAutoY to avoid overlaps
          nextAutoY = Math.max(
            nextAutoY,
            existingLayout.y + existingLayout.height
          );
          return {
            ...widget,
            layout: existingLayout,
          };
        } else {
          // Auto-layout for widgets not in desktop layout
          const autoLayout = {
            x: (index % 2) * 6, // Alternate between x=0 and x=6
            y: nextAutoY,
            width: 6,
            height: 8,
          };

          console.log(`🔧 Auto-layout for widget "${widget.id}":`, autoLayout);

          // Update nextAutoY for next widget
          if (index % 2 === 1) {
            // Every second widget, move to next row
            nextAutoY += 8;
          }

          return {
            ...widget,
            layout: autoLayout,
          };
        }
      }) || [];

    return {
      ...config,
      widgets: adaptedWidgets,
    };
  }

  // Return as-is if already in old format
  return config;
};

interface DashboardRendererProps {
  configSource?: "localStorage" | "file" | "api";
  fallbackConfig?: any;
}

export default function DashboardRenderer({
  configSource = "localStorage",
  fallbackConfig,
}: DashboardRendererProps) {
  const [config, setConfig] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAndValidateConfig();
  }, [configSource]);

  const loadAndValidateConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      let loadedConfig: any = null;

      // โหลด config จากแหล่งต่าง ๆ
      switch (configSource) {
        case "localStorage":
          const saved = localStorage.getItem("dashboard-config");
          if (saved) {
            loadedConfig = JSON.parse(saved);
          } else if (fallbackConfig) {
            loadedConfig = fallbackConfig;
          }
          break;

        case "file":
          // ใน production อาจโหลดจาก static file
          if (fallbackConfig) {
            loadedConfig = fallbackConfig;
          }
          break;

        case "api":
          // TODO: Implement API loading
          break;
      }

      if (!loadedConfig) {
        setError("No dashboard configuration found");
        setLoading(false);
        return;
      }

      // Validate config ด้วย schema
      const validation = validateConfig(loadedConfig);
      setValidationResult(validation);

      if (validation.valid) {
        // Adapt layout from new schema format to old format
        const adaptedConfig = adaptLayoutFromSchema(loadedConfig);
        setConfig(adaptedConfig);
      } else {
        setError("Invalid dashboard configuration");
      }
    } catch (err) {
      setError(
        `Failed to load config: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || (validationResult && !validationResult.valid)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-600">
              {error || "Invalid Dashboard Configuration"}
            </h1>
          </div>

          {validationResult && !validationResult.valid && (
            <div className="mb-4">
              <h2 className="font-medium text-gray-900 mb-2">
                Configuration Errors:
              </h2>
              <ul className="space-y-2">
                {validationResult.errors.map((err: any, index: number) => (
                  <li
                    key={index}
                    className="bg-red-50 border border-red-200 rounded p-3"
                  >
                    <div className="font-mono text-sm text-red-800">
                      Path:{" "}
                      <span className="bg-red-100 px-1 rounded">
                        {err.path || "root"}
                      </span>
                    </div>
                    <div className="text-red-700 mt-1">{err.message}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={loadAndValidateConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() =>
                (window.location.href = "http://localhost:3001/config-editor")
              }
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Edit Config
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            No Dashboard Configuration
          </h1>
          <p className="text-gray-600 mb-4">
            Please create a dashboard configuration first.
          </p>
          <button
            onClick={() =>
              (window.location.href = "http://localhost:3001/config-editor")
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create Config
          </button>
        </div>
      </div>
    );
  }

  // Render dashboard (simplified version)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {config.dashboardName}
              </h1>
              {config.description && (
                <p className="text-gray-600 text-sm mt-1">
                  {config.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Valid Badge */}
              <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-sm">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Valid Config
              </div>
              <span className="text-sm text-gray-500">
                v{config.version || 1}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="mx-auto px-4 py-6">
        {/* CSS Grid Layout based on config */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${config.layout?.columns || 12}, minmax(0, 1fr))`,
            gridAutoRows: `${config.layout?.rowHeight || 50}px`,
          }}
        >
          {/* Enhanced Widget Cards with Layout Position */}
          {config.widgets?.map((widget: any) => {
            const layout = widget.layout || { x: 0, y: 0, width: 6, height: 4 };

            return (
              <div
                key={widget.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden"
                style={{
                  gridColumn: `${layout.x + 1} / span ${layout.width}`,
                  gridRow: `${layout.y + 1} / span ${layout.height}`,
                }}
              >
                <WidgetRenderer
                  widget={widget}
                  data={generateSampleData()}
                  config={config}
                />
              </div>
            );
          })}
        </div>

        {/* Data Sources Info */}
        {config.dataSources && config.dataSources.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Data Sources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.dataSources.map((ds: any) => (
                <div key={ds.id} className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-900">{ds.id}</h3>
                  <p className="text-sm text-gray-600 mt-1">Type: {ds.type}</p>
                  {ds.accept && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Accepts: </span>
                      {ds.accept.map((ext: string) => (
                        <span
                          key={ext}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1"
                        >
                          {ext}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
