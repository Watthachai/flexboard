#!/bin/bash
# Test Admin Functions (Control Plane) - Using Turbo

CONTROL_PLANE_URL="https://flexboard-control-plane.onrender.com"

echo "🔧 Testing Admin Functions with Turbo..."

echo "1️⃣ Testing Health Check"
curl -s "${CONTROL_PLANE_URL}/health" | jq '.'

echo -e "\n2️⃣ Building Control Plane locally for testing"
pnpm turbo build --filter=control-plane-api

echo -e "\n3️⃣ Creating Test Tenant"
TENANT_RESPONSE=$(curl -s -X POST "${CONTROL_PLANE_URL}/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company Ltd",
    "slug": "test-company",
    "email": "admin@testcompany.com"
  }')

echo $TENANT_RESPONSE | jq '.'

# Extract API key from response
API_KEY=$(echo $TENANT_RESPONSE | jq -r '.api_key')
echo "Generated API Key: $API_KEY"

echo -e "\n4️⃣ Testing Tenant Authentication"
AUTH_RESPONSE=$(curl -s -X POST "${CONTROL_PLANE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testcompany.com",
    "password": "temp-password"
  }')

echo $AUTH_RESPONSE | jq '.'

echo -e "\n5️⃣ Creating Dashboard Configuration"
curl -s -X POST "${CONTROL_PLANE_URL}/api/dashboards" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Dashboard",
    "slug": "test-dash",
    "description": "Test dashboard for demo",
    "widgets": [
      {
        "name": "Sales KPI",
        "type": "kpi",
        "config": {
          "query": "SELECT COUNT(*) as total_sales FROM orders",
          "format": "number"
        }
      }
    ]
  }' | jq '.'

echo "✅ Admin testing complete!"
