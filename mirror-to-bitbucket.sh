#!/bin/bash
# 🪞 Mirror GitHub → Bitbucket (Flexboard + Onprem)
# ใช้งาน: bash mirror-to-bitbucket.sh

set -e

source .env

# ✅ Repository URLs
MAIN_REPO="https://bitbucket.org/digitalvalueth/flexboard.git"
ONPREM_REPO="https://bitbucket.org/digitalvalueth/flexboard-onprem.git"

# ✅ แสดง branch ปัจจุบัน
CURRENT_BRANCH=$(git branch --show-current)
echo "🔹 Current branch: $CURRENT_BRANCH"

# ✅ ตรวจสอบว่ามี token หรือไม่
if [ -z "$BB_USERNAME" ] || [ -z "$BB_TOKEN" ]; then
  echo "❌ Missing BB_USERNAME or BB_TOKEN in .env"
  exit 1
fi

# ✅ Mirror main repo
echo "🚀 Pushing $CURRENT_BRANCH → flexboard (Bitbucket)"
git remote remove bitbucket 2>/dev/null || true
git remote add bitbucket https://$BB_USERNAME:$BB_TOKEN@${MAIN_REPO#https://}
git push bitbucket $CURRENT_BRANCH --follow-tags --force

# ✅ Mirror onprem repo (เฉพาะโฟลเดอร์ apps/onprem-viewer)
if [ -d "apps/onprem-viewer" ]; then
  echo "🧩 Creating subtree for apps/onprem-viewer..."
  COMMIT=$(git subtree split --prefix=apps/onprem-viewer)
  echo "🚀 Pushing subtree → flexboard-onprem (Bitbucket)"
  git remote remove bitbucket-onprem 2>/dev/null || true
  git remote add bitbucket-onprem https://$BB_USERNAME:$BB_TOKEN@${ONPREM_REPO#https://}
  git push bitbucket-onprem $COMMIT:$CURRENT_BRANCH --force
else
  echo "⚠️ Directory apps/onprem-viewer not found, skipping..."
fi

echo "✅ Mirror complete! All done ✨"