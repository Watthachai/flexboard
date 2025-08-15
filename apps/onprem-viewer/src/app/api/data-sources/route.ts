/**
 * OnPrem Data Source Test API
 */
import { NextRequest, NextResponse } from "next/server";
import { dataSourceService } from "../../../services/dataSource";

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    // Validate required fields
    if (!config.type || !config.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: type and name",
        },
        { status: 400 }
      );
    }

    // Test connection
    const result = await dataSourceService.testConnection(config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully connected to ${config.type.toUpperCase()} data source: ${config.name}`,
        connectionType: config.type,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Connection test failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Data source test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to test data source: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get("id");

    if (!configId) {
      return NextResponse.json(
        {
          success: false,
          error: "Data source ID is required",
        },
        { status: 400 }
      );
    }

    // Get configured data sources
    const dataSources = dataSourceService.getConfiguredDataSources();
    const config = dataSources.find((ds) => ds.id === configId);

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: "Data source not found",
        },
        { status: 404 }
      );
    }

    // Fetch sample data
    const result = await dataSourceService.fetchData(config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data?.slice(0, 5), // Return first 5 rows for preview
        columns: result.columns,
        totalRows: result.data?.length || 0,
        source: config.type,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to fetch data",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Data fetch failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch data: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}
