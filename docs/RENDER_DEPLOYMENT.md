# 🚀 Flexboard Deployment on Render.com

## Overview

Render.com เป็น alternative ที่ดีที่สุดแทน Railway สำหรับ deploy Flexboard Control Plane ฟรี!

## ✅ Benefits of Render.com

- **PostgreSQL ฟรี 1GB** - เพียงพอสำหรับ metadata ของ 40+ companies
- **Always-on web services** - ไม่มี cold start เหมือน serverless
- **Auto-deploy from GitHub** - push code แล้ว deploy อัตโนมัติ
- **Environment variables support** - ตั้งค่า secrets ได้ง่าย
- **Docker support** - ใช้ Dockerfile ที่มีอยู่ได้เลย
- **Health checks** - monitor service availability
- **SSL certificates** - HTTPS ฟรี

## 🚀 Quick Start Deployment

### 1. Prepare Your Repository

```bash
# 1. Push code to GitHub (if not already)
git add .
git commit -m "Prepare for Render deployment"
git push origin main

# 2. Ensure render.yaml is in root directory (already created)
ls render.yaml  # Should exist
```

### 2. Deploy to Render

```bash
# Method 1: Using render.yaml (Recommended)
1. Go to https://render.com/
2. Sign up with GitHub account
3. Click "New" > "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect render.yaml
6. Click "Apply" to deploy

# Method 2: Manual setup
1. Go to https://render.com/
2. Click "New" > "Web Service"
3. Connect GitHub repo: flexboard
4. Configure as shown below
```

### 3. Web Service Configuration

```yaml
Name: flexboard-control-plane
Environment: Node
Region: Oregon (US-West) # or closest to you
Branch: main
Root Directory: apps/control-plane-api

Build Command: pnpm install && pnpm run build
Start Command: pnpm start

Plan: Free ($0/month)
```

### 4. Environment Variables (ใน Render Dashboard)

**Required Variables:**

```bash
NODE_ENV=production
JWT_SECRET=<generate with: openssl rand -hex 32>
CORS_ORIGINS=https://your-frontend-domain.com
API_VERSION=v1
API_KEY_PREFIX=fxb
MAX_SYNC_LOG_RETENTION_DAYS=30
```

**Database URL (auto-provided):**

```bash
DATABASE_URL=postgresql://... # Auto-generated by PostgreSQL addon
```

### 5. Add PostgreSQL Database

```bash
# In Render Dashboard:
1. Click "New" > "PostgreSQL"
2. Name: flexboard-db
3. Database: flexboard_control_plane
4. User: flexboard_user
5. Region: Same as web service
6. Plan: Free

# Render will automatically:
- Create DATABASE_URL environment variable
- Link it to your web service
```

## 🔧 Configuration Files

### Package.json Scripts (already configured)

```json
{
  "scripts": {
    "build": "tsc && prisma generate",
    "start": "node dist/server.js",
    "migrate": "prisma migrate deploy"
  }
}
```

### Prisma Migration on Deploy

```bash
# Add this to build command if needed:
pnpm install && pnpm run build && prisma migrate deploy
```

## 🌐 Alternative Options

### Option A: Render + Supabase (Hybrid)

```bash
# Use Render for API, Supabase for Database
1. Create Supabase project (2GB free)
2. Get PostgreSQL connection string
3. Deploy API to Render with Supabase DATABASE_URL
```

### Option B: Vercel + PlanetScale

```bash
# Convert to Serverless + MySQL
1. Update Prisma schema to MySQL
2. Create PlanetScale database (1GB free)
3. Convert Fastify to Vercel API routes
4. Deploy to Vercel
```

### Option C: Fly.io

```bash
# Docker-based deployment
1. flyctl auth signup
2. flyctl apps create flexboard-control-plane
3. flyctl postgres create flexboard-db
4. flyctl deploy
```

## 📋 Step-by-Step Render Deployment

### Step 1: Sign Up & Connect

```bash
1. Go to https://render.com/
2. Sign up with GitHub
3. Authorize Render to access your repository
```

### Step 2: Create Web Service

```bash
1. Click "Dashboard" > "New" > "Web Service"
2. Select your GitHub repository
3. Name: flexboard-control-plane
4. Environment: Node
5. Build Command: cd apps/control-plane-api && pnpm install && pnpm run build
6. Start Command: cd apps/control-plane-api && pnpm start
```

### Step 3: Environment Variables

```bash
# Click "Environment" tab and add:
NODE_ENV=production
JWT_SECRET=<your-secret-key>
CORS_ORIGINS=https://your-domain.com
API_VERSION=v1
```

### Step 4: Add Database

```bash
1. Click "New" > "PostgreSQL"
2. Name: flexboard-postgres
3. Plan: Free
4. Region: Same as web service
5. Connect to web service
```

### Step 5: Deploy & Test

```bash
# Render will automatically:
1. Clone your repository
2. Run build command
3. Start the service
4. Provide HTTPS URL

# Test deployment:
curl https://your-app.onrender.com/health
```

## 🔍 Monitoring & Debugging

### View Logs

```bash
# In Render Dashboard:
1. Go to your service
2. Click "Logs" tab
3. View real-time logs
```

### Health Checks

```bash
# Render automatically monitors:
- /health endpoint
- Service uptime
- Response times
```

### Database Management

```bash
# Connect to PostgreSQL:
1. Go to database service
2. Copy connection string
3. Use with psql or GUI tools
```

## 💰 Cost Comparison

| Service    | Free Tier        | Database        | Limitations           |
| ---------- | ---------------- | --------------- | --------------------- |
| **Render** | Free web service | PostgreSQL 1GB  | None for our use case |
| Vercel     | Serverless       | External needed | 10s timeout           |
| Railway    | $5/month         | PostgreSQL 1GB  | Trial only            |
| Fly.io     | Free compute     | PostgreSQL 1GB  | Credit card required  |

## 🚀 Why Render is Perfect for Flexboard

```bash
✅ Always-on web services (no cold starts)
✅ Perfect for Fastify APIs
✅ Built-in PostgreSQL
✅ Auto-deploy from GitHub
✅ Free SSL certificates
✅ Environment variables support
✅ Health monitoring
✅ Suitable for 40+ tenant management
```

## 🔄 Migration from Railway

```bash
# If you have Railway deployment already:
1. Export environment variables from Railway
2. Create Render services (follow steps above)
3. Import environment variables to Render
4. Update DNS/domains to point to Render
5. Test functionality
6. Decommission Railway service
```

---

**🎉 Render.com เป็นทางเลือกที่ดีที่สุดสำหรับ deploy Flexboard Control Plane ฟรี!**

ไม่มี limitations ที่จะส่งผลต่อการใช้งาน และเหมาะสำหรับ production workload ของ multi-tenant SaaS platform.
