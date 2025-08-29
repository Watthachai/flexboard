/**
 * Widget Data API Route
 * Proxy endpoint to fetch widget data from onprem-agent-api
 */

import { NextRequest, NextResponse } from "next/server";

interface WidgetConfig {
  dataSource: string;
  apiEndpoint?: string;
  query?: string;
  refreshInterval?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const { widgetId } = params;
    const searchParams = request.nextUrl.searchParams;
    const widgetType = searchParams.get("type") || "kpi";
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // For now, we'll use mock data but structure it for real API integration
    const mockData = await generateMockData(widgetType, widgetId);

    return NextResponse.json({
      success: true,
      data: mockData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching widget data:", error);
    return NextResponse.json(
      { error: "Failed to fetch widget data" },
      { status: 500 }
    );
  }
}

async function generateMockData(widgetType: string, widgetId: string) {
  // In a real implementation, this would call the onprem-agent-api
  // Example: await fetch(`http://localhost:3001/api/data/${widgetId}`)

  switch (widgetType) {
    case "kpi":
      return {
        value: Math.floor(Math.random() * 1000) + 100,
        change: Math.floor(Math.random() * 40) - 20,
        trend: Math.random() > 0.5 ? "up" : "down",
        unit: ["%", "$", "K", "M"][Math.floor(Math.random() * 4)],
        previousValue: Math.floor(Math.random() * 1000) + 100,
      };

    case "line-chart":
      const lineData = [];
      const baseValue = Math.floor(Math.random() * 100) + 50;
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        lineData.push({
          timestamp: date.toISOString(),
          value: baseValue + Math.floor(Math.random() * 50) - 25,
          label: date.toLocaleDateString(),
        });
      }
      return lineData;

    case "bar-chart":
      const categories = ["Q1", "Q2", "Q3", "Q4"];
      return categories.map((category) => ({
        timestamp: new Date().toISOString(),
        value: Math.floor(Math.random() * 100) + 20,
        label: category,
        category,
      }));

    case "pie-chart":
      const segments = [
        { label: "Desktop", value: 45 + Math.floor(Math.random() * 30) },
        { label: "Mobile", value: 25 + Math.floor(Math.random() * 20) },
        { label: "Tablet", value: 10 + Math.floor(Math.random() * 15) },
      ];
      return segments.map((segment) => ({
        timestamp: new Date().toISOString(),
        value: segment.value,
        label: segment.label,
        category: segment.label,
      }));

    case "table":
      const products = [
        "Product A",
        "Product B",
        "Product C",
        "Product D",
        "Product E",
      ];
      return products.slice(0, 4).map((product, i) => ({
        id: i + 1,
        name: product,
        sales: Math.floor(Math.random() * 2000) + 500,
        growth: Math.floor(Math.random() * 60) - 20,
        status: Math.random() > 0.5 ? "Active" : "Inactive",
      }));

    default:
      return { message: "Widget type not supported", type: widgetType };
  }
}
