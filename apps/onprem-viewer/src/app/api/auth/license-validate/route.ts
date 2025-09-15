/**
 * OnPrem Viewer - License Validation AP    // Forward license validation to Control Plane API
    const controlPlaneUrl = envConfig.getControlPlaneApiUrl("/auth/license-validate");
    const controlPlaneResponse = await fetch(controlPlaneUrl, {ute
 * Validates license key for authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, email } = body;

    if (!licenseKey || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "License key and email are required",
        },
        { status: 400 }
      );
    }

    // Get session token from cookies
    const sessionToken = request.cookies.get("session-token")?.value;
    const userId = request.cookies.get("user-id")?.value;

    console.log("License validation - cookies:", {
      hasSessionToken: !!sessionToken,
      hasUserId: !!userId,
      sessionTokenLength: sessionToken?.length || 0,
    });

    if (!sessionToken || !userId) {
      console.log("Missing session token or user ID for license validation");
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Forward license validation request to Control Plane API
    const controlPlaneUrl = envConfig.getControlPlaneApiUrl(
      "/auth/license-validate"
    );
    const controlPlaneResponse = await fetch(controlPlaneUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        licenseKey,
        email,
        userId,
        associateWithUser: true, // Flag to save license key with user account
      }),
    });

    const result = await controlPlaneResponse.json();

    if (controlPlaneResponse.ok && result.success) {
      // License validation successful
      const response = NextResponse.json({
        success: true,
        license: result.license,
        message: "License validation successful",
      });

      // Set license information in cookies
      if (result.license?.tenantId) {
        response.cookies.set("tenant-id", result.license.tenantId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 90, // 90 days (extended session)
          path: "/",
        });
      }

      if (result.license?.companyName) {
        response.cookies.set("company-name", result.license.companyName, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 90, // 90 days (extended session)
          path: "/",
        });
      }

      return response;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "License validation failed",
        },
        { status: controlPlaneResponse.status }
      );
    }
  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
