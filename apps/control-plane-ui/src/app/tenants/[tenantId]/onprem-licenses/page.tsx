/**
 * OnPrem Licenses Management Page for specific tenant
 */
"use client";

import AppLayout from "@/components/layout/app-layout";
import OnPremLicensesContent from "@/components/tenant/onprem-licenses-content";
import { TenantProvider } from "@/contexts/tenant.context";
import { useParams } from "next/navigation";

export default function OnPremLicensesPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;

  return (
    <TenantProvider tenantId={tenantId}>
      <AppLayout>
        <OnPremLicensesContent />
      </AppLayout>
    </TenantProvider>
  );
}
