import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Activity {
  action: string;
  tenant: string;
  time: string;
  type: "success" | "warning" | "error";
}

const recentActivity: Activity[] = [
  {
    action: "New tenant registration",
    tenant: "Innovation Labs",
    time: "2 minutes ago",
    type: "success",
  },
  {
    action: "User limit reached",
    tenant: "Acme Corp",
    time: "1 hour ago",
    type: "warning",
  },
  {
    action: "Payment processed",
    tenant: "TechStart Inc",
    time: "3 hours ago",
    type: "success",
  },
  {
    action: "Tenant deactivated",
    tenant: "Old Corp",
    time: "1 day ago",
    type: "error",
  },
];

const getActivityColor = (type: string) => {
  switch (type) {
    case "success":
      return "bg-green-500";
    case "warning":
      return "bg-yellow-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export function RecentActivity() {
  return (
    <Card className="glass-card hover-lift">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-foreground">
          Recent Activity
        </CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-3 rounded-lg border bg-card/50"
            >
              <div
                className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getActivityColor(activity.type)}`}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{activity.action}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.tenant}
                </p>
                <div className="flex items-center mt-1">
                  <Clock size={12} className="text-muted-foreground mr-1" />
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
