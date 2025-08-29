/**
 * User Service for Control Plane API
 * จัดการ Users ใน Firestore พร้อมแยก logic สำหรับ on-premise vs control-plane
 */

import { db, COLLECTIONS } from "../config/firebase-real";
import * as admin from "firebase-admin";
import bcrypt from "bcryptjs";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  userType: "control-plane" | "on-premise"; // แยกประเภท user
  auth?: {
    lastLoginAt?: string;
    loginCount: number;
    mfaEnabled: boolean;
    passwordChangedAt?: string;
    loginHistory: LoginHistory[];
  };
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  status: "active" | "inactive";
}

export interface LoginHistory {
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: "admin" | "editor" | "viewer";
  tenantId?: string;
  userType?: "control-plane" | "on-premise";
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: "admin" | "editor" | "viewer";
  isActive?: boolean;
  tenantId?: string;
}

export interface UserWithHash extends User {
  passwordHash?: string;
}

export class UserService {
  /**
   * สร้าง User ใหม่ (Control Plane เท่านั้น)
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Hash password ก่อนบันทึก
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Generate unique user ID (skip Firebase Auth due to config issues)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      // เตรียมข้อมูลสำหรับ Firestore
      const user: User = {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: true,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: userData.tenantId,
        userType: userData.userType || "control-plane",
        auth: {
          loginCount: 0,
          mfaEnabled: false,
          passwordChangedAt: new Date().toISOString(),
          loginHistory: [],
        },
        profile: {
          firstName: userData.name.split(" ")[0] || "",
          lastName: userData.name.split(" ")[1] || "",
        },
        status: "active",
      };

      // บันทึกลง Firestore พร้อม password hash (skip Firebase Auth)
      await db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .set({
          ...user,
          passwordHash: hashedPassword, // เพิ่ม password hash
        });

      console.log(
        `✅ User created successfully: ${userData.email} (${userId})`
      );

      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ดึงรายการ Users ทั้งหมด (Control Plane เท่านั้น)
   */
  async listUsers(): Promise<User[]> {
    try {
      // ดึงจาก Firestore เท่านั้น (สำหรับ Control Plane users)
      // ใช้ filter แบบง่ายก่อน แล้วค่อย sort ใน code
      const snapshot = await db
        .collection(COLLECTIONS.USERS)
        .where("userType", "==", "control-plane")
        .get();

      const users: User[] = [];

      for (const doc of snapshot.docs) {
        const userData = doc.data() as User;

        // ใช้ข้อมูลจาก Firestore เท่านั้น (ข้าม Firebase Auth sync)
        users.push({
          ...userData,
          isActive: userData.isActive ?? true,
          emailVerified: userData.emailVerified ?? false,
          auth: {
            loginCount: userData.auth?.loginCount || 0,
            mfaEnabled: userData.auth?.mfaEnabled || false,
            passwordChangedAt: userData.auth?.passwordChangedAt,
            loginHistory: userData.auth?.loginHistory || [],
            lastLoginAt: userData.auth?.lastLoginAt,
          },
        });
      }

      // Sort ใน memory แทนที่จะใช้ Firestore orderBy
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
   * ดึง User โดย ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      const userData = doc.data() as User;

      // ใช้ข้อมูลจาก Firestore เท่านั้น (ข้าม Firebase Auth sync)
      return {
        ...userData,
        isActive: userData.isActive ?? true,
        emailVerified: userData.emailVerified ?? false,
        auth: {
          ...userData.auth,
          lastLoginAt: userData.auth?.lastLoginAt,
          loginCount: userData.auth?.loginCount || 0,
          mfaEnabled: userData.auth?.mfaEnabled || false,
          loginHistory: userData.auth?.loginHistory || [],
        },
      };
    } catch (error) {
      console.error("Error getting user:", error);
      throw new Error(
        `Failed to get user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * อัปเดต User
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserRequest
  ): Promise<User> {
    try {
      const currentUser = await this.getUserById(userId);
      if (!currentUser) {
        throw new Error("User not found");
      }

      // อัปเดต Firestore เท่านั้น (skip Firebase Auth)
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

      console.log(
        `✅ User updated successfully: ${updateData.email || currentUser.email}`
      );

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ลบ User
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // ลบจาก Firestore เท่านั้น (skip Firebase Auth)
      await db.collection(COLLECTIONS.USERS).doc(userId).delete();

      console.log(`✅ User deleted successfully: ${userId}`);
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
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      // อัปเดต Firestore (ข้าม Firebase Auth เนื่องจากปัญหา configuration)
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

      console.log(
        `Successfully toggled user status for user: ${userId} to ${isActive ? "active" : "inactive"}`
      );
      return updatedUser;
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw new Error(
        `Failed to toggle user status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * เปลี่ยนรหัสผ่าน
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      // Hash password ใหม่
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // อัปเดต timestamp และ hash ใน Firestore (ข้าม Firebase Auth)
      await db.collection(COLLECTIONS.USERS).doc(userId).update({
        "auth.passwordChangedAt": new Date().toISOString(),
        passwordHash: hashedPassword,
        updatedAt: new Date().toISOString(),
      });

      console.log(`Successfully changed password for user: ${userId}`);
    } catch (error) {
      console.error("Error changing password:", error);
      throw new Error(
        `Failed to change password: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ดึง On-premise Users (สำหรับแสดงข้อมูลเท่านั้น - ไม่มี role management)
   */
  async listOnPremiseUsers(): Promise<User[]> {
    try {
      // ดึงจาก Firestore เฉพาะ on-premise users
      const snapshot = await db
        .collection(COLLECTIONS.USERS)
        .where("userType", "==", "on-premise")
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc: any) => ({
        ...(doc.data() as User),
        role: "viewer", // On-premise users เป็น viewer เท่านั้น
      }));
    } catch (error) {
      console.error("Error listing on-premise users:", error);
      throw new Error(
        `Failed to list on-premise users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * บันทึก Login History (สำหรับ on-premise หรือ control-plane)
   */
  async recordLogin(
    userId: string,
    loginData: Omit<LoginHistory, "timestamp">
  ): Promise<void> {
    try {
      const loginRecord: LoginHistory = {
        ...loginData,
        timestamp: new Date().toISOString(),
      };

      // อัปเดต login count และ history
      await db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .update({
          "auth.loginCount": admin.firestore.FieldValue.increment(1),
          "auth.loginHistory":
            admin.firestore.FieldValue.arrayUnion(loginRecord),
          updatedAt: new Date().toISOString(),
        });
    } catch (error) {
      console.error("Error recording login:", error);
      // ไม่ throw error เพราะการบันทึก login history ไม่ควรขัดขวางการ login
    }
  }

  /**
   * ดึงรายการ Users พร้อม password hash (สำหรับ authentication)
   */
  async listUsersWithHash(): Promise<UserWithHash[]> {
    try {
      const snapshot = await db.collection(COLLECTIONS.USERS).get();

      const users: UserWithHash[] = [];

      for (const doc of snapshot.docs) {
        const userData = doc.data() as UserWithHash;
        users.push({
          ...userData,
          id: doc.id,
        });
      }

      return users;
    } catch (error) {
      console.error("Error listing users with hash:", error);
      throw new Error(
        `Failed to list users with hash: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * ตรวจสอบรหัสผ่าน
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  }
}
