/**
 * Action Bar Component
 * Contains action buttons like export, filter, etc.
 */

import React from "react";

interface ActionBarProps {
  actions: any[];
  config: any;
}

export default function ActionBar({ actions = [], config }: ActionBarProps) {
  const handleAction = (action: any) => {
    console.log("Action triggered:", action);

    switch (action.type) {
      case "exportCSV":
        // Simulate CSV export
        alert(`Export CSV: ${action.filename || "data.csv"}`);
        break;
      default:
        alert(`Action: ${action.type} - ${action.title}`);
    }
  };

  return (
    <div className="w-full bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-gray-800">
          {config?.title || "Actions"}
        </h3>
        <div className="flex gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {getActionIcon(action.type)} {action.title}
            </button>
          ))}
        </div>
      </div>
      {actions.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          <p>No actions available</p>
        </div>
      )}
    </div>
  );
}

function getActionIcon(type: string): string {
  switch (type) {
    case "exportCSV":
      return "📥";
    case "filter":
      return "🔍";
    case "refresh":
      return "🔄";
    default:
      return "⚡";
  }
}
