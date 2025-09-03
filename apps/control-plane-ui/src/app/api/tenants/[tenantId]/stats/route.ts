// src/app/api/tenants/[tenantId]/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/config/env";

type RouteParams = { tenantId: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<RouteParams> } // 👈 เปลี่ยนเป็น Promise
) {
  try {
    const { tenantId } = await params; // 👈 await ก่อนใช้

    const response = await fetch(
      `${envConfig.apiUrl}/tenants/${tenantId}/stats`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // (ถ้าต้องส่ง cookie/header เพิ่ม ใส่ตรงนี้)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tenant stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenant stats" },
      { status: 500 }
    );
  }
}
