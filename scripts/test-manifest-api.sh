#!/bin/bash

# Test Script for Dashboard Manifest API
# Run from project root

echo "🧪 Testing Dashboard Manifest API..."

BASE_URL="http://localhost:8000"
TENANT_ID="vpi-co-ltd"

echo ""
echo "1. 📋 Testing GET /api/tenants/$TENANT_ID/dashboards/manifests"
curl -X GET "$BASE_URL/api/tenants/$TENANT_ID/dashboards/manifests" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "2. ➕ Testing POST /api/tenants/$TENANT_ID/dashboards/manifests"
curl -X POST "$BASE_URL/api/tenants/$TENANT_ID/dashboards/manifests" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Sales Dashboard",
    "description": "A test dashboard created via API",
    "targetTeams": ["sales", "management"],
    "manifestContent": "{\"schemaVersion\":\"1.0\",\"dashboardId\":\"\",\"dashboardName\":\"Test Sales Dashboard\",\"description\":\"A test dashboard\",\"version\":1,\"targetTeams\":[\"sales\"],\"layout\":{\"type\":\"grid\",\"columns\":12,\"rowHeight\":60},\"widgets\":[{\"id\":\"test-kpi\",\"title\":\"Test KPI\",\"type\":\"kpi-card\",\"position\":{\"x\":0,\"y\":0,\"w\":3,\"h\":2},\"dataSourceId\":\"test_data\"}],\"dataSources\":[{\"id\":\"test_data\",\"type\":\"sql\",\"query\":\"SELECT 1 as value\"}]}"
  }' \
  | jq '.'

echo ""
echo "3. 📄 Testing GET manifest content (replace DASHBOARD_ID with actual ID from step 2)"
echo "curl -X GET \"$BASE_URL/api/tenants/$TENANT_ID/dashboards/DASHBOARD_ID/manifest\""

echo ""
echo "✅ Test completed! Check the API server logs for any errors."
