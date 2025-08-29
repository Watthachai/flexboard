import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string }> }
) {
  try {
    const { tenantId, dashboardId } = await params;

    console.log(
      `Forwarding manifest request to control-plane-api: tenantId=${tenantId}, dashboardId=${dashboardId}`
    );

    const response = await fetch(
      `${envConfig.apiUrl}/api/manifest/tenants/${tenantId}/dashboards/${dashboardId}/manifest`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Control Plane API error:", errorText);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard manifest:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch manifest",
      },
      { status: 500 }
    );
  }
}
