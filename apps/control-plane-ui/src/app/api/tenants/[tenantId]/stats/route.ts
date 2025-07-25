import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const response = await fetch(
      `${envConfig.apiUrl}/tenants/${params.tenantId}/stats`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tenant stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenant stats" },
      { status: 500 }
    );
  }
}
