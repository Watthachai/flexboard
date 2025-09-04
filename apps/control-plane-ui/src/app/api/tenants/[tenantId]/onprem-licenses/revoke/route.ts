import { NextRequest, NextResponse } from "next/server";

const CONTROL_PLANE_BASE_URL =
  process.env.CONTROL_PLANE_API_URL ||
  "https://sandbox.api-flexboard.fittcoreai.com";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const body = await request.json();

    // Forward to Fastify API
    const response = await fetch(
      `${CONTROL_PLANE_BASE_URL}/api/tenants/${tenantId}/onprem-licenses/revoke`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Fastify API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error revoking license:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to revoke license",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
