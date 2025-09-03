#!/bin/bash
set -euo pipefail

echo "🚀 Flexboard Bitbucket Pipelines Setup"

# ====== แก้ไขค่าให้ตรงโปรเจกต์คุณ ======
PROJECT_ID="flexboard-466304"
REGION="asia-southeast1"
AR_REPO="flexboard"

# ตั้งชื่อสั้น 6–30 ตัวอักษร (เฉพาะ a-z 0-9 และ -)
DEPLOYER_ID="bb-pipelines-deployer"      # SA สำหรับ Bitbucket deploy
RUNTIME_ID="watthachai-digitalvalue-co-th"        # SA ที่ Cloud Run จะรันจริง

DEPLOYER_SA="${DEPLOYER_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_SA="${RUNTIME_ID}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Project ID: $PROJECT_ID"
echo "Region:     $REGION"
echo "AR Repo:    $AR_REPO"
echo "Deployer:   $DEPLOYER_SA"
echo "Runtime SA: $RUNTIME_SA"
echo

command -v gcloud >/dev/null || { echo "❌ gcloud not found"; exit 1; }

echo "🏗️  Set project"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "🔌 Enable APIs"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com iam.googleapis.com >/dev/null

echo "📦 Ensure Artifact Registry repo '$AR_REPO'"
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Docker images for Flexboard" \
  2>/dev/null || echo "ℹ️  Repo already exists"

echo "👤 Create Service Accounts (if not exist)"
gcloud iam service-accounts create "$DEPLOYER_ID" --display-name="Bitbucket Pipelines Deployer" 2>/dev/null || echo "ℹ️  $DEPLOYER_SA exists"
gcloud iam service-accounts create "$RUNTIME_ID"  --display-name="Cloud Run Runtime"             2>/dev/null || echo "ℹ️  $RUNTIME_SA exists"

echo "🔒 Grant roles to Deployer SA"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/run.admin" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/artifactregistry.writer" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/cloudbuild.builds.editor" >/dev/null

echo "🤝 Allow Deployer to 'run as' Runtime SA"
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/iam.serviceAccountUser" >/dev/null

echo "🔑 Create key for Deployer SA (for Bitbucket)"
KEY_JSON="bitbucket-deployer-key.json"
gcloud iam service-accounts keys create "$KEY_JSON" \
  --iam-account="$DEPLOYER_SA" >/dev/null

# base64 single-line (macOS vs Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  BASE64_KEY="$(base64 -i "$KEY_JSON" | tr -d '\n')"
else
  BASE64_KEY="$(base64 -w 0 "$KEY_JSON")"
fi

echo
echo "✅ Done. Put these in Bitbucket → Repository settings → Variables"
echo "-----------------------------------------------------------------"
echo "GCP_PROJECT=$PROJECT_ID"
echo "GCP_REGION=$REGION"
echo "AR_REPO=$AR_REPO"
echo "GCP_SA_EMAIL=$DEPLOYER_SA"
echo "GCP_SA_KEY_BASE64=<secure>  # copy from clipboard or below"
echo

# Copy to clipboard on macOS for convenience
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -n "$BASE64_KEY" | pbcopy
  echo "📋 The base64 key has been copied to your clipboard (macOS)."
else
  echo "🔐 BASE64 KEY (copy all, mark Secure in Bitbucket):"
  echo "$BASE64_KEY"
fi

echo
echo "🧹 Clean up local key file after setting Bitbucket variables:"
echo "rm $KEY_JSON"