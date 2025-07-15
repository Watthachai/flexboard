/**
 * User List Hook
 * Hook for managing user list with CRUD operations
 */

import { useState, useEffect, useCallback } from "react";
import { UserService } from "@/services/user.service";
import { User } from "@/types/user";
import { CreateUserRequest, UpdateUserRequest } from "@/types/api";

interface UseUserListOptions {
  autoFetch?: boolean;
  filters?: {
    tenantId?: string;
    role?: string;
    isActive?: boolean;
    search?: string;
  };
}

interface UseUserListReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<User | null>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<User | null>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<User | null>;
  inviteUser: (
    email: string,
    tenantId: string,
    role: "admin" | "editor" | "viewer"
  ) => Promise<void>;
}

export type { UseUserListOptions, UseUserListReturn };

/**
 * Hook for managing user list with CRUD operations
 */
export function useUserList(
  options: UseUserListOptions = {}
): UseUserListReturn {
  const { autoFetch = true, filters } = options;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await UserService.getUsers(filters);

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch users");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createUser = useCallback(
    async (data: CreateUserRequest): Promise<User | null> => {
      try {
        setError(null);

        const response = await UserService.createUser(data);

        if (response.success && response.data) {
          setUsers((prev) => [response.data!, ...prev]);
          return response.data;
        } else {
          throw new Error(response.error || "Failed to create user");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create user";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const updateUser = useCallback(
    async (id: string, data: UpdateUserRequest): Promise<User | null> => {
      try {
        setError(null);

        const response = await UserService.updateUser(id, data);

        if (response.success && response.data) {
          setUsers((prev) =>
            prev.map((user) =>
              user.id === id ? { ...user, ...response.data! } : user
            )
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
    []
  );

  const deleteUser = useCallback(async (id: string) => {
    try {
      setError(null);

      const response = await UserService.deleteUser(id);

      if (response.success) {
        setUsers((prev) => prev.filter((user) => user.id !== id));
      } else {
        throw new Error(response.error || "Failed to delete user");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete user";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const toggleUserStatus = useCallback(
    async (id: string, isActive: boolean): Promise<User | null> => {
      try {
        setError(null);

        const response = await UserService.toggleUserStatus(id, isActive);

        if (response.success && response.data) {
          setUsers((prev) =>
            prev.map((user) =>
              user.id === id
                ? {
                    ...user,
                    isActive,
                    status: isActive ? "active" : "inactive",
                  }
                : user
            )
          );
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update user status");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update user status";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const inviteUser = useCallback(
    async (
      email: string,
      tenantId: string,
      role: "admin" | "editor" | "viewer"
    ) => {
      try {
        setError(null);

        const response = await UserService.inviteUser(email, tenantId, role);

        if (!response.success) {
          throw new Error(response.error || "Failed to invite user");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to invite user";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetch) {
      fetchUsers();
    }
  }, [fetchUsers, autoFetch]);

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    inviteUser,
  };
}
