"use client";

import { useTenantDetail, useDashboardList } from "@/hooks";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TenantDashboardsContent() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  // Use the modular hooks
  const {
    tenant,
    loading: tenantLoading,
    error: tenantError,
  } = useTenantDetail({
    tenantId: tenantId,
    autoFetch: !!tenantId,
  });

  const {
    dashboards,
    loading: dashboardsLoading,
    error: dashboardsError,
    createDashboard,
  } = useDashboardList({
    filters: { tenantId: tenantId },
  });

  const loading = tenantLoading || dashboardsLoading;
  const error = tenantError || dashboardsError;

  const handleCreateDashboard = async () => {
    try {
      const newDashboard = await createDashboard({
        name: "New Dashboard",
        description: "A new dashboard for your analytics",
        tenantId,
      });

      if (newDashboard) {
        // Navigate to dashboard builder
        router.push(`/tenants/${tenantId}/dashboards/${newDashboard.id}`);
      }
    } catch (error) {
      console.error("Error creating dashboard:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create dashboard"
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Link href="/tenants" className="text-primary hover:underline">
            ← Back to Tenants
          </Link>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-muted-foreground mb-4">Tenant not found</div>
          <Link href="/tenants" className="text-primary hover:underline">
            ← Back to Tenants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/tenants"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Tenants
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{tenant.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{tenant.name} Dashboards</h1>
          <p className="text-muted-foreground">
            Manage dashboards for @{tenant.slug}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCreateDashboard}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Dashboard
          </Button>
        </div>
      </div>

      {/* Tenant Status */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-medium">Status</h3>
              <p className="text-sm text-muted-foreground">
                {tenant.isActive ? "Active and syncing" : "Inactive"}
              </p>
            </div>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                tenant.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {tenant.isActive ? "Active" : "Inactive"}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {dashboards.length}{" "}
              {dashboards.length === 1 ? "dashboard" : "dashboards"}
            </p>
          </div>
        </div>
      </Card>

      {/* Dashboards Grid */}
      {dashboards.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-2">No dashboards yet</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first dashboard for {tenant.name}
            </p>
            <Button
              onClick={handleCreateDashboard}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create First Dashboard
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <Link
              key={dashboard.id}
              href={`/tenants/${tenantId}/dashboards/${dashboard.id}`}
            >
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{dashboard.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Dashboard ID: {dashboard.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>

                {dashboard.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {dashboard.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Dashboard</span>
                  <span>
                    Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
