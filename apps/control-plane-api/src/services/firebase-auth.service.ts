/**
 * Firebase Authentication Service for OnPrem License Management
 * จัดการ Firebase Auth, Session Cookies และ License Validation
 */

import { auth, db, COLLECTIONS } from "../config/firebase-real";
import * as admin from "firebase-admin";
import crypto from "crypto";

export interface LicenseData {
  licenseKey: string;
  tenantId: string;
  companyName: string;
  authorizedEmails: string[];
  maxConcurrentUsers: number;
  features: string[];
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  sessionId: string;
  uid: string;
  email: string;
  licenseKey: string;
  tenantId: string;
  loginTime: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export class FirebaseAuthService {
  /**
   * สร้าง Firebase User หรือตรวจสอบ User ที่มีอยู่
   */
  async getOrCreateUser(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: admin.auth.UserRecord;
    message?: string;
  }> {
    try {
      // ลองหา User ที่มีอยู่แล้ว
      let user: admin.auth.UserRecord;

      try {
        user = await auth.getUserByEmail(email);
        console.log("✅ Found existing Firebase user:", email);
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          // สร้าง User ใหม่
          user = await auth.createUser({
            email,
            password,
            emailVerified: true, // Auto-verify สำหรับ OnPrem
          });
          console.log("✅ Created new Firebase user:", email);
        } else {
          throw error;
        }
      }

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error("❌ Error getting/creating user:", error);
      return {
        success: false,
        message: "Failed to authenticate user",
      };
    }
  }

  /**
   * Validate License Key และตรวจสอบ Email Authorization
   */
  async validateLicense(
    licenseKey: string,
    email: string
  ): Promise<{
    success: boolean;
    license?: LicenseData;
    message?: string;
  }> {
    try {
      // ดึง License จาก Firestore
      const licenseDoc = await db
        .collection(COLLECTIONS.LICENSES)
        .doc(licenseKey)
        .get();

      if (!licenseDoc.exists) {
        return {
          success: false,
          message: "License key not found",
        };
      }

      const license = licenseDoc.data() as LicenseData;

      // ตรวจสอบ License
      if (!license.isActive) {
        return {
          success: false,
          message: "License is not active",
        };
      }

      if (new Date(license.expiryDate) < new Date()) {
        return {
          success: false,
          message: "License has expired",
        };
      }

      // ตรวจสอบ Email Authorization
      if (!license.authorizedEmails.includes(email.toLowerCase())) {
        return {
          success: false,
          message: "Email not authorized for this license",
        };
      }

      // ตรวจสอบ Concurrent Users
      const activeSessionsCount = await this.getActiveSessionsCount(licenseKey);
      if (activeSessionsCount >= license.maxConcurrentUsers) {
        return {
          success: false,
          message: `Maximum concurrent users (${license.maxConcurrentUsers}) reached`,
        };
      }

      return {
        success: true,
        license,
      };
    } catch (error) {
      console.error("❌ Error validating license:", error);
      return {
        success: false,
        message: "License validation failed",
      };
    }
  }

  /**
   * สร้าง Session Cookie สำหรับ OnPrem Authentication
   */
  async createSessionCookie(
    uid: string,
    email: string,
    licenseKey: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    sessionCookie?: string;
    sessionId?: string;
    expiresIn?: number;
    message?: string;
  }> {
    try {
      // Get license data
      const licenseValidation = await this.validateLicense(licenseKey, email);
      if (!licenseValidation.success) {
        return {
          success: false,
          message: licenseValidation.message,
        };
      }

      const license = licenseValidation.license!;

      // Create custom token with license claims
      const customToken = await auth.createCustomToken(uid, {
        licenseKey,
        tenantId: license.tenantId,
        features: license.features,
        email: email.toLowerCase(),
      });

      // Session cookie expires in 24 hours
      const expiresIn = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // Create session cookie
      const sessionCookie = await auth.createSessionCookie(customToken, {
        expiresIn,
      });

      // Store session in Firestore
      const sessionId = crypto.randomUUID();
      const sessionData: UserSession = {
        sessionId,
        uid,
        email: email.toLowerCase(),
        licenseKey,
        tenantId: license.tenantId,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress,
        userAgent,
        isActive: true,
      };

      await db
        .collection(COLLECTIONS.USER_SESSIONS)
        .doc(sessionId)
        .set(sessionData);

      console.log("🔐 Session cookie created:", {
        sessionId,
        email,
        tenantId: license.tenantId,
      });

      return {
        success: true,
        sessionCookie,
        sessionId,
        expiresIn,
      };
    } catch (error) {
      console.error("❌ Error creating session cookie:", error);
      return {
        success: false,
        message: "Failed to create session",
      };
    }
  }

