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
} from "lucide-react";
import { WidgetLibraryItem } from "@/types/dashboard-editor";

// Widget Library Items
export const WIDGET_LIBRARY: WidgetLibraryItem[] = [
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
];
