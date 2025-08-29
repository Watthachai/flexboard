# Dashboard as Code - Quick Start Guide

## 🚀 How to Use the New Dashboard System

### Overview

เรายได้เปลี่ยนจากระบบ drag-and-drop เป็น "Dashboard as Code" แล้ว ตอนนี้คุณสามารถสร้างและจัดการ dashboard ผ่าน JSON manifest files

### 1. Start the Development Server

```bash
# Terminal 1: Start API Server
cd apps/control-plane-api
pnpm dev

# Terminal 2: Start UI Server
cd apps/control-plane-ui
pnpm dev
```

### 2. Access the Dashboard System

- **Dashboard List**: http://localhost:3000/dashboards
- **Create New Dashboard**: http://localhost:3000/dashboards/new
- **Edit Dashboard**: http://localhost:3000/dashboards/[dashboard-id]/edit
- **API Test Page**: http://localhost:3000/test-api

### 3. Test API Endpoints

```bash
# Run API tests
./scripts/test-manifest-api.sh

# Or test via UI
# Go to http://localhost:3000/test-api
```

### 4. Create Your First Dashboard

#### Option A: Using UI Editor

1. Go to http://localhost:3000/dashboards/new
2. Fill in dashboard details
3. Edit JSON manifest in the code editor
4. Save the dashboard

#### Option B: Using API directly

```bash
curl -X POST "http://localhost:8000/api/tenants/vpi-co-ltd/dashboards/manifests" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Dashboard",
    "description": "Created via API",
    "targetTeams": ["sales"],
    "manifestContent": "{\"schemaVersion\":\"1.0\",\"dashboardName\":\"My First Dashboard\"}"
  }'
```

### 5. Dashboard Manifest Schema

```json
{
  "schemaVersion": "1.0",
  "dashboardId": "auto-generated",
  "dashboardName": "Sales Dashboard",
  "description": "Monthly sales performance",
  "version": 1,
  "targetTeams": ["sales", "management"],
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 60
  },
  "widgets": [
    {
      "id": "monthly-sales",
      "title": "Monthly Sales",
      "type": "bar-chart",
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "dataSourceId": "sales_data"
    }
  ],
  "dataSources": [
    {
      "id": "sales_data",
      "type": "sql",
      "query": "SELECT month, sales FROM monthly_sales"
    }
  ]
}
```

### 6. Available Widget Types

- `kpi-card`: Key Performance Indicator cards
- `bar-chart`: Bar charts for comparisons
- `line-chart`: Line charts for trends
- `pie-chart`: Pie charts for distributions
- `area-chart`: Area charts for cumulative data
- `table`: Data tables
- `text`: Text/markdown content

### 7. Data Source Types

- `sql`: SQL queries to databases
- `xml`: XML file parsing
- `csv`: CSV file reading
- `json`: JSON API calls
- `api`: REST API endpoints

### 8. Templates Available

```bash
# Sales Dashboard Template
curl -X GET "http://localhost:8000/api/tenants/vpi-co-ltd/dashboards/manifests/template/sales"

# Inventory Dashboard Template
curl -X GET "http://localhost:8000/api/tenants/vpi-co-ltd/dashboards/manifests/template/inventory"
```

### 9. Next Steps

1. **Test the Complete Flow**: Create → Edit → Deploy dashboard
2. **Add Monaco Editor**: Replace basic textarea with VS Code editor
3. **Create More Templates**: Build industry-specific templates
4. **Add Validation**: JSON schema validation in editor
5. **Version Control**: Git-like versioning for dashboards

### 10. Troubleshooting

#### API Server Not Responding

```bash
# Check if server is running
curl http://localhost:8000/health

# Check server logs
cd apps/control-plane-api && pnpm dev
```

#### Route Not Found Errors

- Make sure API server is running on port 8000
- Check that routes are registered in `server-firebase.ts`

#### TypeScript Errors

```bash
# Rebuild TypeScript
pnpm build

# Check types
pnpm type-check
```

---

## 🎯 Benefits of Dashboard as Code

1. **Version Control**: Track dashboard changes in Git
2. **Code Review**: Review dashboard changes like code
3. **Templating**: Reuse dashboard patterns across clients
4. **Automation**: Generate dashboards programmatically
5. **Consistency**: Enforce dashboard standards via schema
6. **Scalability**: Manage 40+ client dashboards efficiently

---

พร้อมใช้งานแล้วครับ! 🎉
