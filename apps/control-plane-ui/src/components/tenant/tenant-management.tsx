"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Calendar,
  MoreVertical,
  Plus,
  Filter,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: "active" | "inactive" | "pending";
  users: number;
  plan: string;
  createdAt: string;
  lastActive: string;
}

const mockTenants: Tenant[] = [
  {
    id: "1",
    name: "Acme Corporation",
    domain: "acme.flexboard.app",
    status: "active",
    users: 145,
    plan: "Enterprise",
    createdAt: "2024-01-15",
    lastActive: "2 hours ago",
  },
  {
    id: "2",
    name: "TechStart Inc",
    domain: "techstart.flexboard.app",
    status: "active",
    users: 89,
    plan: "Professional",
    createdAt: "2024-02-03",
    lastActive: "1 day ago",
  },
  {
    id: "3",
    name: "Global Solutions Ltd",
    domain: "global.flexboard.app",
    status: "inactive",
    users: 234,
    plan: "Enterprise",
    createdAt: "2023-12-08",
    lastActive: "1 week ago",
  },
  {
    id: "4",
    name: "StartupXYZ",
    domain: "startupxyz.flexboard.app",
    status: "pending",
    users: 45,
    plan: "Basic",
    createdAt: "2024-03-01",
    lastActive: "Never",
  },
  {
    id: "5",
    name: "Innovation Labs",
    domain: "innovation.flexboard.app",
    status: "active",
    users: 67,
    plan: "Professional",
    createdAt: "2024-01-28",
    lastActive: "5 minutes ago",
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "destructive";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      label: "Total Tenants",
      value: tenants.length.toString(),
      icon: Building2,
    },
    {
      label: "Active Tenants",
      value: tenants.filter((t) => t.status === "active").length.toString(),
      icon: Building2,
    },
    {
      label: "Total Users",
      value: tenants.reduce((sum, t) => sum + t.users, 0).toString(),
      icon: Users,
    },
    {
      label: "Pending Setup",
      value: tenants.filter((t) => t.status === "pending").length.toString(),
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="animate-fade-in bg-background/80 backdrop-blur-sm border-border/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={24} className="text-primary" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions and Filters */}
      <Card className="bg-background/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 bg-background/50"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-input bg-background/50 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
              <Button variant="outline">
                <Download size={16} className="mr-2" />
                Export
              </Button>
              <Button>
                <Plus size={16} className="mr-2" />
                Add Tenant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <Card className="bg-background/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">
                    Tenant
                  </th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">
                    Users
                  </th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">
                    Plan
                  </th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">
                    Last Active
                  </th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant, index) => (
                  <tr
                    key={tenant.id}
                    className="border-b border-border/25 hover:bg-accent/50 transition-colors duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Building2 size={20} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {tenant.name}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {tenant.domain}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getStatusVariant(tenant.status) as any}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-foreground">
                        <Users
                          size={16}
                          className="mr-2 text-muted-foreground"
                        />
                        {tenant.users}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="secondary">{tenant.plan}</Badge>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-sm">
                      {tenant.lastActive}
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredTenants.length === 0 && (
        <Card className="text-center py-12 bg-background/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8">
            <Building2
              size={48}
              className="text-muted-foreground mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No tenants found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Get started by creating your first tenant"}
            </p>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Your First Tenant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
