# Flexboard Environment Configuration Guide

## 🌍 Overview

Flexboard uses environment variables to configure all services and connections. This guide explains how to set up and manage environment configurations for development and production.

## 📁 Environment Files Structure

```
flexboard/
├── .env.development          # Global development configuration
├── apps/
│   ├── control-plane-api/
│   │   └── .env             # Backend API configuration
│   ├── control-plane-ui/
│   │   └── .env.local       # Frontend configuration
│   ├── onprem-agent-api/
│   │   └── .env             # Agent API configuration
│   └── onprem-viewer-ui/
│       └── .env.local       # Viewer UI configuration
└── scripts/
    └── validate-env.js       # Environment validation script
```

## 🚀 Quick Start

### 1. Validate Environment

```bash
npm run env:validate
```

### 2. Start All Services

```bash
npm run dev
```

### 3. Start with Environment

```bash
npm run dev:env
```

## 🔧 Service Configurations

### Control Plane API (Backend)

**File:** `apps/control-plane-api/.env`

```bash
# Service Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Security
JWT_SECRET="your-jwt-secret"
CORS_ORIGINS="http://localhost:3000,http://localhost:3003"

# API Configuration
API_PREFIX=/api
API_VERSION=v1
```

### Control Plane UI (Frontend)

**File:** `apps/control-plane-ui/.env.local`

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_PREFIX=/api

# Application Configuration
NEXT_PUBLIC_APP_NAME="Flexboard Dashboard Builder"
NEXT_PUBLIC_ENVIRONMENT=development

# Feature Flags
NEXT_PUBLIC_ENABLE_DASHBOARD_BUILDER=true
NEXT_PUBLIC_DEBUG_MODE=true
```

### OnPrem Agent API

**File:** `apps/onprem-agent-api/.env`

```bash
# Service Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# Control Plane Connection
CONTROL_PLANE_URL=http://localhost:3000
TENANT_API_KEY=your-tenant-api-key
```

### OnPrem Viewer UI

**File:** `apps/onprem-viewer-ui/.env.local`

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Viewer Configuration
NEXT_PUBLIC_TENANT_ID=your-tenant-id
NEXT_PUBLIC_REFRESH_INTERVAL=30000
```

## 🛠 Environment Configuration Helper

### Environment Configuration Class

The `envConfig` class provides centralized environment configuration:

```typescript
// Frontend (apps/control-plane-ui/src/config/env.ts)
import { envConfig } from "@/config/env";

// Usage
const apiUrl = envConfig.apiUrl;
const isDev = envConfig.isDevelopment;
```

```typescript
// Backend (apps/control-plane-api/src/config/env.ts)
import { envConfig } from "./config/env";

// Usage
const port = envConfig.port;
const dbUrl = envConfig.databaseUrl;
```

## 🔍 Environment Validation

### Automatic Validation

```bash
npm run env:validate
```

### Manual Validation

```javascript
const { validateService } = require("./scripts/validate-env.js");

const isValid = validateService("apps/control-plane-api", {
  required: ["DATABASE_URL", "JWT_SECRET"],
  optional: ["PORT", "HOST"],
});
```

## 🌊 Port Configuration

| Service           | Port | URL                   |
| ----------------- | ---- | --------------------- |
| Control Plane API | 3000 | http://localhost:3000 |
| OnPrem Agent API  | 3001 | http://localhost:3001 |
| OnPrem Viewer UI  | 3002 | http://localhost:3002 |
| Control Plane UI  | 3003 | http://localhost:3003 |

## 🔄 API Proxy Configuration

Frontend applications use API proxy routes to avoid CORS issues:

```typescript
// Frontend API routes automatically proxy to backend
fetch("/api/tenants"); // → http://localhost:3000/api/tenants
```

## 📝 Development Scripts

```bash
# Environment Management
npm run env:validate       # Validate all environment configurations
npm run env:setup         # Copy global config to services

# Development
npm run dev               # Start all services
npm run dev:env          # Start with explicit environment
npm run start:all        # Start services concurrently

# Docker
npm run docker:dev       # Start with Docker (development)
npm run docker:prod      # Start with Docker (production)
```

## 🚨 Security Notes

### Required for Production:

1. Change all default JWT secrets
2. Use strong database passwords
3. Configure proper CORS origins
4. Set NODE_ENV=production
5. Use HTTPS URLs in production

### Environment File Hierarchy:

1. `.env.local` (highest priority, not tracked in git)
2. `.env.development`
3. `.env` (lowest priority)

## 🐛 Troubleshooting

### Common Issues:

**1. API Connection Failed**

```bash
# Check environment configuration
npm run env:validate

# Verify services are running
curl http://localhost:3000/api/health
curl http://localhost:3003/api/tenants
```

**2. Wrong Port Configuration**

```bash
# Check which services are running
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :3003
```

**3. Environment Variables Not Loading**

```bash
# Check if .env files exist
ls -la apps/*/.*env*

# Validate configuration
node scripts/validate-env.js
```

## 📚 Best Practices

1. **Never commit sensitive data** to git
2. **Use .env.example** files for templates
3. **Validate environment** before deployment
4. **Use consistent naming** across services
5. **Document required variables** in README

## 🔗 Related Documentation

- [Flexboard Architecture](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [API Documentation](./docs/api.md)
- [Contributing Guide](./CONTRIBUTING.md)
