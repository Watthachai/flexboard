/**
 * SQL Configurator - For connecting to SQL databases
 */

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Widget } from "@/types/dashboard-editor";
import { Database, Play, CheckCircle, AlertCircle } from "lucide-react";

interface SQLConfiguratorProps {
  widget: Widget;
  tenantId: string;
  onConfigChange: (config: any) => void;
}

export function SQLConfigurator({
  widget,
  tenantId,
  onConfigChange,
}: SQLConfiguratorProps) {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    rowCount?: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  // Current configuration from widget
  const currentConfig = (widget.config as any)?.dataSourceConfig || {};
  const query = currentConfig.query || "";
  const parameters = currentConfig.parameters || "{}";
  const refreshInterval = currentConfig.refreshInterval || 300000;

  const handleConfigChange = (updates: any) => {
    onConfigChange({
      ...currentConfig,
      type: "sql",
      ...updates,
    });
  };

  const handleTestQuery = async () => {
    if (!query.trim()) {
      setTestResult({
        success: false,
        message: "Please enter a SQL query to test",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Mock API call for testing SQL query
      const response = await fetch(`/api/tenants/${tenantId}/query/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          parameters: JSON.parse(parameters || "{}"),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({
          success: true,
          message: "Query executed successfully",
          rowCount: result.rowCount || 0,
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || "Query failed",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to test query",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SQL Query */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">
            <Database className="w-4 h-4 mr-2" />
            SQL Query
          </Label>

          <Textarea
            placeholder="SELECT * FROM your_table WHERE condition = @param"
            value={query}
            onChange={(e) => handleConfigChange({ query: e.target.value })}
            rows={8}
            className="font-mono text-sm"
          />

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Use <code>@paramName</code> for parameters. Example:{" "}
            <code>WHERE date &gt; @startDate</code>
          </div>
        </div>
      </Card>

      {/* Query Parameters */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Query Parameters (JSON)</Label>

          <Textarea
            placeholder='{"startDate": "2024-01-01", "limit": 100}'
            value={parameters}
            onChange={(e) => handleConfigChange({ parameters: e.target.value })}
            rows={4}
            className="font-mono text-sm"
          />

          <div className="text-xs text-gray-500 dark:text-gray-400">
            JSON object with parameter values that will replace{" "}
            <code>@paramName</code> in your query
          </div>
        </div>
      </Card>

      {/* Refresh Interval */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Refresh Interval (seconds)
          </Label>

          <Input
            type="number"
            placeholder="300"
            value={refreshInterval / 1000}
            onChange={(e) =>
              handleConfigChange({
                refreshInterval: parseInt(e.target.value) * 1000,
              })
            }
            min="10"
            max="3600"
          />

          <div className="text-xs text-gray-500 dark:text-gray-400">
            How often the widget should refresh its data (10-3600 seconds)
          </div>
        </div>
      </Card>

      {/* Test Query Button */}
      <Card className="p-4">
        <div className="space-y-3">
          <Button
            onClick={handleTestQuery}
            disabled={testing || !query.trim()}
            className="w-full"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing Query...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Query
              </>
            )}
          </Button>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-md flex items-start space-x-2 ${
                testResult.success
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}

              <div>
                <div className="font-medium">{testResult.message}</div>
                {testResult.success && testResult.rowCount !== undefined && (
                  <div className="text-sm mt-1">
                    Returned {testResult.rowCount.toLocaleString()} rows
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Connection Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <div className="font-medium mb-2">Database Connection</div>
          <div className="text-xs space-y-1">
            <div>• Connection is managed by your system administrator</div>
            <div>• Queries are executed with read-only permissions</div>
            <div>• Query timeout is set to 30 seconds</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
