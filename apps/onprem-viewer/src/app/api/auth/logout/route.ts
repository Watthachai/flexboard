/**
 * OnPrem Viewer - Logout API Route
 * Handles user logout and session cleanup
 */

import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session-token")?.value;

    // If we have a session token, notify Control Plane API about logout
    if (sessionToken) {
      try {
        // Forward logout request to Control Plane API
        const controlPlaneUrl = envConfig.getControlPlaneApiUrl("/auth/logout");
        await fetch(controlPlaneUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
      } catch (error) {
        console.warn("Failed to notify Control Plane API about logout:", error);
        // Continue with local logout even if Control Plane API is unreachable
      }
    }

    // Clear all authentication cookies
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.delete("session-token");
    response.cookies.delete("user-id");
    response.cookies.delete("tenant-id");
    response.cookies.delete("company-name");

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, clear the cookies
    const response = NextResponse.json(
      {
        success: false,
        message: "Logout completed with errors",
      },
      { status: 500 }
    );

    response.cookies.delete("session-token");
    response.cookies.delete("user-id");
    response.cookies.delete("tenant-id");
    response.cookies.delete("company-name");

    return response;
  }
}
