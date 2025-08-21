/**
 * OnPrem Viewer Dashboard Page - Simple Homepage
 */
"use client";

import { useState, useEffect } from "react";

export default function OnPremViewer() {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                FlexBoard OnPrem Viewer
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="/expiry"
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center space-x-2"
                title="Expiry Dashboard with File Upload"
              >
                <span>📋</span>
                <span>Expiry Dashboard</span>
              </a>

              <a
                href="/dashboard?tenantId=pvs-co-ltd&dashboardId=test-dashboard"
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
                title="View Dashboard with File Upload"
              >
                <span>📊</span>
                <span>Dashboard</span>
              </a>

              <button
                onClick={() => (window.location.href = "/settings")}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                title="OnPrem Settings"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                � Expiry Dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Upload CSV/XML/JSON files to track inventory aging and expiry
                status with automatic transforms and aggregations.
              </p>
              <div className="space-y-2">
                <a
                  href="/expiry"
                  className="block w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
                >
                  Open Expiry Dashboard
                </a>
                <a
                  href="/sample-inventory.csv"
                  className="block w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-center text-sm"
                  download
                >
                  📄 Download Sample CSV
                </a>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                �📊 Dashboard Viewer
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Upload data files and view charts according to dashboard
                manifest configurations.
              </p>
              <div className="space-y-2">
                <a
                  href="/dashboard?tenantId=pvs-co-ltd&dashboardId=test-dashboard"
                  className="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
                >
                  Open Dashboard Viewer
                </a>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📈 Real-Time Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Monitor live data streams and automatic synchronization status.
              </p>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Current time: {currentTime}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Status: ✅ Online
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ⚙️ Quick Access
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Direct access to dashboard viewer functionality.
              </p>
              <div className="space-y-2">
                <a
                  href="/dashboard?tenantId=pvs-co-ltd&dashboardId=test-dashboard"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 block text-center"
                >
                  View Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            OnPrem Viewer Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Features Available
              </h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <div>✅ Dashboard Viewer</div>
                <div>✅ File Upload (CSV, JSON, XML)</div>
                <div>✅ Charts (Bar, Line, Pie)</div>
                <div>✅ Manifest Configuration</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Quick Links
              </h3>
              <div className="space-y-2">
                <a
                  href="/dashboard?tenantId=pvs-co-ltd&dashboardId=test-dashboard"
                  className="block text-blue-600 hover:text-blue-800 text-sm"
                >
                  📊 Test Dashboard
                </a>
                <a
                  href="/settings"
                  className="block text-blue-600 hover:text-blue-800 text-sm"
                >
                  ⚙️ Settings
                </a>
                <div className="text-gray-500 text-sm mt-4">
                  🔧 OnPrem Viewer v1.0
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            🚀 Getting Started
          </h3>
          <div className="text-blue-800 dark:text-blue-200 space-y-2">
            <p>1. Click "Open Dashboard Viewer" to access the main dashboard</p>
            <p>2. Upload your data file (CSV, JSON, or XML format)</p>
            <p>
              3. View charts generated according to the manifest configuration
            </p>
            <p>
              4. Charts will display based on configured X and Y axis mappings
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
