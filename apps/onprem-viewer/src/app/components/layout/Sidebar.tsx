/**
 * Dashboard Sidebar Component
 * Modern sidebar with navigation menu, supports dark mode
 */

"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Settings } from "lucide-react";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const [activeItem, setActiveItem] = useState("dashboards");
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

  const menuItems = [
    {
      id: "dashboards",
      label: "Dashboards",
      icon: BarChart3,
      href: "/dashboard",
      badge: "",
      active: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } transition-colors duration-200`}
    >
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
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
      </div>
    </div>
  );
}
