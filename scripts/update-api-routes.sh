#!/bin/bash

# Script to update all API route files to use envConfig instead of hardcoded API_BASE_URL

echo "🔄 Updating API route files to use envConfig..."

# Define the files that need to be updated
files=(
  "apps/control-plane-ui/src/app/api/tenants/[tenantId]/route.ts"
  "apps/control-plane-ui/src/app/api/tenants/[tenantId]/dashboards/route.ts"
  "apps/control-plane-ui/src/app/api/tenants/[tenantId]/dashboards/[dashboardId]/route.ts"
  "apps/control-plane-ui/src/app/api/dashboards/[dashboardId]/metadata/route.ts"
  "apps/control-plane-ui/src/app/api/metadata/[versionId]/publish/route.ts"
)

# For each file, replace the import and API_BASE_URL usage
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Updating $file..."
    
    # Replace the import line and API_BASE_URL declaration
    sed -i '' '1s/^/import { envConfig } from "@\/config\/env";\n/' "$file"
    sed -i '' '/const API_BASE_URL = process\.env\.NEXT_PUBLIC_API_URL/d' "$file"
    
    # Replace all API_BASE_URL usage with envConfig.apiUrl
    sed -i '' 's/API_BASE_URL/envConfig.apiUrl/g' "$file"
    
    echo "✅ Updated $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "🎉 All API route files updated successfully!"
