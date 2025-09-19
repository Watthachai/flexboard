/**
 * Test API - Simple Cookie Echo
 * Returns all cookies received by server for debugging
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const allCookies = request.cookies.getAll();
    const cookieHeader = request.headers.get("cookie");

    console.log("[TEST] Cookie echo - Raw header:", cookieHeader);
    console.log("[TEST] Cookie echo - Parsed cookies:", allCookies);

    return NextResponse.json({
      success: true,
      rawCookieHeader: cookieHeader || null,
      parsedCookies: allCookies,
      cookieCount: allCookies.length,
      userAgent: request.headers.get("user-agent"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TEST] Cookie echo error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
