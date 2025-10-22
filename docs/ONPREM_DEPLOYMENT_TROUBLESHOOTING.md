# 🚀 คู่มือ Deploy OnPrem Viewer บนเครื่องลูกค้า

## ปัญหาที่พบ: Environment variable not found: DATABASE_URL

เกิดจาก: Build production ไม่ได้อ่านไฟล์ `.env` ต้องใช้ `.env.production` หรือตั้ง environment variable ในระบบ

---

## ✅ วิธีแก้ปัญหา (เลือกอย่างใดอย่างหนึ่ง)

### วิธีที่ 1: ใช้ไฟล์ `.env.production` (แนะนำสำหรับ Self-hosted)

1. **หา port ที่ถูกต้อง** (สำคัญมาก! ⚠️):

   **Prisma ไม่รองรับ instance name** (`PVG-FORMA01\FORMA`) ต้องใช้ port ตรง ๆ เช่น `PVG-FORMA01:49152`

   ใช้ **PowerShell script** ที่เราเตรียมไว้ให้:

   ```powershell
   # รันบนเครื่อง SQL Server หรือเครื่องที่เชื่อมต่อได้
   cd D:\DigitalValue\flexboard-onprem-dev
   .\scripts\find-sql-server-port.ps1
   ```

   หรือหาด้วยวิธีอื่น:

   **A. ใช้ SQL Query** (แนะนำ):

   ```sql
   -- เชื่อมต่อด้วย SSMS: PVG-FORMA01\FORMA
   SELECT local_tcp_port
   FROM sys.dm_exec_connections
   WHERE session_id = @@SPID;
   ```

   **B. ใช้ SQL Server Configuration Manager**:

   - เปิด **SQL Server Configuration Manager**
   - ไปที่: SQL Server Network Configuration → Protocols for FORMA → TCP/IP → Properties
   - Tab "IP Addresses" → IPAll → ดูค่า "TCP Dynamic Ports" หรือ "TCP Port"

   **C. ใช้ Port Scanner** (ถ้าวิธีอื่นไม่ได้):

   ```powershell
   # ลอง scan ports ทั่วไป
   Test-NetConnection -ComputerName PVG-FORMA01 -Port 1433
   Test-NetConnection -ComputerName PVG-FORMA01 -Port 49152
   Test-NetConnection -ComputerName PVG-FORMA01 -Port 49153
   ```

2. **แก้ไขไฟล์** `.env.production` ให้ตรงกับเครื่อง server ของลูกค้า:

```bash
# ตัวอย่าง connection string (แก้ port ให้ถูกต้อง)
DATABASE_URL="sqlserver://PVG-FORMA01:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
FLEXBOARD_LICENSE_KEY=FLX-PVS-CO-LTD-20250902-7G2P6E-CBKZLQ
```

**⚠️ สำคัญ**: ต้องใช้ **port number** ไม่ใช่ instance name!

- ❌ ผิด: `PVG-FORMA01\FORMA`
- ✅ ถูก: `PVG-FORMA01:49152`

3. **ทดสอบ connection**:

```bash
cd apps/onprem-viewer
npm run db:test
npm run build
npm start
```

---

### 🆚 เปรียบเทียบ: Go Driver vs Prisma

**ทำไมเพื่อนคุณเชื่อมต่อได้ แต่เราไม่ได้?**

```go
// Go SQL Server Driver รองรับ instance name
"server=PVG-FORMA01\\FORMA;user id=fm1234;password=x2y2;database=shareddata"
```

```prisma
// Prisma ไม่รองรับ instance name - ต้องใช้ port
"sqlserver://PVG-FORMA01:49152;database=shareddata;user=fm1234;password=x2y2"
```

**สาเหตุ**:

- Go driver ใช้ **SQL Browser service** (UDP 1434) เพื่อหา port ของ instance อัตโนมัติ
- Prisma ไม่มี mechanism นี้ → ต้องระบุ port ตรง ๆ

