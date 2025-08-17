/**
 * OnPrem Viewer - Dashboard Page
 * Main page for viewing dashboards with uploaded data
 */

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import DashboardViewer from "../components/DashboardViewer";

function DashboardContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") || "pvs-co-ltd";
  const dashboardId = searchParams.get("dashboardId") || "test-dashboard";

  return <DashboardViewer tenantId={tenantId} dashboardId={dashboardId} />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl animate-pulse mb-4">⏳</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
