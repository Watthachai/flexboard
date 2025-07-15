/**
 * User Detail Hook
 * Hook for managing single user details
 */

import { useState, useEffect, useCallback } from "react";
import { UserService } from "@/services/user.service";
import { User } from "@/types/user";
import { UpdateUserRequest } from "@/types/api";

interface UseUserDetailOptions {
  userId: string;
  autoFetch?: boolean;
}

interface UseUserDetailReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateUser: (data: UpdateUserRequest) => Promise<User | null>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

export type { UseUserDetailOptions, UseUserDetailReturn };

/**
 * Hook for managing single user details
 */
export function useUserDetail(
  options: UseUserDetailOptions
): UseUserDetailReturn {
  const { userId, autoFetch = true } = options;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await UserService.getUserById(userId);

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch user");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user";
      setError(errorMessage);
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateUser = useCallback(
    async (data: UpdateUserRequest): Promise<User | null> => {
      if (!userId) return null;

      try {
        setError(null);

        const response = await UserService.updateUser(userId, data);

        if (response.success && response.data) {
          setUser((prev) =>
            prev ? { ...prev, ...response.data! } : response.data!
          );
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update user");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update user";
        setError(errorMessage);
        throw err;
      }
    },
    [userId]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!userId) return;

      try {
        setError(null);

        const response = await UserService.changePassword(
          userId,
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
    [userId]
  );

  useEffect(() => {
    if (autoFetch && userId) {
      fetchUser();
    }
  }, [fetchUser, autoFetch, userId]);

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
    updateUser,
    changePassword,
  };
}
