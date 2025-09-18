/**
 * OnPrem Viewer Dashboard Page - Simple Homepage
 */
"use client";

import { useState, useEffect } from "react";
import { Database, BarChart3, Settings, Clock } from "lucide-react";

export default function OnPremViewer() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [dataStats, setDataStats] = useState({
    totalRecords: 0,
    lastSync: null,
  });

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch data statistics
    fetch("/api/ingestion/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDataStats({
            totalRecords: data.data.totalRecords,
            lastSync: data.data.lastRun,
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            FlexBoard
            <span className="text-blue-600 dark:text-blue-400"> OnPrem</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Real-time inventory dashboard with automatic XML sync and
            comprehensive analytics
          </p>

          {/* Primary Action */}
          <div className="mb-12">
            <a
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="w-6 h-6 mr-3" />
              View Dashboard
            </a>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mb-4 mx-auto">
                <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {dataStats.totalRecords.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Records
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-4 mx-auto">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Live
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Auto Sync Every 5min
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mb-4 mx-auto">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {dataStats.lastSync
                  ? new Date(dataStats.lastSync).toLocaleTimeString()
                  : "N/A"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last Sync
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Quick Actions
            </h2>

            <div className="space-y-4">
              <a
                href="/dashboard"
                className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-4" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Main Dashboard
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    View inventory analytics and reports
                  </div>
                </div>
              </a>

              <a
                href="/settings"
                className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings className="w-8 h-8 text-gray-600 dark:text-gray-400 mr-4" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    System Settings
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Configure XML sync and preferences
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current Time: {currentTime}
          </div>
        </div>
      </main>
    </div>
  );
}
