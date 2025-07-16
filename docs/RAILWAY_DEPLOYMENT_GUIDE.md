# Railway Deployment Configuration

## Setup Control Plane on Railway

### 1. Project Structure for Railway

```
apps/control-plane-api/
├── package.json
├── Dockerfile        # Railway auto-detects
├── railway.json      # Railway configuration
└── src/
    └── server.ts
```

```
┌──────────────────────────────────┐
│        CONTROL PLANE             │
│         (Railway)                │
│                                  │
│  ┌─────────────────────────────┐ │
│  │  Next.js + Fastify          │ │
│  │  (Auto-deploy from Git)     │ │
│  └─────────────────────────────┘ │
│               │                  │
│  ┌────────────▼──────────────┐   │
│  │    PostgreSQL Database    │   │  ← Railway Managed
│  │                           │   │
│  │ • tenants                 │   │
│  │ • dashboards              │   │
│  │ • metadata_versions       │   │
│  │ • sync_logs               │   │
│  └───────────────────────────┘   │
└──────────────────────────────────┘
              │ HTTPS
              │ (Sync API)
              ▼
┌──────────────────────────────────┐
│         DATA PLANE               │
│       (Customer Site)            │
│                                  │
│  ┌─────────────────────────────┐ │
│  │    Docker Container         │ │
│  │  • Agent API (Node.js)      │ │
│  │  • Viewer UI (Next.js)      │ │
│  └─────────────────────────────┘ │
│               │                  │
│  ┌────────────▼──────────────┐   │
│  │     SQL Server Database   │   │  ← Customer's Existing DB
│  │                           │   │
│  │ • Sales Data              │   │
│  │ • Customer Data           │   │
│  │ • Business Data           │   │
│  └───────────────────────────┘   │
└──────────────────────────────────┘
```

### 2. Environment Variables in Railway

Set these in Railway Dashboard:

```bash
# Database (Auto-provided by Railway)
DATABASE_URL=postgresql://user:pass@host:port/db

# JWT for authentication
JWT_SECRET=your-super-secret-key

# CORS origins
CORS_ORIGINS=https://your-control-plane-ui.railway.app,http://localhost:3000

# Environment
NODE_ENV=production

# Agent sync configuration
AGENT_SYNC_TIMEOUT=30000
MAX_TENANTS=100
```

### 3. Railway.json Configuration

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4. Database Migration Strategy

```bash
# In package.json scripts
{
  "scripts": {
    "build": "tsc && prisma generate",
    "start": "node dist/server.js",
    "migrate": "prisma migrate deploy",
    "postinstall": "prisma generate"
  }
}
```

### 5. Railway Deployment Workflow

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and link project
railway login
railway link

# 3. Add PostgreSQL service
railway add postgresql

# 4. Deploy
git push origin main  # Auto-deploys to Railway
```

## Prisma Schema for Railway PostgreSQL

```prisma
// Control Plane Database Schema
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  apiKey          String   @unique @map("api_key")
  licenseType     String   @default("basic") @map("license_type")
  maxDashboards   Int      @default(5) @map("max_dashboards")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  dashboards      Dashboard[]
  metadataVersions MetadataVersion[]
  syncLogs        SyncLog[]

  @@map("tenants")
}

model Dashboard {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  name        String
  slug        String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  widgets     Widget[]

  @@unique([tenantId, slug])
  @@map("dashboards")
}

model Widget {
  id          String   @id @default(cuid())
  dashboardId String   @map("dashboard_id")
  name        String
  widgetType  String   @map("widget_type")
  config      Json
  positionX   Int      @default(0) @map("position_x")
  positionY   Int      @default(0) @map("position_y")
  width       Int      @default(6)
  height      Int      @default(4)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  dashboard   Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)

  @@map("widgets")
}

model MetadataVersion {
  id          String    @id @default(cuid())
  tenantId    String    @map("tenant_id")
  version     Int
  metadata    Json
  status      String    @default("draft") // draft, published, archived
  createdBy   String?   @map("created_by")
  createdAt   DateTime  @default(now()) @map("created_at")
  publishedAt DateTime? @map("published_at")

  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, version])
  @@map("metadata_versions")
}

model SyncLog {
  id              String   @id @default(cuid())
  tenantId        String   @map("tenant_id")
  agentVersion    String?  @map("agent_version")
  syncStatus      String   @map("sync_status") // success, error, partial
  metadataVersion Int?     @map("metadata_version")
  errorMessage    String?  @map("error_message")
  syncDurationMs  Int?     @map("sync_duration_ms")
  syncedAt        DateTime @default(now()) @map("synced_at")

  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("sync_logs")
}
```

## Control Plane API Configuration

```typescript
// apps/control-plane-api/src/server.ts
import Fastify from "fastify";
import { PrismaClient } from "./generated/prisma-client";

const fastify = Fastify({
  logger: process.env.NODE_ENV === "production" ? true : { level: "info" },
});

const prisma = new PrismaClient();

// CORS for Railway deployment
fastify.register(import("@fastify/cors"), {
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
});

// Health check for Railway
fastify.get("/health", async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    reply.status(503);
    return { status: "unhealthy", error: error.message };
  }
});

// Agent Sync API
fastify.post("/api/agent/sync", async (request, reply) => {
  // Implementation here
});

const start = async () => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await fastify.listen({ port: PORT, host: "0.0.0.0" });

    fastify.log.info(`🚀 Control Plane API running on Railway`);
    fastify.log.info(`📊 Health check: /health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

## Benefits of This Architecture

### Railway + PostgreSQL Advantages:

✅ **Zero DevOps**: No server management
✅ **Auto-scaling**: Handles traffic spikes
✅ **Built-in monitoring**: Logs และ metrics
✅ **Easy rollbacks**: Git-based deployments
✅ **Cost-effective**: Pay only for usage

### SQL Server (Customer Side) Advantages:

✅ **Enterprise compliance**: ความปลอดภัยสูง
✅ **No data movement**: ข้อมูลไม่ออกจากองค์กร  
✅ **Existing infrastructure**: ใช้ DB ที่มีอยู่
✅ **Performance**: Local network access

## Migration Strategy

1. **Phase 1**: Railway PostgreSQL สำหรับ Control Plane
2. **Phase 2**: SQL Server integration testing กับลูกค้าแรก
3. **Phase 3**: Scale out to 40+ companies

คิดว่าแผนนี้เป็นอย่างไรครับ? เหมาะกับความต้องการและ timeline ไหม?
