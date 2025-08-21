import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    console.log("Creating dashboard-as-code for tenant:", tenantId);
    console.log("Dashboard manifest:", JSON.stringify(body, null, 2));

    const response = await fetch(
      `${envConfig.apiUrl}/api/tenants/${tenantId}/dashboards`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Control Plane API error:", errorText);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Dashboard created successfully:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating dashboard-as-code:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create dashboard",
      },
      { status: 500 }
    );
  }
}
