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
    <VisualDashboardEditor tenantId={tenantId} dashboardId={dashboardId} />
  );
}
