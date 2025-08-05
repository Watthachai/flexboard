/**
 * Simple User Service - Firestore Only (ไม่ใช้ Firebase Auth)
 * ใช้เฉพาะ Firestore สำหรับเก็บข้อมูล User เมื่อ Firebase Auth ไม่ available
 */

import { db, COLLECTIONS } from "../config/firebase-real";
import { FieldValue } from "firebase-admin/firestore";

// Simplified User Types
export interface SimpleUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  userType: "control-plane" | "on-premise";
  // ใช้ hash password แทน Firebase Auth
  passwordHash?: string;
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  status: "active" | "inactive";
}

export interface SimpleCreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: "admin" | "editor" | "viewer";
  tenantId?: string;
  userType?: "control-plane" | "on-premise";
}

export interface SimpleUpdateUserRequest {
  email?: string;
  name?: string;
  role?: "admin" | "editor" | "viewer";
  isActive?: boolean;
  tenantId?: string;
}

export interface SimpleLoginData {
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

export class SimpleUserService {
  /**
   * สร้าง User ใหม่ (เฉพาะ Firestore)
   */
  async createUser(userData: SimpleCreateUserRequest): Promise<SimpleUser> {
    try {
      // สร้าง ID ใหม่
      const userId = db.collection(COLLECTIONS.USERS).doc().id;

      // Simple password hashing (ในการผลิตจริงควรใช้ bcrypt)
      const crypto = require("crypto");
      const passwordHash = crypto
        .createHash("sha256")
        .update(userData.password)
        .digest("hex");

      // เตรียมข้อมูลสำหรับ Firestore
      const user: SimpleUser = {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(userData.tenantId && { tenantId: userData.tenantId }),
        userType: userData.userType || "control-plane",
        passwordHash,
        profile: {
          firstName: userData.name.split(" ")[0] || "",
          lastName: userData.name.split(" ")[1] || "",
        },
        status: "active",
      };

      // บันทึกลง Firestore
      await db.collection(COLLECTIONS.USERS).doc(userId).set(user);

      // ลบ passwordHash ออกจาก response
      const { passwordHash: _, ...userResponse } = user;
      return userResponse as SimpleUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ตรวจสอบ Password
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      const crypto = require("crypto");
      const hash = crypto
        .createHash("sha256")
        .update(plainPassword)
        .digest("hex");

      return hash === hashedPassword;
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  }

  /**
   * ดึงรายการ Users ทั้งหมด (Control Plane เท่านั้น)
   */
  async listUsers(): Promise<SimpleUser[]> {
    try {
      const snapshot = await db
        .collection(COLLECTIONS.USERS)
        .where("userType", "==", "control-plane")
        .get();

      const users: SimpleUser[] = [];

      for (const doc of snapshot.docs) {
        const userData = doc.data() as SimpleUser;
        // ลบ passwordHash ออกจาก response
        const { passwordHash: _, ...userResponse } = userData;
        users.push(userResponse as SimpleUser);
      }

      // Sort ใน memory
      return users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error listing users:", error);
      throw new Error(
        `Failed to list users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ดึงรายการ Users พร้อม passwordHash (สำหรับ authentication)
   */
  async listUsersWithHash(): Promise<
    (SimpleUser & { passwordHash: string })[]
  > {
    try {
      const snapshot = await db
        .collection(COLLECTIONS.USERS)
        .where("userType", "==", "control-plane")
        .get();

      const users: (SimpleUser & { passwordHash: string })[] = [];

      for (const doc of snapshot.docs) {
        const userData = doc.data() as SimpleUser & { passwordHash: string };
        users.push(userData);
      }

      // Sort ใน memory
      return users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error listing users with hash:", error);
      throw new Error(
        `Failed to list users with hash: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ดึง User โดย ID
   */
  async getUserById(userId: string): Promise<SimpleUser | null> {
    try {
      const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      const userData = doc.data() as SimpleUser;
      // ลบ passwordHash ออกจาก response
      const { passwordHash: _, ...userResponse } = userData;
      return userResponse as SimpleUser;
    } catch (error) {
      console.error("Error getting user:", error);
      throw new Error(
        `Failed to get user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ลบ User
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await db.collection(COLLECTIONS.USERS).doc(userId).delete();
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error(
        `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * เปลี่ยนสถานะ Active/Inactive
   */
  async toggleUserStatus(
    userId: string,
    isActive: boolean
  ): Promise<SimpleUser> {
    try {
      await db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .update({
          isActive,
          status: isActive ? "active" : "inactive",
          updatedAt: new Date().toISOString(),
        });

      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error("Failed to retrieve updated user");
      }

      return updatedUser;
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw new Error(
        `Failed to toggle user status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * อัปเดตรหัสผ่าน (Simple hash)
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const crypto = require("crypto");
      const passwordHash = crypto
        .createHash("sha256")
        .update(newPassword)
        .digest("hex");

      await db.collection(COLLECTIONS.USERS).doc(userId).update({
        passwordHash,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error changing password:", error);
      throw new Error(
        `Failed to change password: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * อัปเดต User
   */
  async updateUser(
    userId: string,
    updateData: SimpleUpdateUserRequest
  ): Promise<SimpleUser> {
    try {
      const currentUser = await this.getUserById(userId);
      if (!currentUser) {
        throw new Error("User not found");
      }

      // อัปเดต Firestore
      const firestoreUpdate = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .update(firestoreUpdate);

      // ดึงข้อมูลใหม่หลังอัปเดต
      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error("Failed to retrieve updated user");
      }

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ดึง On-premise Users (สำหรับแสดงข้อมูลเท่านั้น)
   */
  async listOnPremiseUsers(): Promise<SimpleUser[]> {
    try {
      const snapshot = await db
        .collection(COLLECTIONS.USERS)
        .where("userType", "==", "on-premise")
        .get();

      const users: SimpleUser[] = [];

      for (const doc of snapshot.docs) {
        const userData = doc.data() as SimpleUser;
        // ลบ passwordHash ออกจาก response
        const { passwordHash: _, ...userResponse } = userData;
        users.push(userResponse as SimpleUser);
      }

      // Sort ใน memory
      return users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error listing on-premise users:", error);
      throw new Error(
        `Failed to list on-premise users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * บันทึก Login History (placeholder)
   */
  async recordLogin(userId: string, loginData: SimpleLoginData): Promise<void> {
    try {
      // Simple login recording - อัปเดต last login timestamp
      await db.collection(COLLECTIONS.USERS).doc(userId).update({
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error recording login:", error);
      // ไม่ throw error เพราะการบันทึก login history ไม่ควรขัดขวางการ login
    }
  }
}
