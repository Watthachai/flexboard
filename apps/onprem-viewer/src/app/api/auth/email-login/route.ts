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
      console.log(
        "[UI] Authentication successful, checking for stored license..."
      );

      // Check if Control Plane API returned stored license information
      let userLicense = null;
      
      try {
        if (result.hasStoredLicense && result.storedLicenseKey) {
          console.log("[UI] Found stored license in Control Plane API, validating...");
          
          // Validate the stored license key
          const licenseValidateUrl = envConfig.getControlPlaneApiUrl("/auth/license-validate");
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
            console.log("[UI] Control Plane stored license key validated successfully:", {
              tenantId: userLicense.tenantId,
              companyName: userLicense.companyName,
            });
          } else {
            console.log("[UI] Control Plane stored license key is invalid, will prompt for new key");
          }
        } else {
          console.log("[UI] No stored license key found in Control Plane API");
        }
      } catch (error) {
        console.log("[UI] Error checking stored license:", error);
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

      // Set HTTP-only cookies for session management with development-friendly settings
      if (result.sessionToken) {
        console.log("[UI] Setting session token cookie");
        console.log("[UI] Session token length:", result.sessionToken.length);

        // Primary cookie - use strict settings for production
        response.cookies.set("session-token", result.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax", // Use lax for development
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });

        // Backup cookie with more permissive settings for debugging
        response.cookies.set("session-token-backup", result.sessionToken, {
          httpOnly: false, // Allow client-side access for debugging
          secure: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      }

      if (result.user?.uid) {
        console.log("[UI] Setting user ID cookie");
        console.log("[UI] User ID:", result.user.uid);

        // Primary cookie
        response.cookies.set("user-id", result.user.uid, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });

        // Backup cookie for debugging
        response.cookies.set("user-id-backup", result.user.uid, {
          httpOnly: false, // Allow client-side access for debugging
          secure: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      }

      // Set license cookies if user has stored license
      if (userLicense) {
        console.log("[UI] Setting license cookies for stored license");

        if (userLicense.tenantId) {
          response.cookies.set("tenant-id", userLicense.tenantId, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
          });
        }

        if (userLicense.companyName) {
          response.cookies.set("company-name", userLicense.companyName, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
          });
        }
      }

      // Set multiple debug cookies to test different configurations
      const timestamp = new Date().toISOString();
      response.cookies.set("debug-login-time", timestamp, {
        httpOnly: false, // Allow client-side access for debugging
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      response.cookies.set("debug-test-cookie", "test-value", {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      // Try a simple session cookie (no explicit settings)
      response.cookies.set("simple-session", result.sessionToken, {
        maxAge: 60 * 60 * 24,
      });

      console.log(
        "[UI] All cookies set, response headers:",
        Object.fromEntries(response.headers.entries())
      );
      console.log(
        "[UI] Response Set-Cookie headers:",
        response.headers.getSetCookie()
      );

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
