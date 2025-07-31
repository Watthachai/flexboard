import fs from "fs";
import path from "path";

const dashboardManifest = {
  schemaVersion: "1.0",
  dashboardId: "vpi-co-ltd-v1",
  dashboardName: "VPI Dashboard",
  description: "Branch vs Average Cost Analysis",
  version: 1,
  targetTeams: ["default"],
  layout: {
    type: "grid",
    columns: 12,
    rowHeight: 50,
  },
  widgets: [
    {
      id: "chart-branch-cost",
      type: "bar-chart",
      title: "Branch vs Average Cost",
      dataSource: "uploaded-data",
      config: {
        xAxis: "Branch",
        yAxis: "AverageCost",
        tenantId: "vpi-co-ltd",
      },
      layout: {
        x: 0,
        y: 0,
        width: 12,
        height: 8,
      },
    },
  ],
  dataSources: [
    {
      id: "uploaded-xml-data",
      name: "Uploaded XML Data",
      type: "xml",
      description: "Data from uploaded XML file",
      endpoint: "/api/tenants/vpi-co-ltd/data",
      refreshInterval: 300000,
    },
  ],
};

// Save to temp file for manual copy
const tempDir = "/Users/itswatthachai/flexboard/tmp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

fs.writeFileSync(
  path.join(tempDir, "dashboard-manifest.json"),
  JSON.stringify(dashboardManifest, null, 2)
);

console.log("Dashboard manifest saved to tmp/dashboard-manifest.json");
console.log("Copy this JSON to the dashboard editor:");
console.log(JSON.stringify(dashboardManifest, null, 2));
