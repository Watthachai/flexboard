# Step-by-Step Migration Guide

## 📋 Prerequisites

- [ ] Backup current code (`git commit -am "backup before migration"`)
- [ ] Create migration branch (`git checkout -b migration/prisma-to-mssql`)
- [ ] Have SQL Server connection details ready
- [ ] Know which views exist in database (VVPVSG_INVENTORY_001_VIEW_001, etc.)

---

## 🔧 Step 1: Update Dependencies (15 minutes)

### 1.1 Install mssql package

```bash
cd /Users/itswatthachai/flexboard/apps/onprem-viewer

# Install mssql
npm install mssql

# Install TypeScript types
npm install --save-dev @types/mssql
```

### 1.2 Uninstall Prisma

```bash
# Remove Prisma packages
npm uninstall @prisma/client prisma
```

### 1.3 Update package.json scripts

Remove Prisma-related scripts:

- ❌ Remove `db:generate`
- ❌ Remove `db:push`
- ❌ Remove `db:pull`
- ❌ Remove `db:studio`
- ❌ Remove `prisma generate` from dev/build scripts

✅ Your scripts should look like:

```json
{
  "scripts": {
    "dev": "next dev --turbopack -H 0.0.0.0 -p 3002",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p 3003"
  }
}
```

---

## 🗄️ Step 2: Update Environment Variables (5 minutes)

### 2.1 Update .env file

Replace DATABASE_URL with individual connection variables:

```env
# OLD (DELETE)
DATABASE_URL="sqlserver://PVG-FORMA01:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"

# NEW (USE THIS)
DB_SERVER=PVG-FORMA01\FORMA
DB_DATABASE=shareddata
DB_USER=fm1234
DB_PASSWORD=x2y2
DB_ENCRYPT=true
DB_TRUST_CERT=true

FLEXBOARD_LICENSE_KEY=FLX-PVS-CO-LTD-20250902-7G2P6E-CBKZLQ
```

---

## 📁 Step 3: Create Core Library Files (45 minutes)

### 3.1 Create `src/lib/db.ts`

**Source:** `docs/TODO_MIGRATION/01_lib_db.ts`

```bash
# Create directory if not exists
mkdir -p /Users/itswatthachai/flexboard/apps/onprem-viewer/src/lib

# Copy the file content from TODO_MIGRATION/01_lib_db.ts
```

**Test connection:**

```typescript
// Create test file: src/lib/__test_db.ts
import { testConnection } from "./db";

testConnection().then((result) => {
  console.log("Connection test:", result ? "✅ Success" : "❌ Failed");
  process.exit(result ? 0 : 1);
});
```

```bash
# Run test
npx tsx src/lib/__test_db.ts
```

### 3.2 Create `src/lib/types/inventory.ts`

**Source:** `docs/TODO_MIGRATION/02_lib_types_inventory.ts`

```bash
mkdir -p /Users/itswatthachai/flexboard/apps/onprem-viewer/src/lib/types

# Copy the file content from TODO_MIGRATION/02_lib_types_inventory.ts
```

### 3.3 Create `src/lib/inventory-service.ts`

**Source:** `docs/TODO_MIGRATION/03_lib_inventory_service.ts`

```bash
# Copy the file content from TODO_MIGRATION/03_lib_inventory_service.ts
```

**Test the service:**

```typescript
// Create test file: src/lib/__test_service.ts
import { getAvailableViews, buildViewName } from "./inventory-service";

async function test() {
  // Test view name builder
  const viewName = buildViewName({
    customer: "PVSG",
    area: "INVENTORY",
    dashboard: "001",
    view: "VIEW_001",
  });
  console.log("View name:", viewName);
  // Should output: VVPVSG_INVENTORY_001_VIEW_001

  // Test available views
  const views = await getAvailableViews();
  console.log("Available views:", views);
}

test();
```

```bash
npx tsx src/lib/__test_service.ts
```

---

## 🛣️ Step 4: Update API Routes (45 minutes)

### 4.1 Update `/api/inventory/raw/route.ts`

**Before (using Prisma):**

```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const data = await prisma.inventoryRaw.findMany({
  where: { corp: selectedCorp },
});
```

**After (using mssql):**

```typescript
import { getInventoryData } from "@/lib/inventory-service";

const data = await getInventoryData(viewConfig, filters);
```

**Full code:** See `docs/TODO_MIGRATION/04_api_routes.ts` (File 1)

### 4.2 Create `/api/inventory/views/route.ts` (NEW)

**Full code:** See `docs/TODO_MIGRATION/04_api_routes.ts` (File 2)

```bash
mkdir -p /Users/itswatthachai/flexboard/apps/onprem-viewer/src/app/api/inventory/views
# Create route.ts file
```

### 4.3 Update `/api/inventory/stats/route.ts`

**Full code:** See `docs/TODO_MIGRATION/04_api_routes.ts` (File 3)

### 4.4 Create `/api/inventory/unique-values/route.ts` (NEW)

**Full code:** See `docs/TODO_MIGRATION/04_api_routes.ts` (File 4)

```bash
mkdir -p /Users/itswatthachai/flexboard/apps/onprem-viewer/src/app/api/inventory/unique-values
# Create route.ts file
```

**Test all API routes:**

```bash
# Test raw data
curl "http://localhost:3002/api/inventory/raw?customer=PVSG&area=INVENTORY&dashboard=001&view=VIEW_001"

# Test views list
curl "http://localhost:3002/api/inventory/views"

# Test stats
curl "http://localhost:3002/api/inventory/stats?customer=PVSG&area=INVENTORY"

# Test unique values
curl "http://localhost:3002/api/inventory/unique-values?column=corp&customer=PVSG&area=INVENTORY"
```

