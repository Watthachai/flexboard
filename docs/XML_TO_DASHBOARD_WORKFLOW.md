# การทำงานของระบบ Dashboard หลังจากอัปโหลด XML

## ภาพรวมการทำงาน End-to-End

```
[Admin Upload XML] → [XML Processing] → [Data Transformation] → [Widget Rendering] → [Dashboard Display]
```

## ขั้นตอนการทำงานแบบละเอียด

### 1. **ขั้นตอนการอัปโหลด XML**

**ที่ Control Plane UI:**

```
Admin Dashboard → Select Tenant → Upload Data → Choose XML File → Upload
```

**API Call:**

```bash
POST /api/tenants/tenant-abc/upload-xml
Content-Type: multipart/form-data
File: inventory_data.xml
```

**ผลลัพธ์:**

- ไฟล์ถูกเก็บใน `/opt/uploads/tenant-abc/inventory_data.xml`
- On-Premise Agent พร้อมใช้ข้อมูลนี้

### 2. **ขั้นตอนการร้องขอข้อมูล Dashboard**

**เมื่อ User เปิด Dashboard:**

```
Frontend Request → GET /api/tenants/tenant-abc/dashboards/manager-overview/data
```

**Agent ทำงานภายใน:**

#### 2.1 โหลด Dashboard Manifest

```typescript
// อ่านไฟล์ manifest
const manifest = JSON.parse(
  fs.readFileSync("/opt/manifests/tenant-abc/manager-overview.json")
);

// ได้ข้อมูล widgets ที่ต้องการ:
// - value-at-risk-kpi
// - stock-aging-overview
// - consumption-trend
// - fifo-action-list
```

#### 2.2 ประมวลผล XML Data

```typescript
// XMLDataProcessor ทำงาน
const xmlData = fs.readFileSync('/opt/uploads/tenant-abc/inventory_data.xml');
const parsedData = xmlParser.parse(xmlData);

// แปลงเป็น standardized format
const processedData = {
  products: [...],      // รายการสินค้า
  stockItems: [...],    // สต็อกปัจจุบัน
  categories: [...],    // สรุปตาม category
  summary: {...}        // KPI สำคัญๆ
};
```

#### 2.3 สร้างข้อมูลสำหรับแต่ละ Widget

```typescript
// สำหรับ KPI Card "Value at Risk"
const kpiData = {
  current_value: 450000, // มูลค่าสต็อกที่เสี่ยงหมดอายุ
  critical_items_count: 8, // จำนวนรายการวิกฤต
  change_percentage: -12.5, // เปลี่ยนแปลงจากเดือนก่อน
};

// สำหรับ Bar Chart "Stock Aging"
const chartData = [
  {
    category_name: "Electronics",
    critical_value: 200000, // สินค้าหมดอายุ < 30 วัน
    warning_value: 150000, // สินค้าหมดอายุ 30-90 วัน
    healthy_value: 500000, // สินค้าหมดอายุ > 90 วัน
  },
  // ...categories อื่นๆ
];
```

### 3. **ขั้นตอนการแปลงข้อมูลสำหรับ Frontend**

**Widget Renderer ทำงาน:**

```typescript
// แปลงข้อมูลดิบเป็น format ที่ React component ใช้ได้
const renderedKPI = {
  value: "฿450,000",
  displayValue: 450000,
  trend: {
    percentage: -12.5,
    direction: "down",
    isGood: true, // ลดลงคือดีสำหรับ Value at Risk
  },
  status: "warning",
  metadata: {
    itemsCount: 8,
    lastUpdated: "2024-07-31T10:30:00Z",
  },
};
```

### 4. **การส่งข้อมูลกลับไปยัง Frontend**

**API Response:**

