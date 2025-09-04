/**
 * OnPrem Viewer - Dashboard Page
 * Main page for viewing dashboards with uploaded data
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import DashboardViewer from "../components/DashboardViewer";
import { envConfig } from "@/config/env";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = searchParams.get("tenantId") || "pvs-co-ltd";
  const dashboardId = searchParams.get("dashboardId") || "";

  // ดึงรายชื่อ dashboards
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const apiUrl = envConfig.getControlPlaneApiUrl(
          `/tenants/${tenantId}/dashboards`
        );
        const response = await fetch(apiUrl);
        const result = await response.json();

        if (result.success && result.data) {
          setDashboards(result.data);

          // ถ้ายังไม่ได้เลือก dashboard ให้เลือกอันแรก
          if (!dashboardId && result.data.length > 0) {
            const firstDashboardId = result.data[0].id;
            router.push(
              `/dashboard?tenantId=${tenantId}&dashboardId=${firstDashboardId}`
            );
          }
        }
      } catch (error) {
        console.error("Error fetching dashboards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [tenantId, dashboardId, router]);

  const handleDashboardChange = (newDashboardId: string) => {
    router.push(
      `/dashboard?tenantId=${tenantId}&dashboardId=${newDashboardId}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl animate-pulse mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboards...</p>
        </div>
      </div>
    );
  }

  if (dashboards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No Dashboards Found
          </h2>
          <p className="text-gray-600 mb-4">
            No dashboards available for tenant: {tenantId}
          </p>
          <a
            href={`https://sandbox.api-flexboard.fittcoreai.com/tenants/${tenantId}/dashboards/new`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Create New Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!dashboardId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl animate-pulse mb-4">⏳</div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Selector Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Viewer
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Tenant: {tenantId} • {dashboards.length} dashboard(s) available
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={dashboardId}
                onChange={(e) => handleDashboardChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {dashboards.map((dashboard) => (
                  <option key={dashboard.id} value={dashboard.id}>
                    {dashboard.name || dashboard.id}
                  </option>
                ))}
              </select>
              <a
                href={`https://sandbox.api-flexboard.fittcoreai.com/tenants/${tenantId}/dashboards/new`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                ➕ New Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <DashboardViewer tenantId={tenantId} dashboardId={dashboardId} />
    </div>
  );
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
