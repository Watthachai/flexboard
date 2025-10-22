# Quick Reference Card

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
cd /Users/itswatthachai/flexboard/apps/onprem-viewer
npm install mssql
npm install --save-dev @types/mssql
npm uninstall @prisma/client prisma

# 2. Test connection
npx tsx src/lib/__test_db.ts

# 3. Start dev server
npm run dev

# 4. Test API
curl "http://localhost:3002/api/inventory/views"
```

---

## 📁 File Structure Reference

```
apps/onprem-viewer/
├── src/
│   ├── lib/
│   │   ├── db.ts                      ← Database connection
│   │   ├── inventory-service.ts       ← Business logic
│   │   └── types/
│   │       └── inventory.ts           ← TypeScript types
│   ├── app/
│   │   ├── api/inventory/
│   │   │   ├── raw/route.ts           ← Get data
│   │   │   ├── views/route.ts         ← List views
│   │   │   ├── stats/route.ts         ← Statistics
│   │   │   └── unique-values/route.ts ← Filter values
│   │   └── components/
│   │       ├── PVSDashboard.tsx       ← Main dashboard
│   │       └── ViewSelector.tsx       ← View picker
└── .env                                ← Configuration
```

---

## 🔧 Environment Variables

```env
# Required
DB_SERVER=PVG-FORMA01\FORMA
DB_DATABASE=shareddata
DB_USER=fm1234
DB_PASSWORD=x2y2
DB_ENCRYPT=true
DB_TRUST_CERT=true

# Optional
FLEXBOARD_LICENSE_KEY=your-license-key
```

---

## 📊 View Naming Convention

```
Format: VV{CUSTOMER}_{AREA}_{DASHBOARD}_{VIEW}

Examples:
VVPVSG_INVENTORY_001_VIEW_001
VVPVSG_SALES_001_VIEW_001
VVABC_INVENTORY_001_VIEW_001

Parts:
- CUSTOMER: PVSG, ABC, XYZ
- AREA: INVENTORY, SALES, PURCHASING
- DASHBOARD: 001, 002, 003
- VIEW: VIEW_001, VIEW_002
```

---

## 🔌 API Endpoints

### Get Raw Data

```bash
GET /api/inventory/raw?customer=PVSG&area=INVENTORY&dashboard=001&view=VIEW_001&corp=XXX

Response:
{
  "success": true,
  "count": 100,
  "data": [ /* DatabaseRecord[] */ ],
  "viewName": "VVPVSG_INVENTORY_001_VIEW_001"
}
```

### List Available Views

```bash
GET /api/inventory/views

Response:
{
  "success": true,
  "count": 5,
  "views": [
    {
      "fullName": "VVPVSG_INVENTORY_001_VIEW_001",
      "customer": "PVSG",
      "area": "INVENTORY",
      "dashboard": "001",
      "view": "VIEW_001"
    }
  ]
}
```

### Get Statistics

```bash
GET /api/inventory/stats?customer=PVSG&area=INVENTORY&corp=XXX

Response:
{
  "success": true,
  "stats": {
    "totalRecords": 1000,
    "totalValue": 5000000,
    "uniqueProducts": 250
  }
}
```

### Get Unique Values (for filters)

```bash
GET /api/inventory/unique-values?column=corp&customer=PVSG&area=INVENTORY

Response:
{
  "success": true,
  "column": "corp",
  "values": ["CORP1", "CORP2", "CORP3"]
}
```

---

## 💾 Database Functions

### Connect to Database

```typescript
import { getConnection } from "@/lib/db";

const pool = await getConnection();
```

### Get Inventory Data

```typescript
import { getInventoryData } from "@/lib/inventory-service";

const data = await getInventoryData(
  { customer: "PVSG", area: "INVENTORY", dashboard: "001", view: "VIEW_001" },
  { corp: "ABC", branch: "001" },
  { page: 1, pageSize: 100 }
);
```

### Build View Name

```typescript
import { buildViewName } from "@/lib/inventory-service";

const name = buildViewName({
  customer: "PVSG",
  area: "INVENTORY",
  dashboard: "001",
  view: "VIEW_001",
});
// Returns: "VVPVSG_INVENTORY_001_VIEW_001"
```

---

## 🎨 Frontend Usage

### Use View Selector

```typescript
import { ViewSelector } from "@/app/components/ViewSelector";
import { useState } from "react";

const [viewConfig, setViewConfig] = useState({
  customer: "PVSG",
  area: "INVENTORY",
  dashboard: "001",
  view: "VIEW_001",
});

<ViewSelector value={viewConfig} onChange={setViewConfig} />;
```

### Fetch Data with View Config

```typescript
const fetchData = async () => {
  const params = new URLSearchParams({
    customer: viewConfig.customer,
    area: viewConfig.area,
    dashboard: viewConfig.dashboard,
    view: viewConfig.view,
    corp: selectedCorp || "",
  });

  const response = await fetch(`/api/inventory/raw?${params}`);
  const data = await response.json();

  if (data.success) {
    setRawData(data.data);
  }
};
```

---

## 🔍 Troubleshooting

### Connection Failed

```bash
Error: P1001 Can't reach database server

Solutions:
1. Check DB_SERVER in .env
2. Verify SQL Server is running
3. Check firewall allows port 1433
4. Test connection from server with telnet:
   telnet PVG-FORMA01 1433
```

### Invalid View Name

```bash
Error: Invalid customer: PVSG123

Solutions:
1. View name must match pattern: VV{CUSTOMER}_{AREA}_{DASHBOARD}_{VIEW}
2. Only alphanumeric and underscore allowed
3. Check view exists in database:
   SELECT * FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME LIKE 'VV%'
```

### No Data Returned

```bash
Solutions:
1. Check view has data:
   SELECT COUNT(*) FROM VVPVSG_INVENTORY_001_VIEW_001
2. Check filters - may be too restrictive
3. Check user has SELECT permission on view
```

### Slow Queries

```bash
Solutions:
1. Add indexes to view columns (dataDate, corp, branch, prodCode)
2. Reduce page size (use pagination)
3. Add filters to limit results
4. Check SQL Server performance
```

---

## 📦 Deployment Checklist

**Before Deploy:**

- [ ] Run `npm run build`
- [ ] Test production build locally
- [ ] Update .env with production values
- [ ] Backup current production
- [ ] Create rollback plan

**Deploy:**

- [ ] Copy files to server
- [ ] Install production dependencies
- [ ] Update .env on server
- [ ] Test connection to SQL Server
- [ ] Start application
- [ ] Check logs for errors

**After Deploy:**

- [ ] Test all features
- [ ] Monitor performance
- [ ] Check error logs
- [ ] Verify data accuracy

---

## 🆘 Emergency Contacts

**Database Issues:**

- SQL Server Admin: [contact]
- DBA Team: [contact]

**Application Issues:**

- Development Team: [contact]
- DevOps: [contact]

---

## 📚 Useful SQL Queries

### List All Views

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_NAME LIKE 'VV%'
ORDER BY TABLE_NAME;
```

### Check View Schema

```sql
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'VVPVSG_INVENTORY_001_VIEW_001'
ORDER BY ORDINAL_POSITION;
```

### Test View Data

```sql
SELECT TOP 10 *
FROM VVPVSG_INVENTORY_001_VIEW_001
ORDER BY dataDate DESC;
```

### Check Connection

```sql
SELECT
    @@SERVERNAME AS ServerName,
    DB_NAME() AS DatabaseName,
    SUSER_NAME() AS CurrentUser,
    GETDATE() AS CurrentTime;
```

---

_Quick Reference - Keep this handy!_
_Last Updated: October 1, 2025_
