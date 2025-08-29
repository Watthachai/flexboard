// OnPrem License Service - handles all license operations securely
export interface License {
  licenseKey: string;
  tenantId: string;
  companyName: string;
  email: string;
  features: string[];
  maxConcurrentUsers: number;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
  activeSessions: number;
}

export interface GenerateLicenseRequest {
  adminKey: string;
  companyName: string;
  email: string;
  features: string[];
  dashboardIds?: string[];
  maxConcurrentUsers: number;
  expiryDate: string;
}

export interface RevokeLicenseRequest {
  adminKey: string;
  licenseKey: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  licenses?: License[];
  licenseKey?: string;
  error?: string;
}

class OnPremLicenseService {
  private readonly baseUrl: string;

  constructor() {
    // Use relative URL for Next.js API routes (secure)
    this.baseUrl = "/api";
  }

  /**
   * Fetch all licenses for a tenant
   */
  async fetchLicenses(tenantId: string): Promise<ApiResponse<License[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/tenants/${tenantId}/onprem-licenses`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching licenses:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch licenses",
        licenses: [],
      };
    }
  }

  /**
   * Generate a new license
   */
  async generateLicense(
    tenantId: string,
    licenseData: GenerateLicenseRequest
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/tenants/${tenantId}/onprem-licenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(licenseData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating license:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to generate license",
      };
    }
  }

  /**
   * Revoke a license
   */
  async revokeLicense(
    tenantId: string,
    revokeData: RevokeLicenseRequest
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/tenants/${tenantId}/onprem-licenses/revoke`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(revokeData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error revoking license:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to revoke license",
      };
    }
  }

  /**
   * Get admin key from tenant configuration
   * This uses the tenant's API key for OnPrem license management
   */
  getAdminKey(tenantId: string, tenantApiKey?: string): string {
    // Use tenant's API key if provided
    if (tenantApiKey) {
      return tenantApiKey;
    }

    // Fallback patterns for known tenants
    if (tenantId === "vpi-co-ltd") {
      return "tenant-1753950967508-84yme8k73";
    }

    // Default fallback
    return process.env.NEXT_PUBLIC_ADMIN_KEY || "admin-secret-key-2024";
  }
}

// Export singleton instance
export const onPremLicenseService = new OnPremLicenseService();
export default onPremLicenseService;
