# 🚧 Product Code/Name Separation - Pending Manager Approval

**Status:** ⏳ Waiting for Manager Approval  
**Date Created:** September 26, 2025  
**Component:** PVSDashboard.tsx

## 📋 Overview

เตรียมการแยก field `prod` เป็น `prodCode` (รหัสสินค้า) และ `prodName` (ชื่อสินค้า) ในระบบ PVS Dashboard เพื่อให้การแสดงผลและการจัดการข้อมูลสินค้าชัดเจนขึ้น

## 🎯 Goals

- แยกรหััสสินค้าและชื่อสินค้าออกจากกันเพื่อความชัดเจน
- ปรับปรุงการแสดงผลในตารางและ Excel export
- รองรับการค้นหาและกรองข้อมูลที่ดีขึ้น
- เตรียมพร้อมสำหรับการขยายระบบในอนาคต

## 📁 Files Modified

### `/apps/onprem-viewer/src/app/components/PVSDashboard.tsx`

- ✅ เพิ่ม TODO comments ในทุกส่วนที่ต้องแก้ไข
- ✅ เพิ่ม helper functions (parseProdField, formatProductDisplay, matchesProductSearch)
- ✅ อัปเดต interfaces พร้อม placeholder fields
- ✅ เพิ่ม comprehensive guide ในส่วนท้ายไฟล์

### `/apps/onprem-viewer/prisma/schema.prisma`

- ✅ เพิ่ม TODO comments ใน InventoryRaw model
- ✅ เตรียม prodCode และ prodName fields (commented out)
- ✅ เตรียม database indexes สำหรับ fields ใหม่
- ✅ ระบุ 2 options: Keep prod field หรือ Replace prod field

### `/apps/onprem-viewer/prisma/migrations/pending_product_separation.sql`

- ✅ สร้าง migration script พร้อมใช้งาน
- ✅ รองรับการแยกข้อมูลหลายรูปแบบ (-, |, \_)
- ✅ มี validation queries และ rollback instructions
- ✅ ระบุขั้นตอนการ migrate และตรวจสอบข้อมูล

### `/apps/onprem-viewer/src/app/components/types/ProductSeparationTypes.ts`

- ✅ สร้าง TypeScript types สำหรับ prodCode และ prodName
- ✅ เตรียม interfaces ใหม่ (DatabaseRecordV2, ProductAgeBucketSummaryV2)
- ✅ เพิ่ม helper types และ type guards
- ✅ กำหนด default configurations สำหรับ search และ export

## 🔧 Changes Required When Approved

### 1. Database & API Changes

```sql
-- Example database schema changes (ต้องปรับตาม database ที่ใช้จริง)
ALTER TABLE inventory_records
ADD COLUMN prod_code VARCHAR(100),
ADD COLUMN prod_name VARCHAR(500);

-- Migrate existing data
UPDATE inventory_records
SET prod_code = SUBSTRING_INDEX(prod, ' - ', 1),
    prod_name = SUBSTRING_INDEX(prod, ' - ', -1)
WHERE prod LIKE '% - %';

-- For records without separator, use prod as both code and name
UPDATE inventory_records
SET prod_code = prod, prod_name = prod
WHERE prod_code IS NULL;
```

### 2. Interface Updates

```typescript
interface DatabaseRecord {
  // Remove or keep as legacy
  prod?: string;

  // New fields
  prodCode: string; // รหัสสินค้า
  prodName: string; // ชื่อสินค้า

  // ... other fields
}
```

### 3. Display Logic Updates

```typescript
// Product table rendering
<td>{formatProductDisplay(product.prod, 'combined')}</td>

// Or separate columns
<td>{product.prodCode}</td>
<td>{product.prodName}</td>
```

### 4. Excel Export Updates

```typescript
wsData.push([
  "รหัสสินค้า", // New column
  "ชื่อสินค้า", // New column
  "หน่วย",
  // ... other columns
]);

sortedProducts.forEach((product) => {
  wsData.push([
    product.prodCode, // New data
    product.prodName, // New data
    product.unitName,
    // ... other data
  ]);
});
```

## 📝 Implementation Checklist

### Phase 1: Backend Changes

