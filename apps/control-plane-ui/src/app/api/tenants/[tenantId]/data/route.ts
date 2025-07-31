/**
 * Get XML Data API Route
 * เรียกข้อมูล XML ที่ upload ไว้สำหรับใช้ใน charts
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const { searchParams } = new URL(request.url);
    const columns = searchParams.get("columns"); // comma separated columns
    const limit = parseInt(searchParams.get("limit") || "100");

    // For now, call Control Plane API to get data
    const apiUrl = process.env.CONTROL_PLANE_API_URL || "http://localhost:4000";

    try {
      const apiResponse = await fetch(
        `${apiUrl}/api/tenants/${tenantId}/data`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();

        // Filter columns if specified
        let filteredData = apiData.records || [];
        if (columns) {
          const selectedColumns = columns.split(",").map((c) => c.trim());
          filteredData = filteredData.map((record: any) => {
            const filtered: any = {};
            selectedColumns.forEach((col) => {
              if (record[col] !== undefined) {
                filtered[col] = record[col];
              }
            });
            return filtered;
          });
        }

        // Apply limit
        if (limit && limit > 0) {
          filteredData = filteredData.slice(0, limit);
        }

        return NextResponse.json({
          success: true,
          data: filteredData,
          totalRecords: apiData.totalRecords || filteredData.length,
          availableColumns: apiData.availableColumns || [],
          metadata: {
            tenantId,
            source: "xml_upload",
            filteredColumns: columns
              ? columns.split(",").map((c) => c.trim())
              : null,
            limit: limit,
          },
        });
      } else {
        // Fallback: Return empty data structure
        return NextResponse.json({
          success: false,
          message: "No data available. Please upload XML file first.",
          data: [],
          totalRecords: 0,
          availableColumns: [],
        });
      }
    } catch (apiError) {
      console.warn(`[Control Plane UI] API call failed:`, apiError);

      // Fallback response when API is not available
      return NextResponse.json({
        success: false,
        message:
          "Data service temporarily unavailable. Please try again later.",
        data: [],
        totalRecords: 0,
        availableColumns: [],
        error: "API_UNAVAILABLE",
      });
    }
  } catch (error) {
    console.error("[Control Plane UI] Error fetching XML data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch XML data",
        message: error instanceof Error ? error.message : "Unknown error",
        data: [],
        totalRecords: 0,
        availableColumns: [],
      },
      { status: 500 }
    );
  }
}
