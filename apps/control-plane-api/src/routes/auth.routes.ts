/**
 * Control Plane API - Authentication Routes
 * Handles authentication for OnPrem Viewer
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/user.service";
import { db } from "../config/firebase-real";

// Initialize user service
const userService = new UserService();

// Request types
interface EmailLoginRequest {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

interface LicenseValidateRequest {
  licenseKey: string;
  email: string;
  userId?: string;
}

interface AuthSession {
  userId: string;
  email: string;
  tenantId?: string;
  companyName?: string;
  sessionToken: string;
  createdAt: Date;
  lastActivity: Date;
}

// In-memory session store (in production, use Redis or database)
const activeSessions = new Map<string, AuthSession>();

// Generate session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Email/Password Login
  fastify.post<{ Body: EmailLoginRequest }>(
    "/auth/email-login",
    async (request, reply) => {
      try {
        const { email, password, userAgent, ipAddress } = request.body;

        if (!email || !password) {
          return reply.status(400).send({
            success: false,
            message: "Email and password are required",
          });
        }

        // Validate user credentials using SimpleUserService
        const users = await userService.listUsersWithHash();

        // Add fallback test user if no users exist (for development)
        let user = users.find((u) => u.email === email);

        if (!user && email === "admin@test.com" && password === "password123") {
          // Temporary test user for development
          const bcrypt = require("bcryptjs");
          user = {
            id: "test-admin-001",
            email: "admin@test.com",
            name: "Test Admin",
            role: "admin",
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userType: "control-plane",
            status: "active",
            passwordHash: await bcrypt.hash("password123", 10),
          };
        }

        if (!user) {
          return reply.status(401).send({
            success: false,
            message: "Invalid email or password",
          });
        }

        // Verify password
        const isValidPassword = await userService.verifyPassword(
          password,
          user.passwordHash || ""
        );
        if (!isValidPassword) {
          return reply.status(401).send({
            success: false,
            message: "Invalid email or password",
          });
        }

        // Check if user is active
        if (!user.isActive) {
          return reply.status(403).send({
            success: false,
            message: "Account is disabled",
          });
        }

        // Create session
        const sessionToken = generateSessionToken();
        const session: AuthSession = {
          userId: user.id,
          email: user.email,
          sessionToken,
          createdAt: new Date(),
          lastActivity: new Date(),
        };

        activeSessions.set(sessionToken, session);

        return reply.send({
          success: true,
          user: {
            uid: user.id,
            email: user.email,
            displayName: user.name,
            role: user.role,
          },
          sessionToken,
          message: "Authentication successful",
        });
      } catch (error) {
        console.error("Email login error:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // License Validation
  fastify.post<{ Body: LicenseValidateRequest }>(
    "/auth/license-validate",
    async (request, reply) => {
      try {
        const { licenseKey, email, userId } = request.body;
        const authHeader = request.headers.authorization;

        if (!licenseKey || !email) {
          return reply.status(400).send({
            success: false,
            message: "License key and email are required",
          });
        }

        // Verify session token
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        const sessionToken = authHeader.substring(7);
        const session = activeSessions.get(sessionToken);

        if (!session || session.email !== email) {
          return reply.status(401).send({
            success: false,
            message: "Invalid session",
          });
        }

        // Update last activity
        session.lastActivity = new Date();

        // Search for license across all tenants
        let licenseData = null;
        let tenantId = null;
        let companyName = null;

        const tenantsSnapshot = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnapshot.docs) {
          const tenantData = tenantDoc.data();
          const licenseDoc = await db
            .collection("tenants")
            .doc(tenantDoc.id)
            .collection("licenses")
            .doc(licenseKey)
            .get();

          if (licenseDoc.exists) {
            licenseData = licenseDoc.data();
            tenantId = tenantDoc.id;
            companyName = tenantData.companyName || tenantDoc.id;
            break;
          }
        }

        if (!licenseData) {
          return reply.status(404).send({
            success: false,
            message: "License not found",
          });
        }

        // Check if license is active
        if (!licenseData?.isActive) {
          return reply.status(403).send({
            success: false,
            message: "License is inactive",
          });
        }

        // Check if license is expired
        const expiryDate = new Date(licenseData.expiryDate);
        if (expiryDate < new Date()) {
          return reply.status(403).send({
            success: false,
            message: "License has expired",
          });
        }

        // Update session with tenant information
        session.tenantId = tenantId || undefined;
        session.companyName = companyName || undefined;

        return reply.send({
          success: true,
          license: {
            tenantId,
            companyName,
            features: licenseData.features || [],
            expiryDate: licenseData.expiryDate,
            maxUsers: licenseData.maxUsers,
            isActive: licenseData.isActive,
          },
          message: "License validation successful",
        });
      } catch (error) {
        console.error("License validation error:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // Session Validation (GET)
  fastify.get("/auth/validate", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const sessionToken = authHeader.substring(7);
      const session = activeSessions.get(sessionToken);

      if (!session) {
        return reply.status(401).send({
          success: false,
          message: "Invalid session",
        });
      }

      // Check session expiry (7 days)
      const sessionAge = Date.now() - session.createdAt.getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (sessionAge > maxAge) {
        activeSessions.delete(sessionToken);
        return reply.status(401).send({
          success: false,
          message: "Session expired",
        });
      }

      // Update last activity
      session.lastActivity = new Date();

      return reply.send({
        success: true,
        user: {
          email: session.email,
          tenantId: session.tenantId,
          companyName: session.companyName,
        },
        message: "Session valid",
      });
    } catch (error) {
      console.error("Session validation error:", error);
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Session Validation (POST) - for compatibility with onprem-viewer
  fastify.post<{ Body: { sessionToken: string; userId: string } }>(
    "/auth/validate",
    async (request, reply) => {
      try {
        const { sessionToken, userId } = request.body;

        if (!sessionToken) {
          return reply.status(401).send({
            success: false,
            message: "Session token required",
          });
        }

        const session = activeSessions.get(sessionToken);

        if (!session) {
          return reply.status(401).send({
            success: false,
            message: "Invalid session",
          });
        }

        // Check session expiry (7 days)
        const sessionAge = Date.now() - session.createdAt.getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (sessionAge > maxAge) {
          activeSessions.delete(sessionToken);
          return reply.status(401).send({
            success: false,
            message: "Session expired",
          });
        }

        // Verify userId matches
        if (userId && session.userId !== userId) {
          return reply.status(401).send({
            success: false,
            message: "User ID mismatch",
          });
        }

        // Update last activity
        session.lastActivity = new Date();

        return reply.send({
          success: true,
          user: {
            email: session.email,
            tenantId: session.tenantId,
            companyName: session.companyName,
          },
          message: "Session valid",
        });
      } catch (error) {
        console.error("POST Session validation error:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // Logout
  fastify.post("/auth/logout", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const sessionToken = authHeader.substring(7);
        activeSessions.delete(sessionToken);
      }

      return reply.send({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Clean up expired sessions (run periodically)
  setInterval(
    () => {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const [token, session] of activeSessions.entries()) {
        const sessionAge = now - session.createdAt.getTime();
        if (sessionAge > maxAge) {
          activeSessions.delete(token);
        }
      }
    },
    60 * 60 * 1000
  ); // Clean up every hour
}
