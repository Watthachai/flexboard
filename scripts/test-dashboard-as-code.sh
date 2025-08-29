#!/bin/bash

# Dashboard as Code - Create Example E-commerce Dashboard
echo "🛍️ Creating E-commerce Dashboard for test-company..."

curl -X POST http://localhost:3000/api/tenants/test-company/dashboards \
  -H "Content-Type: application/json" \
  -d @examples/ecommerce-dashboard.json \
  | jq '.'

echo -e "\n✅ Dashboard creation completed!"

echo -e "\n📊 Fetching all dashboards for test-company..."
curl -X GET http://localhost:3000/api/tenants/test-company/dashboards \
  | jq '.data[] | {id, name, description}'

echo -e "\n🎉 Dashboard as Code test completed!"
