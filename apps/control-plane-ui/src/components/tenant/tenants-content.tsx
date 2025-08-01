"use client";

import { useTenantList } from "@/hooks";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function TenantsContent() {
  const { tenants, loading, error } = useTenantList();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tenants...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">
            Manage your client organizations and their dashboards
          </p>
        </div>
        <Link
          href="/tenant-management/new"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
        >
          Add New Tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
        <Card className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No tenants found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first tenant
          </p>
          <Link
            href="/tenant-management/new"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Create First Tenant
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{tenant.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      @{tenant.slug}
                    </p>
                  </div>
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      tenant.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {tenant.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                {tenant.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {tenant.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {tenant._count.dashboards}{" "}
                    {tenant._count.dashboards === 1
                      ? "dashboard"
                      : "dashboards"}
                  </span>
                  <span>
                    Created {new Date(tenant.createdAt).toLocaleDateString()}
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
