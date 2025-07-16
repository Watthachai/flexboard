# Flexboard Demo Scenarios

## 🎭 Scenario 1: Manufacturing Company (ACME Corp)

### Admin Setup (คุณทำ):

1. สร้าง tenant "ACME Corp"
2. Upload dashboard config สำหรับ production metrics
3. ให้ API key กับลูกค้า

### Customer Experience (ลูกค้าทำ):

1. ติดตั้ง on-premise agent ในโรงงาน
2. เชื่อมต่อกับ SQL Server ของโรงงาน
3. เปิด dashboard ดู production KPIs

```json
{
  "name": "Production Dashboard",
  "widgets": [
    {
      "name": "Daily Production",
      "type": "line-chart",
      "query": "SELECT DATE(created_at) as date, COUNT(*) as units FROM production_logs GROUP BY DATE(created_at)"
    },
    {
      "name": "Defect Rate",
      "type": "kpi",
      "query": "SELECT (defective_count * 100.0 / total_count) as defect_rate FROM quality_metrics"
    }
  ]
}
```

## 🎭 Scenario 2: E-commerce Company (ShopFast)

### Admin Setup:

1. สร้าง tenant "ShopFast"
2. Upload e-commerce dashboard config
3. Configure sales & inventory widgets

### Customer Experience:

1. Agent sync กับ e-commerce database
2. Dashboard แสดง sales, orders, inventory
3. Real-time updates ทุก 5 นาที

```json
{
  "name": "E-commerce Dashboard",
  "widgets": [
    {
      "name": "Today's Sales",
      "type": "kpi",
      "query": "SELECT SUM(total_amount) as sales FROM orders WHERE DATE(created_at) = CURDATE()"
    },
    {
      "name": "Top Products",
      "type": "bar-chart",
      "query": "SELECT product_name, SUM(quantity) as sold FROM order_items GROUP BY product_name ORDER BY sold DESC LIMIT 10"
    }
  ]
}
```

## 🧪 Testing Workflow

### Step 1: Admin Testing

```bash
# Run admin tests
./scripts/test-admin.sh
```

### Step 2: Tenant Simulation

```bash
# Run tenant environment
./scripts/test-tenant.sh
```

### Step 3: End-to-End Testing

1. Create tenant via admin API
2. Configure agent with tenant API key
3. Start local agent & viewer
4. Verify data sync & dashboard display

## 🔄 Multi-Tenant Isolation Testing

### Test Data Isolation:

1. สร้าง 2 tenants: "Company A" และ "Company B"
2. แต่ละ tenant มี API key แยกกัน
3. ทดสอบว่า Company A ดูข้อมูลของ Company B ไม่ได้

### Test Configuration Isolation:

1. Company A: Production dashboard
2. Company B: Sales dashboard
3. ทดสอบว่าแต่ละ company ได้ config ที่ถูกต้อง
