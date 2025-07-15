"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  widgets: any[];
}

interface MetadataVersion {
  id: string;
  version: number;
  metadata: any;
  status: "draft" | "published" | "archived";
  createdAt: string;
  publishedAt?: string;
}

export default function DashboardBuilderContent() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const dashboardId = params.dashboardId as string;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [metadata, setMetadata] = useState<MetadataVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // JSON Editor state
  const [jsonCode, setJsonCode] = useState<string>("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (dashboardId && tenantId) {
      fetchDashboardData();
    }
  }, [dashboardId, tenantId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard info
      const dashboardResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}`
      );
      const dashboardData = await dashboardResponse.json();

      if (!dashboardData.success) {
        throw new Error(dashboardData.error || "Failed to fetch dashboard");
      }

      setDashboard(dashboardData.data);

      // Fetch metadata
      const metadataResponse = await fetch(
        `/api/dashboards/${dashboardId}/metadata`
      );
      const metadataData = await metadataResponse.json();

      if (!metadataData.success) {
        throw new Error(metadataData.error || "Failed to fetch metadata");
      }

      setMetadata(metadataData.data);
      setJsonCode(JSON.stringify(metadataData.data.metadata, null, 2));
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      setJsonError(null);
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonCode(value);
    validateJson(value);
  };

  const saveDraft = async () => {
    if (!validateJson(jsonCode)) {
      alert("Please fix JSON errors before saving");
      return;
    }

    try {
      setSaving(true);

      const parsedMetadata = JSON.parse(jsonCode);

      const response = await fetch(`/api/dashboards/${dashboardId}/metadata`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: parsedMetadata,
          createdBy: "admin", // TODO: Get from auth context
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save metadata");
      }

      // Refresh metadata
      await fetchDashboardData();

      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const publishVersion = async () => {
    if (!metadata?.id) {
      alert("Please save a draft first");
      return;
    }

    try {
      setPublishing(true);

      const response = await fetch(`/api/metadata/${metadata.id}/publish`, {
        method: "POST",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to publish metadata");
      }

      // Refresh metadata
      await fetchDashboardData();

      alert("Version published successfully!");
    } catch (error) {
      console.error("Error publishing version:", error);
      alert(
        error instanceof Error ? error.message : "Failed to publish version"
      );
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Link
            href={`/tenants/${tenantId}`}
            className="text-primary hover:underline"
          >
            ← Back to Dashboards
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-muted-foreground mb-4">Dashboard not found</div>
          <Link
            href={`/tenants/${tenantId}`}
            className="text-primary hover:underline"
          >
            ← Back to Dashboards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/tenants" className="hover:text-blue-600">
              Tenants
            </Link>
            <span>/</span>
            <Link href={`/tenants/${tenantId}`} className="hover:text-blue-600">
              {dashboard?.tenant.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{dashboard?.name}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Builder
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href={`/tenants/${tenantId}/dashboards/${dashboardId}/builder`}
            className="inline-flex items-center"
          >
            <Button variant="outline">
              <span className="mr-2">🎨</span>
              Visual Builder
            </Button>
          </Link>

          <Button
            onClick={saveDraft}
            disabled={saving || !!jsonError}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Save Draft"}
          </Button>

          <Button
            onClick={publishVersion}
            disabled={!metadata?.id || publishing}
            className="bg-green-600 hover:bg-green-700"
          >
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h3 className="font-medium">Current Version</h3>
              <p className="text-sm text-muted-foreground">
                v{metadata?.version || 0}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Status</h3>
              <div className="flex items-center gap-2">
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    metadata?.status === "published"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : metadata?.status === "draft"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {metadata?.status || "draft"}
                </div>
              </div>
            </div>
            {metadata?.publishedAt && (
              <div>
                <h3 className="font-medium">Last Published</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(metadata.publishedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* JSON Editor */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Dashboard Metadata</h2>
          {jsonError && (
            <div className="text-red-500 text-sm">JSON Error: {jsonError}</div>
          )}
        </div>

        <div className="relative">
          <textarea
            value={jsonCode}
            onChange={(e) => handleJsonChange(e.target.value)}
            className={`w-full h-96 p-4 font-mono text-sm border rounded-md bg-background ${
              jsonError
                ? "border-red-500 focus:border-red-500"
                : "border-border focus:border-primary"
            }`}
            placeholder="Enter your dashboard metadata JSON..."
            spellCheck={false}
          />
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Tip:</strong> This JSON defines your dashboard structure,
            widgets, and configuration.
          </p>
          <p>
            Save as draft to test changes, then publish when ready to deploy to
            agents.
          </p>
        </div>
      </Card>

      {/* Sample JSON Structure */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Sample Structure</h3>
        <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
          {`{
  "dashboards": [
    {
      "id": "${dashboardId}",
      "name": "${dashboard.name}",
      "slug": "${dashboard.slug}",
      "tabs": [
        {
          "id": "tab1",
          "name": "Overview",
          "widgets": ["widget1", "widget2"]
        }
      ]
    }
  ],
  "widgets": [
    {
      "id": "widget1",
      "type": "chart",
      "title": "Sales Overview",
      "config": {
        "chartType": "line",
        "dataSource": "sales_api",
        "refreshInterval": 30000
      }
    }
  ],
  "config": {
    "theme": "light",
    "refreshInterval": 300000
  }
}`}
        </pre>
      </Card>
    </div>
  );
}
