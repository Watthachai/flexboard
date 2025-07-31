/**
 * Dashboard List Page - Redirect to Tenant Main Page
 * เนื่องจากหน้า tenant หลักมี dashboard list อยู่แล้ว
 */

import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export default async function DashboardListPage({ params }: PageProps) {
  const { tenantId } = await params;

  // Redirect กลับไปหน้า tenant หลักที่มี dashboard list อยู่แล้ว
  redirect(`/tenants/${tenantId}`);
}
