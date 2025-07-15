# Flexboard - Hybrid Analytics Platform

🚀 **A multi-tenant SaaS analytics platform with hybrid cloud-on-premise architecture**

Flexboard enables enterprises to build beautiful, real-time dashboards while keeping sensitive data on-premise. The platform combines cloud convenience with data sovereignty through a unique hybrid architecture.

## 🏗️ Architecture Overview

```
┌────────────## 📚 Documentation

- **[Environment Configuration](docs/ENVIRONMENT.md)** - Complete environment setup guide
- **[Phase 2 Implementation Guide](PHASE_2_IMPLEMENTATION.md)** - Complete technical implementation
- **[Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md)** - Cloud deployment instructions
- **[Railway Environment Setup](RAILWAY_ENV_SETUP.md)** - Environment variables configuration
- **[Comprehensive Guide](COMPREHENSIVE_GUIDE.md)** - Full platform documentation────────────────────────┐
│           CLOUD (Railway)               │
│  ┌─────────────────────────────────────┐│
│  │      Control Plane API              ││ ← Multi-tenant SaaS management
│  │  • Dashboard configuration          ││
│  │  • Agent sync orchestration         ││
│  │  • Customer onboarding              ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
                     │
                HTTP/HTTPS Sync
                 (Outbound Only)
                     │
┌─────────────────────────────────────────┐
│         ON-PREMISE (Customer)           │
│  ┌─────────────────────────────────────┐│
│  │       Analytics Agent               ││ ← Executes SQL, serves data
│  │  • Polls for config updates        ││
│  │  • Executes customer SQL           ││
│  │  • Caches for offline resilience   ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │      Dashboard Viewer               ││ ← Beautiful React dashboards
│  │  • Real-time visualizations        ││
│  │  • Responsive design               ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## 🎯 Key Features

### ✅ **Phase 1 (MVP) - Complete**

- 📊 Multi-widget dashboards (KPI, Line Charts, Bar Charts, Tables)
- 🔄 Real-time data fetching from SQL Server
- 📱 Responsive design with Tailwind CSS
- 🐳 Docker containerization
- 🚀 Production-ready deployment

### ✅ **Phase 2 (Control Plane) - Complete**

- ☁️ Multi-tenant SaaS Control Plane on Railway
- 🔄 Real-time configuration sync with on-premise agents
- 📊 PostgreSQL metadata management
- 🔐 Secure API key authentication
- 📈 Comprehensive monitoring & logging
- 🚀 Zero-downtime configuration updates

### 🔮 **Phase 3 (Enterprise) - Roadmap**

- 👥 Role-based access control & user management
- 🎨 White-label branding for customers
- 🔗 Enterprise SSO integration
- ⚡ Real-time WebSocket updates
- 📱 Mobile-responsive administration

## 🚀 Quick Start

### Option 1: Environment-Managed Development

```bash
# 1. Clone repository
git clone https://github.com/yourusername/flexboard
cd flexboard

# 2. Install dependencies
pnpm install

# 3. Validate environment configuration
npm run env:validate

# 4. Start all services with proper environment
npm run dev

# 5. Access services:
# - Control Plane UI: http://localhost:3003
# - Control Plane API: http://localhost:3000
# - OnPrem Agent API: http://localhost:3001
# - OnPrem Viewer UI: http://localhost:3002
```

### Option 2: Manual Service Startup

```bash
# 1. Setup environment files (see docs/ENVIRONMENT.md)
npm run env:setup

# 2. Start services individually
# Terminal 1: Control Plane API
cd apps/control-plane-api && npm run dev

# Terminal 2: Control Plane UI
cd apps/control-plane-ui && npm run dev

# Terminal 3: OnPrem Agent API
cd apps/onprem-agent-api && npm run dev

# Terminal 4: OnPrem Viewer UI
cd apps/onprem-viewer-ui && npm run dev
```

### For SaaS Providers (Deploy Control Plane)

```bash
# Deploy to Railway (Recommended)
# - See RAILWAY_DEPLOYMENT_GUIDE.md for details
# - Uses PostgreSQL from Render.com (free tier)

