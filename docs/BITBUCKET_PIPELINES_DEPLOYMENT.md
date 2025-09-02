# Bitbucket Pipelines Deployment Guide

This guide explains how to deploy Flexboard monorepo using Bitbucket Pipelines to Google Cloud Run.

## 🏗️ Architecture

Our monorepo contains two main applications:

- **Control Plane UI** (Next.js) - Port 8080
- **Control Plane API** (Node.js) - Port 8080

## 🚀 Deployment Strategy

### Branches

- `dev` → Deploys to **SANDBOX** environment
- `main` → Deploys to **PRODUCTION** environment

### Smart Deployment

- Only builds changed applications (using git diff)
- Separate deployment steps for each service
- Environment-specific configurations

## 📋 Setup Instructions

### 1. GCP Setup

Run the setup script to configure GCP resources:

```bash
# Edit PROJECT_ID in the script first
./setup-bitbucket-pipelines.sh
```

This will:

- Enable required APIs
- Create Artifact Registry repository
- Create service account with proper permissions
- Generate base64-encoded key

### 2. Bitbucket Repository Variables

Set these in `Repository settings > Pipelines > Repository variables`:

```
GCP_PROJECT=your-gcp-project-id
GCP_REGION=asia-southeast1
AR_REPO=flexboard
GCP_SA_EMAIL=bitbucket-deployer@your-project.iam.gserviceaccount.com
GCP_SA_KEY_BASE64=<base64-encoded-key-from-script>
```

### 3. Bitbucket Deployment Variables

Set these in `Repository settings > Pipelines > Deployments`:

#### SANDBOX Environment

```
DATABASE_URL_SANDBOX=postgresql://user:pass@host:port/db_sandbox
JWT_SECRET_SANDBOX=your-jwt-secret-for-sandbox
CORS_ORIGIN_SANDBOX=https://control-plane-ui-sandbox-xyz.a.run.app
NEXT_PUBLIC_API_URL_SANDBOX=https://control-plane-api-sandbox-xyz.a.run.app
```

#### PRODUCTION Environment

```
DATABASE_URL_PRODUCTION=postgresql://user:pass@host:port/db_production
JWT_SECRET_PRODUCTION=your-jwt-secret-for-production
CORS_ORIGIN_PRODUCTION=https://control-plane-ui-xyz.a.run.app
NEXT_PUBLIC_API_URL_PRODUCTION=https://control-plane-api-xyz.a.run.app
```

## 🔧 Resource Configuration

### SANDBOX (dev branch)

| Service | CPU | Memory | Max Instances |
| ------- | --- | ------ | ------------- |
| UI      | 1   | 1Gi    | 10            |
| API     | 1   | 1Gi    | 10            |

### PRODUCTION (main branch)

| Service | CPU | Memory | Max Instances |
| ------- | --- | ------ | ------------- |
| UI      | 2   | 2Gi    | 20            |
| API     | 2   | 2Gi    | 20            |

## 🚦 Deployment Process

1. **Development**: Push to `dev` branch
   - Triggers sandbox deployment
   - Services deployed with `-sandbox` suffix
   - Lower resource allocation

2. **Production**: Merge to `main` branch
   - Triggers production deployment
   - Services deployed without suffix
   - Higher resource allocation

## 📊 Monitoring & Debugging

### Check Deployment Status

```bash
# List all Cloud Run services
gcloud run services list --region=asia-southeast1

# Get service details
gcloud run services describe control-plane-ui --region=asia-southeast1
```

### View Logs

```bash
# View recent logs
gcloud logging read 'resource.type="cloud_run_revision"' --limit=50

# Filter by service
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="control-plane-api"' --limit=20
```

### Common Issues

1. **Build Fails**: Check if Dockerfile paths are correct
2. **Service Not Accessible**: Verify `--allow-unauthenticated` flag
3. **Environment Variables**: Check Bitbucket deployment variables
4. **Port Issues**: Ensure Dockerfile EXPOSE matches --port in deployment

## 🔄 Pipeline Features

- **Change Detection**: Only builds apps with modified files
- **Parallel Steps**: Each service deploys independently
- **Environment Isolation**: Separate configs for sandbox/production
- **Resource Optimization**: Different allocations per environment
- **Automatic Scaling**: Based on traffic patterns

## 📝 File Structure

```
flexboard/
├── bitbucket-pipelines.yml          # Main pipeline configuration
├── setup-bitbucket-pipelines.sh     # GCP setup script
└── apps/
    ├── control-plane-ui/
    │   ├── Dockerfile
    │   └── .dockerignore
    └── control-plane-api/
        ├── Dockerfile
        └── .dockerignore
```

## 🎯 Next Steps

1. Run the setup script
2. Configure Bitbucket variables
3. Push to `dev` branch to test
4. Monitor pipeline execution
5. Merge to `main` for production deployment

Happy deploying! 🚀
