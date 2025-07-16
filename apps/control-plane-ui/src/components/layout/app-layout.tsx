"use client";

import { useState } from "react";
import { NavSidebar } from "@/components/layout/nav-sidebar";
import { Header } from "@/components/layout/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NavSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="md:ml-64">
        <div className="p-4 md:p-8">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
