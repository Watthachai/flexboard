#!/bin/bash

# Bitbucket Pipelines Setup Script for Flexboard Monorepo
# This script helps you set up all required environment variables in Bitbucket

echo "🚀 Flexboard Bitbucket Pipelines Setup Guide"
echo "============================================="
echo ""

# ตั้งค่าตัวแปร - แก้ไขตรงนี้
PROJECT_ID="your-gcp-project-id"  # แก้เป็น Project ID จริง
SERVICE_ACCOUNT_NAME="bitbucket-deployer"
REGION="asia-southeast1"
AR_REPO="flexboard"

echo "Project ID: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT_NAME"
echo "Region: $REGION"
echo "Artifact Registry: $AR_REPO"
echo ""

# ตรวจสอบว่าติดตั้ง gcloud CLI แล้วหรือยัง
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Please install gcloud CLI first: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# ตั้งค่า project
echo "🏗️  Setting up GCP project..."
gcloud config set project $PROJECT_ID

# เปิดใช้งาน APIs ที่จำเป็น
echo "🔌 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iam.googleapis.com

# สร้าง Artifact Registry repository
echo "📦 Creating Artifact Registry repository..."
gcloud artifacts repositories create $AR_REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker images for Flexboard monorepo" || echo "Artifact Registry already exists"

# สร้าง Service Account
echo "👤 Creating service account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --description="Service account for Bitbucket Pipelines deployment" \
  --display-name="Bitbucket Deployer" || echo "Service account already exists"

# ให้สิทธิ์ที่จำเป็น
echo "🔒 Assigning IAM roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# สร้าง Service Account Key
echo "🔑 Creating service account key..."
gcloud iam service-accounts keys create bitbucket-key.json \
  --iam-account=$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com

# แปลงเป็น base64
echo "📦 Converting key to base64..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    BASE64_KEY=$(base64 -i bitbucket-key.json)
else
    # Linux
    BASE64_KEY=$(base64 -w 0 bitbucket-key.json)
fi

echo ""
echo "✅ GCP Setup completed successfully!"
echo ""
echo "📋 Now set these in Bitbucket Repository Variables:"
echo "=================================================="
echo "GCP_PROJECT=$PROJECT_ID"
echo "GCP_REGION=$REGION"
echo "AR_REPO=$AR_REPO"
echo "GCP_SA_EMAIL=$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
echo "GCP_SA_KEY_BASE64=$BASE64_KEY"
echo ""

echo "🏗️ Deployment Variables (set in Bitbucket Deployments)"
echo "======================================================="
echo ""
echo "=== DEV Environment ==="
echo "DATABASE_URL_DEV=postgresql://user:pass@host:port/db_dev"
echo "JWT_SECRET_DEV=your-jwt-secret-for-dev"
echo "CORS_ORIGIN_DEV=https://control-plane-ui-dev-xyz.a.run.app"
echo "NEXT_PUBLIC_API_URL_DEV=https://control-plane-api-dev-xyz.a.run.app"
echo ""
echo "=== PRODUCTION Environment ==="
echo "DATABASE_URL_PRODUCTION=postgresql://user:pass@host:port/db_production"
echo "JWT_SECRET_PRODUCTION=your-jwt-secret-for-production"
echo "CORS_ORIGIN_PRODUCTION=https://control-plane-ui-xyz.a.run.app"
echo "NEXT_PUBLIC_API_URL_PRODUCTION=https://control-plane-api-xyz.a.run.app"
echo ""

echo "🚦 How to Deploy:"
echo "================="
echo "1. Push to 'dev' branch → deploys to DEV"
echo "2. Merge to 'main' branch → deploys to PRODUCTION"
echo ""
echo "Services will be deployed as:"
echo "- control-plane-ui-dev / control-plane-ui"
echo "- control-plane-api-dev / control-plane-api"
echo ""

echo "✨ Smart Features:"
echo "=================="
echo "- Only builds changed apps (git diff detection)"
echo "- Automatic resource allocation per environment"
echo "- Complete environment variable injection"
echo "- Proper port configuration for each service"
echo ""

echo "🔗 Useful Commands:"
echo "==================="
echo "# Check Cloud Run services"
echo "gcloud run services list --region=$REGION"
echo ""
echo "# View service logs"
echo "gcloud logging read 'resource.type=\"cloud_run_revision\"' --limit=50"
echo ""
echo "# Clean up (remove service account key file)"
echo "rm bitbucket-key.json"
echo ""

echo "🎯 Next Steps:"
echo "=============="
echo "1. Copy the variables above to Bitbucket"
echo "2. Commit & push to 'dev' branch to test"
echo "3. Check Bitbucket Pipelines for deployment status"
echo ""
echo "Need help? Check the pipeline logs in Bitbucket! 🚀"
echo "📋 Next steps:"
echo "1. ไปที่ Bitbucket Repository → Settings → Repository variables"
echo "2. เพิ่มตัวแปรต่อไปนี้:"
echo ""
echo "   GOOGLE_CLOUD_KEY:"
echo "   $BASE64_KEY"
echo ""
echo "   PROJECT_ID:"
echo "   $PROJECT_ID"
echo ""
echo "3. แก้ไข PROJECT_ID ใน bitbucket-pipelines.yml (บรรทัด 15 และ 61)"
echo "4. Push การเปลี่ยนแปลงไปยัง Bitbucket"
echo "5. ทดสอบ pipeline โดย push ไปยัง branch 'dev' หรือ 'main'"
echo ""
echo "🗑️  คำสั่งลบ service account key file (แนะนำให้รันหลังจากตั้งค่าเสร็จ):"
echo "   rm bitbucket-key.json"
echo ""
echo "🔍 การตรวจสอบ pipeline:"
echo "   ไปที่ Bitbucket Repository → Pipelines เพื่อดู build status"
