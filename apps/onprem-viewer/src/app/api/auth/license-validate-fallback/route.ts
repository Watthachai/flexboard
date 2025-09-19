/**
 * License Validation with localStorage fallback
 * For cases where cookies don't work
 */

import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, email, sessionToken, userId } = body;

    if (!licenseKey || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "License key and email are required",
        },
        { status: 400 }
      );
    }

    // Try to get credentials from cookies first, then from request body (localStorage fallback)
    const finalSessionToken =
      request.cookies.get("session-token")?.value ||
      request.cookies.get("session-token-backup")?.value ||
      sessionToken;
    const finalUserId =
      request.cookies.get("user-id")?.value ||
      request.cookies.get("user-id-backup")?.value ||
      userId;

    console.log("[UI] License validation (fallback) - auth source:", {
      fromCookies: !!request.cookies.get("session-token")?.value,
      fromBody: !!sessionToken,
      hasSessionToken: !!finalSessionToken,
      hasUserId: !!finalUserId,
    });

    if (!finalSessionToken || !finalUserId) {
      console.log("[UI] Missing credentials for license validation (fallback)");
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
        Authorization: `Bearer ${finalSessionToken}`,
      },
      body: JSON.stringify({
        licenseKey,
        email,
        userId: finalUserId,
        associateWithUser: true, // Flag to save license key with user account
      }),
    });

    const result = await controlPlaneResponse.json();

    if (controlPlaneResponse.ok && result.success) {
      // License validation successful
      console.log("[UI] License validation (fallback) successful, saving to user profile");
      
      // Save license key to user profile for cross-device access
      try {
        // Use direct Firebase update instead of Control Plane API
        const firebaseUpdateResponse = await fetch("/api/firebase/update-user-license", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: finalUserId,
            email,
            licenseKey,
            tenantId: result.license?.tenantId,
            companyName: result.license?.companyName,
          }),
        });
        
        if (firebaseUpdateResponse.ok) {
          const updateResult = await firebaseUpdateResponse.json();
          console.log("[UI] License key saved to Firebase user profile (fallback):", updateResult);
        } else {
          console.warn("[UI] Failed to save license key to Firebase user profile (fallback, validation still successful)");
        }
      } catch (error) {
        console.warn("[UI] Error saving license to Firebase user profile (fallback, validation still successful):", error);
      }

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
      return NextResponse.json(
        {
          success: false,
          message: result.message || "License validation failed",
        },
        { status: controlPlaneResponse.status }
      );
    }
  } catch (error) {
    console.error("License validation (fallback) error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
