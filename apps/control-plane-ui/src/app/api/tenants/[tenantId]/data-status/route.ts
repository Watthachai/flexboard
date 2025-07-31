/**
 * Data Status API Route
 * เช็คว่า tenant มีข้อมูล XML upload ไว้หรือยัง
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;

    // Call Control Plane API to check data status
    const apiUrl = process.env.CONTROL_PLANE_API_URL || "http://localhost:4000";

    try {
      const apiResponse = await fetch(
        `${apiUrl}/api/tenants/${tenantId}/data-status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        return NextResponse.json(apiData);
      } else {
        return NextResponse.json({
          hasData: false,
          message: "No data available. Please upload XML file first.",
        });
      }
    } catch (apiError) {
      console.warn(`[Control Plane UI] API call failed:`, apiError);

      return NextResponse.json({
        hasData: false,
        message: "Data service temporarily unavailable.",
        error: "API_UNAVAILABLE",
      });
    }
  } catch (error) {
    console.error("[Control Plane UI] Error checking data status:", error);
    return NextResponse.json(
      {
        hasData: false,
        error: "Failed to check data status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
