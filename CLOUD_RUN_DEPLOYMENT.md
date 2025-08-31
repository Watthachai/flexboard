# FlexBoard Cloud Run Deployment Guide

This guide explains how to deploy FlexBoard applications to Google Cloud Run using the automated CI/CD setup.

## 🏗️ Architecture

- **Control Plane API**: Backend service (Node.js/Fastify)
- **Control Plane UI**: Frontend application (Next.js)
- **Deployment**: Google Cloud Run with Artifact Registry
- **CI/CD**: Cloud Build triggers with path-based filtering

## 🚀 Quick Start

### Prerequisites

1. Google Cloud Project with billing enabled
2. GitHub repository connected to Cloud Build
3. Required APIs enabled:
   ```bash
   gcloud services enable \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     artifactregistry.googleapis.com
   ```

### 1. Setup Cloud Infrastructure

```bash
# แก้ PROJECT_ID ในไฟล์ก่อน
./scripts/setup-cloud-build.sh
```

### 2. Manual Local Deployment (สำหรับทดสอบ)

```bash
# แก้ PROJECT_ID ในไฟล์ก่อน
./scripts/deploy-cloud-run.sh
```

### 3. Automated Deployment

Push code ไปที่ `main` branch - Cloud Build จะ auto-deploy:

- **API changes**: เมื่อมีไฟล์ใน `apps/control-plane-api/` เปลี่ยน
- **UI changes**: เมื่อมีไฟล์ใน `apps/control-plane-ui/` เปลี่ยน
- **Shared changes**: เมื่อมี `packages/`, `pnpm-lock.yaml`, `turbo.json` เปลี่ยน

## 📁 Files Structure

```
flexboard/
├── cloudbuild-api.yaml           # Cloud Build config for API
├── cloudbuild-ui.yaml            # Cloud Build config for UI
├── .dockerignore                 # Docker ignore patterns
├── scripts/
│   ├── setup-cloud-build.sh      # Setup Cloud Build triggers
│   └── deploy-cloud-run.sh       # Manual deployment script
└── apps/
    ├── control-plane-api/
    │   └── Dockerfile             # API container build
    └── control-plane-ui/
        └── Dockerfile             # UI container build
```

## ⚙️ Configuration

### Environment Variables

Set via Cloud Run deployment:

**API Service:**

- `NODE_ENV=production`
- `PORT=8080`
- Add your Firebase/DB configs as needed

**UI Service:**

- `NODE_ENV=production`
- `PORT=8080`
- `NEXT_PUBLIC_API_URL` (if needed)

### Resource Limits

**API:**

- Memory: 1GB
- CPU: 1 vCPU
- Min instances: 0
- Max instances: 10

**UI:**

- Memory: 512MB
- CPU: 1 vCPU
- Min instances: 0
- Max instances: 5

## 🔧 Customization

### Adding Environment Variables

Edit `cloudbuild-*.yaml` files:

```yaml
- "--set-env-vars"
- "NODE_ENV=production,PORT=8080,YOUR_VAR=value"
```

### Changing Resource Limits

Edit deployment args in Cloud Build configs:

```yaml
- "--memory"
- "2Gi"
- "--cpu"
- "2"
```

### Adding Staging Environment

1. Copy `cloudbuild-*.yaml` → `cloudbuild-*-staging.yaml`
2. Change service names: `${_SERVICE}-staging`
3. Create triggers for `develop` branch
4. Set different env vars for staging

## 🔍 Monitoring

### Cloud Build Logs

- Console: https://console.cloud.google.com/cloud-build/builds
- CLI: `gcloud builds list`

### Cloud Run Logs

- Console: https://console.cloud.google.com/run
- CLI: `gcloud run services describe SERVICE_NAME --region=asia-southeast1`

### Service URLs

```bash
# Get service URLs
gcloud run services list --platform=managed --region=asia-southeast1
```

## 🐛 Troubleshooting

### Build Failures

1. Check Cloud Build logs in GCP Console
2. Verify Dockerfile syntax and paths
3. Check if all dependencies are in `package.json`

### Runtime Errors

1. Check Cloud Run logs
2. Verify environment variables
3. Test Docker images locally:
   ```bash
   docker run -p 8080:8080 REGISTRY/SERVICE:TAG
   ```

### Path Filtering Issues

Cloud Build triggers use these paths:

- API: `apps/control-plane-api/**`
- UI: `apps/control-plane-ui/**`
- Shared: `packages/**`, `pnpm-lock.yaml`, `turbo.json`

## 💰 Cost Optimization

1. **Cold starts**: Min instances = 0 (free tier)
2. **CPU allocation**: Only during request processing
3. **Memory**: Right-size based on actual usage
4. **Artifact Registry**: Clean up old images periodically

## 🔐 Security

1. Services run as non-root users
2. Use IAM for service-to-service communication
3. Consider VPC for internal-only services
4. Enable audit logging for production

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
