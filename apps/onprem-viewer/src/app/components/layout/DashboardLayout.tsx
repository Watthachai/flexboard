/**
 * Main Dashboard Layout
 * Includes Navbar + Sidebar + Content Area
 */

"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
  dashboards?: Array<{ id: string; name: string; description?: string }>;
  selectedDashboardId?: string;
  tenantId?: string;
  onDashboardChange?: (dashboardId: string) => void;
}

export default function DashboardLayout({
  children,
  title = "Dashboard",
  breadcrumb = [],
  dashboards = [],
  selectedDashboardId = "",
  tenantId = "",
  onDashboardChange,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col !bg-gray-50 dark:!bg-gray-900 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={toggleSidebar}
        title={title}
        breadcrumb={breadcrumb}
        dashboards={dashboards}
        selectedDashboardId={selectedDashboardId}
        tenantId={tenantId}
        onDashboardChange={onDashboardChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          {/* Breadcrumb Bar (if needed) */}
          {breadcrumb.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 transition-colors duration-200">
              <div className="flex items-center gap-2 text-sm">
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
              </div>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 overflow-auto">
            <div className="h-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
