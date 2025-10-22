/**
 * TODO #5: Update Frontend Components
 *
 * Priority: HIGH
 * Estimated Time: 1-1.5 hours
 *
 * Files to create/update:
 * - app/components/ViewSelector.tsx (NEW)
 * - app/components/PVSDashboard.tsx (UPDATE)
 */

// ============================================================================
// FILE 1: app/components/ViewSelector.tsx (NEW COMPONENT)
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import type { ViewConfig, AvailableView } from "@/lib/types/inventory";

interface ViewSelectorProps {
  value: ViewConfig;
  onChange: (config: ViewConfig) => void;
  className?: string;
}

export function ViewSelector({
  value,
  onChange,
  className = "",
}: ViewSelectorProps) {
  const [availableViews, setAvailableViews] = useState<AvailableView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViewName, setSelectedViewName] = useState("");

  // Load available views on mount
  useEffect(() => {
    fetchAvailableViews();
  }, []);

  // Update selected view name when value changes
  useEffect(() => {
    const viewName = `VV${value.customer}_${value.area}_${value.dashboard}_${value.view}`;
    setSelectedViewName(viewName);
  }, [value]);

  const fetchAvailableViews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/inventory/views");
      const data = await response.json();

      if (data.success) {
        setAvailableViews(data.views);
      }
    } catch (error) {
      console.error("Failed to fetch available views:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (fullName: string) => {
    const view = availableViews.find((v) => v.fullName === fullName);
    if (view) {
      onChange({
        customer: view.customer,
        area: view.area,
        dashboard: view.dashboard,
        view: view.view,
      });
    }
  };

  // Group views by customer and area
  const groupedViews = availableViews.reduce((acc, view) => {
    const key = `${view.customer} - ${view.area}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(view);
    return acc;
  }, {} as Record<string, AvailableView[]>);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select View
      </label>

      <select
        value={selectedViewName}
        onChange={(e) => handleViewChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {Object.entries(groupedViews).map(([group, views]) => (
          <optgroup key={group} label={group}>
            {views.map((view) => (
              <option key={view.fullName} value={view.fullName}>
                {view.dashboard} - {view.view}
                {view.description && ` (${view.description})`}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Current selection info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-mono">{selectedViewName}</span>
      </div>
    </div>
  );
}

// ============================================================================
// FILE 2: Update app/components/PVSDashboard.tsx
// ============================================================================

/*
 * Key Changes to Make in PVSDashboard.tsx:
 *
 * 1. Add ViewConfig state:
 */

import { ViewSelector } from "./ViewSelector";
import type { ViewConfig } from "@/lib/types/inventory";

const [viewConfig, setViewConfig] = useState<ViewConfig>({
  customer: "PVSG",
  area: "INVENTORY",
  dashboard: "001",
  view: "VIEW_001",
});

/*
 * 2. Update fetchData to include view config:
 */

const fetchData = async () => {
  const params = new URLSearchParams({
    // View configuration
    customer: viewConfig.customer,
    area: viewConfig.area,
    dashboard: viewConfig.dashboard,
    view: viewConfig.view,

    // Filters
    corp: selectedCorp || "",
    branch: selectedBranch || "",
    // ... other filters
  });

  const response = await fetch(`/api/inventory/raw?${params}`);
  const data = await response.json();

  if (data.success) {
    setRawData(data.data);
  }
};

/*
 * 3. Re-fetch when view config changes:
 */

useEffect(() => {
  fetchData();
}, [viewConfig, selectedCorp, selectedBranch /* other dependencies */]);

/*
 * 4. Add ViewSelector to UI (before filter section):
 */

<div className="mb-6">
  <ViewSelector
    value={viewConfig}
    onChange={setViewConfig}
    className="max-w-md"
  />
</div>;

/*
 * 5. Update all API calls to include view config parameters:
 *    - /api/inventory/stats
 *    - /api/inventory/unique-values
 *    - Any other inventory API calls
 */

// Example for stats:
const fetchStats = async () => {
  const params = new URLSearchParams({
    customer: viewConfig.customer,
    area: viewConfig.area,
    dashboard: viewConfig.dashboard,
    view: viewConfig.view,
    corp: selectedCorp || "",
  });

  const response = await fetch(`/api/inventory/stats?${params}`);
  // ...
};

// Example for unique values (companies dropdown):
const fetchCompanies = async () => {
  const params = new URLSearchParams({
    column: "corp",
    customer: viewConfig.customer,
    area: viewConfig.area,
    dashboard: viewConfig.dashboard,
    view: viewConfig.view,
  });

  const response = await fetch(`/api/inventory/unique-values?${params}`);
  const data = await response.json();

  if (data.success) {
    setAvailableCompanies(data.values);
  }
};

/**
 * TODO CHECKLIST:
 *
 * □ Create app/components/ViewSelector.tsx
 *   - Implement view dropdown with grouping
 *   - Add loading state
 *   - Test view switching
 *   - Style to match existing UI
 *
 * □ Update app/components/PVSDashboard.tsx
 *   - Add viewConfig state
 *   - Import ViewSelector component
 *   - Add ViewSelector to UI
 *   - Update fetchData() to include view params
 *   - Update fetchStats() to include view params
 *   - Update fetchCompanies() to include view params
 *   - Update all other API calls
 *   - Add useEffect to refetch on view change
 *   - Test view switching updates all data
 *
 * □ Remove old Prisma-related code
 *   - Remove Prisma Client imports
 *   - Remove old database query logic
 *   - Clean up unused types
 *
 * □ Test all functionality:
 *   - View selection works
 *   - Data updates when view changes
 *   - Filters work with new view
 *   - Stats update correctly
 *   - Excel export works
 *   - CSV export works
 *   - Search works
 *   - Sorting works
 *
 * □ Update localStorage keys if needed
 *   - May need to include view config in saved state
 *
 * □ Add error handling
 *   - Handle view not found
 *   - Handle connection errors
 *   - Show user-friendly error messages
 */
