"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

interface DashboardBuilderHeaderProps {
  dashboard: Dashboard;
  tenantId: string;
  dashboardId: string;
  onSaveDraft: () => void;
  onPublish: () => void;
  saving: boolean;
  publishing: boolean;
  hasMetadata: boolean;
  hasJsonError: boolean;
}

export default function DashboardBuilderHeader({
  dashboard,
  tenantId,
  dashboardId,
  onSaveDraft,
  onPublish,
  saving,
  publishing,
  hasMetadata,
  hasJsonError,
}: DashboardBuilderHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Link
            href="/tenants"
            className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-400"
          >
            Tenants
          </Link>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          <Link
            href={`/tenants/${tenantId}`}
            className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-400"
          >
            {dashboard?.tenant.name}
          </Link>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            {dashboard?.name}
          </span>
          <span className="text-gray-400 dark:text-gray-500"> / </span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            JSON Editor
          </span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard JSON Editor
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          href={`/tenants/${tenantId}/dashboards/${dashboardId}/builder`}
          className="inline-flex items-center"
        >
          <Button variant="outline">
            <span className="mr-2">🎨</span>
            Drag & Drop Builder
          </Button>
        </Link>

        <Button
          onClick={onSaveDraft}
          disabled={saving || hasJsonError}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
        >
          {saving ? "Saving..." : "Save Draft"}
        </Button>

        <Button
          onClick={onPublish}
          disabled={!hasMetadata || publishing}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
        >
          {publishing ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </div>
  );
}
