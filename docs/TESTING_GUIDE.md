# Flexboard Testing Guide - Admin & Tenant

## 🔧 Admin Testing (Control Plane)

### 1. Create Tenant Account

```bash
# Create new tenant via API
curl -X POST https://flexboard-control-plane.onrender.com/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ACME Corporation",
    "slug": "acme-corp",
    "email": "admin@acme.com"
  }'
```

### 2. Get Tenant API Key

```bash
# Login and get tenant API key
curl -X POST https://flexboard-control-plane.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "generated-password"
  }'
```

### 3. Create Dashboard Configuration

```bash
# Upload dashboard config for tenant
curl -X POST https://flexboard-control-plane.onrender.com/api/dashboards \
  -H "Authorization: Bearer <tenant-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Dashboard",
    "slug": "sales",
    "widgets": [...]
  }'
```

## 🏢 Tenant Testing (On-Premise)

### 1. Setup Local Environment

```bash
# Start on-premise agent (simulating customer environment)
cd apps/onprem-agent-api
npm run dev

# Start viewer dashboard (customer's dashboard)
cd apps/onprem-viewer-ui
npm run dev
```

### 2. Configure Agent

```env
# apps/onprem-agent-api/.env
CONTROL_PLANE_URL=https://flexboard-control-plane.onrender.com
TENANT_API_KEY=<api-key-from-step-2>
DATABASE_URL=<customer-sql-server>
```

### 3. Test Sync Process

```bash
# Agent syncs with Control Plane
GET http://localhost:3001/api/sync

# Dashboard displays data
GET http://localhost:3000
```

## 🎭 Multi-Tenant Testing

### Scenario A: Two Different Companies

1. **ACME Corp** - Manufacturing company
2. **TechStart** - Software company

Each has:

- Different database schemas
- Different dashboard layouts
- Different KPI requirements
- Isolated data access
