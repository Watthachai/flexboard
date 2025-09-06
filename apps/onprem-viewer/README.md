# OnPrem Viewer - XML Inventory Data Pipeline

A complete on-premise deployment solution for processing and viewing XML inventory data with automated ingestion, SQLite storage, and REST API access.

## Features

- **Automated XML Ingestion**: Monitors inventory files every 5 minutes
- **SQLite Database**: Local data storage with Prisma ORM
- **REST API**: Query raw inventory data with filtering
- **Docker Ready**: Production containerization with health checks
- **Cron Worker**: Background processing for data ingestion

## Quick Start

### Docker Deployment (Recommended)

1. Clone and navigate to the onprem-viewer directory
2. Create inventory data directory:
   ```bash
   mkdir inventory-files
   ```
3. Deploy with Docker Compose:
   ```bash
   docker-compose up -d
   ```
4. Access the application at `http://localhost:3002`

### Manual Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Initialize database:

   ```bash
   npm run db:generate
   npm run db:push
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Start cron worker (separate terminal):
   ```bash
   npm run cron:dev
   ```

## Data Pipeline

### XML File Structure Expected

Place XML files in the `inventory-files/` directory. The system expects XML with structure like:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<inventory>
  <item>
    <id>123</id>
    <name>Product Name</name>
    <quantity>50</quantity>
    <category>Electronics</category>
  </item>
</inventory>
```

### Automated Processing

- **File Monitoring**: Cron worker checks `inventory-files/` every 5 minutes
- **Change Detection**: Only processes files modified since last import
- **Data Storage**: Upserts data into SQLite database with import tracking
- **API Access**: Query processed data via REST endpoints

## API Endpoints

### Health Check

```
GET /api/health
```

### Raw Inventory Data

```
GET /api/inventory/raw?page=1&limit=100&search=keyword
```

Query Parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 100, max: 1000)
- `search`: Filter by name or category

## Database Schema

### InventoryRaw Table

- `id`: Unique identifier
- `name`: Item name
- `category`: Item category
- `quantity`: Stock quantity
- `data`: Complete JSON data from XML
- `sourceFile`: Original XML filename
- `importedAt`: Import timestamp

### ImportLog Table

- `id`: Log entry ID
- `fileName`: Processed file name
- `filePath`: Full file path
- `lastModified`: File modification time
- `recordsProcessed`: Number of records imported
- `status`: Import status (SUCCESS/ERROR)
- `createdAt`: Log timestamp

## Environment Variables

```env
# Database
DATABASE_URL=file:./data/database.db

# Application
NODE_ENV=production
PORT=3002
```

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build production application
- `npm run start`: Start production server
- `npm run db:generate`: Generate Prisma client
- `npm run db:push`: Push schema to database
- `npm run ingest`: Manual data ingestion
- `npm run cron:dev`: Start cron worker (development)
- `npm run cron:prod`: Start cron worker (production)

## Production Deployment

The Docker container automatically:

1. Initializes the database schema
2. Starts the Next.js application server
3. Starts the background cron worker
4. Monitors health via `/api/health` endpoint

### Volume Mounts

- `./data:/app/data` - Database storage
- `./inventory-files:/app/inventory-files` - XML file directory

### Health Monitoring

The container includes health checks that verify the application is responding on port 3002.

## File Structure

```
apps/onprem-viewer/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── health/route.ts      # Health check endpoint
│   │       └── inventory/raw/route.ts # Raw data API
│   └── lib/
│       ├── db/prisma.ts             # Database client
│       └── ingest/ingest-job.ts     # XML processing logic
├── scripts/
│   └── cron-worker.ts               # Automated ingestion worker
├── prisma/
│   └── schema.prisma                # Database schema
├── Dockerfile                       # Container configuration
├── docker-compose.yml               # Deployment orchestration
└── package.json                     # Dependencies and scripts
```

This template provides a complete, production-ready solution for on-premise XML inventory data processing and API access.