```json
{
  "dashboardId": "manager-overview",
  "dashboardName": "Manager Overview Dashboard",
  "widgets": [
    {
      "widgetId": "value-at-risk-kpi",
      "type": "kpi-card",
      "data": {
        "value": "฿450,000",
        "trend": { "percentage": -12.5, "direction": "down" },
        "status": "warning"
      },
      "config": { "color": "red", "showTrend": true }
    },
    {
      "widgetId": "stock-aging-overview",
      "type": "bar-chart",
      "data": {
        "categories": ["Electronics", "Computers", "Home Appliances"],
        "series": [
          { "name": "Critical", "data": [200000, 225000, 120000] },
          { "name": "Warning", "data": [150000, 180000, 90000] },
          { "name": "Healthy", "data": [500000, 380000, 450000] }
        ]
      }
    }
    // ...widgets อื่นๆ
  ],
  "lastUpdated": "2024-07-31T10:30:00Z",
  "dataSource": "xml-file"
}
```

### 5. **การแสดงผลใน React Components**

**Frontend รับข้อมูลและแสดงผล:**

```tsx
// KPI Card Component
<KPICard
  title="Value at Risk"
  value="฿450,000"
  trend={{ percentage: -12.5, direction: "down", isGood: true }}
  status="warning"
/>

// Bar Chart Component
<BarChart
  categories={["Electronics", "Computers", "Home Appliances"]}
  series={[
    { name: "Critical", data: [200000, 225000, 120000], color: "#ef4444" },
    { name: "Warning", data: [150000, 180000, 90000], color: "#f59e0b" },
    { name: "Healthy", data: [500000, 380000, 450000], color: "#10b981" }
  ]}
  chartType="stacked"
/>
```

## ข้อดีของสถาปัตยกรรมนี้

### 1. **Flexibility (ความยืดหยุ่น)**

- Admin อัปโหลด XML ครั้งเดียว → Dashboard อัปเดตทันที
- ไม่ต้องแก้โค้ดเมื่อข้อมูลเปลี่ยน
- รองรับ XML structure ที่แตกต่างกันได้

### 2. **Scalability (ขยายผลได้)**

- เพิ่ม tenant ใหม่ = เพิ่มโฟลเดอร์ใหม่
- Widget ใหม่ = เพิ่ม template ใหม่
- Data source ใหม่ = เพิ่ม processor ใหม่

### 3. **Maintainability (บำรุงรักษาง่าย)**

- แยก concern ชัดเจน (XML → Processing → Rendering → Display)
- Error handling ในแต่ละชั้น
- Logging และ monitoring ได้ทุกจุด

### 4. **Real-world Benefits**

- **สำหรับ Admin:** อัปโหลดไฟล์เดียว → Dashboard พร้อมใช้
- **สำหรับ Manager:** เห็นข้อมูลปัจจุบันทันที → ตัดสินใจได้เร็ว
- **สำหรับ Developer:** Template-based → เพิ่ม dashboard ใหม่ได้เร็ว

## การ Handle Edge Cases

### 1. **ไฟล์ XML ไม่มี**

```json
{
  "hasData": false,
  "message": "No XML data file found. Please upload inventory data first.",
  "uploadPath": "/tenants/tenant-abc/upload"
}
```

### 2. **XML Format ไม่ถูกต้อง**

```json
{
  "error": "Invalid XML format",
  "details": "Missing required Products section",
  "sampleXML": "/api/tenants/tenant-abc/sample-xml"
}
```

### 3. **Widget ไม่มีข้อมูล**

```json
{
  "widgetId": "stock-aging-overview",
  "data": { "error": "No inventory data available" },
  "fallback": "show-empty-state"
}
```

---

## สรุป: จาก XML ไปสู่ Dashboard ใน 5 ขั้นตอน

1. **Upload:** Admin อัปโหลด XML → เก็บใน `/opt/uploads/`
2. **Parse:** Agent อ่าน XML → แปลงเป็น structured data
3. **Process:** คำนวณ KPI, จัดกลุ่มข้อมูล → เตรียม widget data
4. **Render:** แปลงข้อมูลเป็น format ที่ UI ใช้ได้ → JSON response
5. **Display:** React components รับ JSON → แสดงกราฟและตาราง

**ผลลัพธ์:** Manager เห็น Dashboard ที่มีข้อมูลล่าสุดจาก XML ที่อัปโหลดมา พร้อมกราฟ, KPI, และตารางที่ interactive และ real-time!
