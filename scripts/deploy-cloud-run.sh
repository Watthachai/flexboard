#!/bin/bash

# ตั้งค่าตัวแปร
PROJECT_ID="your-gcp-project-id"  # แก้เป็น Project ID จริง
REGION="asia-southeast1"
REPO="flexboard"

# สร้าง tag จาก git commit
COMMIT=$(git rev-parse --short HEAD)
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

echo "🚀 Building and deploying FlexBoard to Cloud Run"
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
echo "🔨 Building Control Plane API..."
docker build -f apps/control-plane-api/Dockerfile -t ${REGISTRY}/control-plane-api:${COMMIT} .
echo "📤 Pushing Control Plane API..."
docker push ${REGISTRY}/control-plane-api:${COMMIT}

echo ""
echo "🚀 Deploying Control Plane API to Cloud Run..."
gcloud run deploy control-plane-api \
  --image ${REGISTRY}/control-plane-api:${COMMIT} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,PORT=8080

echo ""
echo "🔨 Building Control Plane UI..."
docker build -f apps/control-plane-ui/Dockerfile -t ${REGISTRY}/control-plane-ui:${COMMIT} .
echo "📤 Pushing Control Plane UI..."
docker push ${REGISTRY}/control-plane-ui:${COMMIT}

echo ""
echo "🚀 Deploying Control Plane UI to Cloud Run..."
gcloud run deploy control-plane-ui \
  --image ${REGISTRY}/control-plane-ui:${COMMIT} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars NODE_ENV=production,PORT=8080

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 URLs:"
API_URL=$(gcloud run services describe control-plane-api --region=${REGION} --format="value(status.url)")
UI_URL=$(gcloud run services describe control-plane-ui --region=${REGION} --format="value(status.url)")
echo "API: ${API_URL}"
echo "UI:  ${UI_URL}"
