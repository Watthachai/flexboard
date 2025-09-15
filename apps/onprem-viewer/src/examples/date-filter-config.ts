/**
 * Example Dashboard Config - Date Filter Configuration
 *
 * เพิ่ม globalFilters ใน manifest เพื่อแสดง Date Filter
 */

// 🔧 วิธีเปิด Date Filter (ใส่ในไฟล์ manifest .json)
const dashboardWithDateFilter = {
  schemaVersion: "1.0",
  dashboardId: "inventory-dashboard",
  dashboardName: "Inventory Analytics",
  description: "Inventory management dashboard",
  version: 1,
  targetTeams: ["operations"],

  // ✅ เพิ่ม globalFilters เพื่อเปิดใช้ Date Filter
  globalFilters: [
    {
      type: "date",
      field: "DataDate",
      label: "Filter by Date",
    },
  ],

  layout: {
    type: "grid",
    columns: 12,
    rowHeight: 50,
  },
  widgets: [
    // ... widgets configuration
  ],
};

// ❌ วิธีปิด Date Filter (ไม่ใส่ globalFilters หรือใส่แบบนี้)
const dashboardWithoutDateFilter = {
  schemaVersion: "1.0",
  dashboardId: "simple-dashboard",
  dashboardName: "Simple Dashboard",
  description: "Dashboard without date filter",
  version: 1,
  targetTeams: ["sales"],

  // ไม่มี globalFilters = ไม่แสดง Date Filter
  // หรือ
  // "globalFilters": [], // Array ว่าง = ไม่แสดง Date Filter

  layout: {
    type: "grid",
    columns: 12,
    rowHeight: 50,
  },
  widgets: [
    // ... widgets configuration
  ],
};

// 🔮 Future: รองรับ filter อื่นๆ ได้ด้วย
const dashboardWithMultipleFilters = {
  globalFilters: [
    {
      type: "date",
      field: "DataDate",
      label: "Filter by Date",
    },
    {
      type: "dropdown",
      field: "Branch",
      label: "Select Branch",
      options: ["Branch A", "Branch B", "Branch C"],
    },
    {
      type: "search",
      field: "Prod",
      label: "Search Product",
    },
  ],
};

export {
  dashboardWithDateFilter,
  dashboardWithoutDateFilter,
  dashboardWithMultipleFilters,
};
