# SQL Server Connection String Formats

## 🎯 รูปแบบ Connection String ที่ใช้ได้

### Prisma Built-in Driver

#### ✅ Format 1: Semicolon + Port (แนะนำ)

```bash
DATABASE_URL="sqlserver://HOST:PORT;database=DB;user=USER;password=PASS;encrypt=true;trustServerCertificate=true"
```

**ตัวอย่าง**:

```bash
DATABASE_URL="sqlserver://PVG-FORMA01:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
DATABASE_URL="sqlserver://192.168.50.16:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

**ข้อดี**:

- ✅ ใช้งานได้กับ Prisma โดยตรง
- ✅ ไม่ต้องติดตั้งอะไรเพิ่ม
- ✅ Performance ดี

**ข้อเสีย**:

- ❌ ต้องหา port ก่อน (ใช้ script `find-sql-server-port.ps1`)
- ❌ ถ้า port เปลี่ยนต้องแก้ config

---

#### ❌ Format 2: Instance Name (ใช้ไม่ได้!)

```bash
DATABASE_URL="sqlserver://HOST\\INSTANCE;database=DB;user=USER;password=PASS;encrypt=true;trustServerCertificate=true"
```

**ตัวอย่าง**:

```bash
# ❌ Prisma จะ error!
DATABASE_URL="sqlserver://PVG-FORMA01\\\\FORMA;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

**Error ที่จะเจอ**:

```
Invalid connection string: Named instances are not supported
```

---

#### ⚠️ Format 3: URL Format (อาจไม่ได้)

```bash
DATABASE_URL="sqlserver://USER:PASS@HOST:PORT/DATABASE?encrypt=true&trustServerCertificate=true"
```

**ตัวอย่าง**:

```bash
DATABASE_URL="sqlserver://fm1234:x2y2@PVG-FORMA01:49152/shareddata?encrypt=true&trustServerCertificate=true"
```

**สถานะ**: ⚠️ **ยังไม่แน่ใจ** - บาง version อาจใช้ได้ แต่ไม่แนะนำ

---

### node-mssql Adapter (Prisma v5.4.0+)

#### ✅ Format 4: Instance Name (ใช้ได้!)

```bash
DATABASE_URL="sqlserver://HOST\\INSTANCE;database=DB;user=USER;password=PASS;encrypt=true;trustServerCertificate=true"
```

**ตัวอย่าง**:

```bash
DATABASE_URL="sqlserver://PVG-FORMA01\\\\FORMA;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

**ข้อดี**:

- ✅ รองรับ instance name
- ✅ Auto-resolve port ผ่าน SQL Browser
- ✅ ไม่ต้องหา port
- ✅ Dynamic port เปลี่ยนก็ไม่กระทบ

**ข้อเสีย**:

- ❌ ต้องติดตั้ง dependencies เพิ่ม: `@prisma/adapter-mssql`, `mssql`
- ❌ ต้องสร้าง adapter code เอง
- ❌ ต้องแก้ไข imports ใน API routes

---

## 📋 เปรียบเทียบ

| Format                   | Prisma Built-in | node-mssql Adapter | ใช้ได้          | แนะนำ    |
| ------------------------ | --------------- | ------------------ | --------------- | -------- |
| `host:port;params`       | ✅              | ✅                 | ✅              | 🥇 ง่าย  |
| `host\\instance;params`  | ❌              | ✅                 | ⚠️ ต้อง adapter | 🥈 สะดวก |
| `user:pass@host:port/db` | ⚠️              | ✅                 | ⚠️ ไม่แน่ใจ     | ❌       |

---

## 🎯 แนะนำให้ใช้อะไร?

### สถานการณ์ที่ 1: รู้ port แล้ว

👉 **ใช้ Format 1** (Prisma built-in)

```bash
DATABASE_URL="sqlserver://PVG-FORMA01:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### สถานการณ์ที่ 2: ไม่รู้ port / port เปลี่ยนบ่อย

👉 **ใช้ node-mssql adapter**

```bash
# 1. ติดตั้ง
npm install @prisma/adapter-mssql mssql

# 2. ใช้ connection string
DATABASE_URL="sqlserver://PVG-FORMA01\\\\FORMA;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"

# 3. สร้าง adapter (ดูใน docs/SQL_SERVER_MSSQL_ADAPTER_GUIDE.md)
```

### สถานการณ์ที่ 3: ต้องการความเรียบง่าย

👉 **ใช้ Format 1 + Script หา port**

```bash
# 1. รัน script
.\scripts\find-sql-server-port.ps1

# 2. ได้ port เช่น 49152
# 3. ใส่ใน connection string
DATABASE_URL="sqlserver://PVG-FORMA01:49152;..."
```

---

## 🧪 วิธีทดสอบ

### ทดสอบ Connection String

```bash
# แก้ไข .env
DATABASE_URL="sqlserver://..."

# ทดสอบ
npm run db:test

# ถ้าเห็นข้อความนี้ = สำเร็จ
# ✅ Connected to database successfully!
# ✅ Query successful! Total records: XXX
```

---

## 📝 ตัวอย่างไฟล์ .env

### สำหรับ Development (localhost)

```bash
DATABASE_URL="sqlserver://localhost:1433;database=shareddata;user=sa;password=Test1234;encrypt=true;trustServerCertificate=true"
```

### สำหรับ Production (รู้ port)

```bash
DATABASE_URL="sqlserver://PVG-FORMA01:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### สำหรับ Production (ใช้ IP)

```bash
DATABASE_URL="sqlserver://192.168.50.16:49152;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

### สำหรับ Production (ใช้ instance name - ต้องมี adapter)

```bash
DATABASE_URL="sqlserver://PVG-FORMA01\\\\FORMA;database=shareddata;user=fm1234;password=x2y2;encrypt=true;trustServerCertificate=true"
```

---

## 🚨 Common Errors

### Error 1: "Named instances are not supported"

```
❌ Prisma built-in driver ไม่รองรับ instance name
✅ แก้: ใช้ port แทน หรือเปลี่ยนเป็น node-mssql adapter
```

### Error 2: "Can't reach database server"

```
❌ Port ผิด หรือ firewall block
✅ แก้: รัน Test-NetConnection -ComputerName HOST -Port PORT
```

### Error 3: "Login failed"

```
❌ Username/password ผิด หรือ SQL Auth ปิดอยู่
✅ แก้: เช็ค Server Properties → Security → SQL Server and Windows Authentication mode
```

---

## 📚 เอกสารเพิ่มเติม

- [ONPREM_DEPLOYMENT_TROUBLESHOOTING.md](./ONPREM_DEPLOYMENT_TROUBLESHOOTING.md) - คู่มือแก้ปัญหา
- [CANT_REACH_DATABASE_SERVER.md](./CANT_REACH_DATABASE_SERVER.md) - แก้ปัญหา connection
- [SQL_SERVER_CONNECTION_FIX.md](./SQL_SERVER_CONNECTION_FIX.md) - แก้ไข connection string
- Prisma Docs: https://www.prisma.io/docs/concepts/database-connectors/sql-server

---

**เอกสารนี้อัพเดทล่าสุด**: 2 ตุลาคม 2025  
**สำหรับ**: Flexboard OnPrem Viewer
