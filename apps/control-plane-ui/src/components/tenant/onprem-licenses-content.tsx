"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  onPremLicenseService,
  type License,
} from "@/services/onprem-license.service";
import { useTenant } from "@/contexts/tenant.context";
import GenerateLicenseModal, {
  type LicenseFormData,
} from "./generate-license-modal";
import LicenseSuccessModal from "./license-success-modal";

export default function OnPremLicensesContent() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedLicense, setGeneratedLicense] = useState<any>(null);

  useEffect(() => {
    if (tenantId) {
      fetchLicenses();
    }
  }, [tenantId]);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use secure service layer
      const result = await onPremLicenseService.fetchLicenses(tenantId);

      if (result.success) {
        setLicenses(result.licenses || []);
      } else {
        throw new Error(result.message || "Failed to fetch licenses");
      }
    } catch (err) {
      console.error("Error fetching licenses:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch licenses");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLicense = async (licenseData: LicenseFormData) => {
    try {
      setGenerating(true);

      // Use secure service layer with tenant's API key
      const result = await onPremLicenseService.generateLicense(tenantId, {
        adminKey: onPremLicenseService.getAdminKey(tenantId, tenant?.apiKey),
        companyName: licenseData.companyName,
        email: licenseData.email,
        features: licenseData.features,
        dashboardIds: licenseData.dashboardIds,
        maxConcurrentUsers: licenseData.maxConcurrentUsers,
        expiryDate: licenseData.expiryDate,
      });

      if (result.success) {
        // Refresh licenses list
        await fetchLicenses();

        // Show success modal with license details
        setGeneratedLicense({
          licenseKey: result.licenseKey,
          companyName: licenseData.companyName,
          email: licenseData.email,
          features: licenseData.features,
          maxConcurrentUsers: licenseData.maxConcurrentUsers,
          expiryDate: licenseData.expiryDate,
          generatedAt: new Date().toISOString(),
        });
        setShowSuccessModal(true);

        // Show success notification
        console.log(
          "✅ License generated and stored in Firebase successfully!"
        );
      } else {
        throw new Error(result.message || "Failed to generate license");
      }
    } catch (err) {
      console.error("Error generating license:", err);
      alert(
        "Failed to generate license: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setGenerating(false);
    }
  };
  const handleRevokeLicense = async (licenseKey: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this license? All active sessions will be terminated."
      )
    ) {
      return;
    }

    try {
      // Use secure service layer with tenant's API key
      const result = await onPremLicenseService.revokeLicense(tenantId, {
        adminKey: onPremLicenseService.getAdminKey(tenantId, tenant?.apiKey),
        licenseKey,
      });

      if (result.success) {
        await fetchLicenses();
        alert("License revoked successfully");
      } else {
        throw new Error(result.message || "Failed to revoke license");
      }
    } catch (err) {
      console.error("Error revoking license:", err);
      alert(
        "Failed to revoke license: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  if (tenantLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">
            {tenantLoading ? "Loading tenant..." : "Loading licenses..."}
          </div>
        </div>
      </div>
    );
  }

  if (tenantError || error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 dark:text-red-400 mb-4">
            Error: {tenantError || error}
          </div>
          <Link
            href={`/tenants/${tenantId}`}
            className="text-primary hover:underline"
          >
            ← Back to Tenant Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link
              href="/tenants"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              Tenants
            </Link>
            <span>/</span>
            <Link
              href={`/tenants/${tenantId}`}
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              {tenantId}
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100">
              OnPrem Licenses
            </span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            🔐 OnPrem License Management
          </h1>
          <p className="text-muted-foreground">
            Manage secure license keys for OnPremise dashboard deployments
          </p>
          {tenant && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <strong>Tenant:</strong> {tenant.name} ({tenant.id}) •
              <strong> API Key:</strong> {tenant.apiKey.substring(0, 20)}...
            </div>
          )}
        </div>

        <GenerateLicenseModal
          onGenerate={handleGenerateLicense}
          isGenerating={generating}
        >
          <Button disabled={generating} className="flex items-center">
            <span className="mr-2">+</span>
            {generating ? "Generating..." : "Generate License"}
          </Button>
        </GenerateLicenseModal>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Licenses
              </p>
              <p className="text-2xl font-bold">{licenses.length}</p>
            </div>
            <div className="text-2xl">🔑</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Licenses
              </p>
              <p className="text-2xl font-bold text-green-600">
                {licenses.filter((l) => l.isActive).length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Sessions
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {licenses.reduce((sum, l) => sum + l.activeSessions, 0)}
              </p>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expired Soon
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {
                  licenses.filter((l) => {
                    const expiry = new Date(l.expiryDate);
                    const now = new Date();
                    const daysUntilExpiry = Math.ceil(
                      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                  }).length
                }
              </p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </Card>
      </div>

      {/* Licenses List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            License Keys
          </h2>
        </div>

        {licenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-lg font-medium mb-2">
              No licenses generated yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Generate your first OnPrem license to enable secure dashboard
              access
            </p>
            <GenerateLicenseModal
              onGenerate={handleGenerateLicense}
              isGenerating={generating}
            >
              <Button className="flex items-center">
                <span className="mr-2">+</span>
                Generate First License
              </Button>
            </GenerateLicenseModal>
          </div>
        ) : (
          <div className="space-y-4">
            {licenses.map((license) => {
              const expiry = new Date(license.expiryDate);
              const now = new Date();
              const daysUntilExpiry = Math.ceil(
                (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              const isExpiringSoon =
                daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              const isExpired = daysUntilExpiry <= 0;

              return (
                <Card key={license.licenseKey} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-semibold text-lg">
                          {license.companyName}
                        </h3>
                        <Badge
                          variant={license.isActive ? "default" : "secondary"}
                          className={license.isActive ? "bg-green-500" : ""}
                        >
                          {license.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {isExpiringSoon && (
                          <Badge
                            variant="outline"
                            className="text-orange-600 border-orange-600"
                          >
                            Expires in {daysUntilExpiry} days
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">License Key</p>
                          <p className="font-mono text-xs break-all">
                            {license.licenseKey}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Authorized Email
                          </p>
                          <p>{license.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Active Sessions
                          </p>
                          <p>
                            {license.activeSessions} /{" "}
                            {license.maxConcurrentUsers}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expires</p>
                          <p>{expiry.toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-muted-foreground text-sm mb-2">
                          Features
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {license.features.map((feature) => (
                            <Badge
                              key={feature}
                              variant="outline"
                              className="text-xs"
                            >
                              {feature.replace("-", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(license.licenseKey);
                          alert("License key copied to clipboard!");
                        }}
                      >
                        📋 Copy Key
                      </Button>
                      {license.isActive && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRevokeLicense(license.licenseKey)
                          }
                        >
                          🚫 Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* OnPrem Instructions */}
      <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          🚀 OnPrem Deployment Instructions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              1. Start OnPrem Agent
            </h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
              <code>{`cd apps/onprem-agent-api
pnpm install && pnpm build
PORT=3001 pnpm start`}</code>
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              2. Start OnPrem Viewer
            </h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
              <code>{`cd apps/onprem-viewer-ui
pnpm install && pnpm build
PORT=3002 pnpm start`}</code>
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              3. Access OnPrem Viewer
            </h4>
            <p className="text-blue-700 dark:text-blue-300">
              Open{" "}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                http://localhost:3002
              </code>{" "}
              and enter the license key and authorized email.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              4. Security Features
            </h4>
            <ul className="text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Email authorization required</li>
              <li>• Session-based authentication</li>
              <li>• Concurrent user limits</li>
              <li>• License expiry enforcement</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Success Modal */}
      {generatedLicense && (
        <LicenseSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setGeneratedLicense(null);
          }}
          licenseData={generatedLicense}
        />
      )}
    </div>
  );
}
