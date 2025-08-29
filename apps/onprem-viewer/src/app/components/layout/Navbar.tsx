/**
 * Dashboard Navbar Component
 * Top navigation bar with search, notifications, and user menu
 */

"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, Sun, Moon, Menu, User } from "lucide-react";

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
}

export default function Navbar({
  onToggleSidebar,
  title = "Dashboard",
  breadcrumb = [],
}: NavbarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [darkMode, setDarkMode] = useState(true);

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

    // Load dark mode preference
    if (typeof window !== "undefined" && window.localStorage) {
      const savedDarkMode = localStorage.getItem("darkMode");
      if (savedDarkMode !== null) {
        const isDark = JSON.parse(savedDarkMode);
        setDarkMode(isDark);

        // Apply dark mode to document immediately
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        // Default to dark mode if no preference saved
        setDarkMode(true);
        document.documentElement.classList.add("dark");
        localStorage.setItem("darkMode", JSON.stringify(true));
      }
    }

    checkSession();
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    console.log("🌙 Dark mode toggled:", { from: darkMode, to: newDarkMode });

    // Update document class
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      console.log("✅ Added 'dark' class to document");
    } else {
      document.documentElement.classList.remove("dark");
      console.log("❌ Removed 'dark' class from document");
    }

    // Save to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
      console.log("💾 Saved dark mode preference:", newDarkMode);
    }
  };

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

  const notifications = [
    {
      id: 1,
      type: "success",
      title: "Data uploaded successfully",
      message: "Your CSV file has been processed",
      time: "2 min ago",
      icon: "✅",
    },
    {
      id: 2,
      type: "warning",
      title: "Dashboard layout adjusted",
      message: "Widget positions were auto-corrected",
      time: "5 min ago",
      icon: "⚠️",
    },
    {
      id: 3,
      type: "info",
      title: "New features available",
      message: "Check out our responsive charts",
      time: "1 hour ago",
      icon: "ℹ️",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
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

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search dashboards, data, charts..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
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
            onClick={() => {
              console.log("🔘 Dark mode button clicked!");
              toggleDarkMode();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {notifications.length}
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{notification.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

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
