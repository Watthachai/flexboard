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
      // Create response with authentication cookies
      const response = NextResponse.json({
        success: true,
        user: result.user,
        message: "Authentication successful",
      });

      // Set HTTP-only cookies for session management
      if (result.sessionToken) {
        console.log("Setting session token cookie");
        response.cookies.set("session-token", result.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });
      }

      if (result.user?.uid) {
        console.log("Setting user ID cookie");
        response.cookies.set("user-id", result.user.uid, {
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
