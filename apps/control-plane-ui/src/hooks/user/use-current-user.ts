/**
 * Current User Hook
 * Hook for managing current authenticated user
 */

import { useState, useEffect, useCallback } from "react";
import { UserService } from "@/services/user.service";
import { User } from "@/types/user";
import { UpdateUserRequest } from "@/types/api";

interface UseCurrentUserReturn {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (data: UpdateUserRequest) => Promise<User | null>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export type { UseCurrentUserReturn };

/**
 * Hook for managing current authenticated user
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await UserService.getCurrentUser();

      if (response.success && response.data) {
        setCurrentUser(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch current user");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch current user";
      setError(errorMessage);
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: UpdateUserRequest): Promise<User | null> => {
      if (!currentUser) return null;

      try {
        setError(null);

        const response = await UserService.updateUser(currentUser.id, data);

        if (response.success && response.data) {
          setCurrentUser((prev) =>
            prev ? { ...prev, ...response.data! } : response.data!
          );
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update profile");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!currentUser) return;

      try {
        setError(null);

        const response = await UserService.changePassword(
          currentUser.id,
          currentPassword,
          newPassword
        );

        if (!response.success) {
          throw new Error(response.error || "Failed to change password");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to change password";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser]
  );

  const logout = useCallback(async () => {
    try {
      setError(null);

      // Clear current user (actual logout logic would depend on your auth system)
      setCurrentUser(null);

      // Clear any stored tokens/session data
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to logout";
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return {
    currentUser,
    loading,
    error,
    refresh: fetchCurrentUser,
    updateProfile,
    changePassword,
    logout,
  };
}
