/**
 * OnPrem Viewer - Email Login API Route
 * Handles email/password authentication using Control Plane API
 */

import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userAgent, ipAddress } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Forward authentication request to Control Plane API
    const controlPlaneUrl =
      envConfig.getControlPlaneApiUrl("/auth/email-login");
    const controlPlaneResponse = await fetch(controlPlaneUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        userAgent: userAgent || request.headers.get("user-agent"),
        ipAddress:
          ipAddress || request.headers.get("x-forwarded-for") || "unknown",
      }),
    });

    const result = await controlPlaneResponse.json();

    console.log("Control Plane login response:", {
      ok: controlPlaneResponse.ok,
      status: controlPlaneResponse.status,
      hasSessionToken: !!result.sessionToken,
      hasUser: !!result.user,
    });

    if (controlPlaneResponse.ok && result.success) {
      console.log("Authentication successful, checking for stored license...");

      // Check if Control Plane API returned stored license information
      let userLicense = null;

      try {
        if (result.hasStoredLicense && result.storedLicenseKey) {
          console.log(
            "Found stored license in Control Plane API, validating..."
          );

          // Validate the stored license key
          const licenseValidateUrl = envConfig.getControlPlaneApiUrl(
            "/auth/license-validate"
          );
          const licenseValidateResponse = await fetch(licenseValidateUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${result.sessionToken}`,
            },
            body: JSON.stringify({
              licenseKey: result.storedLicenseKey,
              email: email,
              userId: result.user.uid,
            }),
          });

          const licenseResult = await licenseValidateResponse.json();
          if (licenseValidateResponse.ok && licenseResult.success) {
            userLicense = licenseResult.license;
            console.log(
              "Control Plane stored license key validated successfully:",
              {
                tenantId: userLicense.tenantId,
                companyName: userLicense.companyName,
              }
            );
          } else {
            console.log(
              "Control Plane stored license key is invalid, will prompt for new key"
            );
          }
        } else {
          console.log("No stored license key found in Control Plane API");
        }
      } catch (error) {
        console.log("Error checking stored license:", error);
        // Continue with normal login flow
      }

      // Create response with authentication cookies and license info if available
      const response = NextResponse.json({
        success: true,
        user: result.user,
        license: userLicense, // Include license if found
        hasStoredLicense: !!userLicense,
        sessionToken: result.sessionToken, // Include for localStorage fallback
        message: userLicense
          ? "Authentication and license validation successful"
          : "Authentication successful",
      });

      // Set HTTP-only cookies for session management with consistent settings
      if (result.sessionToken) {
        console.log("Setting session token cookie");
        console.log("Session token length:", result.sessionToken.length);

        // Use consistent settings for all cookies to avoid conflicts
        const cookieSettings = {
          httpOnly: true,
          secure: false, // Set to false for development/local testing
          sameSite: "lax" as const,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        };

        response.cookies.set(
          "session-token",
          result.sessionToken,
          cookieSettings
        );

        // Also set a non-httpOnly version for debugging
        response.cookies.set("session-token-debug", result.sessionToken, {
          ...cookieSettings,
          httpOnly: false,
        });
      }

      if (result.user?.uid) {
        console.log("Setting user ID cookie");
        console.log("User ID:", result.user.uid);

        const cookieSettings = {
          httpOnly: true,
          secure: false,
          sameSite: "lax" as const,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        };

        response.cookies.set("user-id", result.user.uid, cookieSettings);

        // Also set a non-httpOnly version for debugging
        response.cookies.set("user-id-debug", result.user.uid, {
          ...cookieSettings,
          httpOnly: false,
        });
      }

      // Set license cookies if user has stored license
      if (userLicense) {
        console.log("Setting license cookies for stored license");

        const licenseCookieSettings = {
          httpOnly: true,
          secure: false,
          sameSite: "lax" as const,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        };

        if (userLicense.tenantId) {
          response.cookies.set(
            "tenant-id",
            userLicense.tenantId,
            licenseCookieSettings
          );
        }

        if (userLicense.companyName) {
          response.cookies.set(
            "company-name",
            userLicense.companyName,
            licenseCookieSettings
          );
        }
      }

      console.log("All cookies set successfully");

      return response;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Authentication failed",
        },
        { status: controlPlaneResponse.status }
      );
    }
  } catch (error) {
    console.error("Email login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