  /**
   * Verify Session Cookie และ update activity
   */
  async verifySessionCookie(sessionCookie: string): Promise<{
    success: boolean;
    uid?: string;
    email?: string;
    claims?: any;
    sessionId?: string;
    message?: string;
  }> {
    try {
      // Verify session cookie
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

      // Find active session
      const sessionsSnapshot = await db
        .collection(COLLECTIONS.USER_SESSIONS)
        .where("uid", "==", decodedClaims.uid)
        .where("isActive", "==", true)
        .orderBy("lastActivity", "desc")
        .limit(1)
        .get();

      if (sessionsSnapshot.empty) {
        return {
          success: false,
          message: "No active session found",
        };
      }

      const sessionDoc = sessionsSnapshot.docs[0];
      const sessionData = sessionDoc.data() as UserSession;

      // Update last activity
      await sessionDoc.ref.update({
        lastActivity: new Date().toISOString(),
      });

      return {
        success: true,
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        claims: decodedClaims,
        sessionId: sessionData.sessionId,
      };
    } catch (error) {
      console.error("❌ Error verifying session cookie:", error);
      return {
        success: false,
        message: "Invalid or expired session",
      };
    }
  }

  /**
   * Logout และ invalidate session
   */
  async logout(sessionId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Mark session as inactive
      await db.collection(COLLECTIONS.USER_SESSIONS).doc(sessionId).update({
        isActive: false,
        logoutTime: new Date().toISOString(),
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Error during logout:", error);
      return {
        success: false,
        message: "Logout failed",
      };
    }
  }

  /**
   * Get active sessions count for a license
   */
  async getActiveSessionsCount(licenseKey: string): Promise<number> {
    try {
      const activeSessionsSnapshot = await db
        .collection(COLLECTIONS.USER_SESSIONS)
        .where("licenseKey", "==", licenseKey)
        .where("isActive", "==", true)
        .get();

      // Filter out expired sessions (older than 24 hours)
      const now = new Date();
      const validSessions = activeSessionsSnapshot.docs.filter((doc: any) => {
        const session = doc.data() as UserSession;
        const lastActivity = new Date(session.lastActivity);
        const hoursDiff =
          (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 24; // Session valid for 24 hours
      });

      return validSessions.length;
    } catch (error) {
      console.error("❌ Error getting active sessions count:", error);
      return 0;
    }
  }

  /**
   * สร้าง Temporary Session Cookie (สำหรับ email login ขั้นแรก)
   */
  async createTempSession(
    uid: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    sessionCookie?: string;
    sessionId?: string;
    message?: string;
  }> {
    try {
      // Create custom token without license claims
      const customToken = await auth.createCustomToken(uid, {
        email: email.toLowerCase(),
        temp: true, // Mark as temporary session
      });

      // Temporary session expires in 10 minutes
      const expiresIn = 10 * 60 * 1000; // 10 minutes in milliseconds

      // Create session cookie
      const sessionCookie = await auth.createSessionCookie(customToken, {
        expiresIn,
      });

      // Store temporary session in Firestore
      const sessionId = crypto.randomUUID();
      const tempSessionData = {
        sessionId,
        uid,
        email: email.toLowerCase(),
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        isActive: true,
        temporary: true,
        expiresAt: new Date(Date.now() + expiresIn).toISOString(),
      };

      await db.collection("tempSessions").doc(sessionId).set(tempSessionData);

      console.log("✅ Temporary session created:", {
        sessionId,
        email,
        expiresIn: expiresIn / 1000 / 60,
      });

      return {
        success: true,
        sessionCookie,
        sessionId,
      };
    } catch (error) {
      console.error("❌ Error creating temporary session:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create session",
      };
    }
  }

  /**
   * ตรวจสอบ Temporary Session Cookie
   */
  async verifyTempSession(sessionCookie: string): Promise<{
    success: boolean;
    user?: {
      uid: string;
      email: string;
    };
    message?: string;
  }> {
    try {
      // Verify session cookie
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

      if (!decodedClaims.temp) {
        return {
          success: false,
          message: "Not a temporary session",
        };
      }

      // Check if session is still valid in Firestore
      const tempSessionsSnapshot = await db
        .collection("tempSessions")
        .where("uid", "==", decodedClaims.uid)
        .where("isActive", "==", true)
        .where("expiresAt", ">", new Date().toISOString())
        .limit(1)
        .get();

      if (tempSessionsSnapshot.empty) {
        return {
          success: false,
          message: "Temporary session expired or not found",
        };
      }

      return {
        success: true,
        user: {
          uid: decodedClaims.uid,
          email: decodedClaims.email || "",
        },
      };
    } catch (error) {
      console.error("❌ Error verifying temporary session:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to verify session",
      };
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<{
    success: boolean;
    cleaned: number;
  }> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const expiredSessionsSnapshot = await db
        .collection(COLLECTIONS.USER_SESSIONS)
        .where("lastActivity", "<", oneDayAgo.toISOString())
        .where("isActive", "==", true)
        .get();

      let cleaned = 0;
      const batch = db.batch();

      expiredSessionsSnapshot.docs.forEach((doc: any) => {
        batch.update(doc.ref, {
          isActive: false,
          expiredAt: new Date().toISOString(),
        });
        cleaned++;
      });

      if (cleaned > 0) {
        await batch.commit();
        console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
      }

      return {
        success: true,
        cleaned,
      };
    } catch (error) {
      console.error("❌ Error cleaning up sessions:", error);
      return {
        success: false,
        cleaned: 0,
      };
    }
  }
}
