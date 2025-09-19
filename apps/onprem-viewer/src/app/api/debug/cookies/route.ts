/**
 * Debug API - Cookie Information
 * Helps debug cookie issues
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies.getAll();

    console.log(
      "[DEBUG] All cookies received:",
      cookies.map((c) => ({
        name: c.name,
        valueLength: c.value?.length || 0,
        valuePreview: c.value?.substring(0, 50) + "...",
      }))
    );

    return NextResponse.json({
      success: true,
      cookies: cookies.map((c) => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
        valuePreview:
          c.value?.substring(0, 50) + (c.value?.length > 50 ? "..." : ""),
      })),
      cookieNames: cookies.map((c) => c.name),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG] Cookie debug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
