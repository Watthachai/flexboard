import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${envConfig.apiUrl}/tenants/${params.tenantId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating tenant status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tenant status" },
      { status: 500 }
    );
  }
}
