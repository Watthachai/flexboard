/**
 * Local Manifest Override Route
 * Provides modified manifest without p            // Update field names to match PascalCase format (to work with JSON manifest)
            dateParsing: {
              ...ds.dateParsing,
              DataDate: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // PascalCase
              DocDate: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",  // PascalCase
            },atic globalFilters for testing
 */

import { NextRequest, NextResponse } from "next/server";

const CONTROL_PLANE_BASE_URL =
  process.env.NEXT_PUBLIC_CONTROL_PLANE_API_URL ||
  "https://sandbox.api-flexboard.fittcoreai.com";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ dashboardId: string }> }
) {
  try {
    const { dashboardId } = await context.params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";

    console.log("🔧 Override manifest for:", { tenantId, dashboardId });

    // Fetch original manifest from control plane
    const manifestResponse = await fetch(
      `${CONTROL_PLANE_BASE_URL}/api/manifest/tenants/${tenantId}/dashboards/${dashboardId}/manifest`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!manifestResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch dashboard manifest from control plane" },
        { status: manifestResponse.status }
      );
    }

    const manifestData = await manifestResponse.json();

    // Parse manifestContent if it exists
    let parsedManifest: any = {};
    if (manifestData.data?.manifestContent) {
      try {
        parsedManifest = JSON.parse(manifestData.data.manifestContent);
      } catch (error) {
        console.error("Failed to parse manifestContent:", error);
        parsedManifest = manifestData.data;
      }
    } else {
      parsedManifest = manifestData.data;
    }

    // Override: Modify only what's necessary for local API
    const overriddenManifest = {
      ...parsedManifest,
      // Temporarily disable problematic filters for debugging
      // TODO: Fix date parsing and expression evaluation instead
      globalFilters:
        searchParams.get("debug") === "true"
          ? []
          : parsedManifest.globalFilters || [],
      userFilters:
        searchParams.get("debug") === "true"
          ? []
          : parsedManifest.userFilters || [],

      // Update dataSources to use local API
      dataSources: (parsedManifest.dataSources || []).map((ds: any) => {
        if (ds.id === "uploaded-xml") {
          return {
            ...ds,
            type: "api",
            url: "/api/inventory/raw",
            method: "GET",
            // Update field names to match database camelCase format
            dateParsing: {
              ...ds.dateParsing,
              dataDate: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // camelCase
              docDate: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // camelCase
            },
            // Add pagination for better performance
            pagination: {
              enabled: true,
              pageSize: 5000, // Larger chunks for better calculation accuracy
              loadAll: searchParams.get("loadAll") === "true", // Allow full load via parameter
            },
          };
        }
        return ds;
      }),
    };

    console.log("✅ Override manifest created successfully:", {
      originalGlobalFilters: parsedManifest.globalFilters?.length || 0,
      newGlobalFilters: overriddenManifest.globalFilters.length,
      dataSource: overriddenManifest.dataSources[0],
    });

    return NextResponse.json({
      success: true,
      data: overriddenManifest,
    });
  } catch (error) {
    console.error("❌ Override manifest error:", error);
    return NextResponse.json(
      { error: "Failed to create override manifest" },
      { status: 500 }
    );
  }
}
