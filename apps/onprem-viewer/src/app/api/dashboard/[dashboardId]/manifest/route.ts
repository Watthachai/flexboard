/**
 * OnPrem Viewer - Dashboard Manifest API
 * Get dashboard manifest configuration from control plane
 */

import { NextRequest, NextResponse } from "next/server";

const CONTROL_PLANE_API_URL =
  process.env.CONTROL_PLANE_API_URL || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ dashboardId: string }> }
) {
  try {
    const { dashboardId } = await context.params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";

    // Fetch manifest from control plane API
    const manifestResponse = await fetch(
      `${CONTROL_PLANE_API_URL}/api/manifest/tenants/${tenantId}/dashboards/${dashboardId}/manifest`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!manifestResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch dashboard manifest" },
        { status: manifestResponse.status }
      );
    }

    const manifestData = await manifestResponse.json();

    // Parse manifestContent if it exists
    let parsedManifest: Record<string, unknown> = {};
    if (manifestData.data?.manifestContent) {
      try {
        parsedManifest = JSON.parse(manifestData.data.manifestContent);
        console.log("📋 Parsed manifestContent successfully:", {
          hasTransforms: !!(parsedManifest as Record<string, unknown>)
            .transforms,
          transformsLength: Array.isArray(
            (parsedManifest as Record<string, unknown>).transforms
          )
            ? (
                (parsedManifest as Record<string, unknown>)
                  .transforms as unknown[]
              ).length
            : 0,
        });
      } catch (error) {
        console.error("Failed to parse manifestContent:", error);
        parsedManifest = manifestData.data;
      }
    } else {
      parsedManifest = manifestData.data;
    }

    return NextResponse.json({
      success: true,
      data: parsedManifest,
    });
  } catch (error) {
    console.error("Error fetching dashboard manifest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
