/**
 * Dashboard Hooks Index
 * Centralized exports for dashboard-related hooks
 */

export { useDashboardList } from "./use-dashboard-list";
export { useDashboardDetail } from "./use-dashboard-detail";
export { useDashboardAnalytics } from "./use-dashboard-analytics";

// Re-export types for convenience
export type {
  UseDashboardListOptions,
  UseDashboardListReturn,
} from "./use-dashboard-list";

export type {
  UseDashboardDetailOptions,
  UseDashboardDetailReturn,
} from "./use-dashboard-detail";

export type {
  UseDashboardAnalyticsOptions,
  UseDashboardAnalyticsReturn,
} from "./use-dashboard-analytics";
