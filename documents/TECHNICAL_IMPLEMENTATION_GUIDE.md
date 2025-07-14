# 🔧 Flexboard - Technical Implementation Guide

**เอกสารเทคนิค**: การใช้งานและการพัฒนาระบบ  
**เวอร์ชัน**: 1.0  
**วันที่**: 11 กรกฎาคม 2025

---

## 📋 สารบัญ

1. [Quick Start Guide](#quick-start-guide)
2. [Development Workflow](#development-workflow)
3. [API Documentation](#api-documentation)
4. [Configuration Management](#configuration-management)
5. [Deployment Guide](#deployment-guide)
6. [Troubleshooting](#troubleshooting)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)

---

## 🚀 Quick Start Guide

### Prerequisites

```bash
# Required software
node --version    # v18+
pnpm --version    # v8+
docker --version  # v20+
```

### 5-Minute Setup

```bash
# 1. Clone and install
git clone <repository>
cd flexboard
pnpm install

# 2. Setup environment
cp apps/onprem-agent-api/.env.example apps/onprem-agent-api/.env
cp apps/onprem-viewer-ui/.env.example apps/onprem-viewer-ui/.env.local

# 3. Start development
turbo dev --filter=onprem-agent-api --filter=onprem-viewer-ui

# 4. Open browser
# Viewer: http://localhost:3000
# API: http://localhost:3001
```

### Environment Variables Setup

**Agent API** (`apps/onprem-agent-api/.env`):

```bash
# Database connection
DATABASE_URL="sqlserver://localhost:1433;database=TestDB;user=sa;password=YourPassword;trustServerCertificate=true"

# CORS and networking
CORS_ORIGIN="http://localhost:3000"
PORT=3001

# Phase 2 settings (future)
CONTROL_PLANE_URL="http://localhost:3002"
AGENT_API_KEY="agent-key-placeholder"
TENANT_ID="tenant-id-placeholder"
```

**Viewer UI** (`apps/onprem-viewer-ui/.env.local`):

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

---

## 💻 Development Workflow

### Project Structure

```
flexboard/
├── 📁 apps/
│   ├── 🔌 onprem-agent-api/      # Backend API
│   │   ├── 📁 src/
│   │   │   ├── 📄 server.ts      # Main Fastify server
│   │   │   ├── 📄 config.json    # Widget configurations
│   │   │   └── 📁 generated/     # Prisma client
│   │   ├── 📁 prisma/
│   │   │   └── 📄 schema.prisma  # Database schema
│   │   ├── 🐳 Dockerfile
│   │   └── ⚙️ .env.example
│   │
│   ├── 📊 onprem-viewer-ui/      # Frontend Dashboard
│   │   ├── 📁 src/app/
│   │   │   └── 📄 page.tsx       # Main dashboard
│   │   ├── 🐳 Dockerfile
│   │   └── ⚙️ .env.example
│   │
│   ├── 🏢 control-plane-api/     # (Phase 2)
│   └── 🎨 control-plane-ui/      # (Phase 2)
│
├── 📦 packages/                  # Shared code
│   ├── ui/                       # Component library
│   ├── typescript-config/        # TS configs
│   └── eslint-config/           # Code standards
│
├── 🐳 docker-compose.yml         # Production deployment
├── 🚀 turbo.json                # Monorepo config
└── 📚 docs/                     # Documentation
```

### Development Commands

#### Monorepo Commands

```bash
# Install all dependencies
pnpm install

# Run MVP stack
turbo dev --filter=onprem-agent-api --filter=onprem-viewer-ui

# Run all apps
turbo dev

# Build all packages
turbo build

# Lint all code
turbo lint

# Type check all packages
turbo check-types

# Format code
pnpm format
```

#### Individual App Commands

```bash
# Agent API
cd apps/onprem-agent-api
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Viewer UI
cd apps/onprem-viewer-ui
pnpm dev          # Start Next.js dev server
pnpm build        # Build static assets
pnpm start        # Start production server
```

### VS Code Integration

#### Recommended Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "Prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### VS Code Tasks

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev: Run MVP Stack",
      "type": "shell",
      "command": "turbo",
      "args": ["dev", "--filter=onprem-agent-api", "--filter=onprem-viewer-ui"],
      "group": "build",
      "isBackground": true
    }
  ]
}
```

---

## 📡 API Documentation

### Agent API Endpoints

#### Base URL: `http://localhost:3001`

#### GET `/api/data/:widgetId`

ดึงข้อมูลสำหรับ widget ที่ระบุ

**Parameters:**

- `widgetId` (string): ID ของ widget ตาม config.json

**Response:**

```json
[
  {
    "month": "2024-01",
    "total_sales": 150000
  },
  {
    "month": "2024-02",
    "total_sales": 180000
  }
]
```

**Error Response:**

```json
{
  "error": "Widget configuration not found"
}
```

#### Example Requests

```bash
# Sales by month
curl http://localhost:3001/api/data/sales-by-month

# Top products
curl http://localhost:3001/api/data/top-products

# KPI summary
curl http://localhost:3001/api/data/sales-summary
```

### Response Formats

#### Bar Chart Data

```json
[
  {
    "category": "Product A",
    "value": 12500
  }
]
```

#### KPI Data

```json
[
  {
    "total_orders": 1250,
    "total_revenue": 450000,
    "avg_order_value": 360
  }
]
```

---

## ⚙️ Configuration Management

### Widget Configuration Schema

#### config.json Structure

```json
{
  "widget-id": {
    "query": "SQL_QUERY_STRING",
    "type": "bar|kpi|line|pie",
    "title": "Widget Display Name",
    "description": "Widget description",
    "refreshInterval": 300000,
    "cache": true
  }
}
```

#### Example Widgets

**Bar Chart Widget:**

```json
{
  "monthly-sales": {
    "query": "SELECT FORMAT(OrderDate, 'yyyy-MM') AS month, SUM(TotalDue) AS total_sales FROM Sales.SalesOrderHeader WHERE OrderDate >= DATEADD(month, -12, GETDATE()) GROUP BY FORMAT(OrderDate, 'yyyy-MM') ORDER BY month",
    "type": "bar",
    "title": "Monthly Sales Trend",
    "description": "Sales performance over the last 12 months"
  }
}
```

**KPI Widget:**

```json
{
  "sales-kpi": {
    "query": "SELECT COUNT(*) AS total_orders, SUM(TotalDue) AS total_revenue, AVG(TotalDue) AS avg_order_value FROM Sales.SalesOrderHeader WHERE OrderDate >= DATEADD(month, -1, GETDATE())",
    "type": "kpi",
    "title": "Sales Summary",
    "description": "Key metrics for current month"
  }
}
```

### SQL Query Guidelines

#### Best Practices

```sql
-- ✅ Good: Use column aliases
SELECT
  FORMAT(OrderDate, 'yyyy-MM') AS month,
  SUM(TotalDue) AS total_sales
FROM Sales.SalesOrderHeader

-- ✅ Good: Filter recent data
WHERE OrderDate >= DATEADD(month, -12, GETDATE())

-- ✅ Good: Order results
ORDER BY month

-- ✅ Good: Limit large datasets
SELECT TOP 100 ...

-- ❌ Avoid: SELECT *
-- ❌ Avoid: Unfiltered queries on large tables
-- ❌ Avoid: Complex JOINs without indexes
```

#### Data Type Handling

```sql
-- Numbers: Ensure numeric types
CAST(SUM(Amount) AS DECIMAL(10,2)) AS revenue

-- Dates: Use consistent formatting
FORMAT(OrderDate, 'yyyy-MM-dd') AS order_date

-- Strings: Handle NULL values
ISNULL(CustomerName, 'Unknown') AS customer_name
```

---

## 🐳 Deployment Guide

### Docker Deployment

#### Production Build

```bash
# Build all containers
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f onprem-agent-api
docker-compose logs -f onprem-viewer-ui
```

#### Environment Configuration

**docker-compose.yml**:

```yaml
version: "3.8"

services:
  onprem-agent-api:
    build:
      context: ./apps/onprem-agent-api
      dockerfile: Dockerfile
    container_name: flexboard-agent-api
    restart: unless-stopped
    environment:
      DATABASE_URL: "sqlserver://your_server;database=YourDB;user=dbuser;password=dbpass;trustServerCertificate=true"
      PORT: 3001
      CORS_ORIGIN: "http://onprem-viewer-ui:3000"
    ports:
      - "3001:3001"
    networks:
      - flexboard-net

  onprem-viewer-ui:
    build:
      context: ./apps/onprem-viewer-ui
      dockerfile: Dockerfile
    container_name: flexboard-viewer-ui
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: "http://onprem-agent-api:3001"
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - onprem-agent-api
    networks:
      - flexboard-net

networks:
  flexboard-net:
    driver: bridge
```

### Customer Deployment Package

#### Files to Include

```
flexboard-customer-package/
├── docker-compose.yml
├── .env.template
├── README.md
├── scripts/
│   ├── start.sh
│   ├── stop.sh
│   └── update.sh
└── config/
    └── sample-config.json
```

#### Setup Script (start.sh)

```bash
#!/bin/bash
echo "🚀 Starting Flexboard..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  Please copy .env.template to .env and configure it"
  exit 1
fi

# Source environment variables
source .env

# Start services
docker-compose up -d

echo "✅ Flexboard is running!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Symptoms:**

```
Access to fetch at 'http://localhost:3001/api/data/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**

```bash
# Check environment variables
echo $CORS_ORIGIN  # Should be http://localhost:3000

# In docker-compose.yml
environment:
  CORS_ORIGIN: "http://onprem-viewer-ui:3000"  # For container-to-container
  # OR
  CORS_ORIGIN: "http://localhost:3000"         # For development
```

#### 2. Database Connection Issues

**Symptoms:**

```
Error: Login failed for user 'username'
```

**Debugging Steps:**

```bash
# Test connection string
sqlcmd -S server -U username -P password -d database

# Check connection string format
# ✅ Correct format:
DATABASE_URL="sqlserver://server:1433;database=dbname;user=username;password=pass;trustServerCertificate=true"

# Common mistakes:
# ❌ Missing trustServerCertificate=true
# ❌ Wrong port number
# ❌ Incorrect database name
```

#### 3. Port Conflicts

**Symptoms:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

```bash
# Find what's using the port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

#### 4. Widget Configuration Errors

**Symptoms:**

- Empty dashboard
- SQL errors in logs

**Debugging:**

```bash
# Check config.json syntax
jq . apps/onprem-agent-api/src/config.json

# Test SQL query directly
sqlcmd -S server -U user -P pass -d database -Q "YOUR_QUERY_HERE"

# Check API response
curl http://localhost:3001/api/data/widget-id
```

### Debug Tools

#### Server Logs

```bash
# Development
cd apps/onprem-agent-api && pnpm dev

# Production
docker-compose logs -f onprem-agent-api
```

#### Browser DevTools

```javascript
// Test API in browser console
fetch("http://localhost:3001/api/data/sales-by-month")
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

#### Health Checks

```bash
# API health
curl http://localhost:3001/api/data/sales-by-month

# UI health
curl http://localhost:3000
```

---

## 💡 Code Examples

### Adding New Widget Type

#### 1. Backend: Update config.json

```json
{
  "customer-growth": {
    "query": "SELECT YEAR(CreatedDate) AS year, COUNT(*) AS new_customers FROM Customers WHERE CreatedDate >= DATEADD(year, -3, GETDATE()) GROUP BY YEAR(CreatedDate) ORDER BY year",
    "type": "line",
    "title": "Customer Growth",
    "description": "New customer acquisition over time"
  }
}
```

#### 2. Frontend: Add to page.tsx

```tsx
// Add interface
interface CustomerGrowthData {
  year: number;
  new_customers: number;
}

// Add state
const [customerGrowthData, setCustomerGrowthData] = useState<
  CustomerGrowthData[]
>([]);

// Add to fetch logic
const customerGrowthRes = await fetch(`${apiUrl}/api/data/customer-growth`);
const customerGrowthResult = await customerGrowthRes.json();
setCustomerGrowthData(
  customerGrowthResult.map((item: any) => ({
    year: Number(item.year),
    new_customers: Number(item.new_customers),
  }))
);

// Add LineChart component
import { LineChart, Line } from "recharts";

// In JSX
<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
  <h2 className="text-xl font-bold mb-4">Customer Growth</h2>
  <div className="h-[400px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={customerGrowthData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="year" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
          }}
        />
        <Line
          type="monotone"
          dataKey="new_customers"
          stroke="#10b981"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>;
```

### Custom Error Handling

#### Backend Error Handler

```typescript
// In server.ts
fastify.setErrorHandler(async (error, request, reply) => {
  fastify.log.error(error);

  if (error.code === "ECONNREFUSED") {
    reply.status(503).send({
      error: "Database connection failed",
      code: "DB_CONNECTION_ERROR",
    });
  } else if (error.code === "EREQUEST") {
    reply.status(400).send({
      error: "Invalid SQL query",
      code: "SQL_ERROR",
    });
  } else {
    reply.status(500).send({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});
```

#### Frontend Error Handling

```tsx
// Enhanced error state
interface ErrorState {
  message: string;
  code?: string;
  details?: any;
}

const [error, setError] = useState<ErrorState | null>(null);

// Enhanced fetch with error handling
try {
  const res = await fetch(`${apiUrl}/api/data/${widgetId}`);

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch data");
  }

  const data = await res.json();
  // Process data...
} catch (err: any) {
  setError({
    message: err.message,
    code: err.code,
    details: err,
  });
}

// Error display component
{
  error && (
    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
      <h3 className="text-red-400 font-bold mb-2">Error Loading Widget</h3>
      <p className="text-red-300 mb-4">{error.message}</p>
      {error.code && (
        <p className="text-red-400 text-sm">Error Code: {error.code}</p>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Retry
      </button>
    </div>
  );
}
```

---

## 🎯 Best Practices

### Code Quality

#### TypeScript Guidelines

```typescript
// ✅ Use strict types
interface WidgetConfig {
  query: string;
  type: "bar" | "line" | "pie" | "kpi";
  title?: string;
  description?: string;
}

// ✅ Use type guards
function isValidWidgetType(type: string): type is WidgetConfig["type"] {
  return ["bar", "line", "pie", "kpi"].includes(type);
}

// ✅ Handle async operations properly
async function fetchWidgetData(widgetId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/data/${widgetId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch widget ${widgetId}:`, error);
    throw error;
  }
}
```

#### Database Best Practices

```sql
-- ✅ Use parameterized queries (future enhancement)
-- ✅ Add appropriate indexes
CREATE INDEX IX_SalesOrderHeader_OrderDate ON Sales.SalesOrderHeader(OrderDate);

