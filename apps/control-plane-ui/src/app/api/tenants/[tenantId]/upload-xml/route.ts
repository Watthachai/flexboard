/**
 * Upload XML API Route for Control Plane UI
 * รับไฟล์ XML จาก tenant และส่งไปยัง Control Plane API
 */

import { NextRequest, NextResponse } from "next/server";
import { UniversalXmlParser } from "../../../../../lib/xml-parser";

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const body = await request.json();
    const { xmlContent, fileName } = body;

    if (!xmlContent || typeof xmlContent !== "string") {
      return NextResponse.json(
        { error: "xmlContent is required and must be a string" },
        { status: 400 }
      );
    }

    console.log(
      `[Control Plane UI] XML upload request for tenant: ${tenantId}`
    );
    console.log(`[Control Plane UI] File: ${fileName || "inventory_data.xml"}`);
    console.log(
      `[Control Plane UI] File size: ${Buffer.byteLength(xmlContent, "utf8")} bytes`
    );

    // Parse XML content using UniversalXmlParser
    try {
      const parseResult = await UniversalXmlParser.parse(xmlContent);

      console.log(`[Control Plane UI] XML parsed successfully:`, {
        totalRecords: parseResult.records?.length || 0,
        availableColumns: parseResult.availableColumns?.length || 0,
        columns: parseResult.availableColumns,
        detectedStructure: parseResult.detectedStructure,
      });

      // Forward to Control Plane API for persistence
      try {
        const apiUrl =
          process.env.CONTROL_PLANE_API_URL || "http://localhost:4000";
        const apiResponse = await fetch(
          `${apiUrl}/api/tenants/${tenantId}/upload-xml`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ xmlContent, fileName }),
          }
        );

        if (!apiResponse.ok) {
          console.warn(
            `[Control Plane UI] API persistence failed: ${apiResponse.status}`
          );
        } else {
          console.log(`[Control Plane UI] Successfully persisted to API`);
        }
      } catch (apiError) {
        console.warn(`[Control Plane UI] API persistence error:`, apiError);
        // Continue even if API persistence fails
      }

      return NextResponse.json({
        success: true,
        message: "XML file uploaded and parsed successfully",
        fileName: fileName || "inventory_data.xml",
        fileSize: Buffer.byteLength(xmlContent, "utf8"),
        uploadedAt: new Date().toISOString(),
        tenantId,
        parseResult: parseResult, // Return parsed data to frontend
      });
    } catch (parseError) {
      console.error("[Control Plane UI] Error parsing XML:", parseError);

      // Still try to persist to API even if parsing fails
      try {
        const apiUrl =
          process.env.CONTROL_PLANE_API_URL || "http://localhost:4000";
        await fetch(`${apiUrl}/api/tenants/${tenantId}/upload-xml`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ xmlContent, fileName }),
        });
      } catch (apiError) {
        console.warn(`[Control Plane UI] API persistence error:`, apiError);
      }

      return NextResponse.json(
        {
          success: false,
          message: "XML file uploaded but parsing failed",
          fileName: fileName || "inventory_data.xml",
          fileSize: Buffer.byteLength(xmlContent, "utf8"),
          uploadedAt: new Date().toISOString(),
          tenantId,
          error: "Failed to parse XML content",
          details:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("[Control Plane UI] Error uploading XML:", error);
    return NextResponse.json(
      {
        error: "Failed to upload XML file",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
