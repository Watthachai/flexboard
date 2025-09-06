/**
 * Dashboard Navbar Component
 * Top navigation bar with dashboard selector and user menu
 */

"use client";

import React, { useState, useEffect } from "react";
import { Menu, User, Moon, Sun, ChevronDown } from "lucide-react";
import { useTheme } from "@/app/components/context/ThemeContext";

interface UserSession {
  email: string;
  tenantId: string;
  companyName: string;
  features: string[];
  expiryDate: string;
}

interface NavbarProps {
  onToggleSidebar?: () => void;
  title?: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
  dashboards?: any[];
  selectedDashboardId?: string;
  tenantId?: string;
  onDashboardChange?: (dashboardId: string) => void;
}

export default function Navbar({
  onToggleSidebar,
  title = "Dashboard",
  breadcrumb = [],
  dashboards = [],
  selectedDashboardId = "",
  tenantId = "",
  onDashboardChange,
}: NavbarProps) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    // Load session from localStorage
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/validate", {
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.user && result.license) {
            setSession({
              email: result.user.email,
              tenantId: result.license.tenantId,
              companyName: result.license.companyName,
              features: result.license.features,
              expiryDate: result.license.expiryDate,
            });
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Title and Company */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              📊 FlexBoard OnPrem
            </h1>
            {session && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {session.companyName}
              </span>
            )}
          </div>

          {/* Dashboard Dropdown */}
          {dashboards && dashboards.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              >
                <span>📊</span>
                <span>
                  {dashboards.find((d) => d.id === selectedDashboardId)?.name ||
                    "Select Dashboard"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Available Dashboards
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {dashboards.map((dashboard) => (
                        <button
                          key={dashboard.id}
                          onClick={() => {
                            onDashboardChange?.(dashboard.id);
                            setShowDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 ${
                            dashboard.id === selectedDashboardId
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <span className="text-lg">📊</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {dashboard.name}
                            </div>
                            {dashboard.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {dashboard.description}
                              </div>
                            )}
                          </div>
                          {dashboard.id === selectedDashboardId && (
                            <span className="text-blue-600 dark:text-blue-400">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            {breadcrumb.length > 0 ? (
              <>
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <span className="text-gray-400 dark:text-gray-500">
                        /
                      </span>
                    )}
                    <span
                      className={
                        index === breadcrumb.length - 1
                          ? "text-gray-900 dark:text-white font-medium"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      {item.label}
                    </span>
                  </React.Fragment>
                ))}
              </>
            ) : (
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {title}
              </span>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Session info */}
          {session && (
            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              {session.email}
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {session?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    User Account
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session?.email || "user@company.com"}
                  </p>
                </div>
                <div className="py-2">
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Settings
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Help
                  </a>
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
