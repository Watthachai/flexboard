/**
 * OnPrem Viewer - Dashboard Data API Route
 * Fetches dashboard data based on user's license permissions
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log("🔍 Dashboard data API called");

    // Extract cookies from request
    const cookieHeader = request.headers.get("cookie");
    console.log("📨 Request cookies:", cookieHeader);

    if (!cookieHeader) {
      console.log("❌ No cookies found");
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse cookies
    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const tenantId = cookies["tenant-id"];
    console.log("🏢 Tenant ID from cookies:", tenantId);

    if (!tenantId) {
      console.log("❌ No tenant ID found in cookies");
      return NextResponse.json(
        { success: false, message: "No tenant information found" },
        { status: 400 }
      );
    }

    // Fetch dashboard data from Control Plane API
    console.log(`🌐 Fetching dashboards for tenant: ${tenantId}`);
    const controlPlaneUrl = `http://localhost:3000/api/tenants/${tenantId}/dashboards`;
    console.log("📡 Control Plane URL:", controlPlaneUrl);

    const response = await fetch(controlPlaneUrl);
    console.log("📊 Control Plane response status:", response.status);

    if (!response.ok) {
      console.log(
        "❌ Failed to fetch from Control Plane API:",
        response.statusText
      );
      throw new Error(`Control Plane API error: ${response.status}`);
    }

    const controlPlaneData = await response.json();
    console.log(
      "✅ Control Plane data received:",
      JSON.stringify(controlPlaneData, null, 2)
    );

    if (!controlPlaneData.success) {
      console.log("❌ Control Plane API returned error:", controlPlaneData);
      throw new Error("Control Plane API returned error");
    }

    // Transform dashboards for OnPrem Viewer
    const transformedDashboards = controlPlaneData.data.map(
      (dashboard: any) => {
        console.log(`🔄 Transforming dashboard: ${dashboard.name}`);

        // Extract widgets from visualConfig
        const widgets = dashboard.visualConfig?.widgets || [];
        console.log(`📊 Found ${widgets.length} widgets in dashboard`);

        const transformedWidgets = widgets.map((widget: any) => {
          console.log(`🔧 Transforming widget: ${widget.title || widget.id}`);

          // Handle different widget types
          if (widget.type === "metric") {
            return {
              id: widget.id,
              type: "metric",
              title: widget.title,
              value: widget.value,
              change: widget.change,
              trend: widget.trend,
              position: widget.position,
            };
          } else if (widget.type === "chart") {
            return {
              id: widget.id,
              type: "chart",
              title: widget.title,
              data: widget.data || [],
              config: {
                chartType: widget.chartType || "line",
              },
              position: widget.position,
            };
          } else if (widget.type === "table") {
            return {
              id: widget.id,
              type: "table",
              title: widget.title,
              columns: widget.columns || [],
              data: widget.data || [],
              position: widget.position,
            };
          } else {
            // Default fallback
            return {
              id: widget.id,
              type: widget.type || "chart",
              title: widget.title || "Untitled Widget",
              data: widget.data || [],
              config: {
                chartType: widget.chartType || "line",
              },
              position: widget.position,
            };
          }
        });

        return {
          dashboardId: dashboard.id,
          name: dashboard.name,
          description: dashboard.description,
          widgets: transformedWidgets,
          layout: dashboard.visualConfig?.layout,
          metadata: {
            tenantId: dashboard.tenantId,
            lastUpdated: dashboard.updatedAt,
            dataSource: "Control Plane API",
          },
        };
      }
    );

    console.log(`✅ Transformed ${transformedDashboards.length} dashboards`);

    return NextResponse.json({
      success: true,
      dashboards: transformedDashboards,
      source: "control-plane-api",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Dashboard data API error:", error);

    // Generate sample data as fallback
    console.log("🔄 Generating sample data as fallback");
    const sampleDashboards = [
      {
        dashboardId: "sales-dashboard",
        name: "Sales Dashboard (Fallback)",
        widgets: [
          {
            id: "total-revenue",
            type: "metric",
            title: "Total Revenue",
            value: "$1,250,000",
            change: "+8.5%",
            trend: "up",
          },
          {
            id: "monthly-sales",
            type: "chart",
            title: "Monthly Sales",
            data: [
              { name: "Jan", value: 35000 },
              { name: "Feb", value: 42000 },
              { name: "Mar", value: 38000 },
              { name: "Apr", value: 51000 },
              { name: "May", value: 45000 },
              { name: "Jun", value: 57000 },
            ],
            config: { chartType: "line" },
          },
        ],
        metadata: {
          tenantId: "fallback",
          lastUpdated: new Date().toISOString(),
          dataSource: "Sample Fallback",
        },
      },
    ];

    return NextResponse.json({
      success: true,
      dashboards: sampleDashboards,
      source: "sample-fallback",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Transform widgets from Control Plane format to OnPrem Viewer format
function transformWidgetsForViewer(widgets: any[]): any[] {
  return widgets.map((widget) => ({
    id: widget.id || `widget-${Date.now()}`,
    type: widget.config?.type || "chart",
    title: widget.config?.title || "Untitled Widget",
    data: generateSampleDataForWidget(widget.config?.type || "chart"),
    config: {
      chartType: widget.config?.chartType || "line",
      ...widget.config,
    },
  }));
}

// Generate sample data based on widget type
function generateSampleDataForWidget(type: string): any[] {
  switch (type) {
    case "chart":
      return [
        { name: "Jan", value: Math.floor(Math.random() * 5000) + 1000 },
        { name: "Feb", value: Math.floor(Math.random() * 5000) + 1000 },
        { name: "Mar", value: Math.floor(Math.random() * 5000) + 1000 },
        { name: "Apr", value: Math.floor(Math.random() * 5000) + 1000 },
        { name: "May", value: Math.floor(Math.random() * 5000) + 1000 },
        { name: "Jun", value: Math.floor(Math.random() * 5000) + 1000 },
      ];
    case "metric":
      return [
        {
          value: Math.floor(Math.random() * 100000) + 10000,
          currency: "THB",
          growth: Math.floor(Math.random() * 30) - 10,
        },
      ];
    case "table":
      return [
        {
          name: "Product A",
          sales: Math.floor(Math.random() * 1000),
          profit: Math.floor(Math.random() * 500),
        },
        {
          name: "Product B",
          sales: Math.floor(Math.random() * 1000),
          profit: Math.floor(Math.random() * 500),
        },
        {
          name: "Product C",
          sales: Math.floor(Math.random() * 1000),
          profit: Math.floor(Math.random() * 500),
        },
      ];
    default:
      return [];
  }
}

// Sample dashboards for fallback
function getSampleDashboards(tenantId: string) {
  return [
    {
      dashboardId: "sales-dashboard",
      name: "Sales Performance Dashboard",
      widgets: [
        {
          id: "sales-trend",
          type: "chart",
          title: "Monthly Sales Trend",
          data: [
            { name: "Jan", sales: 4000, target: 3800 },
            { name: "Feb", sales: 3000, target: 3200 },
            { name: "Mar", sales: 5000, target: 4500 },
            { name: "Apr", sales: 4500, target: 4200 },
            { name: "May", sales: 6000, target: 5500 },
            { name: "Jun", sales: 5500, target: 5200 },
          ],
          config: { chartType: "line" },
        },
        {
          id: "total-revenue",
          type: "metric",
          title: "Total Revenue",
          data: [{ value: 125000, currency: "THB", growth: 12.5 }],
          config: {},
        },
      ],
      metadata: {
        tenantId,
        lastUpdated: new Date().toISOString(),
        dataSource: "Sample Data",
      },
    },
    {
      dashboardId: "analytics-dashboard",
      name: "Website Analytics",
      widgets: [
        {
          id: "page-views",
          type: "chart",
          title: "Daily Page Views",
          data: [
            { name: "Mon", views: 2400 },
            { name: "Tue", views: 1398 },
            { name: "Wed", views: 9800 },
            { name: "Thu", views: 3908 },
            { name: "Fri", views: 4800 },
            { name: "Sat", views: 3800 },
            { name: "Sun", views: 4300 },
          ],
          config: { chartType: "bar" },
        },
      ],
      metadata: {
        tenantId,
        lastUpdated: new Date().toISOString(),
        dataSource: "Sample Data",
      },
    },
  ];
}
