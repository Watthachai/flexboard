"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardPreview from "@/components/dashboard/dashboard-preview";
import DashboardBuilderHeader from "./dashboard-builder-header";
import DashboardStatusBar from "./dashboard-status-bar";
import DashboardTabs from "./dashboard-tabs";
import JsonEditor from "./json-editor";
import SampleStructure from "./sample-structure";

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

  // UI state
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

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
        `/api/tenants/${tenantId}/dashboards/${dashboardId}/metadata`
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

      const response = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}/metadata`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metadata: parsedMetadata,
            createdBy: "admin", // TODO: Get from auth context
          }),
        }
      );

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

      const response = await fetch(
        `/api/tenants/${tenantId}/dashboards/${dashboardId}/metadata/${metadata.id}/publish`,
        {
          method: "POST",
        }
      );

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
          <div className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 dark:text-red-400 mb-4">
            Error: {error}
          </div>
          <Link
            href={`/tenants/${tenantId}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            ← Back to {dashboard?.tenant?.name || "Tenant"} Dashboards
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400 mb-4">
            Dashboard not found
          </div>
          <Link
            href={`/tenants/${tenantId}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            ← Back to Tenant Dashboards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <DashboardBuilderHeader
        dashboard={dashboard}
        tenantId={tenantId}
        dashboardId={dashboardId}
        onSaveDraft={saveDraft}
        onPublish={publishVersion}
        saving={saving}
        publishing={publishing}
        hasMetadata={!!metadata?.id}
        hasJsonError={!!jsonError}
      />

      {/* Status Bar */}
      <DashboardStatusBar metadata={metadata} />

      {/* Tab Navigation */}
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "preview" && metadata && (
        <DashboardPreview
          metadata={metadata.metadata}
          dashboardName={dashboard.name}
        />
      )}

      {/* JSON Editor */}
      {activeTab === "editor" && (
        <>
          <JsonEditor
            jsonCode={jsonCode}
            jsonError={jsonError}
            onJsonChange={handleJsonChange}
          />

          {/* Sample JSON Structure - Only show in editor mode */}
          <SampleStructure dashboard={dashboard} dashboardId={dashboardId} />
        </>
      )}
    </div>
  );
}
