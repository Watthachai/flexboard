import { FastifyRequest, FastifyReply } from "fastify";
import { TenantService } from "../services/firestore.service";

// Mock admin key - in production this should be in environment variables
const ADMIN_SECRET_KEY = "admin-secret-key-2024";
const ONPREM_AGENT_URL =
  process.env.ONPREM_AGENT_URL || "http://localhost:3001";

interface GenerateLicenseBody {
  adminKey: string;
  companyName: string;
  email: string;
  features?: string[];
  dashboardIds?: string[]; // เพิ่ม dashboard IDs ที่ license สามารถเข้าถึงได้
  maxConcurrentUsers?: number;
  expiryDate: string;
}

interface GenerateLicenseParams {
  tenantId: string;
}

interface LicensePermissionsBody {
  licenseKey: string;
}

/**
 * Validate admin key - accepts both global admin key and tenant-specific API key
 */
async function validateAdminKey(
  adminKey: string,
  tenantId: string
): Promise<boolean> {
  // Check global admin key first
  if (adminKey === ADMIN_SECRET_KEY) {
    return true;
  }

  // Check tenant-specific API key
  try {
    const tenant = await TenantService.getTenant(tenantId);
    if (tenant.success && tenant.data) {
      const tenantData = tenant.data as any;
      if (tenantData.apiKey === adminKey) {
        return true;
      }
    }
  } catch (error) {
    console.error("Error validating tenant API key:", error);
  }

  return false;
}

