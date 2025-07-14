# Flexboard Phase 2: Control Plane Implementation Guide

## 🎯 Overview

Phase 2 transforms Flexboard from a standalone analytics tool into a **multi-tenant SaaS platform** with centralized dashboard management. This implementation provides real-time configuration sync between the cloud Control Plane and on-premise agents.

## 🏗️ Architecture

### Hybrid Cloud-On Premise Design

```
┌─────────────────────────────────────────┐
│           CLOUD (Railway)               │
│  ┌─────────────────────────────────────┐│
│  │      Control Plane API              ││
│  │  • Multi-tenant management          ││
│  │  • Dashboard configuration          ││
│  │  • Agent sync orchestration         ││
│  │  • Metadata versioning              ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │       PostgreSQL Database           ││
│  │  • Tenant metadata                  ││
│  │  • Dashboard configurations         ││
│  │  • Sync logs & monitoring           ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
                     │
                HTTP/HTTPS
                 (Outbound)
                     │
┌─────────────────────────────────────────┐
│         ON-PREMISE (Customer)           │
│  ┌─────────────────────────────────────┐│
│  │       On-Premise Agent              ││
│  │  • Polls Control Plane             ││
│  │  • Syncs configurations            ││
│  │  • Executes SQL queries            ││
│  │  • Serves dashboard data           ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │      Customer Database              ││
│  │  • SQL Server / PostgreSQL         ││
│  │  • Customer business data          ││
│  │  • Direct query execution          ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │       Dashboard Viewer              ││
│  │  • React frontend                  ││
│  │  • Real-time data visualization    ││
│  │  • Responsive design               ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Deploy Control Plane to Railway

```bash
# Navigate to Control Plane API
cd apps/control-plane-api

# Install dependencies
pnpm install

# Set up environment variables in Railway Dashboard:
# - DATABASE_URL (auto-provided by Railway PostgreSQL)
# - JWT_SECRET=your-super-secret-key
# - CORS_ORIGINS=https://your-frontend-domains.com

# Deploy to Railway
railway login
railway up
```

### 2. Set up PostgreSQL Database

The Control Plane automatically creates the required database schema on first startup using Prisma migrations.

**Tables Created:**

- `tenants` - Customer tenant information
- `dashboards` - Dashboard configurations per tenant
- `widgets` - Widget definitions and layout
- `metadata_versions` - Configuration versioning
- `sync_logs` - Agent sync monitoring
- `users` - Control Plane access management

### 3. Create Your First Tenant

```bash
# Create a tenant via API
curl -X POST https://your-control-plane.railway.app/api/tenants \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "license_type": "enterprise"
  }'

# Response includes API key for agent
{
  "tenant": {
    "id": "clq123...",
    "name": "Acme Corporation",
    "slug": "acme-corp"
  },
  "api_key": "fxb_YOUR_API_KEY_HERE..."
}
```

### 4. Configure On-Premise Agent

```bash
# Navigate to agent directory
cd apps/onprem-agent-api

# Create environment file
cat > .env << EOF
# Control Plane Configuration
CONTROL_PLANE_URL=https://your-control-plane.railway.app
FLEXBOARD_API_KEY=fxb_YOUR_API_KEY_HERE...
SYNC_INTERVAL=300000

# Database Configuration
DATABASE_URL="sqlserver://server;database=AdventureWorks;user=sa;password=yourpass;trustServerCertificate=true"

# CORS for viewer
CORS_ORIGIN=http://localhost:3000
EOF

# Install and start
pnpm install
pnpm dev
```

### 5. Start Dashboard Viewer

```bash
cd apps/onprem-viewer-ui
pnpm install
pnpm dev
```

## 🔄 How Agent Sync Works

### Sync Process Flow

1. **Polling**: Agent makes HTTP POST to `/api/agent/sync` every 5 minutes
2. **Version Check**: Control Plane compares agent's `current_version` with latest published version
3. **Update Delivery**: If newer version exists, Control Plane sends complete configuration
4. **Local Caching**: Agent stores config locally for offline resilience
5. **Query Execution**: Dashboard requests use synced configuration

### Sample Sync Request/Response

```json
// Agent → Control Plane
POST /api/agent/sync
{
  "current_version": 5,
  "agent_version": "1.0.0"
}

