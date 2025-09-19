/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OnPrem Dashboard Creation API - Creates dashboards from JSON manifests
 */
import { NextRequest, NextResponse } from "next/server";

// Dashboard manifest interface
interface DashboardManifest {
  schemaVersion?: string;
  dashboardId: string;
  dashboardName: string;
  description?: string;
  version?: number;
  targetTeams?: string[];
  layout?: any;
  widgets: any[];
  dataSources?: any[];
  lastUpdated?: string;
}

export async function POST(request: NextRequest) {
  try {
    const manifest = await request.json();

    // Validate manifest structure
    if (!manifest.dashboardId || !manifest.dashboardName || !manifest.widgets) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid manifest: missing required fields (dashboardId, dashboardName, widgets)",
        },
        { status: 400 }
      );
    }

    // Store manifest locally (in real implementation, this would save to file system or local DB)
    const dashboards = getStoredDashboards();
    const existingIndex = dashboards.findIndex(
      (d) => d.dashboardId === manifest.dashboardId
    );

    if (existingIndex >= 0) {
      // Update existing dashboard
      dashboards[existingIndex] = {
        ...manifest,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      // Add new dashboard
      dashboards.push({
        ...manifest,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Save to storage (removed localStorage - use file system or database in production)
    // localStorage is not available in API routes (server-side)
    // Instead, you could save to a JSON file or database here

    return NextResponse.json({
      success: true,
      message: `Dashboard '${manifest.dashboardName}' created/updated successfully`,
      dashboardId: manifest.dashboardId,
      widgetCount: manifest.widgets.length,
    });
  } catch (error) {
    console.error("Dashboard creation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create dashboard: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return all stored dashboards
    const dashboards = getStoredDashboards();

    return NextResponse.json({
      success: true,
      dashboards: dashboards.map((dashboard) => ({
        dashboardId: dashboard.dashboardId,
        name: dashboard.dashboardName,
        description: dashboard.description,
        version: dashboard.version,
        widgetCount: dashboard.widgets.length,
        lastUpdated: dashboard.lastUpdated,
        targetTeams: dashboard.targetTeams,
      })),
    });
  } catch (error) {
    console.error("Dashboard listing failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to list dashboards: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}

function getStoredDashboards(): DashboardManifest[] {
  // In a real OnPrem deployment, this would read from file system or local database
  // Return empty array - no mock data, only real dashboards from sync or uploads
  return [];
}
