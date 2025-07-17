/**
 * Dashboard Preview Page
 * Read-only preview of the dashboard
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import DashboardCanvas from "@/components/dashboard/dashboard-canvas";
import { DashboardConfig } from "@/types/dashboard-editor";

export default function DashboardPreviewPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const dashboardId = params.dashboardId as string;

  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<string>("desktop");

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/tenants/${tenantId}/dashboards/${dashboardId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load dashboard");
        }

        const dashboardData = await response.json();

        // Create DashboardConfig from API response
        const dashboardConfig: DashboardConfig = {
          id: dashboardId,
          name: dashboardData.data.name,
          widgets: [],
          layout: [],
          layout_config: {
            columns: 24,
            rows: 16,
            gridSize: 40,
            breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
            cols: { lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 },
          },
          theme: "light",
        };

        // Process widgets if they exist
        if (dashboardData.data.widgets) {
          dashboardConfig.widgets = dashboardData.data.widgets.map(
            (widget: any, index: number) => ({
              id: widget.id || `widget-${index}`,
              type: widget.type || "kpi",
              title: widget.title || "Sample Widget",
              x: widget.x || 0,
              y: widget.y || 0,
              width: widget.width || 200,
              height: widget.height || 150,
              config: widget.config || {},
              data: widget.data,
            })
          );

          // Create layout items from widgets
          dashboardConfig.layout = dashboardConfig.widgets.map((widget) => ({
            i: widget.id,
            x: Math.floor(widget.x / dashboardConfig.layout_config.gridSize),
            y: Math.floor(widget.y / dashboardConfig.layout_config.gridSize),
            w: Math.ceil(widget.width / dashboardConfig.layout_config.gridSize),
            h: Math.ceil(
              widget.height / dashboardConfig.layout_config.gridSize
            ),
          }));
        }

        setDashboard(dashboardConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (dashboardId && tenantId) {
      loadDashboard();
    }
  }, [dashboardId, tenantId]);

  const getPreviewStyles = () => {
    switch (previewMode) {
      case "mobile":
        return { maxWidth: "375px", margin: "0 auto" };
      case "tablet":
        return { maxWidth: "768px", margin: "0 auto" };
      case "desktop":
      default:
        return { width: "100%" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard preview...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <p className="text-lg font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Link href={`/tenants/${tenantId}/dashboards`}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboards
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-gray-600 dark:text-gray-400 mb-4">
            <p className="text-lg font-semibold">Dashboard Not Found</p>
            <p className="text-sm">
              The requested dashboard could not be found.
            </p>
          </div>
          <Link href={`/tenants/${tenantId}/dashboards`}>
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboards
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/tenants/${tenantId}/dashboards/${dashboardId}/builder`}
            >
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Builder
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {dashboard.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preview Mode
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview Mode Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant={previewMode === "desktop" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === "tablet" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("tablet")}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === "mobile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4">
        <div style={getPreviewStyles()}>
          <DashboardCanvas
            dashboard={dashboard}
            selectedWidget={null}
            isPreviewMode={true}
            onSelectWidget={() => {}} // No-op in preview mode
            onMoveWidget={() => {}} // No-op in preview mode
            onResizeWidget={() => {}} // No-op in preview mode
            onDeleteWidget={() => {}} // No-op in preview mode
            onDuplicateWidget={() => {}} // No-op in preview mode
            onDropWidget={() => {}} // No-op in preview mode
          />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 right-4">
        <Card className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              {previewMode === "desktop" && <Monitor className="w-4 h-4" />}
              {previewMode === "tablet" && <Tablet className="w-4 h-4" />}
              {previewMode === "mobile" && <Smartphone className="w-4 h-4" />}
              <span className="capitalize">{previewMode} Preview</span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <span>{dashboard.widgets.length} widgets</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