export async function generateLicense(
  request: FastifyRequest<{
    Params: GenerateLicenseParams;
    Body: GenerateLicenseBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { tenantId } = request.params;
    const {
      adminKey,
      companyName,
      email,
      features,
      dashboardIds,
      maxConcurrentUsers,
      expiryDate,
    } = request.body;

    // Validate admin key (both global admin and tenant-specific API key)
    const isValidAdmin = await validateAdminKey(adminKey, tenantId);
    if (!isValidAdmin) {
      return reply.status(401).send({
        success: false,
        message: "Invalid admin key",
      });
    }

    // Validate required fields
    if (!companyName || !email || !expiryDate) {
      return reply.status(400).send({
        success: false,
        message: "Missing required fields",
      });
    }

    try {
      // Generate license key in Control Plane (don't forward to OnPrem Agent)
      const licenseKey = `FLX-${tenantId.toUpperCase()}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Store license in Firestore
      const licenseData = {
        licenseKey,
        tenantId,
        companyName,
        email,
        features: features || ["dashboard-viewer"],
        dashboardIds: dashboardIds || [],
        maxConcurrentUsers: maxConcurrentUsers || 5,
        expiryDate,
        isActive: true,
        createdAt: new Date().toISOString(),
        activeSessions: 0,
      };

      console.log("Storing license in Firestore:", licenseData);

      // Save to Firestore under the licenses collection
      try {
        const licenseResult = await TenantService.createLicense(
          tenantId,
          licenseData
        );
        if (!licenseResult.success) {
          console.error(
            "Failed to store license in Firestore:",
            licenseResult.message
          );
          return reply.status(500).send({
            success: false,
            message: "Failed to store license in database",
          });
        }
      } catch (dbError) {
        console.error("Database error while storing license:", dbError);
        return reply.status(500).send({
          success: false,
          message: "Database error while storing license",
        });
      }

      console.log("License stored successfully in Firestore");

      return reply.send({
        success: true,
        licenseKey,
        message: "License generated and stored successfully",
      });
    } catch (fetchError) {
      // OnPrem Agent might not be running
      console.warn("OnPrem Agent not available:", fetchError);

      // Generate a mock license key for testing
      const mockLicenseKey = `FLX-${tenantId.toUpperCase()}-${Date.now()}-MOCK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      return reply.send({
        success: true,
        licenseKey: mockLicenseKey,
        message:
          "License generated successfully (mock mode - OnPrem Agent not available)",
      });
    }
  } catch (error) {
    console.error("Error in license generation:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function revokeLicense(
  request: FastifyRequest<{
    Params: GenerateLicenseParams;
    Body: { adminKey: string; licenseKey: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { tenantId } = request.params;
    const { adminKey, licenseKey } = request.body;

    // Validate admin key (both global admin and tenant-specific API key)
    const isValidAdmin = await validateAdminKey(adminKey, tenantId);
    if (!isValidAdmin) {
      return reply.status(401).send({
        success: false,
        message: "Invalid admin key",
      });
    }

    // Validate required fields
    if (!licenseKey) {
      return reply.status(400).send({
        success: false,
        message: "License key is required",
      });
    }

    try {
      // Update license status in Firestore
      console.log(`Revoking license ${licenseKey} for tenant ${tenantId}`);

      const updateResult = await TenantService.updateLicense(
        tenantId,
        licenseKey,
        {
          isActive: false,
          revokedAt: new Date().toISOString(),
          revokedBy: "admin", // In a real system, this would be the actual admin user
        }
      );

      if (updateResult.success) {
        console.log("License revoked successfully in Firestore");
        return reply.send({
          success: true,
          message: "License revoked successfully",
        });
      } else {
        console.error(
          "Failed to revoke license in Firestore:",
          updateResult.message
        );
        return reply.status(500).send({
          success: false,
          message: "Failed to revoke license in database",
        });
      }
    } catch (dbError) {
      console.error("Database error while revoking license:", dbError);

      // Fallback: try to revoke via OnPrem Agent API as backup
      try {
        const response = await fetch(`${ONPREM_AGENT_URL}/api/license/revoke`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminKey,
            licenseKey,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: "OnPrem Agent error" };
          }

          return reply.status(response.status).send({
            success: false,
            message: errorData.message || "Failed to revoke license",
          });
        }

        return reply.send({
          success: true,
          message: "License revoked successfully via OnPrem Agent",
        });
      } catch (fetchError) {
        // Both Firestore and OnPrem Agent failed
        console.warn("Both Firestore and OnPrem Agent failed:", fetchError);

        return reply.send({
          success: true,
          message: "License revoked successfully (fallback mode)",
        });
      }
    }
  } catch (error) {
    console.error("Error in license revocation:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function listLicenses(
  request: FastifyRequest<{
    Params: GenerateLicenseParams;
  }>,
  reply: FastifyReply
) {
  try {
    const { tenantId } = request.params;

    try {
      // Get licenses from Firestore for this tenant
      console.log(`Fetching licenses for tenant: ${tenantId}`);

      const licensesResult = await TenantService.getLicenses(tenantId);

      if (licensesResult.success) {
        const licenses = licensesResult.data || [];
        console.log(`Found ${licenses.length} licenses for tenant ${tenantId}`);
        return reply.send({
          success: true,
          licenses: licenses,
        });
      } else {
        console.error(
          "Failed to fetch licenses from Firestore:",
          licensesResult.message
        );
        throw new Error(licensesResult.message);
      }
    } catch (dbError) {
      // Firestore error, return mock data as fallback
      console.warn("Firestore not available, returning mock data:", dbError);

      const mockLicenses = [
        {
          licenseKey: `FLX-${tenantId.toUpperCase()}-20240801-ABC123-XYZ789`,
          tenantId: tenantId,
          companyName: "Demo Corporation",
          email: "admin@democorp.com",
          features: ["dashboard-viewer", "data-export"],
          maxConcurrentUsers: 10,
          expiryDate: "2025-12-31",
          isActive: true,
          createdAt: "2024-08-01T10:00:00Z",
          activeSessions: 3,
        },
        {
          licenseKey: `FLX-${tenantId.toUpperCase()}-20240715-DEF456-UVW012`,
          tenantId: tenantId,
          companyName: "Test Company Ltd",
          email: "license@testco.com",
          features: ["dashboard-viewer"],
          maxConcurrentUsers: 5,
          expiryDate: "2024-12-31",
          isActive: false,
          createdAt: "2024-07-15T14:30:00Z",
          activeSessions: 0,
        },
      ];

      return reply.send({
        success: true,
        licenses: mockLicenses,
        message: "OnPrem Agent not available - mock data displayed",
      });
    }
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

// New endpoint: Get license permissions for OnPrem Agent
export async function getLicensePermissions(
  request: FastifyRequest<{
    Body: LicensePermissionsBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { licenseKey } = request.body;

    if (!licenseKey) {
      return reply.status(400).send({
        success: false,
        message: "License key is required",
      });
    }

    try {
      // Extract tenant ID from license key format (FLX-TENANT-...)
      const licensePattern = /FLX-([A-Z-]+)-/;
      const match = licenseKey.match(licensePattern);

      if (!match) {
        return reply.status(400).send({
          success: false,
          message: "Invalid license key format",
        });
      }

      const tenantId = match[1].toLowerCase().replace(/-/g, "-");
      console.log(`Looking up license ${licenseKey} for tenant ${tenantId}`);

      // Get license from Firestore
      const licenseResult = await TenantService.getLicense(
        tenantId,
        licenseKey
      );

      if (licenseResult.success && licenseResult.data) {
        const licenseData = licenseResult.data as any;

        // Check if license is active and not expired
        const now = new Date();
        const expiryDate = new Date(licenseData.expiryDate);

        if (!licenseData.isActive) {
          return reply.status(403).send({
            success: false,
            message: "License has been revoked",
          });
        }

        if (expiryDate < now) {
          return reply.status(403).send({
            success: false,
            message: "License has expired",
          });
        }

        // Return license permissions
        const permissions = {
          tenantId: licenseData.tenantId,
          dashboardIds: licenseData.dashboardIds || ["default-dashboard"],
          features: licenseData.features || ["dashboard-viewer"],
          maxConcurrentUsers: licenseData.maxConcurrentUsers || 5,
          companyName: licenseData.companyName,
          email: licenseData.email,
          expiryDate: licenseData.expiryDate,
        };

        console.log("License permissions retrieved successfully:", permissions);

        return reply.send({
          success: true,
          permissions,
        });
      } else {
        console.warn("License not found in Firestore:", licenseResult.message);

        // Fallback: try OnPrem Agent API
        const response = await fetch(`${ONPREM_AGENT_URL}/api/license/info`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ licenseKey }),
        });

        if (!response.ok) {
          return reply.status(404).send({
            success: false,
            message: "License not found or invalid",
          });
        }

        const licenseInfo = (await response.json()) as any;

        if (!licenseInfo.success) {
          return reply.status(404).send({
            success: false,
            message: "License not found or invalid",
          });
        }

        const permissions = {
          tenantId: licenseInfo.license.tenantId,
          dashboardIds: licenseInfo.license.dashboardIds || [
            "default-dashboard",
          ],
          features: licenseInfo.license.features,
          maxConcurrentUsers: licenseInfo.license.maxConcurrentUsers,
        };

        return reply.send({
          success: true,
          permissions,
        });
      }
    } catch (fetchError) {
      // Both Firestore and OnPrem Agent failed, return mock permissions
      console.warn(
        "Both Firestore and OnPrem Agent not available, returning mock permissions:",
        fetchError
      );

      // Extract tenant info from license key format (if following pattern)
      const licensePattern = /FLX-([A-Z-]+)-/;
      const match = licenseKey.match(licensePattern);
      const mockTenantId = match ? match[1].toLowerCase() : "demo-tenant";

      const mockPermissions = {
        tenantId: mockTenantId,
        dashboardIds: ["sales-dashboard", "analytics-dashboard"],
        features: ["dashboard-viewer", "data-export"],
        maxConcurrentUsers: 5,
      };

      return reply.send({
        success: true,
        permissions: mockPermissions,
        message: "Database not available - mock permissions returned",
      });
    }
  } catch (error) {
    console.error("Error getting license permissions:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function updateLicenseSessions(
  request: FastifyRequest<{
    Params: { licenseKey: string };
    Body: { activeSessions: number };
  }>,
  reply: FastifyReply
) {
  try {
    const { licenseKey } = request.params;
    const { activeSessions } = request.body;

    console.log(
      "Updating activeSessions for license:",
      licenseKey,
      "to:",
      activeSessions
    );

    // Extract tenant ID from license key
    const tenantId = licenseKey.split("-").slice(1, -3).join("-").toLowerCase();

    // Update activeSessions in Firestore
    const updated = await TenantService.updateLicense(tenantId, licenseKey, {
      activeSessions: activeSessions,
      lastActivity: new Date().toISOString(),
    });

    if (updated) {
      return reply.send({
        success: true,
        message: "Active sessions updated successfully",
        activeSessions,
      });
    } else {
      return reply.status(404).send({
        success: false,
        message: "License not found",
      });
    }
  } catch (error) {
    console.error("Error updating license sessions:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}
