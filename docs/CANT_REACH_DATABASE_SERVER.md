# 🚨 Can't Reach Database Server - Quick Fix

## 📊 Error ที่เจอ

```
Can't reach database server at `192.168.50.16:1433`
Please make sure your database server is running at `192.168.50.16:1433`.
```

**Connection String ที่ใช้**:

```bash
DATABASE_URL="sqlserver://192.168.50.16:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

**ความหมาย**:

- ✅ ปัญหา "DATABASE_URL not found" แก้แล้ว
- ❌ แต่เชื่อมต่อไปที่ database server ไม่ได้

---

## ⚡ วิธีแก้เร็ว (5 นาที)

### 1. รัน Script ทดสอบ

```powershell
cd D:\DigitalValue\flexboard-onprem-dev
.\scripts\test-connection-formats.ps1
```

Script นี้จะ:

- ✅ หา ports ที่เปิดอยู่
- ✅ สร้าง connection strings ให้ลองทั้งหมด
- ✅ บันทึกลงไฟล์ `.env.production.examples`

### 2. Copy connection string ที่ได้

Script จะแสดงผลแบบนี้:

```
✅ Port 49152 is OPEN

DATABASE_URL="sqlserver://192.168.50.16:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### 3. แก้ไข `.env.production`

```powershell
notepad D:\DigitalValue\flexboard-onprem-dev\apps\onprem-viewer\.env.production
```

แทนที่บรรทัด `DATABASE_URL` ด้วย connection string ที่ได้

### 4. ทดสอบ

```powershell
cd D:\DigitalValue\flexboard-onprem-dev\apps\onprem-viewer
npm run db:test
```

### 5. Deploy

```powershell
npm run build
npm start
```

---

## 🔍 ถ้า Script ไม่ทำงาน - แก้ทีละขั้น

### ขั้นที่ 1: ทดสอบ Network

```powershell
# ทดสอบว่า ping ถึงหรือไม่
ping 192.168.50.16

# ทดสอบ port
Test-NetConnection -ComputerName 192.168.50.16 -Port 1433
Test-NetConnection -ComputerName 192.168.50.16 -Port 49152
```

**ต้องการผลลัพธ์**: `TcpTestSucceeded : True`

---

### ขั้นที่ 2: หา Port ที่ถูกต้อง

**Named instance** (`\FORMA`) ไม่ได้ใช้ port 1433!

**วิธีหา**:

#### A. ใช้ SQL Query (ถ้า connect SSMS ได้)

```sql
-- Connect to: 192.168.50.16\FORMA
SELECT local_tcp_port
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;
```

#### B. ดูใน SQL Server Configuration Manager

1. SQL Server Network Configuration → Protocols for FORMA
2. TCP/IP → Properties → IP Addresses
3. ล่างสุดที่ **IPAll** → ดู **TCP Dynamic Ports** หรือ **TCP Port**

---

### ขั้นที่ 3: เช็ค TCP/IP เปิดหรือยัง

บน SQL Server machine:

1. เปิด **SQL Server Configuration Manager**
2. **SQL Server Network Configuration** → **Protocols for FORMA**
3. เช็ค **TCP/IP** = **Enabled**

ถ้าเป็น **Disabled**:

- คลิกขวา → Enable
- รีสตาร์ท: `Restart-Service 'MSSQL$FORMA'`

---

### ขั้นที่ 4: เช็ค Firewall

```powershell
# Run as Administrator
# เปิด port 1433
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow

# หรือเปิด dynamic port (เช่น 49152)
New-NetFirewallRule -DisplayName "SQL FORMA" -Direction Inbound -Protocol TCP -LocalPort 49152 -Action Allow
```

---

### ขั้นที่ 5: เช็ค SQL Authentication

1. เปิด **SSMS** → Connect to `192.168.50.16\FORMA`
2. คลิกขวา server → **Properties** → **Security**
3. เลือก **SQL Server and Windows Authentication mode**
4. รีสตาร์ท SQL Server: `Restart-Service 'MSSQL$FORMA'`

---

### ขั้นที่ 6: เช็ค User Permission

ใน SSMS:

1. **Security** → **Logins** → **fm1234** → Properties
2. **User Mapping** → เช็ค ✅ `shareddata`
3. Grant: `db_datareader`, `db_datawriter`

---

## 🧪 ทดสอบด้วย SSMS ก่อน

ก่อนใช้ Prisma ควรทดสอบด้วย **SSMS**:

**Connection**:

- Server: `192.168.50.16,1433` หรือ `192.168.50.16\FORMA`
- Authentication: SQL Server Authentication
- Login: `fm1234`
- Password: `x2y2`

ถ้า SSMS connect ได้ → ข้อมูลถูกต้อง  
ถ้า SSMS connect ไม่ได้ → แก้ SQL Server ก่อน

---

## 📝 Connection String ที่ควรลอง

### Format 1 (ปัจจุบัน - port 1433)

```bash
DATABASE_URL="sqlserver://192.168.50.16:1433;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### Format 2 (ลอง dynamic port - เช่น 49152)

```bash
DATABASE_URL="sqlserver://192.168.50.16:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### Format 3 (ใช้ hostname แทน IP)

```bash
DATABASE_URL="sqlserver://PVG-FORMA01:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### Format 4 (รูปแบบอื่น)

```bash
DATABASE_URL="sqlserver://fm1234:x2y2@192.168.50.16:49152/shareddata?encrypt=true&trustServerCertificate=true"
```

---

## ✅ Checklist

- [ ] Ping ถึง 192.168.50.16
- [ ] Test-NetConnection ผ่าน (TcpTestSucceeded = True)
- [ ] หา port ที่ถูกต้อง (อาจไม่ใช่ 1433)
- [ ] SQL Server service ทำงาน
- [ ] TCP/IP protocol เปิดอยู่
- [ ] Firewall อนุญาต port
- [ ] SQL Authentication เปิดอยู่
- [ ] User มีสิทธิ์เข้าถึง database
- [ ] ทดสอบ SSMS connect ได้

---

## 🆘 ติดปัญหา?

รัน command นี้แล้วส่งผลลัพธ์:

```powershell
cd D:\DigitalValue\flexboard-onprem-dev
.\scripts\test-connection-formats.ps1 > connection-test-result.txt
```

ส่งไฟล์ `connection-test-result.txt` มาเพื่อช่วยวิเคราะห์
