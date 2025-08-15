/**
 * OnPrem Viewer - Authentication Validation API Route
 * Validates current user session
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get session information from cookies
    const sessionToken = request.cookies.get("session-token")?.value;
    const userId = request.cookies.get("user-id")?.value;
    const tenantId = request.cookies.get("tenant-id")?.value;
    const companyName = request.cookies.get("company-name")?.value;

    console.log("Session validation - cookies:", {
      hasSessionToken: !!sessionToken,
      hasUserId: !!userId,
      hasTenantId: !!tenantId,
      hasCompanyName: !!companyName,
    });

    if (!sessionToken || !userId) {
      console.log("No session token or user ID found");
      return NextResponse.json(
        {
          success: false,
          message: "No active session",
        },
        { status: 401 }
      );
    }

    // Validate session with Control Plane API
    const controlPlaneResponse = await fetch(
      "http://localhost:3000/api/auth/validate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          sessionToken,
          userId,
        }),
      }
    );

    const result = await controlPlaneResponse.json();

    if (controlPlaneResponse.ok && result.success) {
      // Check if we have license information in cookies
      if (tenantId && companyName) {
        return NextResponse.json({
          success: true,
          user: result.user,
          license: {
            tenantId,
            companyName,
            features: [], // Default features
            expiryDate: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(), // Default 1 year
          },
        });
      } else {
        // No license information found
        return NextResponse.json({
          success: true,
          user: result.user,
          session: {
            email: result.user.email,
            tenantId: tenantId || result.user.tenantId,
            companyName: companyName || result.user.companyName,
            features: result.user.features || [],
            expiryDate: result.user.expiryDate,
          },
        });
      }
    } else {
      // Session is invalid, clear cookies
      const response = NextResponse.json(
        {
          success: false,
          message: "Session expired",
        },
        { status: 401 }
      );

      response.cookies.delete("session-token");
      response.cookies.delete("user-id");
      response.cookies.delete("tenant-id");
      response.cookies.delete("company-name");

      return response;
    }
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
