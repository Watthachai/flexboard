import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string }> }
) {
  try {
    const { tenantId, dashboardId } = await params;

    // Handle "new" route - return empty metadata template
    if (dashboardId === "new") {
      return NextResponse.json({
        success: true,
        data: {
          id: "new",
          version: 1,
          metadata: {
            dashboard: {
              id: "new",
              name: "New Dashboard",
              slug: "new-dashboard",
              tenantId,
            },
            widgets: [],
            config: {
              layout: {
                columns: 24,
                rows: 16,
                gridSize: 40,
              },
            },
          },
          status: "draft",
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const response = await fetch(
      `${envConfig.apiUrl}/api/dashboards/${dashboardId}/metadata`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard metadata" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string }> }
) {
  try {
    const { tenantId, dashboardId } = await params;
    const body = await request.json();

    const response = await fetch(
      `${envConfig.apiUrl}/api/dashboards/${dashboardId}/metadata`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating dashboard metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update dashboard metadata" },
      { status: 500 }
    );
  }
}
