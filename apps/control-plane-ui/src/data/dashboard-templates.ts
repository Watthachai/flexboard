// Dashboard templates for different data types

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: string[];
  widgets: {
    type: "chart" | "table" | "kpi" | "filter";
    title: string;
    description: string;
    position: { x: number; y: number; width: number; height: number };
    config: any;
  }[];
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "inventory_overview",
    name: "Inventory Overview",
    description: "สำหรับข้อมูล Inventory/Stock/PVI",
    icon: "📦",
    categories: ["Inventory", "Stock"],
    widgets: [
      {
        type: "kpi",
        title: "Total Items",
        description: "จำนวนรายการทั้งหมด",
        position: { x: 0, y: 0, width: 6, height: 4 },
        config: {
          metric: "count",
          field: "*",
          format: "number",
        },
      },
      {
        type: "kpi",
        title: "Total Quantity",
        description: "จำนวนรวมทั้งหมด",
        position: { x: 6, y: 0, width: 6, height: 4 },
        config: {
          metric: "sum",
          field: "qtyFromThisDoc",
          format: "number",
        },
      },
      {
        type: "kpi",
        title: "Total Value",
        description: "มูลค่ารวม",
        position: { x: 12, y: 0, width: 6, height: 4 },
        config: {
          metric: "calculated",
          formula: "sum(qtyFromThisDoc * averageCost)",
          format: "currency",
        },
      },
      {
        type: "kpi",
        title: "Unique Products",
        description: "สินค้าที่แตกต่าง",
        position: { x: 18, y: 0, width: 6, height: 4 },
        config: {
          metric: "distinct",
          field: "prod",
          format: "number",
        },
      },
      {
        type: "chart",
        title: "Quantity by Product Type",
        description: "กราฟแสดงจำนวนตามประเภทสินค้า",
        position: { x: 0, y: 4, width: 12, height: 8 },
        config: {
          chartType: "bar",
          xAxis: "prod",
          yAxis: "qtyFromThisDoc",
          aggregation: "sum",
          limit: 10,
        },
      },
      {
        type: "chart",
        title: "Timeline Analysis",
        description: "แนวโน้มตามช่วงเวลา",
        position: { x: 12, y: 4, width: 12, height: 8 },
        config: {
          chartType: "line",
          xAxis: "docDate",
          yAxis: "qtyFromThisDoc",
          aggregation: "sum",
          groupBy: "month",
        },
      },
      {
        type: "table",
        title: "Detailed Records",
        description: "ตารางรายละเอียด",
        position: { x: 0, y: 12, width: 24, height: 8 },
        config: {
          columns: [
            "dataDate",
            "prod",
            "qtyFromThisDoc",
            "averageCost",
            "docNumber",
          ],
          pageSize: 10,
          sortBy: "dataDate",
          sortOrder: "desc",
        },
      },
    ],
  },
  {
    id: "sales_analytics",
    name: "Sales Analytics",
    description: "สำหรับข้อมูลการขาย",
    icon: "📊",
    categories: ["Sales", "Revenue"],
    widgets: [
      {
        type: "kpi",
        title: "Total Revenue",
        description: "รายได้รวม",
        position: { x: 0, y: 0, width: 6, height: 4 },
        config: {
          metric: "sum",
          field: "revenue",
          format: "currency",
        },
      },
      {
        type: "kpi",
        title: "Total Orders",
        description: "จำนวนออเดอร์",
        position: { x: 6, y: 0, width: 6, height: 4 },
        config: {
          metric: "count",
          field: "*",
          format: "number",
        },
      },
      {
        type: "kpi",
        title: "Average Order Value",
        description: "มูลค่าเฉลี่ยต่อออเดอร์",
        position: { x: 12, y: 0, width: 6, height: 4 },
        config: {
          metric: "average",
          field: "revenue",
          format: "currency",
        },
      },
      {
        type: "kpi",
        title: "Top Performer",
        description: "พนักงานขายยอดเยี่ยม",
        position: { x: 18, y: 0, width: 6, height: 4 },
        config: {
          metric: "top",
          field: "salesperson",
          by: "revenue",
          format: "text",
        },
      },
      {
        type: "chart",
        title: "Revenue by Product",
        description: "รายได้ตามสินค้า",
        position: { x: 0, y: 4, width: 12, height: 8 },
        config: {
          chartType: "pie",
          field: "product",
          value: "revenue",
          aggregation: "sum",
        },
      },
      {
        type: "chart",
        title: "Sales Trend",
        description: "แนวโน้มการขาย",
        position: { x: 12, y: 4, width: 12, height: 8 },
        config: {
          chartType: "line",
          xAxis: "date",
          yAxis: "revenue",
          aggregation: "sum",
          groupBy: "day",
        },
      },
    ],
  },
  {
    id: "blank_dashboard",
    name: "Blank Dashboard",
    description: "เริ่มต้นจากหน้าเปล่า",
    icon: "📋",
    categories: ["Custom"],
    widgets: [],
  },
];

export function getTemplateByCategory(category: string): DashboardTemplate[] {
  return DASHBOARD_TEMPLATES.filter((template) =>
    template.categories.includes(category)
  );
}

export function getTemplateById(id: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES.find((template) => template.id === id);
}