**วิธีแก้**: หา port ที่ instance `FORMA` ใช้ แล้วใส่ใน connection string

---

### วิธีที่ 2: ตั้ง Environment Variable ในระบบ Windows

สำหรับเครื่องลูกค้าที่ใช้ Windows:

#### Option A: ใช้ PowerShell (ชั่วคราว - ใช้ได้จนปิด terminal)

```powershell
$env:DATABASE_URL="sqlserver://PVG-FORMA01:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
$env:FLEXBOARD_LICENSE_KEY="FLX-PVS-CO-LTD-20250902-7G2P6E-CBKZLQ"

# จากนั้นรัน
npm start
```

#### Option B: ตั้งค่าถาวรใน System Environment Variables

1. กด **Win + R** → พิมพ์ `sysdm.cpl` → Enter
2. Tab **Advanced** → คลิก **Environment Variables**
3. ใน **System variables** คลิก **New**:
   - Variable name: `DATABASE_URL`
   - Variable value: `sqlserver://PVG-FORMA01:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true`
4. เพิ่มอีก 1 ตัว:
   - Variable name: `FLEXBOARD_LICENSE_KEY`
   - Variable value: `FLX-PVS-CO-LTD-20250902-7G2P6E-CBKZLQ`
5. คลิก **OK** → **รีสตาร์ท PowerShell/CMD**
6. รัน `npm start` ใหม่

---

### วิธีที่ 3: ใช้ไฟล์ `.env.local` (สำหรับ Development)

ถ้าเป็นการรันในโหมด dev (`npm run dev`):

1. สร้างไฟล์ `.env.local` (ไม่ควร commit ขึ้น git):

```bash
DATABASE_URL="sqlserver://PVG-FORMA01:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
FLEXBOARD_LICENSE_KEY=FLX-PVS-CO-LTD-20250902-7G2P6E-CBKZLQ
```

2. รัน:

```bash
npm run dev
```

---

## 🔍 วิธีเช็คว่า Environment Variable ถูกโหลดหรือไม่

### ใน Node.js/Next.js:

```javascript
// ใน API route หรือ server component
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log(
  "DATABASE_URL preview:",
  process.env.DATABASE_URL?.substring(0, 30) + "..."
);
```

### ใน PowerShell:

```powershell
echo $env:DATABASE_URL
echo $env:FLEXBOARD_LICENSE_KEY
```

### ใน CMD:

```cmd
echo %DATABASE_URL%
echo %FLEXBOARD_LICENSE_KEY%
```

---

## 📝 Order of Priority (Next.js อ่าน env files ตามลำดับนี้)

1. `.env.production.local` (ถ้ามี - ไม่ควร commit)
2. `.env.local` (ถ้ามี - ไม่ควร commit)
3. `.env.production` (ควร commit - แต่ไม่มีรหัสผ่านจริง)
4. `.env` (default - ควร commit)
5. System Environment Variables

**⚠️ หมายเหตุ**:

- ไฟล์ที่มี `.local` จะ override ไฟล์อื่น
- `NEXT_PUBLIC_*` variables จะถูก embed ใน browser bundle (ห้ามใส่ข้อมูลลับ!)
- `DATABASE_URL` ไม่มี `NEXT_PUBLIC_` หน้า → ใช้ได้ฝั่ง server เท่านั้น (ปลอดภัย)

---

## 🛠️ วิธีแก้ปัญหาเฉพาะบนเครื่องลูกค้า

จากข้อความ error ของคุณ: `D:\DigitalValue\flexboard-onprem-dev`

### ขั้นตอนที่ 1: ไปที่โฟลเดอร์ project

```powershell
cd D:\DigitalValue\flexboard-onprem-dev\apps\onprem-viewer
```

### ขั้นตอนที่ 2: เช็คว่ามีไฟล์ `.env.production` หรือไม่

```powershell
dir .env*
```

### ขั้นตอนที่ 3: แก้ไขไฟล์ `.env.production`

```powershell
notepad .env.production
```

ตรวจสอบว่ามีบรรทัดนี้:

