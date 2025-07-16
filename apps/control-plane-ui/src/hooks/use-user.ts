/**
 * User Management Hooks
 * Custom hooks for user operations with state management
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

interface UseCurrentUserReturn {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    email?: string;
  }) => Promise<User | null>;
  isAuthenticated: boolean;
}

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
        // Don't treat auth errors as errors, just clear user
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string }): Promise<User | null> => {
      try {
        setError(null);

        const response = await UserService.updateProfile(data);

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
    []
  );

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return {
    currentUser,
    loading,
    error,
    refresh: fetchCurrentUser,
    updateProfile,
    isAuthenticated: !!currentUser,
  };
}

interface UseTenantUsersOptions {
  tenantId: string;
  autoFetch?: boolean;
}

interface UseTenantUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for getting users by tenant
 */
export function useTenantUsers(
  options: UseTenantUsersOptions
): UseTenantUsersReturn {
  const { tenantId, autoFetch = true } = options;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await UserService.getUsersByTenant(tenantId);

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch tenant users");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tenant users";
      setError(errorMessage);
      console.error("Error fetching tenant users:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (autoFetch && tenantId) {
      fetchUsers();
    }
  }, [fetchUsers, autoFetch, tenantId]);

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
  };
}
