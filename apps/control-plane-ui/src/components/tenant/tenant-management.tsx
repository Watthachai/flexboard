"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2, Settings, Eye, Calendar } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  licenseType: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    dashboards: number;
    metadataVersions: number;
  };
}

interface CreateTenantForm {
  name: string;
  slug: string;
  licenseType: string;
}

export function TenantManagementNew() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTenantForm>({
    name: "",
    slug: "",
    licenseType: "basic",
  });
  const [creating, setCreating] = useState(false);

  // Fetch tenants
  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenants");
      const result = await response.json();

      if (result.success) {
        setTenants(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!createForm.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      const result = await response.json();

      if (result.success) {
        setTenants([result.data, ...tenants]);
        setCreateDialogOpen(false);
        setCreateForm({ name: "", slug: "", licenseType: "basic" });
      } else {
        alert(result.error || "Failed to create tenant");
      }
    } catch (error) {
      console.error("Failed to create tenant:", error);
      alert("Failed to create tenant");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tenants/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        setTenants(
          tenants.map((tenant) =>
            tenant.id === id ? { ...tenant, isActive: !currentStatus } : tenant
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle tenant status:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getLicenseBadgeColor = (license: string) => {
    switch (license) {
      case "enterprise":
        return "bg-purple-500 text-white";
      case "professional":
        return "bg-blue-500 text-white";
      case "basic":
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Tenant Management
            </h2>
            <p className="text-muted-foreground">
              Manage organizations and their dashboard access
            </p>
          </div>
        </div>
        <Card className="p-8 text-center glass-card">
          <div className="animate-pulse">Loading tenants...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Tenant Management
          </h2>
          <p className="text-muted-foreground">
            Manage organizations and their dashboard access
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Tenants
              </p>
              <p className="text-3xl font-bold text-foreground">
                {tenants.length}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active
              </p>
              <p className="text-3xl font-bold text-green-600">
                {tenants.filter((t) => t.isActive).length}
              </p>
            </div>
            <div className="h-3 w-3 bg-green-500 rounded-full" />
          </div>
        </Card>
        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Dashboards
              </p>
              <p className="text-3xl font-bold text-foreground">
                {tenants.reduce(
                  (sum, tenant) => sum + tenant._count?.dashboards || 0,
                  0
                )}
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <div className="h-4 w-4 bg-blue-600 rounded" />
            </div>
          </div>
        </Card>
      </div>

      {/* Create Form */}
      {createDialogOpen && (
        <Card className="p-6 glass-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Create New Tenant
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    name: e.target.value,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "-"),
                  })
                }
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={createForm.slug}
                onChange={(e) =>
                  setCreateForm({ ...createForm, slug: e.target.value })
                }
                placeholder="acme-corporation"
              />
            </div>
            <div>
              <Label htmlFor="license">License Type</Label>
              <select
                id="license"
                value={createForm.licenseType}
                onChange={(e) =>
                  setCreateForm({ ...createForm, licenseType: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTenant} disabled={creating}>
                {creating ? "Creating..." : "Create Tenant"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tenants List */}
      <Card className="glass-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            All Tenants
          </h3>
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium text-foreground">
                    {tenant.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tenant.slug}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    API Key: {tenant.apiKey}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getLicenseBadgeColor(tenant.licenseType)}>
                    {tenant.licenseType.charAt(0).toUpperCase() +
                      tenant.licenseType.slice(1)}
                  </Badge>
                  <Badge variant={tenant.isActive ? "default" : "secondary"}>
                    {tenant.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {tenant._count?.dashboards || 0} dashboards
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleToggleStatus(tenant.id, tenant.isActive)
                      }
                    >
                      {tenant.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
