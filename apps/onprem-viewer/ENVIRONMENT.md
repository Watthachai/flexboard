# OnPrem Viewer Environment Configuration

This document explains how to configure the OnPrem Viewer for different environments.

## Available Environments

### 1. Production

- **API URL**: `https://api-flexboard.fittcoreai.com`
- **Environment**: `production`
- **Use Case**: Live production deployment

### 2. Sandbox (Default)

- **API URL**: `https://sandbox.api-flexboard.fittcoreai.com`
- **Environment**: `sandbox`
- **Use Case**: Testing, staging, and development

## Configuration Methods

### Method 1: Using Environment Files

Copy the appropriate environment file to `.env.local`:

```bash
# For production
cp .env.production .env.local

# For sandbox
cp .env.sandbox .env.local

# For development
cp .env.development .env.local
```

### Method 2: Setting Environment Variable

Set the `NEXT_PUBLIC_ENVIRONMENT` variable:

```bash
# In .env.local
NEXT_PUBLIC_ENVIRONMENT=production  # or sandbox, development
```

### Method 3: Direct API URL Override

Override the API URL directly:

```bash
# In .env.local
NEXT_PUBLIC_CONTROL_PLANE_API_URL=https://api-flexboard.fittcoreai.com
```

## Environment Variables

| Variable                            | Description                                               | Default                            |
| ----------------------------------- | --------------------------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_ENVIRONMENT`           | Environment name (`production`, `sandbox`, `development`) | `development`                      |
| `NEXT_PUBLIC_CONTROL_PLANE_API_URL` | Direct API URL override                                   | Auto-detected based on environment |
| `NEXT_PUBLIC_TENANT_ID`             | Your tenant ID                                            | -                                  |
| `NEXT_PUBLIC_API_KEY`               | Your API key                                              | -                                  |
| `NEXT_PUBLIC_REFRESH_INTERVAL`      | Data refresh interval (ms)                                | `30000`                            |
| `NEXT_PUBLIC_DEBUG_MODE`            | Enable debug mode                                         | `false`                            |
| `NEXT_PUBLIC_LOG_LEVEL`             | Log level (`debug`, `info`, `warn`, `error`)              | `info`                             |

## Running Different Environments

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# With specific environment
NEXT_PUBLIC_ENVIRONMENT=sandbox npm run dev
```

## API URL Selection Logic

1. If `NEXT_PUBLIC_CONTROL_PLANE_API_URL` is set → Use that URL
2. If `NEXT_PUBLIC_ENVIRONMENT=production` → `https://api-flexboard.fittcoreai.com`
3. If `NEXT_PUBLIC_ENVIRONMENT=sandbox` → `https://sandbox.api-flexboard.fittcoreai.com`
4. If `NEXT_PUBLIC_ENVIRONMENT=development` → `http://localhost:3000`
5. Default → `http://localhost:3000`
