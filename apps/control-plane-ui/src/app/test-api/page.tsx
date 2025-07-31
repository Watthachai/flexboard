"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  response?: any;
  error?: string;
  duration?: number;
}

export default function APITestPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const BASE_URL = "http://localhost:8000";
  const TENANT_ID = "vpi-co-ltd";

  const testCases = [
    {
      name: "List Dashboard Manifests",
      method: "GET",
      url: `/api/manifest/tenants/${TENANT_ID}/dashboards/manifests`,
      body: null,
    },
    {
      name: "Create Dashboard Manifest",
      method: "POST",
      url: `/api/manifest/tenants/${TENANT_ID}/dashboards/manifests`,
      body: {
        name: "API Test Dashboard",
        description: "Dashboard created via API test",
        targetTeams: ["sales", "test"],
        manifestContent: JSON.stringify({
          schemaVersion: "1.0",
          dashboardId: "",
          dashboardName: "API Test Dashboard",
          description: "Dashboard created via API test",
          version: 1,
          targetTeams: ["sales", "test"],
          layout: {
            type: "grid",
            columns: 12,
            rowHeight: 60,
          },
          widgets: [
            {
              id: "test-kpi",
              title: "Test KPI",
              type: "kpi-card",
              position: { x: 0, y: 0, w: 3, h: 2 },
              dataSourceId: "test_data",
            },
          ],
          dataSources: [
            {
              id: "test_data",
              type: "sql",
              query: "SELECT 1 as value",
            },
          ],
        }),
      },
    },
  ];

  const runTest = async (testCase: any): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      const response = await fetch(`${BASE_URL}${testCase.url}`, {
        method: testCase.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: testCase.body ? JSON.stringify(testCase.body) : undefined,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        name: testCase.name,
        status: "success",
        response: data,
        duration,
      };
    } catch (error) {
      return {
        name: testCase.name,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    for (const testCase of testCases) {
      // Add pending test
      setTests((prev) => [...prev, { name: testCase.name, status: "pending" }]);

      // Run test
      const result = await runTest(testCase);

      // Update with result
      setTests((prev) =>
        prev.map((test) => (test.name === testCase.name ? result : test))
      );
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Running...</Badge>;
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Manifest API Tests</h1>
          <p className="text-muted-foreground">
            Test the Dashboard as Code API endpoints
          </p>
        </div>
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="min-w-[120px]"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            "Run Tests"
          )}
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Make sure your API server is running on <code>localhost:8000</code>{" "}
          before running tests.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(test.status)}
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(test.status)}
                  {test.duration && (
                    <Badge variant="outline">{test.duration}ms</Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            {(test.response || test.error) && (
              <CardContent>
                {test.status === "success" && test.response && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2">
                      Response:
                    </p>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(test.response, null, 2)}
                    </pre>
                  </div>
                )}

                {test.status === "error" && test.error && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-2">
                      Error:
                    </p>
                    <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                      {test.error}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {tests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Click "Run Tests" to start testing the API endpoints
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
