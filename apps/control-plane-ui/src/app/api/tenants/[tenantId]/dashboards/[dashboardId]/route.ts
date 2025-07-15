import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string }> }
) {
  try {
    const { tenantId, dashboardId } = await params;

    const response = await fetch(
      `${envConfig.apiUrl}/api/tenants/${tenantId}/dashboards/${dashboardId}`,
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
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch dashboard",
      },
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
      `${envConfig.apiUrl}/api/tenants/${tenantId}/dashboards/${dashboardId}`,
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
    console.error("Error updating dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update dashboard",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string }> }
) {
  try {
    const { tenantId, dashboardId } = await params;

    const response = await fetch(
      `${envConfig.apiUrl}/api/tenants/${tenantId}/dashboards/${dashboardId}`,
      {
        method: "DELETE",
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
    console.error("Error deleting dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete dashboard",
      },
      { status: 500 }
    );
  }
}
