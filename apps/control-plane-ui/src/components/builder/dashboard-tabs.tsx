"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardTabsProps {
  activeTab: "editor" | "preview";
  onTabChange: (tab: "editor" | "preview") => void;
}

export default function DashboardTabs({
  activeTab,
  onTabChange,
}: DashboardTabsProps) {
  return (
    <Card className="p-4 bg-card dark:bg-card">
      <div className="flex space-x-1">
        <Button
          variant={activeTab === "editor" ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange("editor")}
          className="text-sm"
        >
          <span className="mr-2">⚙️</span>
          JSON Editor
        </Button>
        <Button
          variant={activeTab === "preview" ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange("preview")}
          className="text-sm"
        >
          <span className="mr-2">👁️</span>
          Preview
        </Button>
      </div>
    </Card>
  );
}