```bash
DATABASE_URL="sqlserver://PVG-FORMA01:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

**⚠️ หมายเหตุ**: ถ้า server ใช้ instance name `\FORMA` ให้เช็ค dynamic port แล้วใช้ port ตรง ๆ เช่น:

```bash
DATABASE_URL="sqlserver://PVG-FORMA01:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### ขั้นตอนที่ 4: Generate Prisma Client ใหม่

```powershell
cd apps\onprem-viewer
npx prisma generate
```

### ขั้นตอนที่ 5: Build และรัน

```powershell
npm run build
npm start
```

---

## 🧪 วิธีทดสอบ Connection ก่อน Deploy

### ทดสอบด้วย Node.js Script:

สร้างไฟล์ `test-db.js`:

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing database connection...");
    const count = await prisma.vVPVSG_INVENTORY_001_VIEW_001.count();
    console.log("✅ Connection successful! Record count:", count);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

รัน:

```powershell
node test-db.js
```

---

## 📦 Production Build Checklist

ก่อน deploy บนเครื่องลูกค้า:

- [ ] แก้ไข `.env.production` ให้ตรงกับ server จริง
- [ ] ใส่ `DATABASE_URL` และ `FLEXBOARD_LICENSE_KEY` ที่ถูกต้อง
- [ ] ทดสอบ connection ด้วย `test-db.js`
- [ ] รัน `npx prisma generate` ให้สร้าง client ใหม่
- [ ] รัน `npm run build` ให้ build production
- [ ] เช็ค `.next/standalone` ว่ามี server.js
- [ ] ทดสอบรัน `npm start` หรือ `node .next/standalone/server.js`
- [ ] เข้า browser ที่ `http://localhost:3000` ทดสอบ

---

## 🚨 Common Errors และวิธีแก้

### Error: "Environment variable not found: DATABASE_URL"

**สาเหตุ**: ไม่มีไฟล์ `.env.production` หรือไม่มี `DATABASE_URL` ในไฟล์  
**วิธีแก้**: ดูวิธีที่ 1 หรือ 2 ข้างบน

### Error: "Login failed for user 'fm1234'"

**สาเหตุ**: Username/Password ผิด  
**วิธีแก้**: เช็ค credential ใน SQL Server Management Studio

### Error: "Could not connect to server PVG-FORMA01"

**สาเหตุ**: Network ไม่ถึง หรือ SQL Server ปิดอยู่  
**วิธีแก้**:

1. Ping server: `ping PVG-FORMA01`
2. เช็ค SQL Server Browser service ว่าเปิดอยู่หรือไม่
3. เช็ค Firewall ว่าเปิด port หรือยัง

### Error: "Cannot find module '@prisma/client'"

**สาเหตุ**: ยังไม่ได้รัน `npx prisma generate`  
**วิธีแก้**: รัน `npx prisma generate` แล้ว build ใหม่

---

## 💡 Best Practices

1. **ไม่ควร commit** `.env.production` ที่มีรหัสผ่านจริงขึ้น git
2. **ใช้ `.env.production.example`** เป็น template แทน
3. **ใช้ Azure Key Vault** หรือ secrets management ถ้าเป็น production ใหญ่
4. **ใช้ connection pooling** ใน Prisma สำหรับ performance
5. **เปิด logging** ตอน production เพื่อ debug ง่าย:
   ```bash
   DATABASE_URL="sqlserver://...?connection_limit=10&pool_timeout=20&socket_timeout=30"
   ```

---

## 📞 Support

ถ้าเจอปัญหาเพิ่มเติม:

1. เช็ค log file: `.next/server/app/api/inventory/raw/route.log`
2. เช็ค Next.js logs: `npm start 2>&1 | tee server.log`
3. เช็ค Prisma debug: `DEBUG=prisma:* npm start`

---

**เอกสารนี้อัพเดทล่าสุด**: 2 ตุลาคม 2025  
**เวอร์ชัน**: 1.0.0
