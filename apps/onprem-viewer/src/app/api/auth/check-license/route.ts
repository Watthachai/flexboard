/**
 * OnPrem Viewer - Check User License API Route
 * Checks if user already has a valid license key associated
 */

import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session-token")?.value;
    const userId = request.cookies.get("user-id")?.value;

    console.log("Check user license - cookies:", {
      hasSessionToken: !!sessionToken,
      hasUserId: !!userId,
    });

    if (!sessionToken || !userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Check if user has associated license in Control Plane
    const controlPlaneUrl =
      envConfig.getControlPlaneApiUrl("/auth/user-license");
    const controlPlaneResponse = await fetch(controlPlaneUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const result = await controlPlaneResponse.json();

    if (controlPlaneResponse.ok && result.success && result.license) {
      // User has valid license
      const response = NextResponse.json({
        success: true,
        hasLicense: true,
        license: result.license,
        message: "User has valid license",
      });

      // Set license information in cookies
      if (result.license?.tenantId) {
        response.cookies.set("tenant-id", result.license.tenantId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });
      }

      if (result.license?.companyName) {
        response.cookies.set("company-name", result.license.companyName, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });
      }

      return response;
    } else {
      // User doesn't have license yet
      return NextResponse.json({
        success: true,
        hasLicense: false,
        message: "User needs to set license key",
      });
    }
  } catch (error) {
    console.error("Check user license error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
