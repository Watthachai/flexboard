/**
 * OnPrem Viewer - Dashboard Page
 * Main page for viewing dashboards with uploaded data
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import DashboardViewer from "../components/DashboardViewer";
import DashboardLayout from "../components/layout/DashboardLayout";
import { LoadingPage } from "../components/ui/LoadingSpinner";
import { envConfig } from "@/config/env";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dashboards, setDashboards] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      tenantId: string;
    }>
  >([]);
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

        if (result.success && result.data && result.data.length > 0) {
          setDashboards(result.data);

          // ถ้ายังไม่ได้เลือก dashboard ให้เลือกอันแรก
          if (!dashboardId) {
            const firstDashboardId = result.data[0].id;
            router.push(
              `/dashboard?tenantId=${tenantId}&dashboardId=${firstDashboardId}`
            );
          }
        } else {
          throw new Error("No dashboards found from API");
        }
      } catch (error) {
        console.error("Error fetching dashboards from API:", error);

        // Fallback: Use local dashboard configuration
        console.log("🔄 Falling back to local dashboard...");

        // Auto-redirect to known local dashboard
        if (!dashboardId) {
          router.push(
            `/dashboard?tenantId=${tenantId}&dashboardId=pvs-co-ltd-inventory-aging-report`
          );
        }

        // Set a mock dashboard list for UI
        setDashboards([
          {
            id: "pvs-co-ltd-inventory-aging-report",
            name: "PVS Inventory Aging Analysis",
            description: "Local dashboard configuration",
            tenantId: tenantId,
          },
        ]);
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
    return <LoadingPage text="Loading dashboards..." />;
  }

  if (dashboards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            No Dashboards Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No dashboards available for tenant: {tenantId}
          </p>
        </div>
      </div>
    );
  }

  if (!dashboardId) {
    return <LoadingPage text="Redirecting to dashboard..." />;
  }

  return (
    <DashboardLayout
      dashboards={dashboards}
      selectedDashboardId={dashboardId}
      tenantId={tenantId}
      onDashboardChange={handleDashboardChange}
    >
      <DashboardViewer tenantId={tenantId} dashboardId={dashboardId} />
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingPage text="Initializing dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}
