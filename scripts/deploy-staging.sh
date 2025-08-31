#!/bin/bash

# ตั้งค่าตัวแปร
PROJECT_ID="your-gcp-project-id"  # แก้เป็น Project ID จริง
REGION="asia-southeast1"
REPO="flexboard"

# สร้าง tag จาก git commit
COMMIT=$(git rev-parse --short HEAD)
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

echo "🧪 Building and deploying FlexBoard STAGING to Cloud Run"
echo "Project: ${PROJECT_ID}"
echo "Commit: ${COMMIT}"
echo "Registry: ${REGISTRY}"
echo ""

# สร้าง Artifact Registry ถ้ายังไม่มี
echo "📦 Creating Artifact Registry repository..."
gcloud artifacts repositories create ${REPO} \
  --repository-format=docker \
  --location=${REGION} \
  --description="FlexBoard monorepo containers" \
  2>/dev/null || echo "Repository already exists"

echo ""
echo "🔨 Building Control Plane API (Staging)..."
docker build -f apps/control-plane-api/Dockerfile -t ${REGISTRY}/control-plane-api-staging:${COMMIT} .
echo "📤 Pushing Control Plane API (Staging)..."
docker push ${REGISTRY}/control-plane-api-staging:${COMMIT}

echo ""
echo "🚀 Deploying Control Plane API to Cloud Run (Staging)..."
gcloud run deploy control-plane-api-staging \
  --image ${REGISTRY}/control-plane-api-staging:${COMMIT} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars NODE_ENV=staging,PORT=8080,ENVIRONMENT=staging

echo ""
echo "🔨 Building Control Plane UI (Staging)..."
docker build -f apps/control-plane-ui/Dockerfile -t ${REGISTRY}/control-plane-ui-staging:${COMMIT} .
echo "📤 Pushing Control Plane UI (Staging)..."
docker push ${REGISTRY}/control-plane-ui-staging:${COMMIT}

echo ""
echo "🚀 Deploying Control Plane UI to Cloud Run (Staging)..."
gcloud run deploy control-plane-ui-staging \
  --image ${REGISTRY}/control-plane-ui-staging:${COMMIT} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars NODE_ENV=staging,PORT=8080,ENVIRONMENT=staging

echo ""
echo "✅ Staging deployment completed!"
echo ""
echo "🌐 STAGING URLs:"
API_URL=$(gcloud run services describe control-plane-api-staging --region=${REGION} --format="value(status.url)" 2>/dev/null || echo "Not deployed yet")
UI_URL=$(gcloud run services describe control-plane-ui-staging --region=${REGION} --format="value(status.url)" 2>/dev/null || echo "Not deployed yet")
echo "API: ${API_URL}"
echo "UI:  ${UI_URL}"
