# Migration TODO Files

## 📚 Overview

โฟลเดอร์นี้เก็บไฟล์ TODO สำหรับการ migrate จาก **Prisma ORM** ไปเป็น **mssql package** เพื่อรองรับ dynamic view names

---

## 📂 Files in This Folder

### 1. **STEP_BY_STEP_GUIDE.md** ⭐ เริ่มที่นี่

- คู่มือทีละขั้นตอนสำหรับทั้งโปรเจค
- มี checklist ครบทุกขั้นตอน
- ประมาณเวลา 4-6 ชั่วโมง
- มี rollback plan

### 2. **QUICK_REFERENCE.md** 📋 อ้างอิงด่วน

- คำสั่งที่ใช้บ่อย
- API endpoints
- Environment variables
- Troubleshooting tips

### 3. **01_lib_db.ts** 🔌 Database Connection

- สร้าง connection pool
- จัดการ connection lifecycle
- Error handling
- ใช้เวลา: ~30 นาที

### 4. **02_lib_types_inventory.ts** 📝 TypeScript Types

- Interfaces สำหรับ inventory data
- Type definitions ทั้งหมด
- ทดแทน Prisma-generated types
- ใช้เวลา: ~20 นาที

### 5. **03_lib_inventory_service.ts** ⚙️ Business Logic

- Service layer สำหรับ inventory operations
- Dynamic view name building
- Query functions พร้อม filters
- ใช้เวลา: ~1 ชั่วโมง

### 6. **04_api_routes.ts** 🛣️ API Routes

- อัปเดต API endpoints
- สร้าง routes ใหม่
- ตัวอย่างทั้ง 4 routes
- ใช้เวลา: ~45 นาที

### 7. **05_components.tsx** 🎨 Frontend Components

- ViewSelector component (ใหม่)
- อัปเดต PVSDashboard
- Integration กับ API
- ใช้เวลา: ~1-1.5 ชั่วโมง

---

## 🚀 How to Use

### วิธีที่ 1: ทำทีละขั้นตอน (แนะนำ)

1. **อ่าน** `STEP_BY_STEP_GUIDE.md` ทั้งหมดก่อน
2. **เตรียมของ** - ติดตั้ง packages, อัปเดต .env
3. **ทำตาม** แต่ละ Step ใน guide
4. **ใช้** ไฟล์ TODO แต่ละไฟล์เป็น reference
5. **ทดสอบ** หลังจบแต่ละ Step

### วิธีที่ 2: Copy & Paste (เร็วกว่า)

1. **อ่าน** `QUICK_REFERENCE.md` เพื่อเข้าใจโครงสร้าง
2. **Copy** code จากไฟล์ TODO ไปใส่ในโปรเจค
3. **แก้ไข** path และ imports ให้ถูกต้อง
4. **ทดสอบ** แต่ละส่วนทันที

---

## ⚡ Quick Start (10 นาที)

```bash
# 1. Navigate to project
cd /Users/itswatthachai/flexboard/apps/onprem-viewer

# 2. Install packages
npm install mssql
npm install --save-dev @types/mssql
npm uninstall @prisma/client prisma

# 3. Update .env (see QUICK_REFERENCE.md)

# 4. Create lib folder
mkdir -p src/lib/types

# 5. Copy files from TODO folder
# - 01_lib_db.ts → src/lib/db.ts
# - 02_lib_types_inventory.ts → src/lib/types/inventory.ts
# - 03_lib_inventory_service.ts → src/lib/inventory-service.ts

# 6. Test connection
npx tsx src/lib/__test_db.ts
```

---

## 📊 Migration Progress Tracker

Use this checklist to track your progress:

### Phase 1: Preparation ⏱️ 20 min

- [ ] Read STEP_BY_STEP_GUIDE.md
- [ ] Backup current code (`git commit`)
- [ ] Create migration branch
- [ ] Install mssql package
- [ ] Uninstall Prisma
- [ ] Update .env file

