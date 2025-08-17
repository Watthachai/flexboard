/**
 * Dashboard Sidebar Component
 * Modern sidebar with navigation menu, supports dark mode
 */

"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Database,
  FileText,
  Settings,
  Plus,
  Upload,
  Share2,
  User,
} from "lucide-react";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface UserSession {
  email: string;
  tenantId: string;
  companyName: string;
  features: string[];
  expiryDate: string;
}

export default function Sidebar({
  isCollapsed = false,
  onToggle,
}: SidebarProps) {
  const [activeItem, setActiveItem] = useState("dashboards");
  const [session, setSession] = useState<UserSession | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Update active item based on current path
  useEffect(() => {
    if (pathname.includes("/settings")) {
      setActiveItem("settings");
    } else if (pathname.includes("/analytics")) {
      setActiveItem("analytics");
    } else if (pathname.includes("/data")) {
      setActiveItem("data");
    } else if (pathname.includes("/reports")) {
      setActiveItem("reports");
    } else {
      setActiveItem("dashboards");
    }
  }, [pathname]);

  // Get session from localStorage (synced with main layout)
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem("userSession");
        if (sessionData) {
          setSession(JSON.parse(sessionData));
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    };

    checkSession();
    // Listen for session changes
    window.addEventListener("storage", checkSession);
    return () => window.removeEventListener("storage", checkSession);
  }, []);

  const menuItems = [
    {
      id: "dashboards",
      label: "Dashboards",
      icon: BarChart3,
      href: "/dashboard",
      badge: "New",
      active: true,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      href: "/analytics",
    },
    {
      id: "data",
      label: "Data Sources",
      icon: Database,
      href: "/data-sources",
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      href: "/reports",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  const quickActions = [
    {
      id: "upload",
      label: "Upload Data",
      icon: Upload,
      color: "bg-blue-500 dark:bg-blue-600",
    },
    {
      id: "create",
      label: "Create Chart",
      icon: Plus,
      color: "bg-green-500 dark:bg-green-600",
    },
    {
      id: "share",
      label: "Share Dashboard",
      icon: Share2,
      color: "bg-purple-500 dark:bg-purple-600",
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">
                FlexBoard
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Dashboard Suite
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4">
        <div className="px-3">
          {!isCollapsed && (
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              MAIN MENU
            </p>
          )}

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItem(item.id);
                  if (item.href) {
                    router.push(item.href);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeItem === item.id
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="px-3 mt-8">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              QUICK ACTIONS
            </p>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div
                    className={`w-6 h-6 ${action.color} rounded flex items-center justify-center`}
                  >
                    <action.icon className="w-3 h-3 text-white" />
                  </div>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {session?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {!isCollapsed && session && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.companyName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
