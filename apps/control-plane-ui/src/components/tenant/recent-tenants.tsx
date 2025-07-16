import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface Tenant {
  name: string;
  status: "active" | "inactive" | "pending";
  users: number;
  plan: string;
  joinedAt: string;
}

const mockTenants: Tenant[] = [
  {
    name: "Acme Corp",
    status: "active",
    users: 145,
    plan: "Enterprise",
    joinedAt: "2 days ago",
  },
  {
    name: "TechStart Inc",
    status: "active",
    users: 89,
    plan: "Professional",
    joinedAt: "1 week ago",
  },
  {
    name: "Global Solutions",
    status: "inactive",
    users: 234,
    plan: "Enterprise",
    joinedAt: "2 weeks ago",
  },
  {
    name: "StartupXYZ",
    status: "pending",
    users: 45,
    plan: "Basic",
    joinedAt: "3 days ago",
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

export function RecentTenants() {
  return (
    <Card className="glass-card hover-lift">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-foreground">
          Recent Tenants
        </CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTenants.map((tenant, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                  <Building2 size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{tenant.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {tenant.users} users • {tenant.plan}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tenant.joinedAt}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(tenant.status) as any}>
                {tenant.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
