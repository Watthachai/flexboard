# FlexBoard Cloud Run Deployment Guide (Bitbucket Edition)

## Environment Separation

FlexBoard ใช้สองสภาพแวดล้อมหลัก พร้อม Bitbucket Pipelines สำหรับ CI/CD:

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

### 2. ตั้งค่า Bitbucket Integration

```bash
# สร้าง Service Account สำหรับ Bitbucket Pipelines
gcloud iam service-accounts create bitbucket-pipelines \
  --description="Service account for Bitbucket Pipelines" \
  --display-name="Bitbucket Pipelines"

# ให้สิทธิ์ที่จำเป็น
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:bitbucket-pipelines@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:bitbucket-pipelines@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

# สร้าง Service Account Key
gcloud iam service-accounts keys create bitbucket-key.json \
  --iam-account=bitbucket-pipelines@$PROJECT_ID.iam.gserviceaccount.com

# แปลงเป็น base64 สำหรับเก็บใน Bitbucket Repository Variables
base64 -i bitbucket-key.json
```

### 3. ตั้งค่า Bitbucket Repository Variables

ไปที่ Bitbucket Repository → Settings → Repository variables และเพิ่ม:

- **GOOGLE_CLOUD_KEY**: ค่า base64 ของ service account key
- **PROJECT_ID**: GCP Project ID ของคุณ

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

### Automatic Deployment (ผ่าน Bitbucket Pipelines)

1. **Deploy to Staging**:

   ```bash
   git checkout dev
   git add .
   git commit -m "feature: new feature"
   git push origin dev
   ```

   → Bitbucket Pipelines จะ deploy ไปยัง Staging อัตโนมัติ

2. **Deploy to Production**:
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```
   → Bitbucket Pipelines จะ deploy ไปยัง Production อัตโนมัติ

### Manual Deployment (ผ่าน Bitbucket UI)

1. **Deploy Staging**:
   - ไปที่ Bitbucket Repository → Pipelines
   - เลือก "Run pipeline"
   - เลือก branch: `dev`
   - เลือก pipeline: `staging`
   - คลิก "Run"

2. **Deploy Production**:
   - ไปที่ Bitbucket Repository → Pipelines
   - เลือก "Run pipeline"
   - เลือก branch: `main`
   - เลือก pipeline: `production`
   - คลิก "Run"

### Manual Deployment (ผ่าน Scripts)

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

### 1. ดู Bitbucket Pipelines Logs

```bash
# ไปที่ Bitbucket Repository → Pipelines → เลือก build ที่ต้องการดู
```

### 2. ดู Cloud Run Logs

```bash
# Staging
gcloud run logs tail control-plane-api-staging --region=asia-southeast1
gcloud run logs tail control-plane-ui-staging --region=asia-southeast1

# Production
gcloud run logs tail control-plane-api --region=asia-southeast1
gcloud run logs tail control-plane-ui --region=asia-southeast1
```

### 3. ดู Service Status

```bash
# Staging
gcloud run services describe control-plane-api-staging --region=asia-southeast1
gcloud run services describe control-plane-ui-staging --region=asia-southeast1

# Production
gcloud run services describe control-plane-api --region=asia-southeast1
gcloud run services describe control-plane-ui --region=asia-southeast1
```

### 4. ดู Bitbucket Pipelines History

```bash
# ไปที่ Bitbucket Repository → Pipelines → ดู history ของ builds ทั้งหมด
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
