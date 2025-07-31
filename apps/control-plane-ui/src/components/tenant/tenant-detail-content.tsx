"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  licenseType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  description?: string;
  widgetCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function TenantDetailContent() {
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchTenantData();
    }
  }, [tenantId]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);

      // Fetch tenant info
      const tenantResponse = await fetch(`/api/tenants/${tenantId}`);
      const tenantData = await tenantResponse.json();

      if (!tenantData.success) {
        throw new Error(tenantData.error || "Failed to fetch tenant");
      }

      setTenant(tenantData.data);

      // Fetch tenant's dashboards
      const dashboardsResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards`
      );
      const dashboardsData = await dashboardsResponse.json();

      if (!dashboardsData.success) {
        throw new Error(dashboardsData.error || "Failed to fetch dashboards");
      }

      setDashboards(dashboardsData.data);
    } catch (error) {
      console.error("Error fetching tenant data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tenant data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 dark:text-red-400 mb-4">
            Error: {error}
          </div>
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
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link
              href="/tenants"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              Tenants
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100">
              {tenant.name}
            </span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {tenant.name}
          </h1>
          <p className="text-muted-foreground">@{tenant.slug}</p>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant={tenant.isActive ? "default" : "secondary"}>
            {tenant.isActive ? "Active" : "Inactive"}
          </Badge>
          <Link href={`/tenants/${tenantId}/settings`}>
            <Button variant="outline">Settings</Button>
          </Link>
          <Link href={`/tenants/${tenantId}/dashboards/new`}>
            <Button>
              <span className="mr-2">+</span>
              New Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Tenant Info */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              License Type
            </h3>
            <p className="text-lg font-semibold capitalize text-foreground">
              {tenant.licenseType}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Status
            </h3>
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${tenant.isActive ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <p className="text-lg font-semibold text-foreground">
                {tenant.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Dashboards
            </h3>
            <p className="text-lg font-semibold text-foreground">
              {dashboards.length}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">
              Created
            </h3>
            <p className="text-lg font-semibold text-foreground">
              {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Dashboards Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Dashboards</h2>
          {dashboards.length > 0 && (
            <Link href={`/tenants/${tenantId}/dashboards/new`}>
              <Button size="sm">
                <span className="mr-2">+</span>
                Add Dashboard
              </Button>
            </Link>
          )}
        </div>

        {dashboards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">No dashboards yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first dashboard to get started with data visualization
            </p>
            <Link href={`/tenants/${tenantId}/dashboards/new`}>
              <Button>
                <span className="mr-2">+</span>
                Create First Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((dashboard) => (
              <Card
                key={dashboard.id}
                className="p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow bg-card dark:bg-card border border-border dark:border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-foreground">
                      {dashboard.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{dashboard.slug}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dashboard.widgetCount} widget
                    {dashboard.widgetCount !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {dashboard.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {dashboard.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>
                    Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/tenants/${tenantId}/dashboards/${tenantId + "-" + dashboard.slug}`}
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full">
                      <span className="mr-2">✏️</span>
                      Edit Dashboard
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 mt-6 bg-card dark:bg-card">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href={`/tenants/${tenantId}/dashboards/new`}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
            >
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm">New Dashboard</span>
            </Button>
          </Link>

          <Link href={`/tenants/${tenantId}/settings`}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
            >
              <span className="text-2xl mb-2">⚙️</span>
              <span className="text-sm">Settings</span>
            </Button>
          </Link>

          <Link href={`/tenants/${tenantId}/users`}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
            >
              <span className="text-2xl mb-2">👥</span>
              <span className="text-sm">Users</span>
            </Button>
          </Link>

          <Link href={`/tenants/${tenantId}/analytics`}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
            >
              <span className="text-2xl mb-2">📈</span>
              <span className="text-sm">Analytics</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
