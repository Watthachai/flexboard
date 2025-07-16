# 🚀 Flexboard Local Development with Turbo

## ⚡ Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start All Services

```bash
# Start all apps simultaneously
pnpm turbo dev

# Or use the convenience script
./scripts/dev-local.sh
```

## 🎯 Individual Services

### Start Specific Apps

```bash
# Control Plane API only
pnpm turbo dev --filter=control-plane-api

# On-premise components only
pnpm turbo dev --filter=onprem-*

# All UI components
pnpm turbo dev --filter=*-ui
```

## 🌐 Service URLs

| Service           | URL                   | Purpose             |
| ----------------- | --------------------- | ------------------- |
| Control Plane API | http://localhost:3000 | Admin/SaaS API      |
| On-Premise Agent  | http://localhost:3001 | Customer data agent |
| On-Premise Viewer | http://localhost:3002 | Customer dashboard  |
| Control Plane UI  | http://localhost:3003 | Admin dashboard     |

## 🧪 Testing Scenarios

### Scenario 1: Admin Testing

```bash
# Test admin functions
./scripts/test-admin.sh

# Manual testing
curl http://localhost:3000/health
```

### Scenario 2: Customer Simulation

```bash
# Start customer environment
pnpm turbo dev --filter=onprem-*

# Test customer endpoints
curl http://localhost:3001/api/sync
curl http://localhost:3002  # Dashboard UI
```

### Scenario 3: Full End-to-End

```bash
# Start everything
pnpm turbo dev

# Test data flow:
# 1. Admin creates tenant (port 3000)
# 2. Customer agent syncs (port 3001)
# 3. Customer views dashboard (port 3002)
```

## 🔧 Development Commands

```bash
# Build all apps
pnpm turbo build

# Lint all code
pnpm turbo lint

# Type checking
pnpm turbo check-types

# Clean build artifacts
pnpm turbo clean
```

## 🎭 Multi-Tenant Testing

### Create Multiple Tenants

1. **Company A** - Manufacturing dashboard
2. **Company B** - E-commerce dashboard
3. **Company C** - Finance dashboard

Each tenant gets:

- Unique API key
- Isolated data access
- Custom dashboard configuration

### Test Data Isolation

```bash
# Tenant A agent
TENANT_API_KEY=key_a pnpm turbo dev --filter=onprem-agent-api

# Tenant B agent (different terminal)
TENANT_API_KEY=key_b pnpm turbo dev --filter=onprem-agent-api
```

## 🚀 Ready for Cloud Deployment

Once local testing is complete:

1. Control Plane → Deploy to Render.com ✅
2. On-premise components → Ship to customers
3. Configuration → Manage via Control Plane UI
