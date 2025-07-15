/**
 * User Service
 * Business logic for user management operations
 */

import { apiClient } from "@/lib/api/client";
import { ApiResponse, CreateUserRequest, UpdateUserRequest } from "@/types/api";
import { User } from "@/types/user";

export class UserService {
  private static readonly ENDPOINT = "/api/users";

  /**
   * Get all users with optional filtering
   */
  static async getUsers(filters?: {
    tenantId?: string;
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<ApiResponse<User[]>> {
    try {
      const params = new URLSearchParams();

      if (filters?.tenantId) params.append("tenantId", filters.tenantId);
      if (filters?.role) params.append("role", filters.role);
      if (filters?.isActive !== undefined)
        params.append("isActive", filters.isActive.toString());
      if (filters?.search) params.append("search", filters.search);

      const queryString = params.toString();
      const url = queryString
        ? `${this.ENDPOINT}?${queryString}`
        : this.ENDPOINT;

      return await apiClient.get<User[]>(url);
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch users",
        data: [],
      };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "User ID is required",
          data: {} as User,
        };
      }

      return await apiClient.get<User>(`${this.ENDPOINT}/${id}`);
    } catch (error) {
      console.error("Error fetching user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user",
        data: {} as User,
      };
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      return await apiClient.get<User>(`${this.ENDPOINT}/me`);
    } catch (error) {
      console.error("Error fetching current user:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch current user",
        data: {} as User,
      };
    }
  }

  /**
   * Create new user
   */
  static async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Validate required fields
      if (!data.email?.trim()) {
        return {
          success: false,
          error: "Email is required",
          data: {} as User,
        };
      }

      if (!data.name?.trim()) {
        return {
          success: false,
          error: "Name is required",
          data: {} as User,
        };
      }

      if (!data.role) {
        return {
          success: false,
          error: "Role is required",
          data: {} as User,
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return {
          success: false,
          error: "Invalid email format",
          data: {} as User,
        };
      }

      return await apiClient.post<User>(this.ENDPOINT, data);
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user",
        data: {} as User,
      };
    }
  }

  /**
   * Update existing user
   */
  static async updateUser(
    id: string,
    data: UpdateUserRequest
  ): Promise<ApiResponse<User>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "User ID is required",
          data: {} as User,
        };
      }

      // Validate email format if provided
      if (data.email && data.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          return {
            success: false,
            error: "Invalid email format",
            data: {} as User,
          };
        }
      }

      return await apiClient.put<User>(`${this.ENDPOINT}/${id}`, data);
    } catch (error) {
      console.error("Error updating user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update user",
        data: {} as User,
      };
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      return await apiClient.delete<void>(`${this.ENDPOINT}/${id}`);
    } catch (error) {
      console.error("Error deleting user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete user",
      };
    }
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(
    id: string,
    isActive: boolean
  ): Promise<ApiResponse<User>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "User ID is required",
          data: {} as User,
        };
      }

      return await apiClient.patch<User>(`${this.ENDPOINT}/${id}/status`, {
        isActive,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update user status",
        data: {} as User,
      };
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: "User ID is required",
        };
      }

      if (!currentPassword?.trim()) {
        return {
          success: false,
          error: "Current password is required",
        };
      }

      if (!newPassword?.trim()) {
        return {
          success: false,
          error: "New password is required",
        };
      }

      if (newPassword.length < 8) {
        return {
          success: false,
          error: "Password must be at least 8 characters long",
        };
      }

      return await apiClient.post<void>(
        `${this.ENDPOINT}/${id}/change-password`,
        {
          currentPassword,
          newPassword,
        }
      );
    } catch (error) {
      console.error("Error changing password:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to change password",
      };
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string): Promise<ApiResponse<void>> {
    try {
      if (!email?.trim()) {
        return {
          success: false,
          error: "Email is required",
        };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: "Invalid email format",
        };
      }

      return await apiClient.post<void>(`${this.ENDPOINT}/password-reset`, {
        email,
      });
    } catch (error) {
      console.error("Error sending password reset:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send password reset email",
      };
    }
  }

  /**
   * Invite user to tenant
   */
  static async inviteUser(
    email: string,
    tenantId: string,
    role: "admin" | "editor" | "viewer"
  ): Promise<ApiResponse<void>> {
    try {
      if (!email?.trim()) {
        return {
          success: false,
          error: "Email is required",
        };
      }

      if (!tenantId?.trim()) {
        return {
          success: false,
          error: "Tenant ID is required",
        };
      }

      if (!role) {
        return {
          success: false,
          error: "Role is required",
        };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: "Invalid email format",
        };
      }

      return await apiClient.post<void>(`${this.ENDPOINT}/invite`, {
        email,
        tenantId,
        role,
      });
    } catch (error) {
      console.error("Error inviting user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to invite user",
      };
    }
  }

  /**
   * Get users by tenant ID
   */
  static async getUsersByTenant(
    tenantId: string
  ): Promise<ApiResponse<User[]>> {
    try {
      if (!tenantId?.trim()) {
        return {
          success: false,
          error: "Tenant ID is required",
          data: [],
        };
      }

      return await apiClient.get<User[]>(`${this.ENDPOINT}/tenant/${tenantId}`);
    } catch (error) {
      console.error("Error fetching tenant users:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch tenant users",
        data: [],
      };
    }
  }

  /**
   * Update user profile (current user)
   */
  static async updateProfile(data: {
    name?: string;
    email?: string;
  }): Promise<ApiResponse<User>> {
    try {
      if (data.email && data.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          return {
            success: false,
            error: "Invalid email format",
            data: {} as User,
          };
        }
      }

      return await apiClient.put<User>(`${this.ENDPOINT}/me`, data);
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update profile",
        data: {} as User,
      };
    }
  }
}
