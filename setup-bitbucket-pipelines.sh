#!/bin/bash

echo "🔧 Setting up FlexBoard for Bitbucket Pipelines deployment"

# ตั้งค่าตัวแปร - แก้ไขตรงนี้
PROJECT_ID="your-gcp-project-id"  # แก้เป็น Project ID จริง
SERVICE_ACCOUNT_NAME="bitbucket-pipelines"

echo "Project ID: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT_NAME"
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

# สร้าง Service Account
echo "👤 Creating service account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --description="Service account for Bitbucket Pipelines" \
  --display-name="Bitbucket Pipelines" || echo "Service account already exists"

# ให้สิทธิ์ที่จำเป็น
echo "🔒 Assigning IAM roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

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
echo "✅ Setup completed successfully!"
echo ""
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
