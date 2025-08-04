/**
 * User Service for Control Plane API
 * จัดการ Users ใน Firestore พร้อมแยก logic สำหรับ on-premise vs control-plane
 */

import { db, auth, COLLECTIONS } from "../config/firebase-real";
import { FieldValue } from "firebase-admin/firestore";
import { UserRecord } from "firebase-admin/auth";

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

export class UserService {
  /**
   * สร้าง User ใหม่ (Control Plane เท่านั้น)
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // สร้าง Firebase Auth User ก่อน
      const firebaseUser = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: false,
        disabled: false,
      });

      // เตรียมข้อมูลสำหรับ Firestore
      const user: User = {
        id: firebaseUser.uid,
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

      // บันทึกลง Firestore
      await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(user);

      // Set custom claims สำหรับ Firebase Auth
      await auth.setCustomUserClaims(firebaseUser.uid, {
        role: userData.role,
        tenantId: userData.tenantId,
        userType: user.userType,
      });

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

        try {
          // Sync กับ Firebase Auth เพื่อดูสถานะล่าสุด
          const firebaseUser = await auth.getUser(doc.id);

          users.push({
            ...userData,
            isActive: !firebaseUser.disabled,
            emailVerified: firebaseUser.emailVerified,
            auth: {
              loginCount: userData.auth?.loginCount || 0,
              mfaEnabled: userData.auth?.mfaEnabled || false,
              passwordChangedAt: userData.auth?.passwordChangedAt,
              loginHistory: userData.auth?.loginHistory || [],
              lastLoginAt: firebaseUser.metadata.lastSignInTime,
            },
          });
        } catch (authError) {
          // ถ้า Firebase Auth user ไม่อยู่แล้ว ให้ mark เป็น inactive
          users.push({
            ...userData,
            isActive: false,
            status: "inactive",
          });
        }
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

      try {
        // Sync กับ Firebase Auth
        const firebaseUser = await auth.getUser(userId);

        return {
          ...userData,
          isActive: !firebaseUser.disabled,
          emailVerified: firebaseUser.emailVerified,
          auth: {
            ...userData.auth,
            lastLoginAt: firebaseUser.metadata.lastSignInTime,
            loginCount: userData.auth?.loginCount || 0,
            mfaEnabled: userData.auth?.mfaEnabled || false,
            loginHistory: userData.auth?.loginHistory || [],
          },
        };
      } catch (authError) {
        // Firebase Auth user ไม่อยู่
        return {
          ...userData,
          isActive: false,
          status: "inactive",
        };
      }
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

      // อัปเดต Firebase Auth ถ้าจำเป็น
      if (updateData.email || updateData.isActive !== undefined) {
        const authUpdate: any = {};
        if (updateData.email) authUpdate.email = updateData.email;
        if (updateData.isActive !== undefined)
          authUpdate.disabled = !updateData.isActive;

        await auth.updateUser(userId, authUpdate);
      }

      // อัปเดต Custom Claims
      if (updateData.role || updateData.tenantId !== undefined) {
        await auth.setCustomUserClaims(userId, {
          role: updateData.role || currentUser.role,
          tenantId: updateData.tenantId,
          userType: currentUser.userType,
        });
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
   * ลบ User
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // ลบจาก Firebase Auth
      await auth.deleteUser(userId);

      // ลบจาก Firestore
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
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      // อัปเดต Firebase Auth
      await auth.updateUser(userId, { disabled: !isActive });

      // อัปเดต Firestore
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
   * เปลี่ยนรหัสผ่าน
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      // อัปเดตรหัสผ่านใน Firebase Auth
      await auth.updateUser(userId, { password: newPassword });

      // อัปเดต timestamp ใน Firestore
      await db.collection(COLLECTIONS.USERS).doc(userId).update({
        "auth.passwordChangedAt": new Date().toISOString(),
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

      return snapshot.docs.map((doc) => ({
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
          "auth.loginCount": FieldValue.increment(1),
          "auth.loginHistory": FieldValue.arrayUnion(loginRecord),
          updatedAt: new Date().toISOString(),
        });
    } catch (error) {
      console.error("Error recording login:", error);
      // ไม่ throw error เพราะการบันทึก login history ไม่ควรขัดขวางการ login
    }
  }
}
