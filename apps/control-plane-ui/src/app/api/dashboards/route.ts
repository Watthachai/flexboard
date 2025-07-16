import { NextRequest, NextResponse } from "next/server";

// Mock dashboard data
const mockDashboards = [
  {
    id: "dashboard-1",
    name: "Analytics Dashboard",
    description: "Main analytics dashboard with key metrics",
    tenantId: "cmd46fri300009kuo5aqy3jo4",
    isPublic: false,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T15:30:00Z",
    widgets: [],
  },
  {
    id: "dashboard-2",
    name: "Sales Overview",
    description: "Sales performance tracking",
    tenantId: "cmd46fri300009kuo5aqy3jo4",
    isPublic: false,
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-18T11:00:00Z",
    widgets: [],
  },
  {
    id: "dashboard-3",
    name: "User Engagement",
    description: "User activity and engagement metrics",
    tenantId: "another-tenant-id",
    isPublic: true,
    createdAt: "2024-01-05T14:00:00Z",
    updatedAt: "2024-01-15T16:00:00Z",
    widgets: [],
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const search = searchParams.get("search");
    const isPublic = searchParams.get("isPublic");

    let filteredDashboards = [...mockDashboards];

    // Filter by tenant ID
    if (tenantId) {
      filteredDashboards = filteredDashboards.filter(
        (dashboard) => dashboard.tenantId === tenantId
      );
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDashboards = filteredDashboards.filter(
        (dashboard) =>
          dashboard.name.toLowerCase().includes(searchLower) ||
          (dashboard.description &&
            dashboard.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by public status
    if (isPublic !== null) {
      const isPublicBoolean = isPublic === "true";
      filteredDashboards = filteredDashboards.filter(
        (dashboard) => dashboard.isPublic === isPublicBoolean
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredDashboards,
      pagination: {
        total: filteredDashboards.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboards:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboards",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, tenantId } = body;

    // Validate required fields
    if (!name || !tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and tenantId are required",
        },
        { status: 400 }
      );
    }

    // Create new dashboard
    const newDashboard = {
      id: `dashboard-${Date.now()}`,
      name,
      description: description || "",
      tenantId,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      widgets: [],
    };

    // In a real app, save to database
    mockDashboards.push(newDashboard);

    return NextResponse.json({
      success: true,
      data: newDashboard,
    });
  } catch (error) {
    console.error("Error creating dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create dashboard",
      },
      { status: 500 }
    );
  }
}
