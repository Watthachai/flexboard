/**
 * Zustand Store for Dashboard Builder State Management
 * Handles active widget selection and dashboard metadata
 */

import { create } from "zustand";
import { Widget } from "@/types/dashboard-editor";

interface DashboardState {
  // Active widget selection
  activeWidgetId: string | null;

  // Dashboard metadata
  metadata: {
    widgets: Widget[];
    config: {
      theme: string;
      refreshInterval: number;
    };
  };

  // Actions
  setActiveWidgetId: (id: string | null) => void;
  setMetadata: (metadata: any) => void;
  updateWidgetConfig: (widgetId: string, config: any) => void;

  // Computed selectors
  getActiveWidgetConfig: () => Widget | null;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  activeWidgetId: null,
  metadata: {
    widgets: [],
    config: {
      theme: "light",
      refreshInterval: 300000,
    },
  },

  // Actions
  setActiveWidgetId: (id) => set({ activeWidgetId: id }),

  setMetadata: (metadata) => set({ metadata }),

  updateWidgetConfig: (widgetId, config) =>
    set((state) => ({
      metadata: {
        ...state.metadata,
        widgets: state.metadata.widgets.map((widget) =>
          widget.id === widgetId
            ? { ...widget, config: { ...widget.config, ...config } }
            : widget
        ),
      },
    })),

  // Computed selectors
  getActiveWidgetConfig: () => {
    const { activeWidgetId, metadata } = get();
    if (!activeWidgetId) return null;

    return (
      metadata.widgets.find((widget) => widget.id === activeWidgetId) || null
    );
  },
}));
