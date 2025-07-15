/**
 * Tenant Hooks Index
 * Centralized exports for tenant-related hooks
 */

export { useTenantList } from "./use-tenant-list";
export { useTenantDetail } from "./use-tenant-detail";

// Re-export types for convenience
export type {
  UseTenantListOptions,
  UseTenantListReturn,
} from "./use-tenant-list";

export type {
  UseTenantDetailOptions,
  UseTenantDetailReturn,
} from "./use-tenant-detail";
