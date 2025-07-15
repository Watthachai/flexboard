"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  BarChart3,
  Plus,
  X,
  Menu,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tenants", label: "Tenants", icon: Building2 },
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 w-64 h-screen p-6",
          "backdrop-blur-md border-r border-sidebar-border",
          "bg-sidebar text-sidebar-foreground",
          "transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Flexboard
            </h1>
            <p className="text-muted-foreground text-sm">Control Plane</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <X size={20} />
            </Button>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => {
                  onTabChange(item.id);
                  onToggle();
                }}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Card className="p-4 glass-card">
            <h4 className="font-medium mb-2 text-foreground">Quick Actions</h4>
            <Button variant="outline" size="sm" className="w-full">
              <Plus size={16} className="mr-2" />
              Add Tenant
            </Button>
          </Card>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-30 w-64 h-screen p-6",
          "backdrop-blur-md border-r border-sidebar-border",
          "bg-sidebar text-sidebar-foreground",
          "hidden md:flex md:flex-col"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Flexboard
            </h1>
            <p className="text-muted-foreground text-sm">Control Plane</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => {
                  onTabChange(item.id);
                }}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Card className="p-4 glass-card">
            <h4 className="font-medium mb-2 text-foreground">Quick Actions</h4>
            <Button variant="outline" size="sm" className="w-full">
              <Plus size={16} className="mr-2" />
              Add Tenant
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
