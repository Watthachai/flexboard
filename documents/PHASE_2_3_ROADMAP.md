# 🗓️ Flexboard - Phase 2 & 3 Development Roadmap

**แผนการพัฒนา**: Phase 2 (Control Plane) และ Phase 3 (Full Platform)  
**เวอร์ชัน**: 1.0  
**วันที่**: 11 กรกฎาคม 2025

---

## 📋 สารบัญ

1. [Phase 2: Control Plane Foundation](#phase-2-control-plane-foundation)
2. [Phase 3: Full-Fledged Platform](#phase-3-full-fledged-platform)
3. [Database Schema Design](#database-schema-design)
4. [API Specifications](#api-specifications)
5. [UI/UX Mockups](#uiux-mockups)
6. [Implementation Timeline](#implementation-timeline)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Strategy](#deployment-strategy)

---

## 🚀 Phase 2: Control Plane Foundation

### 🎯 เป้าหมายและ Scope

#### วัตถุประสงค์หลัก

- สร้าง **Central Control Plane** บนคลาวด์
- เปิดใช้งาน **การ Sync อัตโนมัติ** ระหว่าง CCP และ Agent
- รองรับ **Multi-tenant** สำหรับลูกค้าหลายราย
- ระบบ **Version Control** สำหรับ Dashboard configurations

#### Success Criteria

- ✅ Admin สามารถจัดการ Dashboard ของลูกค้าหลายรายจากที่เดียว
- ✅ Agent สามารถ sync การตั้งค่าใหม่อัตโนมัติทุก 5 นาที
- ✅ ระบบ Version Control ทำงานได้ (Draft/Published)
- ✅ Multi-tenant support พร้อม API key authentication

### 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROL PLANE (Cloud)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  Control Plane UI   │    │    Control Plane API        │ │
│  │                     │    │                             │ │
│  │ • Tenant Management │    │ • Agent Sync API            │ │
│  │ • Dashboard Builder │    │ • Metadata Management       │ │
│  │ • Version Control   │    │ • Authentication            │ │
│  │ • Preview System    │    │ • Tenant API                │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│            │                               │                │
│            └───────────────┬───────────────┘                │
│                            │                                │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │              PostgreSQL Database                     │  │
│  │                                                      │  │
│  │ • tenants              • metadata_versions           │  │
│  │ • dashboards           • sync_logs                   │  │
│  │ • widgets              • api_keys                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/JSON (Outbound Only)
                                │ POST /api/agent/sync
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA PLANE (On-Premise)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               Sync Worker (New)                         │ │
│  │                                                         │ │
│  │ • Background cron job (every 5 minutes)                │ │
│  │ • Fetch latest metadata from CCP                       │ │
│  │ • Update local config.json                             │ │
│  │ • Cache invalidation                                    │ │
│  │ • Error handling & retry logic                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                │                            │
│  ┌─────────────────────────────▼─────────────────────────┐  │
│  │            Agent API + Viewer UI                     │  │
│  │                 (ไม่เปลี่ยนแปลง)                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 📊 Database Schema Design

#### Core Tables

```sql
-- Tenants (ลูกค้า)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    license_type VARCHAR(50) DEFAULT 'basic',
    max_dashboards INTEGER DEFAULT 5,
    max_widgets_per_dashboard INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Dashboards
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- Widgets
CREATE TABLE widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    widget_type VARCHAR(50) NOT NULL, -- 'bar', 'line', 'pie', 'kpi'
    config JSONB NOT NULL,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 6,
    height INTEGER DEFAULT 4,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Metadata Versions (สำหรับ Version Control)
CREATE TABLE metadata_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    metadata JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,
    UNIQUE(tenant_id, version)
);

-- Sync Logs (สำหรับ Debugging)
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    agent_version VARCHAR(50),
    sync_status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
    metadata_version INTEGER,
    error_message TEXT,
    sync_duration_ms INTEGER,
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_tenants_api_key ON tenants(api_key);
CREATE INDEX idx_dashboards_tenant_id ON dashboards(tenant_id);
CREATE INDEX idx_widgets_dashboard_id ON widgets(dashboard_id);
CREATE INDEX idx_metadata_versions_tenant_status ON metadata_versions(tenant_id, status);
CREATE INDEX idx_sync_logs_tenant_date ON sync_logs(tenant_id, synced_at);
```

#### Widget Configuration Schema

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "SQL query to execute"
    },
    "type": {
      "type": "string",
      "enum": ["bar", "line", "pie", "kpi", "table"]
    },
    "title": {
      "type": "string",
      "description": "Widget display title"
    },
    "description": {
      "type": "string",
      "description": "Widget description"
    },
    "refreshInterval": {
      "type": "integer",
      "default": 300000,
      "description": "Refresh interval in milliseconds"
    },
    "chartConfig": {
      "type": "object",
      "properties": {
        "xAxisKey": { "type": "string" },
        "yAxisKey": { "type": "string" },
        "colors": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  },
  "required": ["query", "type"]
}
```

### 🔌 API Specifications

#### Control Plane API Endpoints

**Base URL**: `https://api.flexboard.app`

##### Authentication

```typescript
// API Key Authentication
headers: {
  'Authorization': 'Bearer <API_KEY>',
  'Content-Type': 'application/json'
}
```

##### Agent Sync API

**POST `/api/agent/sync`**

```typescript
// Request
interface SyncRequest {
  tenant_id: string;
  current_version?: number;
  agent_version: string;
}

// Response
interface SyncResponse {
  success: boolean;
  has_updates: boolean;
  latest_version: number;
  metadata?: {
    version: number;
    dashboards: Dashboard[];
    widgets: Widget[];
    config: Record<string, WidgetConfig>;
  };
  error?: string;
}

// Example
POST /api/agent/sync
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_version": 5,
  "agent_version": "1.0.0"
}

Response:
{
  "success": true,
  "has_updates": true,
  "latest_version": 6,
  "metadata": {
    "version": 6,
    "config": {
      "sales-by-month": {
        "query": "SELECT ...",
        "type": "bar"
      }
    }
  }
}
```

##### Tenant Management API

**GET `/api/tenants`**

```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
  license_type: string;
  is_active: boolean;
  created_at: string;
  dashboard_count: number;
  last_sync: string;
}

Response: Tenant[]
```

**POST `/api/tenants`**

```typescript
interface CreateTenantRequest {
  name: string;
  slug: string;
  license_type?: string;
}

interface CreateTenantResponse {
  tenant: Tenant;
  api_key: string; // Only returned on creation
}
```

##### Dashboard Management API

**GET `/api/tenants/:tenantId/dashboards`**

```typescript
interface Dashboard {
  id: string;
  name: string;
  slug: string;
  description: string;
  widget_count: number;
  created_at: string;
  updated_at: string;
}
```

**POST `/api/tenants/:tenantId/dashboards`**

```typescript
interface CreateDashboardRequest {
  name: string;
  slug: string;
  description?: string;
}
```

**PUT `/api/dashboards/:dashboardId/widgets`**

```typescript
interface UpdateWidgetsRequest {
  widgets: Widget[];
}
```

##### Version Control API

**GET `/api/tenants/:tenantId/versions`**

```typescript
interface MetadataVersion {
  id: string;
  version: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  published_at?: string;
  created_by: string;
}
```

**POST `/api/tenants/:tenantId/versions/:versionId/publish`**

```typescript
// Publish a draft version
Response: {
  success: boolean;
  published_version: number;
}
```

### 🎨 Control Plane UI Design

#### Main Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Flexboard Control Panel                    [User Profile ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 Overview                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ 24 Tenants  │ │ 156 Dashbrd│ │ 892 Widgets │ │ 98% Up  │ │
│ │ Active      │ │ Published   │ │ Total       │ │ time    │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ 🏢 Recent Tenant Activity                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CompanyA   │ Sales Dashboard   │ Published │ 2 hrs ago  │ │
│ │ CompanyB   │ KPI Overview      │ Draft     │ 5 hrs ago  │ │
│ │ CompanyC   │ Financial Report  │ Published │ 1 day ago  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🔄 Sync Status                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CompanyA   │ ✅ Synced  │ Version 12 │ 3 mins ago       │ │
│ │ CompanyB   │ ⚠️ Pending │ Version 8  │ 15 mins ago      │ │
│ │ CompanyC   │ ❌ Error   │ Version 5  │ 2 hours ago      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Tenant Management

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back] Tenant Management                    [+ New Tenant] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Search: [________________] Filter: [All ▼] Status: [All ▼]  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Name      │ Dashboards │ Status  │ Last Sync │ Actions  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ CompanyA  │ 3         │ Active  │ 3m ago    │ [Edit][•]│ │
│ │ CompanyB  │ 1         │ Active  │ 15m ago   │ [Edit][•]│ │
│ │ CompanyC  │ 5         │ Error   │ 2h ago    │ [Edit][•]│ │
│ │ CompanyD  │ 2         │ Paused  │ 1d ago    │ [Edit][•]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Showing 4 of 24 tenants                          [1][2][3] │
└─────────────────────────────────────────────────────────────┘
```

#### Dashboard Builder (Phase 2 - JSON Editor)

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back] Edit Dashboard: Sales Overview (CompanyA)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Version: [Draft v13 ▼] Status: Draft    [Preview][Publish] │
│                                                             │
│ ┌─────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Widget List         │ │ Configuration JSON              │ │
│ │                     │ │                                 │ │
│ │ ☐ sales-by-month    │ │ {                               │ │
│ │ ☐ top-products      │ │   "sales-by-month": {           │ │
│ │ ☐ kpi-summary       │ │     "query": "SELECT ...",      │ │
│ │                     │ │     "type": "bar",              │ │
│ │ [+ Add Widget]      │ │     "title": "Monthly Sales"    │ │
│ │                     │ │   },                            │ │
│ │                     │ │   "top-products": {             │ │
│ │                     │ │     "query": "SELECT ...",      │ │
│ │                     │ │     "type": "bar"               │ │
│ │                     │ │   }                             │ │
│ │                     │ │ }                               │ │
│ └─────────────────────┘ └─────────────────────────────────┘ │
│                                                             │
│ [Save Draft]                                    [Cancel]    │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Agent Sync Worker Implementation

#### Background Sync Service

```typescript
// apps/onprem-agent-api/src/sync-worker.ts
import cron from "node-cron";
import fs from "fs/promises";
import path from "path";

interface SyncConfig {
  controlPlaneUrl: string;
  apiKey: string;
  tenantId: string;
  syncInterval: string; // cron format
}

class SyncWorker {
  private config: SyncConfig;
  private currentVersion: number = 0;
  private isRunning: boolean = false;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  start() {
    console.log("🔄 Starting sync worker...");

    // Load current version from file
    this.loadCurrentVersion();

    // Schedule periodic sync
    cron.schedule(this.config.syncInterval, async () => {
      if (!this.isRunning) {
        await this.performSync();
      }
    });

    // Perform initial sync
    setTimeout(() => this.performSync(), 5000);
  }

  private async performSync() {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(
        `🔄 Syncing with Control Plane... (current version: ${this.currentVersion})`
      );

      const response = await fetch(
        `${this.config.controlPlaneUrl}/api/agent/sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: this.config.tenantId,
            current_version: this.currentVersion,
            agent_version: process.env.AGENT_VERSION || "1.0.0",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Sync failed: ${response.status} ${response.statusText}`
        );
      }

      const syncResult = await response.json();

      if (syncResult.has_updates) {
        console.log(
          `📥 Received updates: v${this.currentVersion} → v${syncResult.latest_version}`
        );

        // Update config.json
        await this.updateConfig(syncResult.metadata.config);

        // Update version
        this.currentVersion = syncResult.latest_version;
        await this.saveCurrentVersion();

        // Clear cache (trigger re-processing)
        await this.clearCache();

        console.log("✅ Sync completed successfully");
      } else {
        console.log("ℹ️ No updates available");
      }

      // Log sync success
      await this.logSync("success", Date.now() - startTime);
    } catch (error) {
      console.error("❌ Sync failed:", error);
      await this.logSync("error", Date.now() - startTime, error.message);
    } finally {
      this.isRunning = false;
    }
  }

  private async updateConfig(newConfig: Record<string, any>) {
    const configPath = path.join(__dirname, "config.json");
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
    console.log("📝 Config updated");
  }

  private async clearCache() {
    // Implement cache clearing logic
    // This will trigger re-processing of widgets
    console.log("🗑️ Cache cleared");
  }

  private async loadCurrentVersion() {
    try {
      const versionPath = path.join(__dirname, ".sync-version");
      const versionFile = await fs.readFile(versionPath, "utf-8");
      this.currentVersion = parseInt(versionFile.trim()) || 0;
    } catch (error) {
      this.currentVersion = 0;
    }
  }

  private async saveCurrentVersion() {
    const versionPath = path.join(__dirname, ".sync-version");
    await fs.writeFile(versionPath, this.currentVersion.toString());
  }

  private async logSync(status: string, duration: number, error?: string) {
    // Log to local file or send to Control Plane
    const logEntry = {
      timestamp: new Date().toISOString(),
      status,
      version: this.currentVersion,
      duration,
      error,
    };
    console.log("📊 Sync log:", logEntry);
  }
}

// Usage in server.ts
const syncWorker = new SyncWorker({
  controlPlaneUrl: process.env.CONTROL_PLANE_URL || "https://api.flexboard.app",
  apiKey: process.env.AGENT_API_KEY || "",
  tenantId: process.env.TENANT_ID || "",
  syncInterval: "*/5 * * * *", // Every 5 minutes
});

syncWorker.start();
```

---

## 🚀 Phase 3: Full-Fledged Platform

### 🎯 เป้าหมายและ Scope

#### วัตถุประสงค์หลัก

- สร้าง **Visual Dashboard Builder** แบบ Drag-and-Drop
- รองรับ **Advanced Widget Types** และ **Calculated Fields**
- เพิ่ม **Multiple Data Source Connectors**
- **Enterprise Features** (SSO, RBAC, White-label)

#### Success Criteria

- ✅ Admin สามารถสร้าง Dashboard โดยไม่ต้องเขียน JSON
- ✅ รองรับ widget types หลากหลาย (Line, Pie, Table, Gauge)
- ✅ รองรับ calculated fields และ filters
- ✅ เชื่อมต่อกับ data sources หลายประเภท
- ✅ Preview system ที่สมบูรณ์
- ✅ Enterprise-ready features

### 🎨 Visual Dashboard Builder

#### Drag-and-Drop Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Back] Visual Builder: Sales Dashboard (CompanyA)         [Preview][Save]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────┐ │ ┌─────────────────────────────────────────────────────┐  │
│ │ Widget      │ │ │                Canvas Area                          │  │
│ │ Library     │ │ │                                                     │  │
│ │             │ │ │ ┌─────────────┐  ┌─────────────┐                    │  │
│ │ 📊 Bar Chart │ │ │ │ Sales Trend │  │ Top Product │                    │  │
│ │ 📈 Line Chart│ │ │ │ (Bar Chart) │  │ (H-Bar)     │                    │  │
│ │ 🥧 Pie Chart │ │ │ │             │  │             │                    │  │
│ │ 📋 Table    │ │ │ │             │  │             │                    │  │
│ │ 📊 KPI Card │ │ │ │             │  │             │                    │  │
│ │ 🌡️ Gauge    │ │ │ └─────────────┘  └─────────────┘                    │  │
│ │ 🗺️ Map      │ │ │                                                     │  │
│ │             │ │ │ ┌─────────────┐  ┌─────────────┐                    │  │
│ │ [+ Custom]  │ │ │ │ Revenue KPI │  │ Growth Rate │                    │  │
│ │             │ │ │ │ (KPI Cards) │  │ (Gauge)     │                    │  │
│ └─────────────┘ │ │ │             │  │             │                    │  │
│                 │ │ │             │  │             │                    │  │
│ ┌─────────────┐ │ │ └─────────────┘  └─────────────┘                    │  │
│ │ Properties  │ │ │                                                     │  │
│ │             │ │ │                                                     │  │
│ │ Widget Type:│ │ └─────────────────────────────────────────────────────┘  │
│ │ [Bar Chart▼]│ │                                                          │
│ │             │ │ ┌─────────────────────────────────────────────────────┐  │
│ │ Data Source:│ │ │ Widget Configuration Panel                          │  │
│ │ [SQL Server▼│ │ │                                                     │  │
│ │             │ │ │ 📊 Chart Type: Bar Chart                            │  │
│ │ X-Axis:     │ │ │ 📅 Time Period: Last 12 months                      │  │
│ │ [month    ▼]│ │ │ 📈 Metrics: Revenue, Profit                         │  │
│ │             │ │ │ 🎨 Colors: [🔴][🔵][🟢] [Reset]                      │  │
│ │ Y-Axis:     │ │ │ 📏 Size: Width [━━━━] Height [━━━━]                  │  │
│ │ [revenue  ▼]│ │ │                                                     │  │
│ │             │ │ │ SQL Query Preview:                                  │  │
│ │ [Apply]     │ │ │ SELECT FORMAT(date, 'yyyy-MM') as month,            │  │
│ └─────────────┘ │ │        SUM(revenue) as total_revenue                │  │
│                 │ │ FROM sales_data                                     │  │
│                 │ │ WHERE date >= DATEADD(month, -12, GETDATE())       │  │
│                 │ │ GROUP BY FORMAT(date, 'yyyy-MM')                    │  │
│                 │ │                                                     │  │
│                 │ └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 🔧 Advanced Widget Types

#### Widget Configuration System

```typescript
interface AdvancedWidgetConfig {
  id: string;
  type: "bar" | "line" | "pie" | "table" | "kpi" | "gauge" | "map" | "scatter";
  title: string;
  description?: string;

  // Data Configuration
  dataSource: {
    type: "sql" | "api" | "file";
    connection: string;
    query?: string;
    endpoint?: string;
    file?: string;
  };

  // Visual Configuration
  visual: {
    colors?: string[];
    theme?: "light" | "dark";
    showLegend?: boolean;
    showGrid?: boolean;
    animation?: boolean;
  };

  // Chart-specific Configuration
  chartConfig?: {
    xAxis?: AxisConfig;
    yAxis?: AxisConfig;
    series?: SeriesConfig[];
  };

  // Interactive Features
  interactions?: {
    clickable?: boolean;
    drilldown?: DrilldownConfig;
    filters?: FilterConfig[];
  };

  // Performance
  caching?: {
    enabled: boolean;
    ttl: number; // seconds
  };

  // Position and Size
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface FilterConfig {
  type: "date" | "select" | "multiselect" | "range";
  field: string;
  label: string;
  options?: string[];
  default?: any;
}

interface DrilldownConfig {
  enabled: boolean;
  target: "modal" | "navigate" | "expand";
  query: string;
}
```

#### Example: Advanced Line Chart

```typescript
const lineChartConfig: AdvancedWidgetConfig = {
  id: "revenue-trend",
  type: "line",
  title: "Revenue Trend Analysis",
  description: "Monthly revenue with forecast",

  dataSource: {
    type: "sql",
    connection: "main",
    query: `
      SELECT 
        FORMAT(order_date, 'yyyy-MM') as month,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count,
        AVG(total_amount) as avg_order_value
      FROM orders 
      WHERE order_date >= DATEADD(month, -18, GETDATE())
      GROUP BY FORMAT(order_date, 'yyyy-MM')
      ORDER BY month
    `,
  },

  visual: {
    colors: ["#3b82f6", "#10b981", "#f59e0b"],
    theme: "dark",
    showLegend: true,
    showGrid: true,
    animation: true,
  },

  chartConfig: {
    xAxis: {
      field: "month",
      type: "category",
      format: "MMM yyyy",
    },
    yAxis: [
      {
        field: "revenue",
        type: "linear",
        position: "left",
        format: "currency",
      },
      {
        field: "order_count",
        type: "linear",
        position: "right",
        format: "number",
      },
    ],
    series: [
      {
        field: "revenue",
        name: "Revenue",
        type: "line",
        yAxisIndex: 0,
        smooth: true,
      },
      {
        field: "order_count",
        name: "Orders",
        type: "line",
        yAxisIndex: 1,
        dashArray: "5,5",
      },
    ],
  },

  interactions: {
    clickable: true,
    drilldown: {
      enabled: true,
      target: "modal",
      query: `
        SELECT * FROM orders 
        WHERE FORMAT(order_date, 'yyyy-MM') = '{month}'
        ORDER BY order_date DESC
      `,
    },
    filters: [
      {
        type: "date",
        field: "date_range",
        label: "Date Range",
        default: "last_12_months",
      },
      {
        type: "select",
        field: "region",
        label: "Region",
        options: ["All", "North", "South", "East", "West"],
      },
    ],
  },

  caching: {
    enabled: true,
    ttl: 300, // 5 minutes
  },

  layout: {
    x: 0,
    y: 0,
    width: 12,
    height: 6,
  },
};
```

### 🔗 Multiple Data Source Connectors

#### Supported Data Sources

```typescript
interface DataSourceConfig {
  id: string;
  name: string;
  type:
    | "sqlserver"
    | "mysql"
    | "postgresql"
    | "mongodb"
    | "rest_api"
    | "csv"
    | "excel";
  connection: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    url?: string;
    apiKey?: string;
    headers?: Record<string, string>;
  };
  options?: {
    ssl?: boolean;
    timeout?: number;
    poolSize?: number;
  };
}

// SQL Server
const sqlServerConfig: DataSourceConfig = {
  id: "main-db",
  name: "Main SQL Server",
  type: "sqlserver",
  connection: {
    host: "localhost",
    port: 1433,
    database: "ProductionDB",
    username: "dbuser",
    password: "encrypted_password",
  },
  options: {
    ssl: true,
    timeout: 30000,
    poolSize: 10,
  },
};

// REST API
const apiConfig: DataSourceConfig = {
  id: "external-api",
  name: "External Analytics API",
  type: "rest_api",
  connection: {
    url: "https://api.analytics.com/v1/data",
    apiKey: "api_key_here",
    headers: {
      "Content-Type": "application/json",
    },
  },
  options: {
    timeout: 10000,
  },
};

// MongoDB
const mongoConfig: DataSourceConfig = {
  id: "mongo-analytics",
  name: "Analytics MongoDB",
  type: "mongodb",
  connection: {
    url: "mongodb://localhost:27017/analytics",
  },
};
```

#### Data Source Manager

```typescript
class DataSourceManager {
  private dataSources: Map<string, DataSourceConfig> = new Map();

  async query(
    dataSourceId: string,
    query: string,
    params?: any[]
  ): Promise<any[]> {
    const config = this.dataSources.get(dataSourceId);
    if (!config) {
      throw new Error(`Data source ${dataSourceId} not found`);
    }

    switch (config.type) {
      case "sqlserver":
        return this.querySqlServer(config, query, params);
      case "mysql":
        return this.queryMySQL(config, query, params);
      case "postgresql":
        return this.queryPostgreSQL(config, query, params);
      case "mongodb":
        return this.queryMongoDB(config, query, params);
      case "rest_api":
        return this.queryRestAPI(config, query, params);
      default:
        throw new Error(`Unsupported data source type: ${config.type}`);
    }
  }

  private async querySqlServer(
    config: DataSourceConfig,
    query: string,
    params?: any[]
  ): Promise<any[]> {
    // Implementation for SQL Server
    const client = new sql.ConnectionPool(config.connection);
    await client.connect();

    try {
      const result = await client.request().query(query);
      return result.recordset;
    } finally {
      await client.close();
    }
  }

  private async queryRestAPI(
    config: DataSourceConfig,
    endpoint: string,
    params?: any
  ): Promise<any[]> {
    const url = new URL(endpoint, config.connection.url);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.connection.apiKey}`,
        ...config.connection.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }
}
```

### 🔐 Enterprise Features

#### Single Sign-On (SSO) Integration

```typescript
// SAML Configuration
interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  signatureAlgorithm: string;
}

// OIDC Configuration
interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

// Auth Provider
class AuthProvider {
  async authenticateWithSAML(samlResponse: string): Promise<User> {
    // SAML authentication logic
  }

  async authenticateWithOIDC(code: string): Promise<User> {
    // OIDC authentication logic
  }

  async authenticateWithAPIKey(apiKey: string): Promise<User> {
    // API key authentication
  }
}
```

#### Role-Based Access Control (RBAC)

```typescript
interface Permission {
  resource: string; // 'dashboards', 'widgets', 'tenants'
  action: string; // 'create', 'read', 'update', 'delete'
  scope?: string; // 'own', 'tenant', 'all'
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface User {
  id: string;
  email: string;
  name: string;
  tenantId?: string;
  roles: Role[];
}

// Example Roles
const roles: Role[] = [
  {
    id: "super-admin",
    name: "Super Administrator",
    permissions: [{ resource: "*", action: "*", scope: "all" }],
  },
  {
    id: "tenant-admin",
    name: "Tenant Administrator",
    permissions: [
      { resource: "dashboards", action: "*", scope: "tenant" },
      { resource: "widgets", action: "*", scope: "tenant" },
      { resource: "users", action: "read", scope: "tenant" },
    ],
  },
  {
    id: "dashboard-editor",
    name: "Dashboard Editor",
    permissions: [
      { resource: "dashboards", action: "read", scope: "tenant" },
      { resource: "dashboards", action: "update", scope: "own" },
      { resource: "widgets", action: "*", scope: "own" },
    ],
  },
  {
    id: "viewer",
    name: "Viewer",
    permissions: [
      { resource: "dashboards", action: "read", scope: "tenant" },
      { resource: "widgets", action: "read", scope: "tenant" },
    ],
  },
];
```

#### White-label Customization

```typescript
interface BrandingConfig {
  tenantId: string;
  logo: {
    url: string;
    width: number;
    height: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    headingFont?: string;
  };
  customCSS?: string;
  customJS?: string;
}

// Example Branding
const companyABranding: BrandingConfig = {
  tenantId: "company-a",
  logo: {
    url: "https://company-a.com/logo.png",
    width: 200,
    height: 60,
  },
  colors: {
    primary: "#1a365d",
    secondary: "#2d3748",
    accent: "#38b2ac",
    background: "#f7fafc",
    text: "#2d3748",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    headingFont: "Poppins, sans-serif",
  },
  customCSS: `
    .dashboard-header {
      background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
    }
  `,
};
```

---

## 📅 Implementation Timeline

### Phase 2: Control Plane Foundation (6 สัปดาห์)

#### Week 1-2: Infrastructure & Database

- ✅ **Database Schema**: สร้างและ migrate tables ทั้งหมด
- ✅ **Control Plane API**: Basic CRUD operations
- ✅ **Authentication**: API key based auth
- ✅ **Tenant Management**: Basic tenant CRUD

#### Week 3-4: Sync Mechanism & Builder

- ✅ **Agent Sync API**: Endpoint สำหรับ agent sync
- ✅ **Sync Worker**: Background service ใน agent
- ✅ **JSON Editor**: Basic dashboard builder
- ✅ **Version Control**: Draft/published workflow

#### Week 5-6: Testing & Polish

- ✅ **End-to-End Testing**: Complete sync workflow
- ✅ **Error Handling**: Robust error handling
- ✅ **Documentation**: API docs และ user guides
- ✅ **Performance Testing**: Load testing

#### Deliverables Phase 2

- 📦 **Control Plane**: Deployed และ production-ready
- 📦 **Updated Agent**: พร้อม sync functionality
- 📦 **JSON Builder**: Working dashboard editor
- 📦 **Multi-tenant**: รองรับลูกค้าหลายราย

### Phase 3: Full Platform (12 สัปดาห์)

#### Week 1-3: Visual Builder Foundation

- 🔄 **Drag-and-Drop Engine**: React DnD implementation
- 🔄 **Widget Library**: Component library
- 🔄 **Canvas System**: Grid-based layout
- 🔄 **Property Panel**: Widget configuration UI

#### Week 4-6: Advanced Widgets

- 🔄 **Chart Types**: Line, Pie, Table, Gauge
- 🔄 **Calculated Fields**: Formula engine
- 🔄 **Filters**: Interactive filtering
- 🔄 **Real-time Updates**: WebSocket support

#### Week 7-9: Data Sources & Enterprise

- 🔄 **Data Connectors**: MySQL, PostgreSQL, APIs
- 🔄 **SSO Integration**: SAML และ OIDC
- 🔄 **RBAC System**: Role-based permissions
- 🔄 **White-label**: Custom branding

#### Week 10-12: Polish & Launch

- 🔄 **Preview System**: Real-time preview
- 🔄 **Performance Optimization**: Caching, CDN
- 🔄 **Testing**: Comprehensive testing
- 🔄 **Documentation**: Complete user guides

#### Deliverables Phase 3

- 📦 **Visual Builder**: Complete drag-and-drop interface
- 📦 **Advanced Widgets**: 8+ widget types
- 📦 **Multi-source**: 5+ data source connectors
- 📦 **Enterprise Features**: SSO, RBAC, White-label
- 📦 **Production Platform**: Scalable, secure, performant

---

## 🧪 Testing Strategy

### Testing Pyramid

#### Unit Tests (70%)

```typescript
// Widget Configuration Validation
describe("WidgetConfig", () => {
  test("should validate required fields", () => {
    const config = { type: "bar" }; // missing query
    expect(validateWidgetConfig(config)).toHaveProperty("errors");
  });

  test("should accept valid configuration", () => {
    const config = {
      query: "SELECT * FROM table",
      type: "bar",
    };
    expect(validateWidgetConfig(config)).toHaveProperty("valid", true);
  });
});

// Data Source Manager
describe("DataSourceManager", () => {
  test("should execute SQL query", async () => {
    const manager = new DataSourceManager();
    const result = await manager.query("test-db", "SELECT 1 as test");
    expect(result).toEqual([{ test: 1 }]);
  });
});
```

#### Integration Tests (20%)

```typescript
// API Integration Tests
describe("Agent Sync API", () => {
  test("should sync configuration successfully", async () => {
    const response = await request(app)
      .post("/api/agent/sync")
      .send({
        tenant_id: "test-tenant",
        current_version: 1,
      })
      .expect(200);

    expect(response.body).toHaveProperty("has_updates");
  });
});

// Database Integration
describe("Metadata Repository", () => {
  test("should create and retrieve metadata version", async () => {
    const metadata = { widgets: [] };
    const version = await metadataRepo.createVersion("tenant-1", metadata);

    const retrieved = await metadataRepo.getVersion(version.id);
    expect(retrieved.metadata).toEqual(metadata);
  });
});
```

#### End-to-End Tests (10%)

```typescript
// E2E Testing with Playwright
describe("Dashboard Builder E2E", () => {
  test("should create dashboard and sync to agent", async () => {
    // Login to Control Plane
    await page.goto("/login");
    await page.fill("[data-testid=email]", "admin@test.com");
    await page.fill("[data-testid=password]", "password");
    await page.click("[data-testid=login-button]");

    // Create new dashboard
    await page.click("[data-testid=new-dashboard]");
    await page.fill("[data-testid=dashboard-name]", "Test Dashboard");

    // Add widget
    await page.click("[data-testid=add-widget]");
    await page.selectOption("[data-testid=widget-type]", "bar");
    await page.fill("[data-testid=widget-query]", "SELECT 1 as value");
    await page.click("[data-testid=save-widget]");

    // Publish dashboard
    await page.click("[data-testid=publish]");

    // Verify sync occurred
    await expect(page.locator("[data-testid=sync-status]")).toContainText(
      "Synced"
    );
  });
});
```

### Performance Testing

```typescript
// Load Testing with Artillery
module.exports = {
  config: {
    target: "http://localhost:3001",
    phases: [
      { duration: 60, arrivalRate: 10 }, // Warm up
      { duration: 120, arrivalRate: 50 }, // Load test
      { duration: 60, arrivalRate: 100 }, // Stress test
    ],
  },
  scenarios: [
    {
      name: "Widget Data API",
      weight: 70,
      flow: [
        {
          get: {
            url: "/api/data/sales-by-month",
          },
        },
      ],
    },
    {
      name: "Agent Sync API",
      weight: 30,
      flow: [
        {
          post: {
            url: "/api/agent/sync",
            json: {
              tenant_id: "test-tenant",
              current_version: 1,
            },
          },
        },
      ],
    },
  ],
};
```

---

## 🚀 Deployment Strategy

### Cloud Infrastructure (Control Plane)

#### Architecture

```yaml
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: control-plane-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: control-plane-api
  template:
    metadata:
      labels:
        app: control-plane-api
    spec:
      containers:
        - name: api
          image: flexboard/control-plane-api:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: jwt-secret
                  key: secret
---
apiVersion: v1
kind: Service
metadata:
  name: control-plane-api-service
spec:
  selector:
    app: control-plane-api
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

#### Database Migration Strategy

```typescript
// Automated Database Migrations
class MigrationManager {
  async runMigrations() {
    const migrations = [
      "001_initial_schema.sql",
      "002_add_version_control.sql",
      "003_add_sync_logs.sql",
    ];

    for (const migration of migrations) {
      await this.executeMigration(migration);
    }
  }

  async executeMigration(filename: string) {
    const sql = await fs.readFile(`migrations/${filename}`, "utf-8");
    await this.database.query(sql);

    // Log migration
    await this.database.query(
      "INSERT INTO schema_migrations (filename, executed_at) VALUES (?, ?)",
      [filename, new Date()]
    );
  }
}
```

### On-Premise Deployment

#### Customer Deployment Package

```bash
# deployment-package/
├── docker-compose.yml
├── .env.template
├── config/
│   ├── nginx.conf
│   └── ssl/
├── scripts/
│   ├── install.sh
│   ├── upgrade.sh
│   ├── backup.sh
│   └── restore.sh
└── docs/
    ├── installation-guide.md
    └── troubleshooting.md
```

#### Installation Script

```bash
#!/bin/bash
# scripts/install.sh

set -e

echo "🚀 Flexboard Installation Script"
echo "================================"

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    echo "✅ Prerequisites check passed"
}

# Setup environment
setup_environment() {
    echo "Setting up environment..."

    if [ ! -f .env ]; then
        cp .env.template .env
        echo "⚠️  Please edit .env file with your configuration before continuing"
        echo "   Required: DATABASE_URL, TENANT_ID, AGENT_API_KEY"
        read -p "Press Enter when ready..."
    fi

    # Source environment
    source .env

    # Validate required variables
    if [ -z "$DATABASE_URL" ] || [ -z "$TENANT_ID" ] || [ -z "$AGENT_API_KEY" ]; then
        echo "❌ Missing required environment variables"
        exit 1
    fi

    echo "✅ Environment configured"
}

# Download and start services
install_services() {
    echo "Installing Flexboard services..."

    # Pull latest images
    docker-compose pull

    # Start services
    docker-compose up -d

    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 30

    # Health check
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Flexboard is running successfully!"
        echo "📊 Dashboard: http://localhost:3000"
        echo "🔌 API: http://localhost:3001"
    else
        echo "❌ Installation failed. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Main installation flow
main() {
    check_prerequisites
    setup_environment
    install_services

    echo ""
    echo "🎉 Installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Access your dashboard at http://localhost:3000"
    echo "2. Check the logs: docker-compose logs -f"
    echo "3. To stop: docker-compose down"
    echo "4. To upgrade: ./scripts/upgrade.sh"
}

main "$@"
```

### Monitoring และ Observability

#### Application Metrics

```typescript
// Metrics Collection
import { register, Counter, Histogram, Gauge } from "prom-client";

const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
});

const syncOperationsTotal = new Counter({
  name: "sync_operations_total",
  help: "Total number of sync operations",
  labelNames: ["tenant_id", "status"],
});

const activeTenants = new Gauge({
  name: "active_tenants",
  help: "Number of active tenants",
});

// Middleware for metrics
fastify.addHook("onRequest", async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook("onResponse", async (request, reply) => {
  const duration = (Date.now() - request.startTime) / 1000;

  httpRequestsTotal.inc({
    method: request.method,
    route: request.routerPath,
    status_code: reply.statusCode,
  });

  httpRequestDuration.observe(
    {
      method: request.method,
      route: request.routerPath,
    },
    duration
  );
});

// Metrics endpoint
fastify.get("/metrics", async (request, reply) => {
  reply.type(register.contentType);
  return register.metrics();
});
```

#### Health Checks

```typescript
// Health Check System
interface HealthCheck {
  name: string;
  status: "healthy" | "unhealthy" | "unknown";
  message?: string;
  lastCheck: Date;
}

class HealthCheckManager {
  private checks: Map<string, HealthCheck> = new Map();

  registerCheck(name: string, checkFn: () => Promise<boolean>) {
    setInterval(async () => {
      try {
        const isHealthy = await checkFn();
        this.updateCheck(name, isHealthy ? "healthy" : "unhealthy");
      } catch (error) {
        this.updateCheck(name, "unhealthy", error.message);
      }
    }, 30000); // Check every 30 seconds
  }

  private updateCheck(
    name: string,
    status: HealthCheck["status"],
    message?: string
  ) {
    this.checks.set(name, {
      name,
      status,
      message,
      lastCheck: new Date(),
    });
  }

  getHealthStatus(): { status: string; checks: HealthCheck[] } {
    const checks = Array.from(this.checks.values());
    const hasUnhealthy = checks.some((check) => check.status === "unhealthy");

    return {
      status: hasUnhealthy ? "unhealthy" : "healthy",
      checks,
    };
  }
}

// Register health checks
const healthManager = new HealthCheckManager();

healthManager.registerCheck("database", async () => {
  const result = await prisma.$queryRaw`SELECT 1`;
  return result.length > 0;
});

healthManager.registerCheck("control-plane", async () => {
  const response = await fetch(`${process.env.CONTROL_PLANE_URL}/health`);
  return response.ok;
});

// Health endpoint
fastify.get("/health", async (request, reply) => {
  const health = healthManager.getHealthStatus();
  reply.status(health.status === "healthy" ? 200 : 503);
  return health;
});
```

---

## 📋 Summary และ Next Steps

### Phase 2 & 3 Overview

#### Phase 2 Achievements (6 สัปดาห์)

- ✅ **Central Control Plane**: Cloud-based management system
- ✅ **Automatic Sync**: Agent sync ทุก 5 นาที
- ✅ **Multi-tenant Support**: รองรับลูกค้าหลายราย
- ✅ **Version Control**: Draft/Published workflow
- ✅ **JSON Builder**: Web-based configuration editor

#### Phase 3 Achievements (12 สัปดาห์)

- ✅ **Visual Builder**: Drag-and-drop interface
- ✅ **Advanced Widgets**: 8+ widget types
- ✅ **Multiple Data Sources**: SQL, NoSQL, APIs
- ✅ **Enterprise Features**: SSO, RBAC, White-label
- ✅ **Production Platform**: Scalable, secure, monitored

### การเตรียมความพร้อม

#### Immediate Actions (ถัดไป 2 สัปดาห์)

1. ✅ **MVP Validation**: ทดสอบ MVP กับลูกค้าจริง
2. ✅ **Phase 2 Planning**: Detailed technical specifications
3. ✅ **Infrastructure Setup**: เตรียม cloud infrastructure
4. ✅ **Team Preparation**: ทักษะและเครื่องมือที่จำเป็น

#### Phase 2 Kickoff (เดือนถัดไป)

1. 🔄 **Database Design**: Implement schema และ migrations
2. 🔄 **Control Plane API**: Core API development
3. 🔄 **Sync Mechanism**: Agent upgrade development
4. 🔄 **Basic Builder**: JSON editor implementation

#### Long-term Vision (6-12 เดือน)

1. 🔄 **Market Launch**: Public release ของ platform
2. 🔄 **Customer Onboarding**: 50+ enterprise customers
3. 🔄 **Platform Expansion**: Additional features และ integrations
4. 🔄 **Global Scale**: Multi-region deployment

### Success Metrics

#### Technical KPIs

- **Sync Reliability**: 99.9% successful sync operations
- **API Performance**: <200ms response time
- **Platform Uptime**: 99.9% availability
- **Customer Deployment**: <30 minutes installation time

#### Business KPIs

- **Customer Growth**: 100+ active tenants
- **Dashboard Usage**: 10,000+ active dashboards
- **Feature Adoption**: 80% using advanced features
- **Customer Satisfaction**: 4.5+ rating

---

**🗓️ Phase 2 & 3 Roadmap เวอร์ชัน 1.0**  
**📅 อัปเดตล่าสุด**: 11 กรกฎาคม 2025

_เอกสารนี้เป็นแผนการพัฒนาที่มีการปรับปรุงตามความคืบหน้าของโครงการ_
