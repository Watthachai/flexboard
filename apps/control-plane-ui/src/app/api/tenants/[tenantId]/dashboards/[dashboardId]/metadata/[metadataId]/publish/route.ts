import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: { tenantId: string; dashboardId: string; metadataId: string } }
) {
  try {
    const { tenantId, dashboardId, metadataId } = params;

    const response = await fetch(
      `${envConfig.apiUrl}/api/metadata/${metadataId}/publish`,
      {
        method: "POST",
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
    console.error("Error publishing metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish metadata" },
      { status: 500 }
    );
  }
}
