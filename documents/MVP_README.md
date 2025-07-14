# 🚀 Flexboard MVP - Phase 1

## Overview

This is the **Phase 1 (MVP)** implementation of Flexboard - a Hybrid Analytics Platform. The MVP demonstrates the core concept of On-Premise Data Processing with sample data visualization.

## Phase 1 Architecture

```
┌─────────────────────┐    HTTP/JSON    ┌───────────────────────────┐
│   Viewer UI         │◄──────────────► │   Agent API               │
│   (Next.js)         │                 │   (Fastify + Prisma)      │
│   Port: 3000        │                 │   Port: 3001              │
└─────────────────────┘                 └───────────────────────────┘
                                                     │
                                                     ▼ SQL Query
                                        ┌───────────────────────────┐
                                        │   SQL Server Database     │
                                        │   (Customer's Data)       │
                                        └───────────────────────────┘
```

## What's Included in MVP

### ✅ Completed Features

- **On-Premise Agent API**: Fastify-based API that reads widget configurations from `config.json`
- **Viewer UI**: Next.js dashboard with multiple chart types (Bar charts, KPI cards)
- **Sample Widgets**: 3 pre-configured widgets demonstrating different data visualization types
- **Docker Package**: Complete containerized solution ready for customer deployment
- **Development Environment**: Turbo-powered monorepo with hot reload

### 📊 Sample Widgets

1. **Sales by Month**: Bar chart showing monthly sales trends
2. **Top Products**: Horizontal bar chart of best-selling products
3. **Sales Summary**: KPI cards with key metrics (Total Orders, Revenue, Average Order Value)

### 🔧 Technology Stack

- **Monorepo**: Turborepo
- **Backend**: Node.js + Fastify + Prisma
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Charts**: Recharts
- **Database**: SQL Server (via Prisma)
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose (for deployment)
- SQL Server database (for testing with real data)

### Development Setup

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Set Up Environment Variables**

   ```bash
   # Copy example env files
   cp apps/onprem-agent-api/.env.example apps/onprem-agent-api/.env
   cp apps/onprem-viewer-ui/.env.example apps/onprem-viewer-ui/.env.local

   # Edit the DATABASE_URL in apps/onprem-agent-api/.env
   # Replace with your SQL Server connection string
   ```

3. **Run Development Stack**

   ```bash
   # Option 1: Run MVP stack only
   turbo dev --filter=onprem-agent-api --filter=onprem-viewer-ui

   # Option 2: Use VS Code Task (Ctrl+Shift+P -> "Tasks: Run Task" -> "Dev: Run MVP Stack")
   ```

4. **Access the Dashboard**
   - **Viewer UI**: http://localhost:3000
   - **Agent API**: http://localhost:3001
   - **API Health Check**: http://localhost:3001/api/data/sales-by-month

### Production Deployment (Docker)

1. **Build and Run Containers**

   ```bash
   # Update database connection in docker-compose.yml
   # Then build and start
   docker-compose up --build
   ```

2. **Access the Application**
   - **Dashboard**: http://localhost:3000
   - **Agent API**: http://localhost:3001

### Configuration

#### Widget Configuration (`apps/onprem-agent-api/src/config.json`)

```json
{
  "widget-id": {
    "query": "SELECT column1, column2 FROM table WHERE condition",
    "type": "bar|kpi"
  }
}
```

#### Environment Variables

**Agent API** (`.env`):

```bash
DATABASE_URL="sqlserver://server;database=db;user=user;password=pass;trustServerCertificate=true"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

**Viewer UI** (`.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Project Structure

```
flexboard/
├── apps/
│   ├── onprem-agent-api/          # Backend API
│   │   ├── src/
│   │   │   ├── server.ts          # Main Fastify server
│   │   │   └── config.json        # Widget configurations
│   │   ├── prisma/schema.prisma   # Database schema
│   │   └── Dockerfile
│   └── onprem-viewer-ui/          # Frontend Dashboard
│       ├── src/app/page.tsx       # Main dashboard page
│       └── Dockerfile
├── packages/                      # Shared packages
├── docker-compose.yml             # Container orchestration
└── turbo.json                     # Monorepo configuration
```

## Development Tips

### Adding New Widgets

1. Add widget configuration to `config.json`
2. Create corresponding UI component in `page.tsx`
3. Update data fetching logic
4. Restart development server

### Debugging

- **Agent API Logs**: Check terminal output for SQL query execution
- **Browser Console**: Check for fetch errors and data structure
- **Network Tab**: Inspect API requests and responses

### Common Issues

- **CORS Errors**: Ensure `CORS_ORIGIN` in Agent API matches Viewer UI URL
- **Database Connection**: Verify SQL Server is accessible and connection string is correct
- **Port Conflicts**: Ensure ports 3000 and 3001 are available

## Next Steps (Phase 2)

The MVP demonstrates the core functionality. Phase 2 will include:

- **Central Control Plane**: Cloud-based dashboard builder and configuration management
- **Automatic Sync**: Agents automatically pull configuration updates from Control Plane
- **Multi-tenant Support**: Support for multiple customers from single Control Plane
- **Advanced Widgets**: More chart types, filters, and calculated fields
- **Version Control**: Draft/publish workflow for dashboard changes

---

🏗️ **Built with ❤️ for Enterprise Analytics**

For questions or support, please refer to the main project documentation.
