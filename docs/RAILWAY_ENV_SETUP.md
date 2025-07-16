# 🚀 Flexboard Railway Deployment - Environment Variables Setup

## คำแนะนำสำหรับการตั้งค่า Environment Variables ใน Railway

เมื่อ deploy Flexboard Control Plane ไปยัง Railway คุณจะต้องตั้งค่า Environment Variables เหล่านี้ใน Railway Dashboard:

### 1. ไปที่ Railway Dashboard

```
1. เข้า https://railway.app/dashboard
2. เลือกโปรเจคของคุณ
3. ไปที่ตาบ "Variables"
4. คลิก "Add Variable"
```

### 2. Environment Variables ที่จำเป็น (REQUIRED)

#### 🔐 JWT_SECRET (สำคัญมาก!)

```
Name: JWT_SECRET
Value: your-super-secret-256-bit-key-here-change-this
```

**ต้องเป็น random string ที่ยาวและซับซ้อน สำหรับการ encrypt JWT tokens**

#### 🌐 CORS_ORIGINS (สำคัญ!)

```
Name: CORS_ORIGINS
Value: https://your-frontend-domain.com,https://app.yourcompany.com
```

**ระบุ domains ที่อนุญาตให้เข้าถึง API (comma-separated)**

### 3. Environment Variables ที่เป็น Optional

#### 🔧 API_VERSION

```
Name: API_VERSION
Value: v1
```

#### 🔑 API_KEY_PREFIX

```
Name: API_KEY_PREFIX
Value: fxb
```

#### 📅 MAX_SYNC_LOG_RETENTION_DAYS

```
Name: MAX_SYNC_LOG_RETENTION_DAYS
Value: 30
```

### 4. Environment Variables ที่ Railway จัดการให้อัตโนมัติ

เหล่านี้จะถูกสร้างโดย Railway โดยอัตโนมัติ:

- `DATABASE_URL` - PostgreSQL connection string
- `RAILWAY_STATIC_URL` - URL ของ app
- `RAILWAY_PUBLIC_DOMAIN` - Public domain
- `PORT` - Port ที่ Railway กำหนดให้

### 5. ตัวอย่างการตั้งค่าที่สมบูรณ์

```bash
# Required Variables
JWT_SECRET=your-super-secret-jwt-key-at-least-256-bits-long
CORS_ORIGINS=https://dashboard.yourcompany.com,https://admin.yourcompany.com

# Optional Variables
API_VERSION=v1
API_KEY_PREFIX=fxb
MAX_SYNC_LOG_RETENTION_DAYS=30

# Auto-provided by Railway
DATABASE_URL=postgresql://... (auto-generated)
PORT=3000 (auto-generated)
RAILWAY_STATIC_URL=... (auto-generated)
```

### 6. การทดสอบหลังจาก Deploy

หลังจากตั้งค่าแล้ว ทดสอบได้ด้วย:

```bash
# Health check
curl https://your-app.railway.app/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-12-23T10:00:00.000Z",
  "version": "1.0.0",
  "database": "connected"
}
```

### 7. Security Best Practices

#### 🔐 JWT_SECRET Generation

```bash
# ใช้ command นี้เพื่อสร้าง JWT_SECRET ที่ปลอดภัย
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# หรือ
openssl rand -hex 32
```

#### 🌐 CORS_ORIGINS

```bash
# Production example
CORS_ORIGINS=https://app.yourcompany.com,https://admin.yourcompany.com

# Development (ใช้สำหรับ test เท่านั้น)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 8. การ Monitor และ Debug

#### View Logs

```bash
# ใน Railway Dashboard
1. ไปที่ "Deployments" tab
2. คลิกที่ deployment ล่าสุด
3. ดู logs ใน "Logs" section
```

#### Environment Check

```bash
# เรียก API เพื่อตรวจสอบ configuration
curl https://your-app.railway.app/health

# ตรวจสอบว่า environment variables ถูกโหลดถูกต้องไหม
```

### 9. Troubleshooting

#### ❌ JWT_SECRET ไม่ได้ตั้งค่า

```
Error: JWT_SECRET environment variable is required in production
Solution: ตั้งค่า JWT_SECRET ใน Railway Dashboard
```

#### ❌ CORS Error

```
Error: CORS policy blocked
Solution: เพิ่ม domain ของคุณใน CORS_ORIGINS
```

#### ❌ Database Connection Error

```
Error: Database connection failed
Solution: ตรวจสอบว่า Railway PostgreSQL addon ถูก enable แล้ว
```

### 10. Next Steps

หลังจากตั้งค่า Environment Variables แล้ว:

1. **Deploy Control Plane**: `railway up`
2. **ทดสอบ API**: ใช้ health check endpoint
3. **สร้าง Tenant แรก**: เรียก POST /api/tenants
4. **Configure Agent**: ใช้ API key ที่ได้รับ
5. **Monitor**: ดู sync logs ใน Railway dashboard

---

**🚀 เสร็จแล้ว! Control Plane พร้อมสำหรับ production บน Railway**
