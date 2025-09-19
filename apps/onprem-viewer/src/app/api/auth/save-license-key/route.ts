/**
 * Save License Key to Firebase User Profile
 * Ensures license key is stored with user for cross-device access
 */

import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, userId, email } = body;

    if (!licenseKey || !userId || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "License key, user ID, and email are required",
        },
        { status: 400 }
      );
    }

    // Get session token from cookies or request body
    const sessionToken =
      request.cookies.get("session-token")?.value ||
      request.cookies.get("session-token-backup")?.value ||
      body.sessionToken;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    console.log("[UI] Saving license key to user profile:", {
      userId: userId,
      email: email,
      hasLicenseKey: !!licenseKey,
    });

    // Save license key to Control Plane user profile
    const controlPlaneUrl = envConfig.getControlPlaneApiUrl(
      "/auth/user/update-license"
    );
    const controlPlaneResponse = await fetch(controlPlaneUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        userId,
        email,
        licenseKey,
        updateProfile: true, // Flag to update user profile with license
      }),
    });

    const result = await controlPlaneResponse.json();

    if (controlPlaneResponse.ok && result.success) {
      console.log("[UI] License key saved to user profile successfully");

      return NextResponse.json({
        success: true,
        message: "License key saved to user profile",
        profile: result.profile || null,
      });
    } else {
      console.error("[UI] Failed to save license key to user profile:", result);

      return NextResponse.json(
        {
          success: false,
          message: result.message || "Failed to save license key",
        },
        { status: controlPlaneResponse.status }
      );
    }
  } catch (error) {
    console.error("Save license key error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
