/**
 * Check User License from Firebase Profile
 * Directly check license key stored in user profile
 */

import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken =
      request.cookies.get("session-token")?.value ||
      request.cookies.get("session-token-backup")?.value;
    const userId =
      request.cookies.get("user-id")?.value ||
      request.cookies.get("user-id-backup")?.value;

    console.log("[UI] Check user profile license - cookies:", {
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

    // Check user profile for stored license key
    const controlPlaneUrl =
      envConfig.getControlPlaneApiUrl("/auth/user/profile");
    const controlPlaneResponse = await fetch(controlPlaneUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const result = await controlPlaneResponse.json();

    if (controlPlaneResponse.ok && result.success && result.profile) {
      // Check if user profile has license key
      const profile = result.profile;

      console.log("[UI] User profile loaded:", {
        hasLicenseKey: !!profile.licenseKey,
        tenantId: profile.tenantId,
        role: profile.role,
      });

      if (profile.licenseKey && profile.tenantId) {
        // User has license key in profile, validate it
        try {
          const licenseValidateUrl = envConfig.getControlPlaneApiUrl(
            "/auth/license-validate"
          );
          const licenseValidateResponse = await fetch(licenseValidateUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              licenseKey: profile.licenseKey,
              email: profile.email || "",
              userId: userId,
              associateWithUser: false, // Don't re-associate, just validate
            }),
          });

          const licenseResult = await licenseValidateResponse.json();

          if (licenseValidateResponse.ok && licenseResult.success) {
            console.log("[UI] Stored license key is valid");

            return NextResponse.json({
              success: true,
              hasLicense: true,
              license: licenseResult.license,
              licenseKey: profile.licenseKey,
              message: "User has valid stored license",
            });
          } else {
            console.log("[UI] Stored license key is invalid");
            return NextResponse.json({
              success: true,
              hasLicense: false,
              message: "Stored license key is invalid",
            });
          }
        } catch (error) {
          console.error("[UI] Error validating stored license:", error);
          return NextResponse.json({
            success: true,
            hasLicense: false,
            message: "Error validating stored license",
          });
        }
      } else {
        console.log("[UI] No license key found in user profile");
        return NextResponse.json({
          success: true,
          hasLicense: false,
          message: "No license key found in user profile",
        });
      }
    } else {
      console.log("[UI] Failed to load user profile");
      return NextResponse.json({
        success: true,
        hasLicense: false,
        message: "Failed to load user profile",
      });
    }
  } catch (error) {
    console.error("Check profile license error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
