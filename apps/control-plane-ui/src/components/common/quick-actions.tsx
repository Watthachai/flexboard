import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, BarChart3, Settings } from "lucide-react";

const quickActions = [
  {
    title: "Create Tenant",
    description: "Add a new tenant organization",
    icon: Building2,
  },
  {
    title: "Manage Users",
    description: "User administration panel",
    icon: Users,
  },
  {
    title: "View Analytics",
    description: "Platform usage insights",
    icon: BarChart3,
  },
  {
    title: "System Settings",
    description: "Configure platform settings",
    icon: Settings,
  },
];

export function QuickActions() {
  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="p-6 text-center transition-all duration-200 hover:bg-accent/50 cursor-pointer border-border/50"
              >
                <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                  <Icon size={32} className="text-primary" />
                </div>
                <h4 className="font-medium mb-1 text-foreground">
                  {action.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
