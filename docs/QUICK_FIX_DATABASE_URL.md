# 🚀 Quick Fix: DATABASE_URL Not Found

## สาเหตุ

Prisma ไม่รองรับ SQL Server **instance name** (`\FORMA`) - ต้องใช้ **port number** ตรง ๆ!

---

## ✅ วิธีแก้ (3 ขั้นตอน)

### 1️⃣ หา Port ที่ถูกต้อง

#### วิธี A: ใช้ PowerShell Script (แนะนำ)

```powershell
cd D:\DigitalValue\flexboard-onprem-dev
.\scripts\find-sql-server-port.ps1
```

#### วิธี B: ใช้ SQL Query

```sql
-- เชื่อมต่อด้วย SSMS: PVG-FORMA01\FORMA
SELECT local_tcp_port
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;
```

#### วิธี C: ใช้ SQL Server Configuration Manager

1. SQL Server Network Configuration → Protocols for FORMA
2. TCP/IP → Properties → IP Addresses tab
3. IPAll → ดู "TCP Dynamic Ports" หรือ "TCP Port"

#### วิธี D: ลองทีละ Port

```powershell
# ลอง port ทั่วไป
Test-NetConnection PVG-FORMA01 -Port 1433
Test-NetConnection PVG-FORMA01 -Port 49152
Test-NetConnection PVG-FORMA01 -Port 49153
```

---

### 2️⃣ แก้ไข `.env.production`

```bash
# สมมติหา port ได้ 49152
DATABASE_URL="sqlserver://PVG-FORMA01:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
FLEXBOARD_LICENSE_KEY=<FLEXBOARD_LICENSE_KEY_REMOVED>
```

⚠️ **สำคัญ**:

- ❌ ผิด: `PVG-FORMA01\FORMA`
- ✅ ถูก: `PVG-FORMA01:49152`

---

### 3️⃣ ทดสอบและ Deploy

```powershell
cd D:\DigitalValue\flexboard-onprem-dev\apps\onprem-viewer

# ทดสอบ connection
npm run db:test

# ถ้าผ่าน ให้ build และรัน
npx prisma generate
npm run build
npm start
```

---

## 🔍 ผลลัพธ์ที่คาดหวัง

### ✅ สำเร็จ

```
✅ Connected to database successfully!
✅ Query successful! Total records: 1,234
✅ ALL TESTS PASSED!
```

### ❌ ยังไม่ผ่าน

```
❌ CONNECTION TEST FAILED!
→ ลอง port อื่น หรือเช็ค firewall/credentials
```

---

## 🆚 ทำไมเพื่อนเชื่อมต่อได้?

| Driver            | รองรับ Instance Name?                 | Connection String       |
| ----------------- | ------------------------------------- | ----------------------- |
| **Go SQL Driver** | ✅ ใช่ (auto-resolve via SQL Browser) | `server=HOST\INSTANCE`  |
| **Prisma**        | ❌ ไม่ (ต้องระบุ port)                | `sqlserver://HOST:PORT` |

**Go driver** ใช้ **SQL Browser service** (UDP 1434) หา port อัตโนมัติ  
**Prisma** ไม่มี → ต้องระบุ port เอง

---

## 📞 ยังไม่ได้?

อ่านเอกสารฉบับเต็ม: `docs/ONPREM_DEPLOYMENT_TROUBLESHOOTING.md`
