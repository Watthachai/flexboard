/**
 * OnPrem Viewer - Authentication Validation API Route
 * Validates current user session
 */

import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

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
    const controlPlaneUrl = envConfig.getControlPlaneApiUrl("/auth/validate");

    try {
      const controlPlaneResponse = await fetch(controlPlaneUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          sessionToken,
          userId,
        }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });

      const result = await controlPlaneResponse.json();

      if (controlPlaneResponse.ok && result.success) {
        // Refresh cookies to extend session
        const response = NextResponse.json({
          success: true,
          user: result.user,
          license: {
            tenantId: tenantId || result.user?.tenantId,
            companyName: companyName || result.user?.companyName,
            features: result.user?.features || [],
            expiryDate:
              result.user?.expiryDate ||
              new Date(
                Date.now() + 24 * 60 * 60 * 1000 // 24 hours default
              ).toISOString(),
          },
        });

        // Set cookies with extended expiry (7 days)
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: "/",
        };

        response.cookies.set("session-token", sessionToken, cookieOptions);
        response.cookies.set("user-id", userId, cookieOptions);

        if (tenantId) {
          response.cookies.set("tenant-id", tenantId, cookieOptions);
        }
        if (companyName) {
          response.cookies.set("company-name", companyName, cookieOptions);
        }

        return response;
      } else {
        console.log("Control plane validation failed:", result);
        // Fall through to session cleanup
      }
    } catch (controlPlaneError) {
      console.error("Control plane API error:", controlPlaneError);

      // If control plane is down, allow session to continue if we have basic info
      if (tenantId && companyName) {
        console.log("Control plane unreachable, using cached session");
        return NextResponse.json({
          success: true,
          user: { email: userId }, // Basic user info
          license: {
            tenantId,
            companyName,
            features: [],
            expiryDate: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        });
      }
      // Fall through to session cleanup if no cached info
    }

    // Session is invalid or expired, clear cookies
    console.log("Clearing invalid session cookies");
    const response = NextResponse.json(
      {
        success: false,
        message: "Session expired or invalid",
      },
      { status: 401 }
    );

    // Clear cookies properly
    const clearCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0,
      path: "/",
    };

    response.cookies.set("session-token", "", clearCookieOptions);
    response.cookies.set("user-id", "", clearCookieOptions);
    response.cookies.set("tenant-id", "", clearCookieOptions);
    response.cookies.set("company-name", "", clearCookieOptions);

    return response;
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
