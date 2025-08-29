/**
 * Responsive Layout Utilities for Dashboard Widgets
 * Handles breakpoints, positioning, and responsive behavior
 */

export interface LayoutConfig {
  columns: number;
  rowHeight: number;
  type: string;
}

export interface WidgetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResponsiveBreakpoints {
  sm: number; // 640px
  md: number; // 768px
  lg: number; // 1024px
  xl: number; // 1280px
  "2xl": number; // 1536px
}

export const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Validates and fixes widget layout to prevent overflow and positioning issues
 */
export function validateAndFixLayout(
  layout: WidgetLayout,
  maxColumns: number,
  widgetTitle?: string
): WidgetLayout {
  const { x, y, width, height } = layout;

  // Fix positioning issues
  const safeX = Math.max(0, Math.min(x, maxColumns - 1));
  const safeWidth = Math.min(width, maxColumns - safeX);
  const safeY = Math.max(0, y);
  const safeHeight = Math.max(1, height);

  // Log validation issues in development
  if (process.env.NODE_ENV === "development") {
    if (x !== safeX || width !== safeWidth) {
      console.warn(`Widget "${widgetTitle || "Unknown"}" layout adjusted:`, {
        original: { x, width },
        adjusted: { x: safeX, width: safeWidth },
        reason:
          x >= maxColumns
            ? "X position out of bounds"
            : "Width causes overflow",
      });
    }
  }

  return {
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
  };
}

/**
 * Calculate responsive columns based on screen size
 */
export function getResponsiveColumns(
  originalColumns: number,
  screenWidth: number,
  breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS
): number {
  if (screenWidth < breakpoints.sm) return 1; // Mobile: 1 column
  if (screenWidth < breakpoints.md) return 2; // Small tablet: 2 columns
  if (screenWidth < breakpoints.lg) return 4; // Tablet: 4 columns
  if (screenWidth < breakpoints.xl) return 8; // Small desktop: 8 columns
  return originalColumns; // Large desktop: original
}

/**
 * Convert desktop layout to mobile-friendly stacked layout
 */
export function convertToMobileLayout(
  widgets: Array<{ id: string; layout: WidgetLayout; title: string }>,
  rowHeight: number
): Array<{ id: string; layout: WidgetLayout; mobileHeight: number }> {
  // Sort widgets by their original position (top to bottom, left to right)
  const sortedWidgets = [...widgets].sort((a, b) => {
    if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
    return a.layout.x - b.layout.x;
  });

  return sortedWidgets.map((widget, index) => ({
    id: widget.id,
    layout: {
      x: 0,
      y: index,
      width: 1,
      height: 1,
    },
    mobileHeight: Math.max(300, widget.layout.height * rowHeight),
  }));
}

/**
 * Generate CSS Grid styles for responsive layouts
 */
export function generateGridStyles(
  layout: LayoutConfig,
  screenWidth?: number
): {
  gridTemplateColumns: string;
  gridAutoRows: string;
  gap: string;
} {
  const columns = screenWidth
    ? getResponsiveColumns(layout.columns, screenWidth)
    : layout.columns;

  return {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoRows: `${layout.rowHeight}px`,
    gap: "1rem",
  };
}

/**
 * Calculate widget grid position styles
 */
export function getWidgetGridStyles(
  layout: WidgetLayout,
  maxColumns: number
): {
  gridColumn: string;
  gridRow: string;
} {
  const validatedLayout = validateAndFixLayout(layout, maxColumns);

  return {
    gridColumn: `${validatedLayout.x + 1} / span ${validatedLayout.width}`,
    gridRow: `${validatedLayout.y + 1} / span ${validatedLayout.height}`,
  };
}

/**
 * Check if widget overlaps with others
 */
export function detectLayoutOverlaps(
  widgets: Array<{ id: string; layout: WidgetLayout }>
): Array<{ widget1: string; widget2: string; overlap: boolean }> {
  const overlaps: Array<{
    widget1: string;
    widget2: string;
    overlap: boolean;
  }> = [];

  for (let i = 0; i < widgets.length; i++) {
    for (let j = i + 1; j < widgets.length; j++) {
      const w1 = widgets[i].layout;
      const w2 = widgets[j].layout;

      // Check if rectangles overlap
      const overlap = !(
        w1.x + w1.width <= w2.x ||
        w2.x + w2.width <= w1.x ||
        w1.y + w1.height <= w2.y ||
        w2.y + w2.height <= w1.y
      );

      if (overlap) {
        overlaps.push({
          widget1: widgets[i].id,
          widget2: widgets[j].id,
          overlap: true,
        });
      }
    }
  }

  return overlaps;
}

/**
 * Generate layout debug information
 */
export function generateLayoutDebugInfo(
  widgets: Array<{ id: string; layout: WidgetLayout; title: string }>,
  layoutConfig: LayoutConfig
): {
  gridInfo: string;
  widgetInfo: Array<{
    id: string;
    title: string;
    position: string;
    size: string;
  }>;
  overlaps: Array<{ widget1: string; widget2: string; overlap: boolean }>;
  totalGridArea: { width: number; height: number };
} {
  const overlaps = detectLayoutOverlaps(widgets);
  const maxY = Math.max(...widgets.map((w) => w.layout.y + w.layout.height));

  return {
    gridInfo: `${layoutConfig.columns} columns × ${layoutConfig.rowHeight}px rows`,
    widgetInfo: widgets.map((widget) => ({
      id: widget.id,
      title: widget.title,
      position: `(${widget.layout.x}, ${widget.layout.y})`,
      size: `${widget.layout.width}×${widget.layout.height}`,
    })),
    overlaps,
    totalGridArea: {
      width: layoutConfig.columns,
      height: maxY,
    },
  };
}
