/**
 * Stacked Bar Chart Component
 * Bar chart with multiple series stacked on top of each other
 */

import React from "react";

interface StackedBarChartProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

export default function StackedBarChart({
  data,
  config,
  width = 400,
  height = 300,
}: StackedBarChartProps) {
  return (
    <div className="w-full h-full bg-white border rounded-lg p-4">
      <div className="text-center text-gray-600">
        <div className="text-4xl mb-2">📊</div>
        <h3 className="font-semibold text-lg mb-2">Stacked Bar Chart</h3>
        <p className="text-sm text-gray-500 mb-4">
          {config?.title || "Stacked Bar Analysis"}
        </p>
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-700">
            Stacked bar chart will show:
            <br />
            • Multiple series stacked vertically
            <br />
            • Each segment represents different category
            <br />
            Data points: {data?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