-- ✅ Use LIMIT/TOP for large datasets
SELECT TOP 1000 * FROM LargeTable WHERE Condition;

-- ✅ Optimize JOINs
SELECT o.OrderDate, c.CustomerName
FROM Orders o
INNER JOIN Customers c ON o.CustomerId = c.Id
WHERE o.OrderDate >= DATEADD(month, -1, GETDATE());
```

### Performance Optimization

#### Frontend Optimization

```tsx
// ✅ Use React.memo for expensive components
const ChartComponent = React.memo(({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>{/* Chart content */}</BarChart>
    </ResponsiveContainer>
  );
});

// ✅ Implement proper loading states
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchWidgetData("sales-by-month");
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);

// ✅ Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map((item) => ({
    ...item,
    formattedValue: formatCurrency(item.value),
  }));
}, [data]);
```

#### Backend Optimization

```typescript
// ✅ Implement caching
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

fastify.get("/api/data/:widgetId", async (request, reply) => {
  const { widgetId } = request.params;
  const cacheKey = `widget:${widgetId}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return reply.send(cached.data);
  }

  // Fetch from database
  const data = await prisma.$queryRawUnsafe(query);

  // Cache result
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  return reply.send(data);
});
```

### Security Guidelines

#### Environment Variables

```bash
# ✅ Use strong passwords
DATABASE_PASSWORD="C0mpl3x!P@ssw0rd"

# ✅ Use different credentials per environment
DATABASE_URL_DEV="..."
DATABASE_URL_PROD="..."

# ❌ Never commit secrets to git
# ❌ Never use default passwords
# ❌ Never expose internal endpoints
```

#### CORS Configuration

```typescript
// ✅ Restrict CORS to specific origins
fastify.register(import("@fastify/cors"), {
  origin: [
    "http://localhost:3000", // Development
    "http://customer-internal-domain", // Production
  ],
  credentials: true,
});

// ❌ Never use wildcard in production
// origin: '*'  // DON'T DO THIS
```

---

## 📞 Support และ Development

### Getting Help

#### Debug Checklist

1. ✅ Check environment variables
2. ✅ Verify database connectivity
3. ✅ Test API endpoints individually
4. ✅ Check browser console for errors
5. ✅ Review server logs
6. ✅ Validate JSON configuration

#### Common Solutions

- **Restart development server**: `Ctrl+C` then `pnpm dev`
- **Clear cache**: Delete `node_modules` and `pnpm install`
- **Reset database**: Check connection string and permissions
- **Update dependencies**: `pnpm update`

### Contributing Guidelines

#### Code Style

```bash
# Format code before commit
pnpm format

# Check types
turbo check-types

# Lint code
turbo lint

# Run tests (when available)
turbo test
```

#### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-widget-type

# Make changes and commit
git add .
git commit -m "feat: add line chart widget support"

# Push and create PR
git push origin feature/new-widget-type
```

---

**🔧 Technical Documentation เวอร์ชัน 1.0**  
**📅 อัปเดตล่าสุด**: 11 กรกฎาคม 2025

_เอกสารนี้ครอบคลุมการใช้งานเทคนิคทั้งหมดของ Flexboard MVP และจะถูกอัปเดตตามการพัฒนาของระบบ_