// Control Plane → Agent
{
  "success": true,
  "has_updates": true,
  "latest_version": 7,
  "metadata": {
    "version": 7,
    "config": {
      "sales-dashboard": {
        "query": "SELECT * FROM sales WHERE date >= '2024-01-01'",
        "type": "line"
      }
    }
  }
}
```

## 📊 Dashboard Management

### Creating Dashboards via Control Plane

```bash
# 1. Create dashboard
curl -X POST https://your-control-plane.railway.app/api/tenants/clq123/dashboards \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Sales Analytics",
    "slug": "sales-analytics",
    "description": "Monthly sales performance tracking"
  }'

# 2. Add widgets
curl -X POST https://your-control-plane.railway.app/api/dashboards/dash123/widgets \\
  -d '{
    "name": "Monthly Revenue",
    "type": "line",
    "config": {
      "query": "SELECT MONTH(date) as month, SUM(amount) as revenue FROM sales GROUP BY MONTH(date)",
      "chart_config": {
        "x_axis": "month",
        "y_axis": "revenue",
        "color": "#2563eb"
      }
    }
  }'

# 3. Publish version
curl -X POST https://your-control-plane.railway.app/api/tenants/clq123/versions/1/publish
```

### Configuration Format

```json
{
  "dashboards": [
    {
      "id": "sales-dashboard",
      "name": "Sales Analytics",
      "widgets": [
        {
          "id": "monthly-revenue",
          "name": "Monthly Revenue",
          "type": "line",
          "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
          "config": {
            "query": "SELECT MONTH(OrderDate) as month, SUM(TotalDue) as revenue FROM Sales.SalesOrderHeader WHERE YEAR(OrderDate) = 2024 GROUP BY MONTH(OrderDate)",
            "chart_config": {
              "dataKey": "revenue",
              "nameKey": "month",
              "color": "#2563eb"
            }
          }
        }
      ]
    }
  ]
}
```

## 🔐 Security & Multi-Tenancy

### Tenant Isolation

- Each tenant has unique API key
- Database-level tenant separation
- Configuration scoped by tenant ID
- Sync logs isolated per tenant

### Security Features

- HTTPS-only communication
- JWT token authentication (ready for implementation)
- API key rotation support
- Audit logging for all operations
- CORS protection

### Data Flow Security

```
┌─────────────┐    HTTPS     ┌─────────────┐
│   Agent     │────────────→ │Control Plane│
│(On-Premise) │    Poll      │  (Railway)  │
└─────────────┘    Only      └─────────────┘
       │                            │
       │                            │
    Executes                   Stores Only
  SQL Queries                 Metadata
       │                            │
       ▼                            ▼
┌─────────────┐              ┌─────────────┐
│ Customer DB │              │PostgreSQL DB│
│(Private)    │              │(Metadata)   │
└─────────────┘              └─────────────┘
```

## 📈 Monitoring & Observability

### Health Checks

```bash
# Control Plane health
curl https://your-control-plane.railway.app/health

# Agent health
curl http://localhost:3001/api/health
```

### Sync Monitoring

```bash
# View sync status across all tenants
curl https://your-control-plane.railway.app/api/sync/status

# Trigger manual sync
curl -X POST http://localhost:3001/api/sync
```

### Log Examples

```json
// Control Plane Logs
{
  "level": "info",
  "msg": "Sync request from tenant: acme-corp, current_version: 5",
  "tenant_id": "clq123",
  "timestamp": "2024-12-23T10:00:00Z"
}

