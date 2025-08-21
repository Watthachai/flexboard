/**
 * Pareto Chart Component
 * Combination of bar chart and line chart showing cumulative percentage
 */

import React from "react";

interface ParetoChartProps {
  data: any[];
  config: any;
  width?: number;
  height?: number;
}

export default function ParetoChart({
  data,
  config,
  width = 400,
  height = 300,
}: ParetoChartProps) {
  // For now, render as Bar Chart with note
  return (
    <div className="w-full h-full bg-white border rounded-lg p-4">
      <div className="text-center text-gray-600">
        <div className="text-4xl mb-2">📊</div>
        <h3 className="font-semibold text-lg mb-2">Pareto Chart</h3>
        <p className="text-sm text-gray-500 mb-4">
          {config?.title || "Pareto Analysis"}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-700">
            Pareto chart will show combination of:
            <br />
            • Bar chart for values
            <br />
            • Line chart for cumulative %<br />
            Data points: {data?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
