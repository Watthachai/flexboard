/**
 * Tenant Management Component
 * Modern tenant management using Clean Architecture hooks
 */

"use client";

import React, { useState } from "react";
import { useTenantList } from "@/hooks";
import { CreateTenantRequest } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Users, Calendar, MoreHorizontal } from "lucide-react";

export function TenantManagementNew() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    tenants,
    loading,
    error,
    createTenant,
    updateTenant,
    deleteTenant,
    refresh,
  } = useTenantList();

  const handleCreateTenant = async (data: CreateTenantRequest) => {
    try {
      await createTenant(data);
      setShowCreateForm(false);
      // Show success message
    } catch (error) {
      // Show error message
      console.error("Failed to create tenant:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={refresh} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Tenant Management
          </h2>
          <p className="text-muted-foreground">
            Manage tenants and their configurations
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Tenant Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                </div>
                <Badge variant={tenant.isActive ? "default" : "secondary"}>
                  {tenant.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {tenant.description && (
                <CardDescription>{tenant.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  {tenant._count.users} users, {tenant._count.dashboards}{" "}
                  dashboards
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Created {new Date(tenant.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to tenant details
                    console.log("View tenant:", tenant.id);
                  }}
                >
                  View Details
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tenants.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenants yet</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first tenant
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Tenant
            </Button>
          </div>
        </Card>
      )}

      {/* Create Form Modal - Simplified for now */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Tenant</CardTitle>
              <CardDescription>
                Add a new tenant to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data: CreateTenantRequest = {
                    name: formData.get("name") as string,
                    description: formData.get("description") as string,
                    slug: (formData.get("name") as string)
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, ""),
                  };
                  handleCreateTenant(data);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    name="name"
                    required
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="Enter tenant name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    name="description"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Create Tenant
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
