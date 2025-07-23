# Data Flow หลังจาก Upload ข้อมูล

## 📊 ขั้นตอนการใช้งานข้อมูลหลัง Upload

### 1. Dashboard Creation

```typescript
// ข้อมูลที่บันทึกใน Firestore
{
  id: "pvs-co-ltd-inventory-dashboard",
  name: "Inventory Dashboard",
  tenantId: "pvs-co-ltd",
  dataSourceConfig: {
    type: "file",
    template: "xml-inventory",
    uploadedData: {
      columns: [
        { name: "product", type: "string", displayName: "Product" },
        { name: "quantity", type: "number", displayName: "Quantity" },
        { name: "price", type: "number", displayName: "Price" }
      ],
      data: [
        { product: "PVI-บริษัท ฟิวเจอร์", quantity: 1, price: 100 },
        // ... อื่นๆ
      ],
      summary: {
        totalRows: 139,
        totalQuantity: 955445,
        totalValue: 895544500.00
      }
    }
  }
}
```

### 2. Widget Builder จะเข้าถึงข้อมูลผ่าน

#### A. Data Source Selector

```typescript
// ใน Widget Builder
const dataSources = [
  {
    id: "uploaded-data",
    name: "Uploaded XML Data",
    type: "file",
    columns: dashboard.dataSourceConfig.uploadedData.columns,
  },
  {
    id: "firestore",
    name: "Firestore Database",
    type: "firestore",
  },
  // ... อื่นๆ
];
```

#### B. Query Builder

```typescript
// สำหรับข้อมูลที่ Upload แล้ว
const widgetConfig = {
  dataConfig: {
    dataSourceType: "file",
    query: "SELECT * FROM uploaded_data WHERE quantity > 100",
    // หรือใช้ JavaScript filter
    jsFilter: "data.filter(row => row.quantity > 100)",
    refreshInterval: 0, // ไม่ต้อง refresh เพราะเป็นข้อมูลสถิต
  },
};
```

### 3. Widget Types ที่รองรับ

#### KPI Widgets

```typescript
{
  type: "kpi",
  dataConfig: {
    dataSourceType: "file",
    query: "SUM(quantity)", // หรือ jsFilter: "data.reduce((sum, row) => sum + row.quantity, 0)"
  },
  displayConfig: {
    title: "Total Quantity",
    chartType: "number",
    format: "number"
  }
}
```

#### Chart Widgets

```typescript
{
  type: "chart",
  dataConfig: {
    dataSourceType: "file",
    query: "GROUP BY product", // หรือ JavaScript grouping
  },
  displayConfig: {
    title: "Products Distribution",
    chartType: "bar", // bar, line, pie, doughnut
    xAxis: "product",
    yAxis: "quantity"
  }
}
```

#### Table Widgets

```typescript
{
  type: "table",
  dataConfig: {
    dataSourceType: "file",
    query: "SELECT * LIMIT 10", // หรือ jsFilter: "data.slice(0, 10)"
  },
  displayConfig: {
    title: "Recent Products",
    showPagination: true,
    pageSize: 10
  }
}
```

### 4. Data Processing Pipeline

```typescript
// ใน Widget Runtime
class DataProcessor {
  static processFileData(uploadedData: any, query: string) {
    const { columns, data } = uploadedData;

    // Simple SQL-like processing หรือ JavaScript filtering
    if (query.startsWith("SELECT")) {
      return this.processSQLLike(data, query);
    } else {
      return this.processJavaScript(data, query);
    }
  }

  static processSQLLike(data: any[], query: string) {
    // Parse simple SQL: SELECT, WHERE, GROUP BY, ORDER BY
    // Return processed data
  }

  static processJavaScript(data: any[], jsFilter: string) {
    // Execute JavaScript filter safely
    // Return filtered data
  }
}
```

### 5. Real-time Dashboard Updates

```typescript
// Dashboard จะ render widgets dynamically
const DashboardRenderer = () => {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    // Load dashboard configuration
    loadDashboard(dashboardId).then(dashboard => {
      setDashboardData(dashboard);
    });
  }, [dashboardId]);

  return (
    <GridLayout>
      {dashboardData?.visualConfig?.widgets?.map(widget => (
        <Widget
          key={widget.id}
          config={widget}
          dataSource={dashboardData.dataSourceConfig}
        />
      ))}
    </GridLayout>
  );
};
```

## 🎯 สรุปผลลัพธ์

หลังจาก Upload XML สำเร็จ:

1. ✅ ข้อมูลถูกแปลงและบันทึกใน Dashboard
2. ✅ สามารถสร้าง Widget ได้ทันที
3. ✅ ข้อมูลพร้อมใช้งานใน Visual Builder
4. ✅ Dashboard สามารถแสดงผลได้ทันที
5. ✅ รองรับการ filter และ aggregate ข้อมูล

## 🔄 ขั้นตอนต่อไป

1. **Visual Builder**: ลาก-วาง Widget ลงใน Grid
2. **Configure Widgets**: เลือก Data Source และ Chart Type
3. **Preview**: ดูผลลัพธ์แบบ Real-time
4. **Publish**: เผยแพร่ Dashboard ให้ผู้ใช้ดู
