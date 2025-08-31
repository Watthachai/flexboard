# FlexBoard Cloud Run Deployment Guide

## Environment Separation

FlexBoard ใช้สองสภาพแวดล้อมหลัก:

### 🧪 Staging Environment

- **Branch**: `dev`
- **Services**: `control-plane-api-staging`, `control-plane-ui-staging`
- **Purpose**: Testing และ QA ก่อนปล่อยสู่ Production
- **Resources**: ลด resource เพื่อประหยัดค่าใช้จ่าย

### 🚀 Production Environment

- **Branch**: `main`
- **Services**: `control-plane-api`, `control-plane-ui`
- **Purpose**: Production สำหรับผู้ใช้งานจริง
- **Resources**: เพิ่ม resource เพื่อ performance และ reliability

## การตั้งค่าครั้งแรก

### 1. ตั้งค่า Google Cloud Project

```bash
# ตั้งค่า Project ID
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# เปิดใช้งาน APIs ที่จำเป็น
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 2. ตั้งค่า GitHub Integration

```bash
# Connect GitHub repository กับ Cloud Build
gcloud builds triggers connect --region=asia-southeast1
```

### 3. สร้าง Cloud Build Triggers

```bash
# แก้ไขค่าใน script ก่อน
nano setup-cloud-build.sh

# รันคำสั่งสร้าง triggers
./setup-cloud-build.sh
```

### 4. ตั้งค่า Environment Variables

แก้ไขไฟล์ deployment scripts:

**scripts/deploy-staging.sh**:

```bash
PROJECT_ID="your-staging-project-id"
```

**scripts/deploy-production.sh**:

```bash
PROJECT_ID="your-production-project-id"
```

## Deployment Workflow

### Automatic Deployment (ผ่าน Git)

1. **Deploy to Staging**:

   ```bash
   git checkout dev
   git add .
   git commit -m "feature: new feature"
   git push origin dev
   ```

   → Cloud Build จะ deploy ไปยัง Staging อัตโนมัติ

2. **Deploy to Production**:
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```
   → Cloud Build จะ deploy ไปยัง Production อัตโนมัติ

### Manual Deployment

1. **Deploy Staging**:

   ```bash
   ./scripts/deploy-staging.sh
   ```

2. **Deploy Production**:
   ```bash
   ./scripts/deploy-production.sh
   ```

## Environment URLs

หลังจาก deploy สำเร็จ จะได้ URLs ตามนี้:

### Staging

- API: `https://control-plane-api-staging-xxx-uc.a.run.app`
- UI: `https://control-plane-ui-staging-xxx-uc.a.run.app`

### Production

- API: `https://control-plane-api-xxx-uc.a.run.app`
- UI: `https://control-plane-ui-xxx-uc.a.run.app`

## Resource Configuration

### Staging (ประหยัดค่าใช้จ่าย)

- **API**: 1 CPU, 1GB RAM, min 0, max 5 instances
- **UI**: 1 CPU, 512MB RAM, min 0, max 3 instances

### Production (เน้น Performance)

- **API**: 2 CPU, 2GB RAM, min 1, max 10 instances
- **UI**: 1 CPU, 1GB RAM, min 1, max 5 instances

## Environment Variables

แต่ละ environment จะมี environment variables ที่แตกต่างกัน:

### Staging

```bash
NODE_ENV=staging
ENVIRONMENT=staging
PORT=8080
```

### Production

```bash
NODE_ENV=production
ENVIRONMENT=production
PORT=8080
```

## การ Monitor และ Troubleshooting

### 1. ดู Logs

```bash
# Staging
gcloud run logs tail control-plane-api-staging --region=asia-southeast1
gcloud run logs tail control-plane-ui-staging --region=asia-southeast1

# Production
gcloud run logs tail control-plane-api --region=asia-southeast1
gcloud run logs tail control-plane-ui --region=asia-southeast1
```

### 2. ดู Service Status

```bash
# Staging
gcloud run services describe control-plane-api-staging --region=asia-southeast1
gcloud run services describe control-plane-ui-staging --region=asia-southeast1

# Production
gcloud run services describe control-plane-api --region=asia-southeast1
gcloud run services describe control-plane-ui --region=asia-southeast1
```

### 3. ดู Build History

```bash
gcloud builds list --limit=10
```

## Security และ Best Practices

1. **ใช้ Service Account** สำหรับ Firebase access
2. **ตั้งค่า CORS** เฉพาะ domain ที่จำเป็น
3. **Monitor costs** ผ่าน Cloud Console
4. **ใช้ IAM** จำกัดสิทธิ์การเข้าถึง resources
5. **Test ใน Staging** ก่อน deploy Production เสมอ

## การ Scale และ Cost Optimization

### Staging (ประหยัดค่าใช้จ่าย)

- ใช้ min-instances = 0 เพื่อประหยัดเงินเมื่อไม่มีการใช้งาน
- ลด CPU และ Memory
- Auto-scale down เร็วขึ้น

### Production (เน้น Reliability)

- ใช้ min-instances >= 1 เพื่อลด cold start
- เพิ่ม CPU และ Memory สำหรับ performance
- Auto-scale up เพื่อรองรับ traffic spike
