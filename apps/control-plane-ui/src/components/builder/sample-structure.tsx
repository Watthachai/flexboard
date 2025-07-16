"use client";

import { Card } from "@/components/ui/card";

interface Dashboard {
  id: string;
  name: string;
  slug: string;
}

interface SampleStructureProps {
  dashboard: Dashboard;
  dashboardId: string;
}

export default function SampleStructure({
  dashboard,
  dashboardId,
}: SampleStructureProps) {
  const sampleJson = `{
  "dashboards": [
    {
      "id": "${dashboardId}",
      "name": "${dashboard.name}",
      "slug": "${dashboard.slug}",
      "tabs": [
        {
          "id": "tab1",
          "name": "Overview",
          "widgets": ["widget1", "widget2"]
        }
      ]
    }
  ],
  "widgets": [
    {
      "id": "widget1",
      "type": "chart",
      "title": "Sales Overview",
      "config": {
        "chartType": "line",
        "dataSource": "sales_api",
        "refreshInterval": 30000
      }
    }
  ],
  "config": {
    "theme": "light",
    "refreshInterval": 300000
  }
}`;

  return (
    <Card className="p-6 mt-6 bg-card dark:bg-card">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
        Sample Structure
      </h3>
      <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
        {sampleJson}
      </pre>
    </Card>
  );
}
