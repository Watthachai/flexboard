/**
 * Dashboard Stats Cards
 * Shows key metrics like in Materio dashboard
 */

"use client";

import React from "react";

interface StatsCardsProps {
  data: any[];
  manifest: any;
}

export default function StatsCards({ data, manifest }: StatsCardsProps) {
  if (!data || data.length === 0) return null;

  // Calculate stats from data
  const totalRecords = data.length;
  const numericColumns =
    manifest?.availableColumns?.filter((col: string) => {
      const sampleValue = data[0]?.[col];
      return !isNaN(Number(sampleValue)) && sampleValue !== "";
    }) || [];

  const totalValue = data.reduce((sum, item) => {
    const firstNumericCol = numericColumns[0];
    return sum + (Number(item[firstNumericCol]) || 0);
  }, 0);

  const avgValue = totalValue / totalRecords;
  const maxValue = Math.max(
    ...data.map((item) => Number(item[numericColumns[0]]) || 0)
  );

  const stats = [
    {
      title: "Total Records",
      value: totalRecords.toLocaleString(),
      icon: "📊",
      color: "from-blue-500 to-blue-600",
      change: "+12%",
      changeType: "positive" as const,
      description: "Data points loaded",
    },
    {
      title: "Total Value",
      value: totalValue.toLocaleString(),
      icon: "💰",
      color: "from-green-500 to-green-600",
      change: "+8.2%",
      changeType: "positive" as const,
      description: "Sum of all values",
    },
    {
      title: "Average",
      value: avgValue.toFixed(0),
      icon: "📈",
      color: "from-purple-500 to-purple-600",
      change: "-2.1%",
      changeType: "negative" as const,
      description: "Mean value",
    },
    {
      title: "Peak Value",
      value: maxValue.toLocaleString(),
      icon: "🚀",
      color: "from-orange-500 to-orange-600",
      change: "+15.3%",
      changeType: "positive" as const,
      description: "Highest data point",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 relative overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Background gradient */}
          <div
            className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-full transform translate-x-6 -translate-y-6`}
          ></div>

          {/* Content */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}
              >
                <span className="text-white text-xl">{stat.icon}</span>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stat.changeType === "positive"
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400"
                }`}
              >
                {stat.change}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </p>
            </div>
          </div>

          {/* Mini chart visualization */}
          <div className="mt-4 flex items-end space-x-1 h-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`bg-gradient-to-t ${stat.color} opacity-30 rounded-sm flex-1`}
                style={{
                  height: `${Math.random() * 80 + 20}%`,
                  minHeight: "4px",
                }}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
