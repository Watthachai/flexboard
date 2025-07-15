"use client";

import { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  BarChart3,
  Plus,
  Search,
  Bell,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { GlassCard, GlassButton, GlassInput } from "./glass-components";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DashboardLayout({
  children,
  activeTab = "dashboard",
  onTabChange,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tenants", label: "Tenants", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 animate-float"></div>
        <div
          className="absolute top-1/2 -left-20 w-60 h-60 rounded-full bg-purple-300/20 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/3 w-40 h-40 rounded-full bg-blue-300/30 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <div
          className={`
          fixed md:relative z-30 w-64 h-screen glass-panel border-r border-white/20 p-6 
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Flexboard</h1>
              <p className="text-white/60 text-sm">Control Plane</p>
            </div>
            <button
              className="md:hidden glass-button p-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange?.(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`nav-item w-full text-left text-white/80 hover:text-white ${
                    activeTab === item.id ? "active" : ""
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-8">
            <GlassCard>
              <h4 className="text-white font-medium mb-2">Quick Actions</h4>
              <GlassButton className="w-full text-sm">
                <Plus size={16} className="mr-2" />
                Add Tenant
              </GlassButton>
            </GlassCard>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 min-h-screen">
          {/* Header */}
          <GlassCard className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="md:hidden glass-button p-2 mr-4"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={20} className="text-white" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Welcome back!
                  </h2>
                  <p className="text-white/60">
                    Here's what's happening with your platform today.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative hidden sm:block">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40"
                    size={20}
                  />
                  <GlassInput placeholder="Search..." className="pl-10 w-64" />
                </div>
                <GlassButton className="p-3" variant="ghost">
                  <Bell size={20} />
                </GlassButton>
                <GlassButton className="p-3" variant="ghost">
                  <User size={20} />
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
