/**
 * Firebase Authentication Routes for OnPrem License Management
 * จัดการ Login, Logout และ Session Validation ผ่าน Firebase Auth + Session Cookies
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { FirebaseAuthService } from "../services/firebase-auth.service";

// Extend Fastify types for Cookie support
declare module "fastify" {
  interface FastifyRequest {
    cookies: { [cookieName: string]: string | undefined };
  }
  interface FastifyReply {
    setCookie(name: string, value: string, options?: any): this;
    clearCookie(name: string, options?: any): this;
  }
}

const authService = new FirebaseAuthService();

interface LoginRequest {
  email: string;
  password: string;
  licenseKey: string;
}

interface EmailLoginRequest {
  email: string;
  password: string;
}

interface LicenseValidateRequest {
  licenseKey: string;
  email: string;
}

interface SessionStatsParams {
  licenseKey: string;
}

/**
 * Register Firebase Auth routes for Fastify
 */
export async function firebaseAuthRoutes(fastify: FastifyInstance) {
  /**
   * 🔐 Step 1: Email/Password Login
   * POST /api/auth/email-login
   */
  fastify.post(
    "/email-login",
    async (
      req: FastifyRequest<{ Body: EmailLoginRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
          return reply.code(400).send({
            success: false,
            message: "Email and password are required",
          });
        }

        console.log("🔐 Processing email login:", {
          email: email.toLowerCase(),
        });

        // Authenticate with Firebase
        const userResult = await authService.getOrCreateUser(email, password);
        if (!userResult.success) {
          return reply.code(401).send({
            success: false,
            message: userResult.message,
          });
        }

        const user = userResult.user!;

        // Create temporary session (without license)
        const tempSessionResult = await authService.createTempSession(
          user.uid,
          email,
          req.ip,
          req.headers["user-agent"]
        );

        if (!tempSessionResult.success) {
          return reply.code(500).send({
            success: false,
            message: tempSessionResult.message,
          });
        }

        // Set temporary session cookie
        reply.setCookie("__temp_session", tempSessionResult.sessionCookie!, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 10 * 60, // 10 minutes for license validation
          path: "/",
        });

        console.log("✅ Email login successful:", { email });

        return reply.send({
          success: true,
          message: "Email authentication successful",
          user: {
            uid: user.uid,
            email: user.email,
          },
        });
      } catch (error) {
        console.error("❌ Email login error:", error);
        return reply.code(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  /**
   * 🔑 Step 2: License Key Validation
   * POST /api/auth/license-validate
   */
  fastify.post(
    "/license-validate",
    async (
      req: FastifyRequest<{ Body: LicenseValidateRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const { licenseKey, email } = req.body;

        // Validate input
        if (!licenseKey || !email) {
          return reply.code(400).send({
            success: false,
            message: "License key and email are required",
          });
        }

        // Check temporary session
        const tempSession = req.cookies.__temp_session;
        if (!tempSession) {
          return reply.code(401).send({
            success: false,
            message: "No authentication session found",
          });
        }

        console.log("🔑 Processing license validation:", { email, licenseKey });

        // Validate License และ Email Authorization
        const licenseValidation = await authService.validateLicense(
          licenseKey,
          email
        );
        if (!licenseValidation.success) {
          return reply.code(403).send({
            success: false,
            message: licenseValidation.message,
          });
        }

        // Verify temp session and get user
        const sessionValidation =
          await authService.verifyTempSession(tempSession);
        if (!sessionValidation.success) {
          reply.clearCookie("__temp_session");
          return reply.code(401).send({
            success: false,
            message: "Invalid or expired session",
          });
        }

        const user = sessionValidation.user!;

        // Create full session with license
        const sessionResult = await authService.createSessionCookie(
          user.uid,
          email,
          licenseKey,
          req.ip,
          req.headers["user-agent"]
        );

        if (!sessionResult.success) {
          return reply.code(500).send({
            success: false,
            message: sessionResult.message,
          });
        }

        // Clear temp session and set full session
        reply.clearCookie("__temp_session");
        reply.setCookie("__session", sessionResult.sessionCookie!, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60, // 24 hours
          path: "/",
        });

        console.log("✅ License validation successful:", { email, licenseKey });

        return reply.send({
          success: true,
          message: "Authentication successful",
          user: {
            uid: user.uid,
            email: user.email,
          },
          license: licenseValidation.license,
        });
      } catch (error) {
        console.error("❌ License validation error:", error);
        return reply.code(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  /**
   * 🔐 Original Single-Step Login (for backward compatibility)
   * POST /api/auth/login
   */
  fastify.post(
    "/login",
    async (
      req: FastifyRequest<{ Body: LoginRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const { email, password, licenseKey } = req.body;

        // Validate input
        if (!email || !password || !licenseKey) {
          return reply.code(400).send({
            success: false,
            message: "Email, password, and license key are required",
          });
        }

        console.log("🔐 Processing login:", {
          email: email.toLowerCase(),
          licenseKey,
        });

        // Step 1: Validate License และ Email Authorization
        const licenseValidation = await authService.validateLicense(
          licenseKey,
          email
        );
        if (!licenseValidation.success) {
          return reply.code(403).send({
            success: false,
            message: licenseValidation.message,
          });
        }

        // Step 2: Get or Create Firebase User
        const userResult = await authService.getOrCreateUser(email, password);
        if (!userResult.success) {
          return reply.code(401).send({
            success: false,
            message: userResult.message,
          });
        }

        const user = userResult.user!;

        // Step 3: Create Session Cookie
        const sessionResult = await authService.createSessionCookie(
          user.uid,
          email,
          licenseKey,
          req.ip,
          req.headers["user-agent"]
        );

        if (!sessionResult.success) {
          return reply.code(500).send({
            success: false,
            message: sessionResult.message,
          });
        }

        // Step 4: Set HttpOnly Cookie
        reply.setCookie("__session", sessionResult.sessionCookie!, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: sessionResult.expiresIn! / 1000, // Fastify uses seconds
          path: "/",
        });

        console.log("✅ Login successful:", {
          email: email.toLowerCase(),
          sessionId: sessionResult.sessionId,
          tenantId: licenseValidation.license?.tenantId,
        });

        // Return success response
        return reply.send({
          success: true,
          message: "Login successful",
          user: {
            uid: user.uid,
            email: user.email,
            sessionId: sessionResult.sessionId,
            tenantId: licenseValidation.license?.tenantId,
            features: licenseValidation.license?.features,
          },
        });
      } catch (error) {
        console.error("❌ Login error:", error);
        return reply.code(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  /**
   * 🚪 Logout Endpoint
   * POST /api/auth/logout
   */
  fastify.post("/logout", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const sessionCookie = req.cookies.__session;

      if (!sessionCookie) {
        return reply.code(400).send({
          success: false,
          message: "No session found",
        });
      }

      // Verify session to get sessionId
      const verifyResult = await authService.verifySessionCookie(sessionCookie);

      if (verifyResult.success && verifyResult.sessionId) {
        // Logout from Firebase Auth Service
        await authService.logout(verifyResult.sessionId);
      }

      // Clear session cookie
      reply.clearCookie("__session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      console.log("🚪 Logout successful:", {
        email: verifyResult.email,
        sessionId: verifyResult.sessionId,
      });

      return reply.send({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("❌ Logout error:", error);
      return reply.code(500).send({
        success: false,
        message: "Logout failed",
      });
    }
  });

  /**
   * ✅ Session Validation Endpoint
   * GET /api/auth/validate
   */
  fastify.get("/validate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const sessionCookie = req.cookies.__session;

      if (!sessionCookie) {
        return reply.code(401).send({
          success: false,
          message: "No session cookie found",
        });
      }

      // Verify session cookie
      const verifyResult = await authService.verifySessionCookie(sessionCookie);

      if (!verifyResult.success) {
        // Clear invalid cookie
        reply.clearCookie("__session", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });

        return reply.code(401).send({
          success: false,
          message: verifyResult.message,
        });
      }

      // Return user info from claims
      return reply.send({
        success: true,
        user: {
          uid: verifyResult.uid,
          email: verifyResult.email,
          sessionId: verifyResult.sessionId,
          tenantId: verifyResult.claims?.tenantId,
          licenseKey: verifyResult.claims?.licenseKey,
          features: verifyResult.claims?.features,
        },
      });
    } catch (error) {
      console.error("❌ Session validation error:", error);
      return reply.code(500).send({
        success: false,
        message: "Session validation failed",
      });
    }
  });

  /**
   * 🧹 Cleanup Expired Sessions
   * POST /api/auth/cleanup
   */
  fastify.post("/cleanup", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await authService.cleanupExpiredSessions();

      return reply.send({
        success: result.success,
        message: `Cleaned up ${result.cleaned} expired sessions`,
        cleaned: result.cleaned,
      });
    } catch (error) {
      console.error("❌ Cleanup error:", error);
      return reply.code(500).send({
        success: false,
        message: "Cleanup failed",
      });
    }
  });

  /**
   * 📊 Get Session Stats
   * GET /api/auth/stats/:licenseKey
   */
  fastify.get(
    "/stats/:licenseKey",
    async (
      req: FastifyRequest<{ Params: SessionStatsParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { licenseKey } = req.params;

        const activeSessionsCount =
          await authService.getActiveSessionsCount(licenseKey);

        return reply.send({
          success: true,
          stats: {
            licenseKey,
            activeSessionsCount,
          },
        });
      } catch (error) {
        console.error("❌ Stats error:", error);
        return reply.code(500).send({
          success: false,
          message: "Failed to get session stats",
        });
      }
    }
  );
}
