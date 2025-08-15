import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    console.log("Saving column data for tenant:", tenantId);
    console.log("Column data:", JSON.stringify(body, null, 2));

    const response = await fetch(
      `${envConfig.apiUrl}/api/tenants/${tenantId}/data-columns`,
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
    console.log("Column data saved successfully:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error saving column data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save column data",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    const response = await fetch(
      `${envConfig.apiUrl}/api/tenants/${tenantId}/data-columns`,
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
    console.error("Error fetching column data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch column data",
      },
      { status: 500 }
    );
  }
}
