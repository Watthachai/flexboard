import AppLayout from "@/components/layout/app-layout";
import DashboardEditOptions from "@/components/dashboard/dashboard-edit-options";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    tenantId: string;
    dashboardId: string;
  }>;
}

export default async function DashboardMainPage({ params }: PageProps) {
  const { tenantId, dashboardId } = await params;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Link
            href={`/tenants/${tenantId}`}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboards
          </Link>
          <div className="hidden sm:block h-6 border-l border-border"></div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Editor
          </h1>
        </div>

        <p className="text-muted-foreground">
          Choose how you want to edit your dashboard - visual interface or
          code-based approach.
        </p>
      </div>

      <DashboardEditOptions
        tenantId={tenantId}
        dashboardId={dashboardId}
        dashboardName={`Dashboard ${dashboardId}`}
      />
    </AppLayout>
  );
}
