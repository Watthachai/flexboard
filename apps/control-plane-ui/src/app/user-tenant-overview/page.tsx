"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Key,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useTenantList } from "@/hooks/tenant/use-tenant-list";
import { useUserList } from "@/hooks/user/use-user-list";

export default function UserTenantOverviewPage() {
  const { tenants, loading: tenantsLoading } = useTenantList();
  const { users, loading: usersLoading } = useUserList();

  const [selectedTenant, setSelectedTenant] = useState<string>("");

  // Calculate overview statistics
  const getOverviewStats = () => {
    const activeTenants = tenants.filter((t) => t.isActive).length;
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive).length;
    const usersWithTenant = users.filter((u) => u.tenantId).length;

    return {
      totalTenants: tenants.length,
      activeTenants,
      totalUsers,
      activeUsers,
      usersWithTenant,
      usersWithoutTenant: totalUsers - usersWithTenant,
    };
  };

  const stats = getOverviewStats();

  // Get tenant-specific data
  const getTenantUserStats = () => {
    return tenants.map((tenant) => {
      const tenantUsers = users.filter((u) => u.tenantId === tenant.id);
      const activeUsers = tenantUsers.filter((u) => u.isActive).length;
      const admins = tenantUsers.filter((u) => u.role === "admin").length;

      return {
        tenant,
        totalUsers: tenantUsers.length,
        activeUsers,
        admins,
        lastActivity:
          tenantUsers.length > 0
            ? Math.max(
                ...tenantUsers.map((u) => new Date(u.createdAt).getTime())
              )
            : null,
      };
    });
  };

  const tenantStats = getTenantUserStats();

  if (tenantsLoading || usersLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            User & Company Overview
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of users, companies, and license management
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/users">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </Link>
          <Link href="/tenants">
            <Button variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              Manage Companies
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTenants} active companies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Users
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersWithTenant}</div>
            <p className="text-xs text-muted-foreground">
              Users assigned to companies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unassigned Users
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersWithoutTenant}</div>
            <p className="text-xs text-muted-foreground">
              Users without companies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/users?action=create">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold">Create New User</h3>
                  <p className="text-sm text-muted-foreground">
                    Add a new user with company assignment
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/tenant-management/new">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Building2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold">Create New Company</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up a new company with licenses
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Key className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold">License Management</h3>
                <p className="text-sm text-muted-foreground">
                  Generate and manage OnPrem licenses
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Company-User Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Company-User Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenantStats.map((stat) => (
              <div
                key={stat.tenant.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{stat.tenant.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stat.tenant.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold">{stat.totalUsers}</div>
                    <div className="text-xs text-muted-foreground">
                      Total Users
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{stat.activeUsers}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{stat.admins}</div>
                    <div className="text-xs text-muted-foreground">Admins</div>
                  </div>
                  <Badge
                    variant={stat.tenant.isActive ? "default" : "secondary"}
                  >
                    {stat.tenant.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Link href={`/tenants/${stat.tenant.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Users Alert */}
      {stats.usersWithoutTenant > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Users Without Company Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              You have {stats.usersWithoutTenant} users that are not assigned to
              any company. These users may have limited access to
              company-specific features and licenses.
            </p>
            <Link href="/users">
              <Button
                variant="outline"
                className="border-orange-300 text-orange-800"
              >
                Manage User Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
