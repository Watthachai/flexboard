/**
 * Data Properties Panel - Dynamic UI for configuring widget data sources
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { UploadedDataConfigurator } from "@/components/dashboard/data/UploadedDataConfigurator";
import { AdvancedDataConfigurator } from "@/components/dashboard/data/AdvancedDataConfigurator";
import { QuickSetupHelper } from "@/components/dashboard/data/QuickSetupHelper";
import { ManualSetupInstructions } from "@/components/dashboard/data/ManualSetupInstructions";
import { Widget } from "@/types/dashboard-editor";
import { Database, Upload, Globe, Settings } from "lucide-react";

interface DataPropertiesPanelProps {
  tenantId: string;
  widget?: Widget;
  onUpdateWidget?: (updates: Partial<Widget>) => void;
}

interface DataSourceConfig {
  type?: string;
  selectedDatasetId?: string;
  selectedColumns?: string[];
  transformations?: any;
  query?: string;
  parameters?: string;
  refreshInterval?: number;
}

// Temporary SQLConfigurator placeholder
const SQLConfigurator = ({
  tenantId,
  onConfigChange,
}: {
  widget: Widget;
  tenantId: string;
  onConfigChange: (config: DataSourceConfig) => void;
}) => (
  <div className="text-center p-8 text-gray-500 dark:text-gray-400">
    <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p>SQL Configurator</p>
    <p className="text-xs">Coming soon...</p>
    <p className="text-xs">Tenant ID: {tenantId}</p>
    <p className="text-xs">
      This will configure: {JSON.stringify(onConfigChange.name)}
    </p>
  </div>
);

export function DataPropertiesPanel({
  tenantId,
  widget: propsWidget,
  onUpdateWidget,
}: DataPropertiesPanelProps) {
  const { getActiveWidgetConfig, updateWidgetConfig } = useDashboardStore();
  const activeWidget = propsWidget || getActiveWidgetConfig();

  if (!activeWidget) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Select a widget to configure its data source</p>
      </div>
    );
  }

  // Safe access to dataSourceConfig with proper typing
  const widgetConfig = activeWidget.config as Record<string, unknown>;
  const dataSourceConfig = widgetConfig?.dataSourceConfig as
    | DataSourceConfig
    | undefined;
  const dataSourceType = dataSourceConfig?.type || "api";

  const handleDataSourceTypeChange = (type: string) => {
    const newConfig = {
      dataSourceConfig: {
        type,
        // Reset other configs when changing type
        ...(type === "uploadedData" && {
          selectedDatasetId: null,
          selectedColumns: [],
          transformations: {},
        }),
        ...(type === "sql" && {
          connectionId: null,
          query: "",
          parameters: "{}",
        }),
        ...(type === "api" && {
          endpoint: "",
          method: "GET",
          headers: "{}",
        }),
      },
    };

    if (onUpdateWidget && activeWidget) {
      onUpdateWidget({
        config: {
          ...activeWidget.config,
          ...newConfig,
        },
      });
    } else {
      updateWidgetConfig(activeWidget.id, newConfig);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Data Configuration
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure how this widget gets its data
        </p>
      </div>

      {/* Data Source Type Selector */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label htmlFor="dataSourceType" className="text-sm font-medium">
            Data Source Type
          </Label>

          <Select
            value={dataSourceType}
            onValueChange={handleDataSourceTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uploadedData">
                <div className="flex items-center">
                  <Upload className="w-4 h-4 mr-2 text-green-500" />
                  <div>
                    <div className="font-medium">Uploaded Data</div>
                    <div className="text-xs text-gray-500">
                      Use data uploaded via CSV/Excel
                    </div>
                  </div>
                </div>
              </SelectItem>

              <SelectItem value="sql">
                <div className="flex items-center">
                  <Database className="w-4 h-4 mr-2 text-blue-500" />
                  <div>
                    <div className="font-medium">SQL Database</div>
                    <div className="text-xs text-gray-500">
                      Connect to SQL Server, PostgreSQL, etc.
                    </div>
                  </div>
                </div>
              </SelectItem>

              <SelectItem value="api">
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-purple-500" />
                  <div>
                    <div className="font-medium">API Endpoint</div>
                    <div className="text-xs text-gray-500">
                      Fetch data from REST API
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Quick Setup Helper with Fallback */}
      {(dataSourceType === "api" ||
        dataSourceType === "sql" ||
        !dataSourceConfig?.selectedDatasetId) && (
        <>
          <QuickSetupHelper
            widgetId={activeWidget.id}
            widgetType={activeWidget.type}
          />
          {/* Fallback manual instructions */}
          <ManualSetupInstructions widgetType={activeWidget.type} />
        </>
      )}

      {/* Dynamic Configuration UI based on selected type */}
      {dataSourceType === "uploadedData" && (
        <AdvancedDataConfigurator
          widget={activeWidget}
          tenantId={tenantId}
          onConfigChange={(config: DataSourceConfig) => {
            if (onUpdateWidget && activeWidget) {
              onUpdateWidget({
                config: {
                  ...activeWidget.config,
                  dataSourceConfig: config,
                },
              });
            } else {
              updateWidgetConfig(activeWidget.id, { dataSourceConfig: config });
            }
          }}
        />
      )}

      {dataSourceType === "sql" && (
        <SQLConfigurator
          widget={activeWidget}
          tenantId={tenantId}
          onConfigChange={(config: DataSourceConfig) =>
            updateWidgetConfig(activeWidget.id, { dataSourceConfig: config })
          }
        />
      )}

      {dataSourceType === "api" && (
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>API Configurator</p>
          <p className="text-xs">Coming soon...</p>
        </div>
      )}
    </div>
  );
}
