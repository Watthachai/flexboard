/**
 * Test API Route
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "OnPrem Viewer API is working",
    timestamp: new Date().toISOString(),
    url: request.url,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    message: "POST method working",
    received: body,
    timestamp: new Date().toISOString(),
  });
}
