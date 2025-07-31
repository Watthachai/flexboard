"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Settings,
  BarChart3,
  TrendingUp,
  Activity,
  Code,
  FileText,
  TestTube,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

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
      {/* Dashboard as Code Announcement */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <Code className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Dashboard as Code
              </h2>
              <Badge className="bg-green-100 text-green-800">New!</Badge>
            </div>
            <p className="text-gray-700 mb-4">
              🎉 ระบบใหม่ล่าสุด! เปลี่ยนจาก drag-and-drop เป็นการสร้าง dashboard
              ผ่าน JSON manifest files
              เพื่อความยืดหยุ่นและการจัดการที่ง่ายขึ้นสำหรับ 40+ ลูกค้า
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboards">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Dashboards
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboards/new">
                <Button variant="outline">
                  <Code className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </Link>
              <Link href="/test-api">
                <Button variant="outline">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test API
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block ml-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <FileText className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 text-center">JSON Manifest</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} index={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <RecentTenants />
          <QuickActions />
        </div>
        <div className="space-y-6">
          <RecentActivity />
        </div>
      </div>
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
