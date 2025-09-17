import { NextRequest, NextResponse } from "next/server";
import { dataSourceService } from "../../../../services/dataSource";

export async function POST(request: NextRequest) {
  try {
    const { dataSource, widget } = await request.json();

    if (!dataSource) {
      return NextResponse.json(
        { error: "Data source configuration is required" },
        { status: 400 }
      );
    }

    let result;

    if (dataSource.type === "sql" && widget) {
      // Use fetchDataForWidget for SQL sources with widget-specific queries
      result = await dataSourceService.fetchDataForWidget(dataSource, widget);
    } else {
      // Use regular fetchData for other sources
      result = await dataSourceService.fetchData(dataSource);
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      columns: result.columns,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get configured data sources
    const dataSources = dataSourceService.getConfiguredDataSources();

    return NextResponse.json({
      success: true,
      data: dataSources,
    });
  } catch (error) {
    console.error("Error getting data sources:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get data sources",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