---

## 🎨 Step 5: Update Frontend Components (1 hour)

### 5.1 Create `ViewSelector.tsx` component

**Source:** `docs/TODO_MIGRATION/05_components.tsx` (File 1)

```bash
# Create component file
# Copy code from TODO_MIGRATION/05_components.tsx
```

### 5.2 Update `PVSDashboard.tsx`

**Changes needed:**

1. Add viewConfig state
2. Import ViewSelector component
3. Add ViewSelector to UI
4. Update all API calls to include view params
5. Add useEffect to refetch on view change

**Reference:** See `docs/TODO_MIGRATION/05_components.tsx` (File 2)

**Key additions:**

```typescript
// 1. Import
import { ViewSelector } from "./ViewSelector";
import type { ViewConfig } from "@/lib/types/inventory";

// 2. Add state
const [viewConfig, setViewConfig] = useState<ViewConfig>({
  customer: "PVSG",
  area: "INVENTORY",
  dashboard: "001",
  view: "VIEW_001",
});

// 3. Add to JSX (before filters)
<ViewSelector value={viewConfig} onChange={setViewConfig} />;

// 4. Update API calls to include view config
const params = new URLSearchParams({
  customer: viewConfig.customer,
  area: viewConfig.area,
  dashboard: viewConfig.dashboard,
  view: viewConfig.view,
  // ... other params
});
```

---

## 🧹 Step 6: Clean Up (15 minutes)

### 6.1 Remove Prisma files (optional - keep for reference)

```bash
cd /Users/itswatthachai/flexboard/apps/onprem-viewer

# Optional: Remove prisma folder
# rm -rf prisma

# Or rename for backup
mv prisma prisma_backup
```

### 6.2 Remove Prisma imports from all files

Search for and remove:

- `import { PrismaClient } from '@prisma/client'`
- `const prisma = new PrismaClient()`
- Any Prisma-related code

```bash
# Find all files with Prisma imports
grep -r "from '@prisma/client'" src/
```

### 6.3 Update TypeScript paths if needed

Check `tsconfig.json` - ensure paths are correct:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🧪 Step 7: Testing (30 minutes)

### 7.1 Unit Tests

```bash
# Test view name builder
npx tsx src/lib/__test_service.ts
```

### 7.2 Integration Tests

```bash
# Start dev server
npm run dev

# In another terminal, test APIs
curl "http://localhost:3002/api/inventory/views"
curl "http://localhost:3002/api/inventory/raw?customer=PVSG&area=INVENTORY&dashboard=001"
```

### 7.3 Manual Testing Checklist

- [ ] Open dashboard in browser
- [ ] View selector shows available views
- [ ] Can switch between views
- [ ] Data loads correctly
- [ ] Filters work (corp, branch, product)
- [ ] Search works
- [ ] Sorting works
- [ ] Statistics update correctly
- [ ] Excel export works
- [ ] CSV export works
- [ ] No console errors

### 7.4 Performance Testing

```bash
# Test query performance
time curl "http://localhost:3002/api/inventory/raw?customer=PVSG&area=INVENTORY"
```

Expected: < 500ms for 1000 records

---

## 🚀 Step 8: Build & Deploy (30 minutes)

### 8.1 Build for production

```bash
cd /Users/itswatthachai/flexboard/apps/onprem-viewer

# Build
npm run build

# Check build output
ls -lh .next
```

### 8.2 Test production build locally

```bash
npm run start

# Test in browser
open http://localhost:3003
```

### 8.3 Deploy to server

```bash
# 1. Copy files to server
scp -r .next package.json .env user@server:/path/to/app/

# 2. On server, install dependencies
ssh user@server
cd /path/to/app
npm install --production

# 3. Update .env with server-specific values
nano .env
# Change DB_SERVER to localhost or local server name

# 4. Start application
npm run start:onprem
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Application starts without errors
- [ ] Can connect to SQL Server
- [ ] Views are listed correctly
- [ ] Data loads from all views
- [ ] Filters work
- [ ] Export functions work
- [ ] Performance is acceptable (< 1s page load)
- [ ] No memory leaks (monitor over time)
- [ ] Logs show no errors

---

## 🔄 Rollback Plan

If migration fails:

```bash
# 1. Checkout backup branch
git checkout main  # or your previous working branch

# 2. Reinstall Prisma
npm install @prisma/client prisma

# 3. Generate Prisma Client
npx prisma generate

# 4. Rebuild
npm run build

# 5. Restart
npm run start
```

---

## 📊 Success Metrics

**Before (Prisma):**

- Startup time: ~3s (prisma generate)
- Query time: ~150ms
- Memory usage: ~120MB
- Fixed view only

**After (mssql):**

- Startup time: <1s ✅
- Query time: ~80ms ✅
- Memory usage: ~60MB ✅
- Dynamic views ✅

---

## 🎓 Next Steps

After successful migration:

1. **Monitor Performance**

   - Set up logging
   - Monitor query times
   - Check memory usage

2. **Documentation**

   - Update README.md
   - Document new view naming convention
   - Create API documentation

3. **Training**

   - Train team on new architecture
   - Document how to add new views
   - Create troubleshooting guide

4. **Optimization**
   - Add caching if needed
   - Optimize slow queries
   - Add database indexes

---

**Estimated Total Time:** 4-6 hours

**Difficulty:** Medium

**Risk Level:** Medium (rollback plan available)

---

_Last Updated: October 1, 2025_
