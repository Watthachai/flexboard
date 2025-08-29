/**
 * OnPrem Sessions Management API Routes
 * จัดการ session data ใน Firebase Firestore สำหรับ OnPrem Agent
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { TenantService } from "../services/firestore.service";
import { Timestamp } from "firebase-admin/firestore";

interface SessionData {
  sessionId: string;
  userEmail: string;
  licenseKey: string;
  tenantId: string;
  companyName: string;
  features: string[];
  maxConcurrentUsers: number;
  expiryDate: string;
  loginTime: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  refreshTokenHash?: string;
}

interface CreateSessionRequest extends FastifyRequest {
  Body: SessionData;
}

interface GetSessionRequest extends FastifyRequest {
  Params: { sessionId: string };
}

interface UpdateActivityRequest extends FastifyRequest {
  Params: { sessionId: string };
  Body: { lastActivity: string };
}

interface GetSessionsCountRequest extends FastifyRequest {
  Querystring: { licenseKey: string };
}

/**
 * Create new session in Firebase
 */
export async function createSession(
  request: CreateSessionRequest,
  reply: FastifyReply
) {
  try {
    const sessionData = request.body as any;

    // Store session in Firestore
    const result = await TenantService.createDocument(
      "onprem-sessions",
      sessionData.sessionId,
      {
        ...sessionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );

    if (result.success) {
      console.log("✅ Session stored in Firebase:", sessionData.sessionId);

      return reply.send({
        success: true,
        sessionId: sessionData.sessionId,
        message: "Session created successfully",
      });
    } else {
      return reply.status(500).send({
        success: false,
        message: "Failed to create session",
      });
    }
  } catch (error) {
    console.error("❌ Error creating session:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Get session from Firebase
 */
export async function getSession(
  request: GetSessionRequest,
  reply: FastifyReply
) {
  try {
    const { sessionId } = request.params as any;

    const result = await TenantService.getDocument(
      "onprem-sessions",
      sessionId
    );

    if (result.success && result.data) {
      const session = result.data as unknown as SessionData;

      // Check if session is still valid (not expired)
      const now = new Date();
      const lastActivity = new Date(session.lastActivity);
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

      if (now.getTime() - lastActivity.getTime() > sessionTimeout) {
        // Session expired, mark as inactive
        await TenantService.updateDocument(
          "onprem-sessions",
          sessionId,
          {
            isActive: false,
            updatedAt: Timestamp.now(),
          } as any,
          session.userEmail
        );

        return reply.status(401).send({
          success: false,
          message: "Session expired",
        });
      }

      return reply.send({
        success: true,
        session,
      });
    } else {
      return reply.status(404).send({
        success: false,
        message: "Session not found",
      });
    }
  } catch (error) {
    console.error("❌ Error getting session:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(
  request: UpdateActivityRequest,
  reply: FastifyReply
) {
  try {
    const { sessionId } = request.params as any;
    const { lastActivity } = request.body as any;

    const result = await TenantService.updateDocument(
      "onprem-sessions",
      sessionId,
      {
        lastActivity,
        updatedAt: Timestamp.now(),
      } as any,
      "system"
    );

    if (result.success) {
      return reply.send({
        success: true,
        message: "Session activity updated",
      });
    } else {
      return reply.status(404).send({
        success: false,
        message: "Session not found",
      });
    }
  } catch (error) {
    console.error("❌ Error updating session activity:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Get active sessions count for a license
 */
export async function getActiveSessionsCount(
  request: GetSessionsCountRequest,
  reply: FastifyReply
) {
  try {
    const { licenseKey } = request.query as any;

    // Get all sessions from Firestore
    const result = await TenantService.getDocuments("onprem-sessions");

    if (result.success) {
      const allSessions = (result.data as unknown as SessionData[]) || [];

      // Filter sessions by license key and active status
      const activeSessions = allSessions.filter(
        (session) => session.licenseKey === licenseKey && session.isActive
      );

      // Filter out expired sessions
      const now = new Date();
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

      const validSessions = activeSessions.filter((session) => {
        const lastActivity = new Date(session.lastActivity);
        return now.getTime() - lastActivity.getTime() <= sessionTimeout;
      });

      return reply.send({
        success: true,
        count: validSessions.length,
        sessions: validSessions.map((s) => ({
          sessionId: s.sessionId,
          userEmail: s.userEmail,
          loginTime: s.loginTime,
          lastActivity: s.lastActivity,
        })),
      });
    } else {
      return reply.send({
        success: true,
        count: 0,
        sessions: [],
      });
    }
  } catch (error) {
    console.error("❌ Error getting sessions count:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Delete session (logout)
 */
export async function deleteSession(
  request: GetSessionRequest,
  reply: FastifyReply
) {
  try {
    const { sessionId } = request.params as any;
    // Mark session as inactive instead of deleting
    const result = await TenantService.updateDocument(
      "onprem-sessions",
      sessionId,
      {
        isActive: false,
        logoutTime: new Date().toISOString(),
        updatedAt: Timestamp.now(),
      } as any,
      "system"
    );

    if (result.success) {
      console.log("✅ Session marked as inactive:", sessionId);

      return reply.send({
        success: true,
        message: "Session terminated successfully",
      });
    } else {
      return reply.status(404).send({
        success: false,
        message: "Session not found",
      });
    }
  } catch (error) {
    console.error("❌ Error deleting session:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get all active sessions
    const result = await TenantService.getDocuments("onprem-sessions");

    if (result.success) {
      const allSessions = (result.data as unknown as SessionData[]) || [];

      // Filter only active sessions
      const activeSessions = allSessions.filter((session) => session.isActive);

      const now = new Date();
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

      let cleanedUp = 0;

      // Mark expired sessions as inactive
      for (const session of activeSessions) {
        const lastActivity = new Date(session.lastActivity);
        if (now.getTime() - lastActivity.getTime() > sessionTimeout) {
          await TenantService.updateDocument(
            "onprem-sessions",
            session.sessionId,
            {
              isActive: false,
              expiredAt: new Date().toISOString(),
              updatedAt: Timestamp.now(),
            } as any,
            "system"
          );
          cleanedUp++;
        }
      }
      console.log(`🧹 Cleaned up ${cleanedUp} expired sessions`);

      return reply.send({
        success: true,
        message: `Cleaned up ${cleanedUp} expired sessions`,
        cleanedUp,
      });
    } else {
      return reply.send({
        success: true,
        message: "No sessions to cleanup",
        cleanedUp: 0,
      });
    }
  } catch (error) {
    console.error("❌ Error cleaning up sessions:", error);
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}