# Environment variables required:
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: Use `openssl rand -hex 32`
# - CORS_ORIGINS: Frontend domains (comma-separated)
```

### For Enterprise Customers (On-Premise Setup)

```bash
# 1. Get API credentials from SaaS provider
export TENANT_API_KEY="fxb_your_api_key"
export CONTROL_PLANE_URL="https://your-control-plane.railway.app"

# 2. Configure local database
export DATABASE_URL="sqlserver://server;database=YourDB;user=sa;password=pass;trustServerCertificate=true"

# 3. Start on-premise services
npm run dev  # or use Docker: npm run docker:dev
```

## 📦 Project Structure

```
flexboard/
├── apps/
│   ├── control-plane-api/     # ☁️ Multi-tenant SaaS Control Plane
│   │   ├── src/server.ts      # Fastify API with Prisma + PostgreSQL
│   │   ├── prisma/schema.prisma # Database schema for metadata
│   │   └── railway.toml       # Railway deployment config
│   │
│   ├── onprem-agent-api/      # 🏢 On-premise Analytics Agent
│   │   ├── src/server.ts      # Fastify API with SQL Server integration
│   │   ├── src/config.json    # Local widget configurations (fallback)
│   │   └── Dockerfile         # Container deployment
│   │
│   ├── onprem-viewer-ui/      # 📊 Dashboard Frontend
│   │   ├── src/app/page.tsx   # Multi-widget dashboard
│   │   └── Dockerfile         # Container deployment
│   │
│   └── control-plane-ui/      # 🎛️ SaaS Management Interface (Future)
│
├── packages/
│   ├── ui/                    # 🎨 Shared React components
│   ├── eslint-config/         # 📏 Code quality standards
│   └── typescript-config/     # 🔧 TypeScript configurations
│
├── docs/
│   ├── PHASE_2_IMPLEMENTATION.md  # 📚 Detailed implementation guide
│   ├── RAILWAY_DEPLOYMENT_GUIDE.md # 🚀 Cloud deployment instructions
│   └── COMPREHENSIVE_GUIDE.md     # 📖 Complete platform documentation
│
└── test-integration.js       # 🧪 End-to-end integration tests
```

## 🔄 How It Works

### Multi-Tenant Configuration Sync

1. **SaaS Provider**: Creates tenant and dashboard configurations via Control Plane
2. **Control Plane**: Stores metadata in PostgreSQL with versioning
3. **Agent Polling**: On-premise agent polls every 5 minutes for updates
4. **Configuration Sync**: Agent receives new configurations and caches locally
5. **Query Execution**: Agent executes SQL against customer database
6. **Dashboard Display**: Frontend displays real-time data with beautiful charts

### Sample Workflow

```bash
# 1. SaaS Provider creates tenant
curl -X POST https://control-plane.railway.app/api/tenants \\
  -d '{"name":"Acme Corp","slug":"acme"}'
# Returns: API key for customer

# 2. Customer configures agent
export FLEXBOARD_API_KEY="fxb_abc123..."
pnpm dev

# 3. Agent automatically syncs configuration
# 4. Dashboard immediately shows new widgets
# 5. Real-time data updates every 30 seconds
```

## 🛠️ Development

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- SQL Server or PostgreSQL database
- Railway account (for Control Plane deployment)

### Local Development Setup

```bash
# Install all dependencies
pnpm install

# Start Control Plane locally (optional)
cd apps/control-plane-api
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
export DATABASE_URL="postgresql://postgres:password@localhost:5432/flexboard"
pnpm dev # Runs on port 3000

# Start Agent API
cd apps/onprem-agent-api
export DATABASE_URL="sqlserver://..." # Your SQL Server
pnpm dev # Runs on port 3001

# Start Dashboard UI
cd apps/onprem-viewer-ui
pnpm dev # Runs on port 3000
```

### Running Integration Tests

```bash
# Test full Control Plane ↔ Agent workflow
node test-integration.js

