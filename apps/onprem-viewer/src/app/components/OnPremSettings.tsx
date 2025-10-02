/**
 * OnPrem Settings Component
 * Simplified settings page with Default Company and System Information
 */

"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Building2, Settings as SettingsIcon } from "lucide-react";
import { useCompany } from "@/app/components/context/CompanyContext";

interface DefaultCompanySettings {
  defaultCompany: string;
  enableDefaultCompany: boolean;
}

const LOCAL_STORAGE_KEY_COMPANY = "flexboard-default-company-settings";

export default function OnPremSettings() {
  const { availableCompanies } = useCompany();

  // Default Company Settings
  const [defaultCompanySettings, setDefaultCompanySettings] =
    useState<DefaultCompanySettings>({
      defaultCompany: "",
      enableDefaultCompany: false,
    });

  // Load default company settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDefaultCompanySettings(parsed);
      } catch (e) {
        console.error("Failed to parse default company settings:", e);
      }
    }
  }, []);

  // Logout function
  const handleLogout = async () => {
    if (
      confirm(
        "Are you sure you want to logout? You will need to login again with your license key."
      )
    ) {
      try {
        // Call logout API
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        // Clear localStorage
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("userSession");
        }

        // Reload page to trigger re-authentication
        window.location.href = "/";
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Failed to logout. Please try again.");
      }
    }
  };

  const saveDefaultCompanySettings = (settings: DefaultCompanySettings) => {
    setDefaultCompanySettings(settings);
    localStorage.setItem(LOCAL_STORAGE_KEY_COMPANY, JSON.stringify(settings));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-200">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your on-premise viewer settings
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Company Settings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Default Company Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set default company for dashboard startup
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Enable Default Company Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-select Default Company
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatically select default company when opening dashboard
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={defaultCompanySettings.enableDefaultCompany}
                  onChange={(e) => {
                    saveDefaultCompanySettings({
                      ...defaultCompanySettings,
                      enableDefaultCompany: e.target.checked,
                    });
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Company Selection */}
            {defaultCompanySettings.enableDefaultCompany && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Company
                </label>

                {availableCompanies.length > 0 ? (
                  <select
                    value={defaultCompanySettings.defaultCompany}
                    onChange={(e) => {
                      saveDefaultCompanySettings({
                        ...defaultCompanySettings,
                        defaultCompany: e.target.value,
                      });
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-white text-gray-900"
                  >
                    <option value="">Select a company...</option>
                    {availableCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <span className="font-medium">
                        No companies available.
                      </span>
                      <br />
                      Data will be loaded from SQL Server when connected.
                    </p>
                  </div>
                )}

                {/* Manual Input Option */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Or enter manually:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TKPV-TKPV CO., LTD."
                    value={defaultCompanySettings.defaultCompany}
                    onChange={(e) => {
                      saveDefaultCompanySettings({
                        ...defaultCompanySettings,
                        defaultCompany: e.target.value,
                      });
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-white text-gray-900 text-sm"
                  />
                </div>

                {/* Preview */}
                {defaultCompanySettings.defaultCompany && (
                  <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      <span className="font-medium">Current default:</span>{" "}
                      {defaultCompanySettings.defaultCompany}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      This company will be automatically selected when you open
                      the dashboard.
                    </p>
                  </div>
                )}

                {/* Info box */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <span className="font-medium">💡 Tip:</span> After setting a
                    default company, refresh the dashboard page to see it
                    automatically selected.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Information
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Platform
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {typeof window !== "undefined" ? navigator.platform : "Server"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                User Agent
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {typeof window !== "undefined"
                  ? navigator.userAgent.split(" ")[0]
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Browser Language
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {typeof window !== "undefined" ? navigator.language : "en"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Timezone
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {typeof window !== "undefined"
                  ? Intl.DateTimeFormat().resolvedOptions().timeZone
                  : "UTC"}
              </span>
            </div>
          </div>

          {/* Database Connection Info */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
              Database Connection
            </h3>
            <p className="text-xs text-green-700 dark:text-green-400">
              <span className="font-medium">Type:</span> SQL Server
            </p>
            <p className="text-xs text-green-700 dark:text-green-400">
              <span className="font-medium">Source:</span> Direct connection to
              VVPVSG_INVENTORY_001_VIEW_001
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-2">
              ✅ Real-time data access enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
