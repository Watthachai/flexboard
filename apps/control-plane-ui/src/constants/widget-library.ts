/**
 * Widget Library Constants
 * Configuration for available widgets in the library
 */

import {
  Hash,
  Activity,
  BarChart3,
  PieChart,
  Table,
  Type,
  Image,
  Calendar,
  TrendingUp,
  Target,
  Users,
  Layers,
  LineChart,
  BarChart,
} from "lucide-react";
import { WidgetLibraryItem } from "@/types/dashboard-editor";

// Widget Library Items - Combined standard widgets and analytics widgets
export const WIDGET_LIBRARY: WidgetLibraryItem[] = [
  // Standard Widgets
  {
    type: "kpi",
    name: "KPI Card",
    icon: Hash,
    defaultSize: { width: 3, height: 2 },
    category: "Metrics",
  },
  {
    type: "line-chart",
    name: "Line Chart",
    icon: Activity,
    defaultSize: { width: 6, height: 4 },
    category: "Charts",
  },
  {
    type: "bar-chart",
    name: "Bar Chart",
    icon: BarChart3,
    defaultSize: { width: 6, height: 4 },
    category: "Charts",
  },
  {
    type: "pie-chart",
    name: "Pie Chart",
    icon: PieChart,
    defaultSize: { width: 4, height: 4 },
    category: "Charts",
  },
  {
    type: "table",
    name: "Data Table",
    icon: Table,
    defaultSize: { width: 6, height: 4 },
    category: "Data",
  },
  {
    type: "text",
    name: "Text Widget",
    icon: Type,
    defaultSize: { width: 3, height: 1 },
    category: "Content",
  },
  {
    type: "image",
    name: "Image",
    icon: Image,
    defaultSize: { width: 2, height: 2 },
    category: "Content",
  },
  {
    type: "date",
    name: "Date Range",
    icon: Calendar,
    defaultSize: { width: 2, height: 1 },
    category: "Controls",
  },

  // Analytics Widgets - PowerBI-style comparison widgets
  {
    type: "period-comparison",
    name: "Period Compare",
    icon: TrendingUp,
    defaultSize: { width: 6, height: 4 },
    category: "Analytics",
  },
  {
    type: "target-comparison",
    name: "Target Compare",
    icon: Target,
    defaultSize: { width: 6, height: 4 },
    category: "Analytics",
  },
  {
    type: "peer-comparison",
    name: "Peer Compare",
    icon: Users,
    defaultSize: { width: 6, height: 4 },
    category: "Analytics",
  },
  {
    type: "composition-analysis",
    name: "Composition Analysis",
    icon: Layers,
    defaultSize: { width: 6, height: 4 },
    category: "Analytics",
  },
  {
    type: "trend-analysis",
    name: "Trend Analysis",
    icon: LineChart,
    defaultSize: { width: 8, height: 5 },
    category: "Analytics",
  },
  {
    type: "interactive-chart",
    name: "Interactive Chart",
    icon: BarChart,
    defaultSize: { width: 8, height: 6 },
    category: "Analytics",
  },
];