# Manual testing endpoints
curl http://localhost:3001/api/health        # Agent health
curl http://localhost:3000/health           # Control Plane health
curl -X POST http://localhost:3001/api/sync # Trigger manual sync
```

## 🚀 Production Deployment

### Control Plane (Cloud)

#### Option A: Render.com (Recommended)

```bash
# One-time setup
1. Go to https://render.com/
2. Connect GitHub repository
3. Create Web Service from repo
4. Add PostgreSQL database (free 1GB)
5. Set environment variables

# Environment variables:
JWT_SECRET=<openssl rand -hex 32>
CORS_ORIGINS=https://your-domains.com
DATABASE_URL=<auto-provided by Render>
```

#### Option B: Vercel + Supabase

```bash
# Database setup
1. Create Supabase project (2GB free)
2. Get PostgreSQL connection string

# API deployment
vercel --prod
# Set DATABASE_URL in Vercel dashboard
```

#### Option C: Fly.io

```bash
flyctl auth signup
flyctl apps create flexboard-control-plane
flyctl postgres create flexboard-db
flyctl deploy
```

### On-Premise (Customer Environment)

```bash
# Docker deployment
docker build -t flexboard-agent apps/onprem-agent-api
docker run -d \\
  -e CONTROL_PLANE_URL=https://your-control-plane.railway.app \\
  -e FLEXBOARD_API_KEY=fxb_... \\
  -e DATABASE_URL=sqlserver://... \\
  flexboard-agent

# Docker Compose (recommended)
cd apps/onprem-agent-api
docker-compose up -d
```

## 📊 Sample Dashboards

### Sales Analytics Dashboard

```json
{
  "monthly-revenue": {
    "query": "SELECT MONTH(OrderDate) as month, SUM(TotalDue) as revenue FROM Sales.SalesOrderHeader WHERE YEAR(OrderDate) = 2024 GROUP BY MONTH(OrderDate)",
    "type": "line"
  },
  "top-customers": {
    "query": "SELECT TOP 10 c.CompanyName, SUM(soh.TotalDue) as total FROM Sales.Customer c JOIN Sales.SalesOrderHeader soh ON c.CustomerID = soh.CustomerID GROUP BY c.CompanyName ORDER BY total DESC",
    "type": "table"
  }
}
```

### E-commerce KPIs

```json
{
  "total-orders": {
    "query": "SELECT COUNT(*) as value FROM Orders WHERE MONTH(OrderDate) = MONTH(GETDATE())",
    "type": "kpi"
  },
  "conversion-rate": {
    "query": "SELECT CAST(COUNT(DISTINCT CustomerID) * 100.0 / COUNT(*) as DECIMAL(5,2)) as value FROM WebsiteVisits WHERE MONTH(VisitDate) = MONTH(GETDATE())",
    "type": "kpi"
  }
}
```

## 🔐 Security

### Data Sovereignty

- ✅ Customer data never leaves on-premise environment
- ✅ Only metadata (dashboard configs) stored in cloud
- ✅ Agent polls Control Plane (outbound-only connections)
- ✅ No inbound connections required

### Authentication & Authorization

- 🔑 Unique API keys per tenant
- 🔒 HTTPS-only communication
- 🛡️ JWT token support (ready for implementation)
- 📊 Audit logging for all operations

## 📚 Documentation

- **[Phase 2 Implementation Guide](PHASE_2_IMPLEMENTATION.md)** - Complete technical implementation
- **[Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md)** - Cloud deployment instructions
- **[Comprehensive Guide](COMPREHENSIVE_GUIDE.md)** - Full platform documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- **Q1 2025**: Phase 3 implementation with enterprise features
- **Q2 2025**: Mobile administration interface
- **Q3 2025**: Advanced analytics and ML insights
- **Q4 2025**: Multi-cloud deployment options

---

**🚀 Built with love by วัฒชัย เตชะลือ - Ready for enterprise deployment!**