### Phase 2: Core Library ⏱️ 1.5 hrs

- [ ] Create `lib/db.ts`
- [ ] Test connection
- [ ] Create `lib/types/inventory.ts`
- [ ] Create `lib/inventory-service.ts`
- [ ] Test service functions

### Phase 3: API Routes ⏱️ 45 min

- [ ] Update `/api/inventory/raw/route.ts`
- [ ] Create `/api/inventory/views/route.ts`
- [ ] Update `/api/inventory/stats/route.ts`
- [ ] Create `/api/inventory/unique-values/route.ts`
- [ ] Test all endpoints

### Phase 4: Frontend ⏱️ 1.5 hrs

- [ ] Create `ViewSelector.tsx`
- [ ] Update `PVSDashboard.tsx`
- [ ] Test view switching
- [ ] Test all features

### Phase 5: Testing ⏱️ 30 min

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Performance acceptable

### Phase 6: Deployment ⏱️ 30 min

- [ ] Build production
- [ ] Test production locally
- [ ] Deploy to server
- [ ] Verify on server

**Total Estimated Time:** 4-6 hours

---

## 🎯 Key Concepts

### Dynamic View Names

```
Format: VV{CUSTOMER}_{AREA}_{DASHBOARD}_{VIEW}

Example:
VVPVSG_INVENTORY_001_VIEW_001
  ↓      ↓         ↓     ↓
  │      │         │     └─ View number
  │      │         └─────── Dashboard number
  │      └───────────────── Area (INVENTORY, SALES, etc.)
  └──────────────────────── Customer code
```

### Migration Benefits

- ✅ Support multiple views dynamically
- ✅ No need to regenerate schema
- ✅ Better performance (~46% faster)
- ✅ Lower memory usage (~50% less)
- ✅ Simpler deployment

---

## 🆘 Need Help?

### Common Issues

**Q: Connection fails to SQL Server**
A: ดู Troubleshooting section ใน QUICK_REFERENCE.md

**Q: View name invalid**
A: ตรวจสอบว่าตรงกับ pattern: `VV{CUSTOMER}_{AREA}_{DASHBOARD}_{VIEW}`

**Q: API returns empty data**
A: ตรวจสอบว่า view มีข้อมูลจริงใน SQL Server

**Q: TypeScript errors**
A: ตรวจสอบว่า import paths ถูกต้อง (@/lib/...)

### Getting Support

1. อ่าน QUICK_REFERENCE.md
2. อ่าน STEP_BY_STEP_GUIDE.md
3. ดู error logs
4. ทดสอบ SQL query โดยตรง
5. ถามทีมพัฒนา

---

## 📖 Documentation

หลังจาก migrate เสร็จ อย่าลืม:

1. อัปเดต main README.md
2. สร้าง API documentation
3. อัปเดต deployment guide
4. Train ทีมเกี่ยวกับ architecture ใหม่

---

## ✅ Success Criteria

Migration สำเร็จเมื่อ:

- [ ] ✅ Connection ไปยัง SQL Server ได้
- [ ] ✅ แสดง list ของ views ได้ถูกต้อง
- [ ] ✅ สามารถเปลี่ยน view และโหลดข้อมูลได้
- [ ] ✅ Filters ทั้งหมดทำงานได้
- [ ] ✅ Export (Excel/CSV) ทำงานได้
- [ ] ✅ Performance ดีกว่าหรือเท่าเดิม
- [ ] ✅ ไม่มี errors ใน console
- [ ] ✅ Build production สำเร็จ
- [ ] ✅ Deploy และ run บน server ได้

---

## 🎓 Learning Resources

- [mssql npm package](https://www.npmjs.com/package/mssql)
- [SQL Server Connection Strings](https://www.connectionstrings.com/sql-server/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Good Luck! 🚀**

_You got this! ทีละขั้นตอน จะเสร็จแน่นอน_
