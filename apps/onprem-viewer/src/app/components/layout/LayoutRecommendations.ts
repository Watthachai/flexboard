/**
 * Dashboard Layout Recommendations
 * Based on the payload you shared, here are optimal layout configurations
 */

// ❌ Your Current Layout (with issues):
const currentProblematicLayout = {
  layout: { columns: 12, rowHeight: 50 },
  widgets: [
    {
      id: "chart-1755333904802",
      layout: { x: 0, y: 0, width: 12, height: 12 }, // Too tall (600px), full width unnecessary
    },
    {
      id: "chart-1755336028659",
      layout: { x: 13, y: 0, width: 12, height: 15 }, // ❌ x=13 > 12 columns!
    },
  ],
};

// ✅ RECOMMENDED LAYOUTS:

// Option 1: Side-by-Side (Best for comparing data)
export const SIDE_BY_SIDE_LAYOUT = {
  layout: { columns: 12, rowHeight: 50 },
  widgets: [
    {
      id: "chart-1755333904802",
      type: "bar",
      title: "Bar Chart",
      layout: { x: 0, y: 0, width: 6, height: 8 }, // Left half, 400px height
    },
    {
      id: "chart-1755336028659",
      type: "line",
      title: "Line Chart",
      layout: { x: 6, y: 0, width: 6, height: 8 }, // Right half, same height
    },
  ],
};

// Option 2: Stacked (Best for different chart purposes)
export const STACKED_LAYOUT = {
  layout: { columns: 12, rowHeight: 50 },
  widgets: [
    {
      id: "chart-1755333904802",
      type: "bar",
      title: "Bar Chart",
      layout: { x: 0, y: 0, width: 12, height: 6 }, // Full width, 300px height
    },
    {
      id: "chart-1755336028659",
      type: "line",
      title: "Line Chart",
      layout: { x: 0, y: 6, width: 12, height: 6 }, // Below first chart
    },
  ],
};

// Option 3: Asymmetric (Bar chart emphasized)
export const ASYMMETRIC_LAYOUT = {
  layout: { columns: 12, rowHeight: 50 },
  widgets: [
    {
      id: "chart-1755333904802",
      type: "bar",
      title: "Bar Chart",
      layout: { x: 0, y: 0, width: 8, height: 8 }, // 2/3 width, left
    },
    {
      id: "chart-1755336028659",
      type: "line",
      title: "Line Chart",
      layout: { x: 8, y: 0, width: 4, height: 8 }, // 1/3 width, right
    },
  ],
};

// Option 4: Multi-Row Dashboard (Best for many widgets)
export const MULTI_ROW_LAYOUT = {
  layout: { columns: 12, rowHeight: 50 },
  widgets: [
    // Top row - main charts
    {
      id: "chart-1755333904802",
      type: "bar",
      title: "Bar Chart",
      layout: { x: 0, y: 0, width: 6, height: 6 },
    },
    {
      id: "chart-1755336028659",
      type: "line",
      title: "Line Chart",
      layout: { x: 6, y: 0, width: 6, height: 6 },
    },
    // Bottom row - additional analytics (if you add more widgets)
    {
      id: "chart-summary",
      type: "pie",
      title: "Distribution",
      layout: { x: 0, y: 6, width: 4, height: 6 },
    },
    {
      id: "chart-trends",
      type: "line",
      title: "Trends",
      layout: { x: 4, y: 6, width: 8, height: 6 },
    },
  ],
};

// HEIGHT GUIDELINES:
export const HEIGHT_RECOMMENDATIONS = {
  bar_chart: 6, // 300px - good for seeing bar details
  line_chart: 6, // 300px - sufficient for trend visualization
  pie_chart: 6, // 300px - enough for pie + legend
  table: 8, // 400px - more rows visible
  kpi_card: 3, // 150px - compact metrics
  map: 10, // 500px - geographic detail
};

// RESPONSIVE BREAKPOINTS:
export const RESPONSIVE_BEHAVIOR = {
  "desktop (>1024px)": "Use original layout",
  "tablet (768-1024px)": "Reduce to 8 columns, maintain proportions",
  "mobile (<768px)": "Stack all widgets vertically, auto-height",
};

// YOUR OPTIMAL PAYLOAD:
export const RECOMMENDED_PAYLOAD_FOR_YOUR_DATA = {
  success: true,
  data: {
    schemaVersion: "1.0",
    dashboardId: "test-dashboard",
    dashboardName: "test dashboard",
    description: "Dashboard description",
    version: 1,
    targetTeams: ["default"],
    layout: {
      columns: 12,
      type: "grid",
      rowHeight: 50, // 50px per row unit
    },
    widgets: [
      {
        id: "chart-1755333904802",
        type: "bar",
        title: "Product Quantity Analysis", // More descriptive title
        dataSource: "uploaded-data",
        config: {
          xAxis: "Prod",
          yAxis: "QtyFromThisDoc",
          dataSource: "uploaded-data",
          tenantId: "pvs-co-ltd",
        },
        layout: {
          x: 0, // Start at column 0
          y: 0, // Start at row 0
          width: 6, // Half width (6/12 columns)
          height: 8, // 400px height (8 * 50px)
        },
      },
      {
        id: "chart-1755336028659",
        type: "line",
        title: "Quantity Trends Over Time", // More descriptive title
        dataSource: "uploaded-data",
        config: {
          xAxis: "DataDate",
          yAxis: "QtyFromThisDoc",
          dataSource: "uploaded-data",
          tenantId: "pvs-co-ltd",
        },
        layout: {
          x: 6, // ✅ Start at column 6 (right half)
          y: 0, // Same row as bar chart
          width: 6, // Half width (6/12 columns)
          height: 8, // Same height as bar chart
        },
      },
    ],
    dataSources: [],
    availableColumns: [
      "AverageCost",
      "Branch",
      "Corp",
      "DataDate",
      "DocDate",
      "DocNumber",
      "Prod",
      "QtyFromThisDoc",
      "UnitName",
    ],
  },
};

// Quick visual reference:
/*
12-Column Grid Layout (Side-by-Side):
┌──────────────────────┬──────────────────────┐
│                      │                      │
│     Bar Chart        │     Line Chart       │
│   (Prod × Qty)       │   (Date × Qty)       │  
│                      │                      │
│     6 columns        │     6 columns        │
│     8 rows           │     8 rows           │
│     (400px)          │     (400px)          │
└──────────────────────┴──────────────────────┘
*/