// Agent Logs
{
  "level": "info",
  "msg": "📦 Received metadata update: v5 → v7",
  "config_version": 7,
  "timestamp": "2024-12-23T10:00:01Z"
}
```

## 🛠️ Development Workflow

### 1. Local Development Setup

```bash
# Start Control Plane with local PostgreSQL
cd apps/control-plane-api
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
export DATABASE_URL="postgresql://postgres:password@localhost:5432/flexboard"
pnpm dev

# Start Agent with AdventureWorks
cd apps/onprem-agent-api
pnpm dev

# Start Viewer
cd apps/onprem-viewer-ui
pnpm dev
```

### 2. Testing Agent Sync

```bash
# Create test tenant
curl -X POST http://localhost:3000/api/tenants \\
  -d '{"name":"Test Corp","slug":"test"}'

# Update agent config with API key
export FLEXBOARD_API_KEY="fxb_returned_key"

# Trigger manual sync
curl -X POST http://localhost:3001/api/sync
```

### 3. Configuration Updates

```bash
# Update dashboard config in Control Plane
curl -X PUT http://localhost:3000/api/tenants/test/dashboards/dash1 \\
  -d '{"config": {"new_widget": {...}}}'

# Publish new version
curl -X POST http://localhost:3000/api/tenants/test/versions/2/publish

# Check agent sync
curl http://localhost:3001/api/health
```

## 🚀 Production Deployment

### Railway Deployment Checklist

- [ ] PostgreSQL add-on enabled
- [ ] Environment variables configured
- [ ] Custom domains set up
- [ ] SSL certificates active
- [ ] Health checks enabled

### Environment Variables

```bash
# Control Plane (Railway)
DATABASE_URL=postgresql://...  # Auto-provided
JWT_SECRET=your-production-secret
CORS_ORIGINS=https://app1.com,https://app2.com
NODE_ENV=production

# Agent (Customer premise)
CONTROL_PLANE_URL=https://your-control-plane.railway.app
FLEXBOARD_API_KEY=fxb_production_key
DATABASE_URL=sqlserver://...
SYNC_INTERVAL=300000
```

### Scaling Considerations

- **Control Plane**: Railway auto-scaling handles load
- **PostgreSQL**: Railway provides managed PostgreSQL with backups
- **Agents**: Independent scaling per customer
- **Rate Limiting**: Implement if needed for high-frequency sync

## 🔄 Migration from Phase 1

### Automatic Migration Path

1. **Deploy Control Plane**: Railway deployment with PostgreSQL
2. **Create Tenant**: Generate tenant and API key for existing customer
3. **Update Agent**: Add Control Plane sync to existing agent
4. **Verify Sync**: Ensure configuration sync works
5. **Switch Over**: Agent automatically uses synced config

### Zero-Downtime Migration

```bash
# 1. Deploy Control Plane
railway up

# 2. Create tenant with existing config
curl -X POST .../api/tenants -d '{
  "name": "Existing Customer",
  "slug": "existing",
  "initial_config": {...existing config.json...}
}'

# 3. Update agent environment
export CONTROL_PLANE_URL=...
export FLEXBOARD_API_KEY=...

# 4. Restart agent - it falls back to local config if sync fails
pnpm restart

# 5. Verify sync working
curl http://localhost:3001/api/health
```

## 🎯 Next Steps: Phase 3

Phase 2 sets the foundation for advanced features:

- **Multi-Dashboard Support**: Multiple dashboards per tenant
- **User Management**: Role-based access control
- **Advanced Widgets**: Custom visualizations
- **Real-time Updates**: WebSocket-based live data
- **White-label UI**: Customer-branded dashboards
- **Enterprise SSO**: SAML/OAuth integration

---

**🚀 Phase 2 is now ready for production deployment!**

The hybrid architecture provides the perfect balance of cloud convenience and on-premise security, enabling Flexboard to serve enterprise customers at scale while maintaining data sovereignty.
