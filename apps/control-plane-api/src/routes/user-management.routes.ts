/**
 * User Management Routes for Control Plane API
 * Firebase-based user management with Firestore integration
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import {
  UserService,
  CreateUserRequest,
  UpdateUserRequest,
  LoginHistory,
} from "../services/user.service";

// Request Types
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function userManagementRoutes(fastify: FastifyInstance) {
  const userService = new UserService();

  /**
   * GET /api/users - List all users (Control Plane เท่านั้น)
   */
  fastify.get(
    "/users",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await userService.listUsers();

        return {
          success: true,
          data: users,
        };
      } catch (error) {
        console.error("Error listing users:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to list users",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  /**
   * GET /api/users/on-premise - List on-premise users (แสดงข้อมูลเท่านั้น)
   */
  fastify.get(
    "/users/on-premise",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await userService.listOnPremiseUsers();

        return {
          success: true,
          data: users,
          message:
            "On-premise users have viewer role only and cannot be managed from Control Plane",
        };
      } catch (error) {
        console.error("Error listing on-premise users:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to list on-premise users",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  /**
   * GET /api/users/:id - Get user by ID
   */
  fastify.get<{ Params: { id: string } }>(
    "/users/:id",
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = await userService.getUserById(id);

        if (!user) {
          reply.status(404);
          return {
            success: false,
            error: "User not found",
          };
        }

        return {
          success: true,
          data: user,
        };
      } catch (error) {
        console.error("Error getting user:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to get user",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  /**
   * POST /api/users - Create new user (Control Plane เท่านั้น)
   */
  fastify.post<{ Body: CreateUserRequest }>(
    "/users",
    async (request, reply) => {
      try {
        const userData = request.body as CreateUserRequest; // Validation
        if (!userData.email || !userData.name || !userData.password) {
          reply.status(400);
          return {
            success: false,
            error: "Missing required fields",
            details: "email, name, and password are required",
          };
        }

        if (userData.password.length < 8) {
          reply.status(400);
          return {
            success: false,
            error: "Password too short",
            details: "Password must be at least 8 characters long",
          };
        }

        // สร้าง user ใหม่
        const newUser = await userService.createUser({
          ...userData,
          userType: "control-plane", // Force control-plane type
        });

        return {
          success: true,
          data: newUser,
          message: "User created successfully",
        };
      } catch (error) {
        console.error("Error creating user:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to create user",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  /**
   * PUT /api/users/:id - Update user
   */
  fastify.put<{ Params: { id: string }; Body: UpdateUserRequest }>(
    "/users/:id",
    async (request, reply) => {
      try {
        const { id } = request.params;
        const updateData = request.body as UpdateUserRequest;

        const updatedUser = await userService.updateUser(id, updateData);

        return {
          success: true,
          data: updatedUser,
          message: "User updated successfully",
        };
      } catch (error) {
        console.error("Error updating user:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to update user",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  /**
   * DELETE /api/users/:id - Delete user
   */
  fastify.delete<{ Params: { id: string } }>(
    "/users/:id",
    async (request, reply) => {
      try {
        const { id } = request.params;

        await userService.deleteUser(id);

        return {
          success: true,
          message: "User deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting user:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to delete user",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  /**
   * PATCH /api/users/:id/status - Toggle user active status
   */
  fastify.patch<{ Params: { id: string }; Body: { isActive: boolean } }>(
    "/users/:id/status",
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { isActive } = request.body;

        const updatedUser = await userService.toggleUserStatus(id, isActive);

        return {
          success: true,
          data: updatedUser,
          message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        };
      } catch (error) {
        console.error("Error toggling user status:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to toggle user status",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  /**
   * POST /api/users/:id/change-password - Change user password
   */
  fastify.post<{ Params: { id: string }; Body: ChangePasswordRequest }>(
    "/users/:id/change-password",
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { newPassword } = request.body;

        if (!newPassword || newPassword.length < 8) {
          reply.status(400);
          return {
            success: false,
            error: "Invalid password",
            details: "Password must be at least 8 characters long",
          };
        }

        await userService.changePassword(id, newPassword);

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch (error) {
        console.error("Error changing password:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to change password",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  /**
   * POST /api/users/:id/record-login - Record login activity
   */
  fastify.post<{
    Params: { id: string };
    Body: { ipAddress?: string; userAgent?: string; success: boolean };
  }>("/users/:id/record-login", async (request, reply) => {
    try {
      const { id } = request.params;
      const loginData = request.body;

      await userService.recordLogin(id, loginData);

      return {
        success: true,
        message: "Login recorded successfully",
      };
    } catch (error) {
      console.error("Error recording login:", error);
      // ไม่ return error เพราะการบันทึก login history ไม่ควรขัดขวางการ login
      return {
        success: true,
        message: "Login recording failed but login process continues",
      };
    }
  });

  /**
   * GET /api/users/stats - Get user statistics
   */
  fastify.get(
    "/users/stats",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const [controlPlaneUsers, onPremiseUsers] = await Promise.all([
          userService.listUsers(),
          userService.listOnPremiseUsers(),
        ]);

        const stats = {
          controlPlane: {
            total: controlPlaneUsers.length,
            active: controlPlaneUsers.filter((u) => u.isActive).length,
            inactive: controlPlaneUsers.filter((u) => !u.isActive).length,
            admins: controlPlaneUsers.filter((u) => u.role === "admin").length,
            editors: controlPlaneUsers.filter((u) => u.role === "editor")
              .length,
            viewers: controlPlaneUsers.filter((u) => u.role === "viewer")
              .length,
          },
          onPremise: {
            total: onPremiseUsers.length,
            active: onPremiseUsers.filter((u) => u.isActive).length,
            inactive: onPremiseUsers.filter((u) => !u.isActive).length,
            note: "All on-premise users have viewer role only",
          },
          summary: {
            totalUsers: controlPlaneUsers.length + onPremiseUsers.length,
            totalActive:
              controlPlaneUsers.filter((u) => u.isActive).length +
              onPremiseUsers.filter((u) => u.isActive).length,
          },
        };

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error("Error getting user stats:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to get user statistics",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );
}
