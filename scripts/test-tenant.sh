#!/bin/bash
# Test Tenant Functions (On-Premise) - Using Turbo

echo "🏢 Testing Tenant Functions with Turbo..."

# Set tenant configuration
export CONTROL_PLANE_URL="https://flexboard-control-plane.onrender.com"
export TENANT_API_KEY="your-api-key-here"

echo "1️⃣ Building all apps with Turbo"
pnpm turbo build

echo "2️⃣ Starting On-Premise Agent with Turbo"
# Start agent in background using Turbo
pnpm turbo dev --filter=onprem-agent-api &
AGENT_PID=$!

# Wait for agent to start
sleep 8

echo "3️⃣ Testing Agent Sync"
curl -s http://localhost:3001/api/sync | jq '.'

echo -e "\n4️⃣ Testing Data Endpoints"
curl -s http://localhost:3001/api/data | jq '.'

echo -e "\n5️⃣ Starting Viewer Dashboard with Turbo"
pnpm turbo dev --filter=onprem-viewer-ui &
VIEWER_PID=$!

echo "6️⃣ Dashboard should be available at: http://localhost:3000"

echo "✅ Tenant testing environment ready!"
echo "🔄 Agent PID: $AGENT_PID"
echo "🖥️  Viewer PID: $VIEWER_PID"

# Wait for user input before cleanup
echo "Press any key to stop all services..."
read -n 1

# Cleanup function
cleanup() {
  echo "🧹 Cleaning up..."
  kill $AGENT_PID 2>/dev/null
  kill $VIEWER_PID 2>/dev/null
  # Kill any remaining turbo processes
  pkill -f "turbo dev" 2>/dev/null
}

cleanup
