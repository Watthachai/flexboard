import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: LucideIcon;
  description: string;
  index: number;
}

export function StatsCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  description,
  index,
}: StatsCardProps) {
  return (
    <Card className="glass-card hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <Badge
          variant={positive ? "default" : "destructive"}
          className="text-xs"
        >
          {change}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
