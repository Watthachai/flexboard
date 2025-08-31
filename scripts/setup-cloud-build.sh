#!/bin/bash

# ตั้งค่าตัวแปร
PROJECT_ID="your-gcp-project-id"  # แก้เป็น Project ID จริง
REGION="asia-southeast1"
REPO_NAME="flexboard"
GITHUB_OWNER="Watthachai"  # แก้เป็น GitHub username/org ของคุณ
GITHUB_REPO="flexboard"    # แก้เป็น GitHub repository name ของคุณ

echo "🔧 Setting up Cloud Build Triggers for FlexBoard"
echo "Project: ${PROJECT_ID}"
echo "GitHub: ${GITHUB_OWNER}/${GITHUB_REPO}"
echo ""

# สร้าง Artifact Registry
echo "📦 Creating Artifact Registry..."
gcloud artifacts repositories create ${REPO_NAME} \
  --repository-format=docker \
  --location=${REGION} \
  --description="FlexBoard monorepo containers" \
  --project=${PROJECT_ID} \
  2>/dev/null || echo "Repository already exists"

echo ""
echo "🔨 Creating Cloud Build Trigger for Control Plane API..."
gcloud builds triggers create github \
  --name="deploy-control-plane-api" \
  --repo-owner="${GITHUB_OWNER}" \
  --repo-name="${GITHUB_REPO}" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-api.yaml" \
  --include-logs-with-status \
  --included-files="apps/control-plane-api/**,packages/**,pnpm-lock.yaml,turbo.json" \
  --description="Deploy Control Plane API to Cloud Run" \
  --project=${PROJECT_ID}

echo ""
echo "🔨 Creating Cloud Build Trigger for Control Plane UI..."
gcloud builds triggers create github \
  --name="deploy-control-plane-ui" \
  --repo-owner="${GITHUB_OWNER}" \
  --repo-name="${GITHUB_REPO}" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-ui.yaml" \
  --include-logs-with-status \
  --included-files="apps/control-plane-ui/**,packages/**,pnpm-lock.yaml,turbo.json" \
  --description="Deploy Control Plane UI to Cloud Run" \
  --project=${PROJECT_ID}

echo ""
echo "✅ Cloud Build Triggers created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. แก้ PROJECT_ID ในไฟล์ scripts/setup-cloud-build.sh"
echo "2. แก้ GITHUB_OWNER และ GITHUB_REPO ให้ตรงกับ repository ของคุณ"
echo "3. Connect GitHub repository กับ Cloud Build ใน GCP Console"
echo "4. Push โค้ดไปที่ main branch เพื่อทดสอบ deployment"
echo ""
echo "🌐 Cloud Build Console: https://console.cloud.google.com/cloud-build/triggers?project=${PROJECT_ID}"