- [ ] **Prisma Schema Update**
  - [ ] Uncomment prodCode และ prodName fields
  - [ ] Choose migration strategy (keep prod vs replace prod)
  - [ ] Update indexes
- [ ] **Database Migration**
  - [ ] Run migration script (`pending_product_separation.sql`)
  - [ ] Validate data migration results
  - [ ] Test rollback procedure
- [ ] **Prisma Client Regeneration**
  - [ ] Run `prisma generate` after schema changes
  - [ ] Update TypeScript types
- [ ] **API Endpoint Updates**
  - [ ] Update `/api/inventory/raw` to return prodCode/prodName
  - [ ] Maintain backward compatibility if needed
  - [ ] Update database queries
- [ ] **Backend Testing**
  - [ ] Test new database structure
  - [ ] Validate API responses
  - [ ] Performance testing with new indexes

### Phase 2: Frontend Updates

- [ ] Enable prodCode/prodName in interfaces
- [ ] Activate helper functions
- [ ] Update product summary table
- [ ] Update raw data table
- [ ] Update table headers

### Phase 3: Export & Search

- [ ] Excel export updates
- [ ] Search/filter logic updates
- [ ] Sort functionality updates

### Phase 4: Testing & Validation

- [ ] Unit testing
- [ ] Integration testing
- [ ] UI/UX testing
- [ ] Performance testing
- [ ] User acceptance testing

## 🎨 UI/UX Considerations

### Option 1: Combined Display

```
Column: "สินค้า"
Data: "ABC001 - สินค้าตัวอย่าง"
```

### Option 2: Separate Columns

```
Column 1: "รหัสสินค้า" → "ABC001"
Column 2: "ชื่อสินค้า" → "สินค้าตัวอย่าง"
```

### Option 3: Hybrid Approach

```
Desktop: Separate columns
Mobile: Combined display
```

## ⚠️ Important Notes

1. **Data Backup:** สำรองข้อมูลก่อนแก้ไข database schema
2. **API Compatibility:** รักษา backward compatibility ในระยะเปลี่ยนผ่าน
3. **Performance:** ตรวจสอบประสิทธิภาพหลังการเปลี่ยนแปลง
4. **User Training:** อาจต้องอบรมผู้ใช้เรื่องการเปลี่ยนแปลง UI

## � Prisma Commands (เมื่อได้รับการอนุมัติ)

```bash
# 1. อัปเดต Prisma Schema
# แก้ไข schema.prisma - uncomment prodCode และ prodName fields

# 2. สร้าง migration
cd apps/onprem-viewer
npx prisma migrate dev --name "add-product-code-name-fields"

# 3. ถ้าต้องการใช้ custom migration script
# Copy content from pending_product_separation.sql และรันใน database tool
# หรือใช้ prisma db execute

# 4. Generate Prisma Client ใหม่
npx prisma generate

# 5. ตรวจสอบ schema
npx prisma db pull

# 6. ดู database ด้วย Prisma Studio
npx prisma studio

# 7. Reset database (ถ้าต้องการเริ่มใหม่)
# npx prisma migrate reset --force  # ⚠️ ระวัง! จะลบข้อมูลทั้งหมด
```

## �🚀 Next Steps

1. **รอการอนุมัติจากหัวหน้า** 👨‍💼
2. **Backup Database** - สำรองข้อมูลก่อนทำการ migrate
3. **ทดสอบ Migration Script** - ทดสอบใน development environment ก่อน
4. **Update Prisma Schema** - uncomment fields และ indexes ใหม่
5. **Run Migration** - ใช้ prisma migrate หรือ custom script
6. **Regenerate Prisma Client** - อัปเดต TypeScript types
7. **Update API Endpoints** - แก้ไข queries ให้ใช้ fields ใหม่
8. **Update Frontend** - enable helper functions และ UI changes
9. **Testing & Validation** - ทดสอบทุกฟังก์ชันให้ครบ
10. **Deploy** - deploy ไปยัง production environment

## 📞 Contact

หากมีคำถามหรือต้องการชี้แจงเพิ่มเติม กรุณาติดต่อ Developer Team

---

**Last Updated:** September 26, 2025  
**Next Review:** รอการอนุมัติจากหัวหน้า
