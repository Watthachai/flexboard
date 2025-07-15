/**
 * User Type Definitions
 * Types for user entities and operations
 */

/**
 * User role definitions
 */
export type UserRole = "admin" | "editor" | "viewer";

/**
 * User status definitions
 */
export type UserStatus = "active" | "inactive" | "pending" | "suspended";

/**
 * User preferences
 */
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    dashboard: boolean;
    reports: boolean;
  };
  dashboard: {
    defaultView: "grid" | "list";
    itemsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

/**
 * User permissions
 */
export interface UserPermissions {
  canCreateDashboards: boolean;
  canEditDashboards: boolean;
  canDeleteDashboards: boolean;
  canShareDashboards: boolean;
  canManageUsers: boolean;
  canManageTenants: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canAccessAPI: boolean;
}

/**
 * User profile information
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  title?: string;
  department?: string;
  phone?: string;
  location?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

/**
 * User authentication information
 */
export interface UserAuth {
  lastLoginAt?: string;
  loginCount: number;
  mfaEnabled: boolean;
  passwordChangedAt?: string;
  loginHistory: Array<{
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    location?: string;
  }>;
}

/**
 * Main user entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  tenantId?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  permissions: UserPermissions;
  auth: UserAuth;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  emailVerified: boolean;
  invitedBy?: string;
  invitedAt?: string;
}

/**
 * User invitation
 */
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  status: "pending" | "accepted" | "expired" | "rejected";
}

/**
 * User session information
 */
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isActive: boolean;
}

/**
 * User activity log
 */
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

/**
 * User filter for search and listing
 */
export interface UserFilter {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  tenantId?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  department?: string;
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * User sort options
 */
export type UserSortField =
  | "name"
  | "email"
  | "role"
  | "status"
  | "createdAt"
  | "lastLoginAt";
export type UserSortOrder = "asc" | "desc";

export interface UserSort {
  field: UserSortField;
  order: UserSortOrder;
}

/**
 * User statistics
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  byRole: Record<UserRole, number>;
  byStatus: Record<UserStatus, number>;
  recentLogins: number;
  newUsers: number;
}
