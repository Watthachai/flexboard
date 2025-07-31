/**
 * Dashboard Edit Options Component
 * Shows both visual editor and code editor options with sync status
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MousePointer,
  Code,
  AlertTriangle,
  CheckCircle,
  ArrowRightLeft,
} from "lucide-react";
import Link from "next/link";
import { DashboardSyncService } from "@/services/dashboard-sync.service";

interface DashboardEditOptionsProps {
  tenantId: string;
  dashboardId: string;
  dashboardName: string;
}

export default function DashboardEditOptions({
  tenantId,
  dashboardId,
  dashboardName,
}: DashboardEditOptionsProps) {
  const [syncStatus, setSyncStatus] = useState<{
    hasVisual: boolean;
    hasManifest: boolean;
    lastVisualUpdate?: string;
    lastManifestUpdate?: string;
    needsSync: boolean;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSyncStatus();
  }, [tenantId, dashboardId]);

  const checkSyncStatus = async () => {
    try {
      setLoading(true);
      const status = await DashboardSyncService.getSyncStatus(
        tenantId,
        dashboardId
      );
      setSyncStatus(status);
    } catch (error) {
      console.error("Error checking sync status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncVisualToCode = async () => {
    try {
      setSyncing(true);
      const result = await DashboardSyncService.syncVisualToManifest(
        tenantId,
        dashboardId
      );
      if (result.success) {
        await checkSyncStatus();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error syncing visual to code:", error);
      alert("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncCodeToVisual = async () => {
    try {
      setSyncing(true);
      const result = await DashboardSyncService.syncManifestToVisual(
        tenantId,
        dashboardId
      );
      if (result.success) {
        await checkSyncStatus();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error syncing code to visual:", error);
      alert("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">
            Checking dashboard status...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sync Status */}
      {syncStatus && (
        <Alert
          className={
            syncStatus.needsSync
              ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-500/50"
              : "border-green-500/50 bg-green-50 dark:bg-green-950/30 dark:border-green-500/50"
          }
        >
          <div className="flex items-center">
            {syncStatus.needsSync ? (
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            <AlertDescription className="ml-2 text-foreground">
              {syncStatus.needsSync
                ? "Visual and code versions may be out of sync"
                : "Dashboard versions are synchronized"}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Edit Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Visual Editor */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <MousePointer className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Visual Editor</h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop interface
              </p>
            </div>
            {syncStatus?.hasVisual && (
              <Badge variant="secondary" className="flex-shrink-0">
                Available
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Build your dashboard visually using our intuitive drag-and-drop
            interface. Perfect for quick prototyping and non-technical users.
          </p>

          <div className="space-y-2">
            <Link
              href={`/tenants/${tenantId}/dashboards/${dashboardId}/builder`}
              className="block"
            >
              <Button className="w-full">
                <MousePointer className="h-4 w-4 mr-2" />
                Open Visual Editor
              </Button>
            </Link>

            {syncStatus?.hasManifest && syncStatus?.needsSync && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleSyncCodeToVisual}
                disabled={syncing}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {syncing ? "Syncing..." : "Sync from Code"}
              </Button>
            )}
          </div>

          {syncStatus?.lastVisualUpdate && (
            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
              Last updated:{" "}
              {new Date(syncStatus.lastVisualUpdate).toLocaleString()}
            </p>
          )}
        </Card>

        {/* Code Editor */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                Dashboard as Code
              </h3>
              <p className="text-sm text-muted-foreground">
                JSON/YAML configuration
              </p>
            </div>
            {syncStatus?.hasManifest && (
              <Badge variant="secondary" className="flex-shrink-0">
                Available
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Define your dashboard using code. Perfect for version control,
            automation, and advanced customization.
          </p>

          <div className="space-y-2">
            <Link
              href={`/tenants/${tenantId}/dashboards/${dashboardId}/edit`}
              className="block"
            >
              <Button className="w-full">
                <Code className="h-4 w-4 mr-2" />
                Open Code Editor
              </Button>
            </Link>

            {syncStatus?.hasVisual && syncStatus?.needsSync && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleSyncVisualToCode}
                disabled={syncing}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {syncing ? "Syncing..." : "Sync from Visual"}
              </Button>
            )}
          </div>

          {syncStatus?.lastManifestUpdate && (
            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
              Last updated: {syncStatus.lastManifestUpdate}
            </p>
          )}
        </Card>
      </div>

      {/* Help Text */}
      <Card className="p-4 sm:p-6 bg-muted/30 border-muted">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <span className="text-lg mr-2">💡</span>
          How it works
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Visual Editor:
                </p>
                <p className="text-xs text-muted-foreground">
                  Create dashboards using drag & drop
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Code Editor:
                </p>
                <p className="text-xs text-muted-foreground">
                  Define dashboards using JSON configuration
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">Sync:</p>
                <p className="text-xs text-muted-foreground">
                  Keep both versions in sync as needed
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Unified Data:
                </p>
                <p className="text-xs text-muted-foreground">
                  Both editors work with the same dashboard data
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
