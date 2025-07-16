import AppLayout from "@/components/layout/app-layout";
import VisualDashboardEditor from "@/components/dashboard/visual-dashboard-editor";

interface PageProps {
  params: Promise<{
    tenantId: string;
    dashboardId: string;
  }>;
}

export default async function VisualDashboardBuilderPage({
  params,
}: PageProps) {
  const { tenantId, dashboardId } = await params;

  return (
    <AppLayout>
      <VisualDashboardEditor tenantId={tenantId} dashboardId={dashboardId} />
    </AppLayout>
  );
}
