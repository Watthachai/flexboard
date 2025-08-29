#!/bin/bash

# FlexBoard Complete Flow Demo
# Shows the real relationship between Firebase API Key and OnPrem deployment

echo "🚀 FlexBoard Complete Development & Deployment Flow"
echo "=================================================="
echo ""

# Configuration
TENANT_ID="vpi-co-ltd"
TENANT_API_KEY="tenant-1753950967508-84yme8k73"
CONTROL_PLANE_API="http://localhost:3000"
ONPREM_AGENT="http://localhost:3001"
ONPREM_VIEWER="http://localhost:3002"

echo "📋 System Configuration:"
echo "   Tenant ID: ${TENANT_ID}"
echo "   Tenant API Key: ${TENANT_API_KEY}"
echo "   Control Plane API: ${CONTROL_PLANE_API}"
echo "   OnPrem Agent: ${ONPREM_AGENT}"
echo "   OnPrem Viewer: ${ONPREM_VIEWER}"

echo ""
echo "🏗️ Phase 1: Development Team Setup (Your Work)"
echo "=============================================="

echo ""
echo "Step 1.1: Create Tenant in Control Plane UI..."
echo "   ✓ Navigate to: http://localhost:3003/tenants"
echo "   ✓ Create tenant with ID: ${TENANT_ID}"
echo "   ✓ Generate API Key: ${TENANT_API_KEY}"
echo "   ✓ Purpose: OnPrem Agent authentication with Control Plane"

echo ""
echo "Step 1.2: Create Dashboards for Tenant..."
echo "   ✓ Sales Dashboard"
echo "   ✓ Analytics Dashboard"
echo "   ✓ Performance Dashboard"
echo "   ✓ All stored in Control Plane (Firebase)"

echo ""
echo "Step 1.3: Generate OnPrem Licenses..."
echo "   ✓ License for Customer A: Sales + Analytics access"
echo "   ✓ License for Customer B: Analytics only access"
echo "   ✓ License for Customer C: All dashboards access"

echo ""
echo "🏭 Phase 2: Customer Deployment (Customer Environment)"
echo "===================================================="

echo ""
echo "Step 2.1: Package OnPrem for Customer..."
echo "   📦 OnPrem Agent API:"
echo "      • Pre-configured with tenant API key: ${TENANT_API_KEY}"
echo "      • Points to Control Plane: ${CONTROL_PLANE_API}"
echo "      • Port: 3001"
echo ""
echo "   📦 OnPrem Viewer UI:"
echo "      • Login interface for license key entry"
echo "      • Dashboard display interface"
echo "      • Points to local OnPrem Agent: ${ONPREM_AGENT}"
echo "      • Port: 3002"

echo ""
echo "Step 2.2: Customer Installation..."
echo "   ✓ Customer installs both OnPrem packages"
echo "   ✓ OnPrem Agent starts with embedded tenant API key"
echo "   ✓ OnPrem Agent connects to Control Plane for data"

echo ""
echo "🔑 Phase 3: API Key Usage Demonstration"
echo "======================================="

echo ""
echo "Step 3.1: OnPrem Agent Authenticates with Control Plane..."

# Test OnPrem Agent authentication with Control Plane
echo ""
echo "   Testing OnPrem → Control Plane connection:"

DASHBOARD_RESPONSE=$(curl -s -X GET "${CONTROL_PLANE_API}/api/tenants/${TENANT_ID}/dashboards/list" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TENANT_API_KEY}" \
  -H "X-Tenant-ID: ${TENANT_ID}")

if echo "${DASHBOARD_RESPONSE}" | grep -q '"success":true' 2>/dev/null; then
    echo "   ✅ OnPrem Agent successfully authenticated with Control Plane"
    echo "   🔑 Using Tenant API Key: ${TENANT_API_KEY}"
else
    echo "   ⚠️  Control Plane API not available (this is normal in demo)"
    echo "   🔑 Would use Tenant API Key: ${TENANT_API_KEY}"
fi

echo ""
echo "Step 3.2: Customer Uses License Key..."
echo "   👤 Customer opens OnPrem Viewer: ${ONPREM_VIEWER}"
echo "   🔑 Customer enters license key: FLX-VPI-CO-LTD-20240801-ABC123"
echo "   📧 Customer enters email: customer@company.com"

echo ""
echo "Step 3.3: License Validation & Data Flow..."
echo "   1️⃣  OnPrem Viewer → OnPrem Agent (license validation)"
echo "   2️⃣  OnPrem Agent → Control Plane (using tenant API key)"
echo "   3️⃣  Control Plane → OnPrem Agent (permitted dashboard data)"
echo "   4️⃣  OnPrem Agent → OnPrem Viewer (filtered data)"
echo "   5️⃣  OnPrem Viewer → Customer (display dashboards)"

echo ""
echo "🎯 Key Insights"
echo "==============="

echo ""
echo "   🔑 Firebase Tenant API Key:"
echo "      • Purpose: OnPrem Agent ↔ Control Plane authentication"
echo "      • Location: Embedded in OnPrem Agent configuration"
echo "      • Usage: Every API call from OnPrem to Control Plane"
echo "      • NOT used by: End users or for license validation"

echo ""
echo "   🎫 License Key:"
echo "      • Purpose: End user ↔ Dashboard access control"
echo "      • Location: Entered by customer in OnPrem Viewer UI"
echo "      • Usage: Determines which dashboards customer can see"
echo "      • NOT used for: OnPrem ↔ Control Plane authentication"

echo ""
echo "   🏗️ Architecture Summary:"
echo "      • OnPrem Viewer: Pure UI display layer"
echo "      • OnPrem Agent: Data proxy with tenant API key"
echo "      • Control Plane: Data source and permission authority"
echo "      • Tenant API Key: Machine-to-machine authentication"
echo "      • License Key: User-to-data access control"

echo ""
echo "📁 File Locations"
echo "================"

echo ""
echo "   OnPrem Agent Configuration:"
echo "      📄 /apps/onprem-agent-api/config.json"
echo "      {" 
echo "        \"tenant\": {"
echo "          \"id\": \"${TENANT_ID}\","
echo "          \"apiKey\": \"${TENANT_API_KEY}\""
echo "        }"
echo "      }"

echo ""
echo "   Control Plane URLs:"
echo "      🌐 Admin UI: http://localhost:3003/tenants/${TENANT_ID}"
echo "      🔧 API: ${CONTROL_PLANE_API}/api/tenants/${TENANT_ID}"

echo ""
echo "   Customer URLs:"
echo "      👤 OnPrem Viewer: ${ONPREM_VIEWER}"
echo "      🔌 OnPrem Agent: ${ONPREM_AGENT}"

echo ""
echo "✅ Complete Flow Understanding Achieved!"
echo ""
echo "🔄 Summary:"
echo "   1. Development Team creates tenant and generates API key"
echo "   2. API key is embedded in OnPrem package for customer"
echo "   3. Customer installs OnPrem with embedded API key"
echo "   4. OnPrem uses API key to authenticate with Control Plane"
echo "   5. End users use license keys to access specific dashboards"
echo ""
