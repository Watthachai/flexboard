"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  Building2,
  Settings,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";

import { NavSidebar } from "@/components/layout/nav-sidebar";
import { Header } from "@/components/layout/header";
import { RecentTenants, TenantManagementNew } from "@/components/tenant";
import { QuickActions, RecentActivity, StatsCard } from "@/components/common";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    {
      title: "Total Tenants",
      value: "24",
      change: "+12%",
      positive: true,
      icon: Building2,
      description: "Organizations using the platform",
    },
    {
      title: "Active Users",
      value: "1,847",
      change: "+23%",
      positive: true,
      icon: Users,
      description: "Users logged in this month",
    },
    {
      title: "Monthly Revenue",
      value: "$12,456",
      change: "+8%",
      positive: true,
      icon: TrendingUp,
      description: "Revenue generated this month",
    },
    {
      title: "System Health",
      value: "99.9%",
      change: "+0.1%",
      positive: true,
      icon: Activity,
      description: "Platform uptime this month",
    },
  ];

  const renderDashboardContent = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} index={index} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentTenants />
        <RecentActivity />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "tenants":
        return <TenantManagementNew />;
      case "users":
        return (
          <Card className="text-center py-12 glass-card">
            <div className="p-8">
              <Users size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                User Management
              </h3>
              <p className="text-muted-foreground">
                Coming soon - comprehensive user administration
              </p>
            </div>
          </Card>
        );
      case "analytics":
        return (
          <Card className="text-center py-12 glass-card">
            <div className="p-8">
              <BarChart3
                size={48}
                className="text-muted-foreground mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Analytics Dashboard
              </h3>
              <p className="text-muted-foreground">
                Coming soon - detailed platform analytics
              </p>
            </div>
          </Card>
        );
      case "settings":
        return (
          <Card className="text-center py-12 glass-card">
            <div className="p-8">
              <Settings
                size={48}
                className="text-muted-foreground mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                System Settings
              </h3>
              <p className="text-muted-foreground">
                Coming soon - platform configuration
              </p>
            </div>
          </Card>
        );
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen">
      <NavSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="md:ml-64">
        <div className="p-4 md:p-8">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <div>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
