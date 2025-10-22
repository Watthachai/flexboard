# SQL Server Connection String - Fix Guide

## ❌ ปัญหาที่พบ

```
Error parsing connection string: Conversion error: invalid digit found in string
```

**สาเหตุ:** รูปแบบ connection string ไม่ถูกต้องสำหรับ Prisma + SQL Server

## ✅ วิธีแก้ไข

### รูปแบบเดิม (ผิด):

```env
DATABASE_URL="sqlserver://fm1234:x2y2@PVG-FORMA01\\FORMA:1433;database=shareddata;encrypt=true;trustServerCertificate=true"
```

### รูปแบบใหม่ (ถูก):

```env
DATABASE_URL="sqlserver://PVG-FORMA01\\FORMA:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

## 🔑 จุดสำคัญ:

1. **ไม่ใช้ `user:password@host` format** - ใช้ parameters แทน
2. **ใช้ `;user=xxx;password=xxx`** - เป็น query string parameters
3. **`\\FORMA`** - backslash สองตัวสำหรับ instance name
4. **`encrypt=true;trustServerCertificate=true`** - สำหรับ local development

## 🧪 ทดสอบ Connection

หลังจากแก้ไข `.env` แล้ว ให้รัน:

```bash
# 1. Generate Prisma Client ใหม่
npx prisma generate

# 2. ทดสอบดึง schema จาก SQL Server
npx prisma db pull

# 3. เปิด Prisma Studio เพื่อดูข้อมูล
npx prisma studio
```

## 📋 Connection String Formats ทางเลือก

### Option 1: ใช้ instance name (แนะนำ)

```env
DATABASE_URL="sqlserver://PVG-FORMA01\\FORMA:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### Option 2: ไม่ใช้ instance name (ถ้า Option 1 ไม่ได้)

```env
DATABASE_URL="sqlserver://PVG-FORMA01:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### Option 3: Windows Authentication (ถ้ามี)

```env
DATABASE_URL="sqlserver://PVG-FORMA01\\FORMA;database=shareddata;integratedSecurity=true;trustServerCertificate=true"
```

## 🔗 เอกสารอ้างอิง

- [Prisma SQL Server Connection String](https://www.prisma.io/docs/concepts/database-connectors/sql-server)
- [SQL Server Connection String Format](https://www.prisma.io/docs/reference/database-reference/connection-urls#sql-server)

## ⚠️ หมายเหตุ

- ถ้าใช้ production ให้เปลี่ยน `trustServerCertificate=true` เป็น `false` และใช้ SSL certificate ที่ถูกต้อง
- ตรวจสอบว่า SQL Server Browser service กำลังทำงานอยู่ (สำหรับ named instance)
- ตรวจสอบว่า port 1433 เปิดอยู่ใน firewall
