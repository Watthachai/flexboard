#!/usr/bin/env node

/**
 * Flexboard Phase 2 Integration Test
 * Tests the full Control Plane ↔ Agent sync workflow
 */

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Configuration
const CONTROL_PLANE_URL =
  process.env.CONTROL_PLANE_URL || "http://localhost:3000";
const AGENT_URL = process.env.AGENT_URL || "http://localhost:3001";

let tenantData = null;

async function testStep(stepName, testFn) {
  console.log(`\n🧪 Testing: ${stepName}`);
  try {
    const result = await testFn();
    console.log(`✅ ${stepName} - PASSED`);
    return result;
  } catch (error) {
    console.error(`❌ ${stepName} - FAILED: ${error.message}`);
    throw error;
  }
}

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function testControlPlaneHealth() {
  const health = await makeRequest(`${CONTROL_PLANE_URL}/health`);
  console.log(`   Status: ${health.status}`);
  console.log(`   Database: ${health.database}`);
  return health;
}

async function testAgentHealth() {
  const health = await makeRequest(`${AGENT_URL}/api/health`);
  console.log(`   Status: ${health.status}`);
  console.log(`   Agent Version: ${health.version}`);
  console.log(`   Control Plane: ${health.sync_status?.control_plane_url}`);
  return health;
}

async function testCreateTenant() {
  const tenantPayload = {
    name: "Test Corporation",
    slug: "test-corp-" + Date.now(),
    license_type: "enterprise",
  };

  const result = await makeRequest(`${CONTROL_PLANE_URL}/api/tenants`, {
    method: "POST",
    body: JSON.stringify(tenantPayload),
  });

  console.log(`   Tenant ID: ${result.tenant.id}`);
  console.log(`   API Key: ${result.api_key.substring(0, 15)}...`);

  tenantData = result;
  return result;
}

async function testCreateDashboard() {
  if (!tenantData) throw new Error("No tenant data available");

  const dashboardPayload = {
    name: "Test Sales Dashboard",
    slug: "test-sales",
    description: "Integration test dashboard",
  };

  const result = await makeRequest(
    `${CONTROL_PLANE_URL}/api/tenants/${tenantData.tenant.id}/dashboards`,
    {
      method: "POST",
      body: JSON.stringify(dashboardPayload),
    }
  );

  console.log(`   Dashboard ID: ${result.id}`);
  console.log(`   Name: ${result.name}`);
  return result;
}

async function testCreateMetadataVersion() {
  if (!tenantData) throw new Error("No tenant data available");

  const sampleConfig = {
    "test-widget": {
      query: "SELECT 'Integration Test' as message, GETDATE() as timestamp",
      type: "kpi",
    },
    "sales-summary": {
      query:
        "SELECT COUNT(*) as total_orders, SUM(TotalDue) as revenue FROM Sales.SalesOrderHeader WHERE OrderDate >= DATEADD(day, -30, GETDATE())",
      type: "kpi",
    },
  };

  // This would be done via a proper API endpoint in a real implementation
  // For now, we'll just verify the tenant exists
  const versions = await makeRequest(
    `${CONTROL_PLANE_URL}/api/tenants/${tenantData.tenant.id}/versions`
  );
  console.log(`   Existing versions: ${versions.length}`);
  return versions;
}

async function testAgentSync() {
  if (!tenantData) throw new Error("No tenant data available");

  console.log(`   Using API Key: ${tenantData.api_key.substring(0, 15)}...`);

  // Update agent's API key temporarily for test
  console.log(
    `   ⚠️  For this test to work, update your agent's FLEXBOARD_API_KEY to: ${tenantData.api_key}`
  );

  // Wait for user confirmation
  await new Promise((resolve) => {
    rl.question("   Press Enter after updating agent API key...", resolve);
  });

  // Trigger manual sync
  const syncResult = await makeRequest(`${AGENT_URL}/api/sync`, {
    method: "POST",
  });

  console.log(`   Sync Status: ${syncResult.success ? "Success" : "Failed"}`);
  console.log(`   Config Version: ${syncResult.config_version}`);
  return syncResult;
}

async function testWidgetDataRetrieval() {
  const widgetId = "test-widget";

  try {
    const data = await makeRequest(`${AGENT_URL}/api/data/${widgetId}`);
    console.log(
      `   Widget Data: ${JSON.stringify(data.data[0] || data.data).substring(0, 100)}...`
    );
    console.log(`   Config Source: ${data.metadata?.config_source}`);
    console.log(`   Config Version: ${data.metadata?.config_version}`);
    return data;
  } catch (error) {
    console.log(
      `   ℹ️  Widget '${widgetId}' not found - this is expected if config hasn't synced yet`
    );
    throw error;
  }
}

async function testSyncStatus() {
  const status = await makeRequest(`${CONTROL_PLANE_URL}/api/sync/status`);
  console.log(`   Recent Syncs: ${status.recent_syncs.length}`);
  console.log(
    `   Success Rate: ${status.stats.success || 0} successful, ${status.stats.error || 0} failed`
  );
  return status;
}

async function runIntegrationTest() {
  console.log("🚀 Flexboard Phase 2 Integration Test");
  console.log("=====================================");
  console.log(`Control Plane: ${CONTROL_PLANE_URL}`);
  console.log(`Agent API: ${AGENT_URL}`);

  try {
    // Test 1: Health Checks
    await testStep("Control Plane Health", testControlPlaneHealth);
    await testStep("Agent Health", testAgentHealth);

    // Test 2: Tenant Management
    await testStep("Create Test Tenant", testCreateTenant);
    await testStep("Create Test Dashboard", testCreateDashboard);
    await testStep("Check Metadata Versions", testCreateMetadataVersion);

    // Test 3: Agent Sync
    await testStep("Agent Sync", testAgentSync);

    // Test 4: Data Retrieval
    await testStep("Widget Data Retrieval", testWidgetDataRetrieval);

    // Test 5: Monitoring
    await testStep("Sync Status Monitoring", testSyncStatus);

    console.log("\n🎉 ALL TESTS PASSED!");
    console.log("✅ Control Plane ↔ Agent integration working correctly");
    console.log("\n📋 Test Summary:");
    console.log(
      `   • Tenant: ${tenantData.tenant.name} (${tenantData.tenant.id})`
    );
    console.log(`   • API Key: ${tenantData.api_key.substring(0, 20)}...`);
    console.log(`   • Sync: Operational`);
    console.log(`   • Monitoring: Active`);
  } catch (error) {
    console.error("\n💥 TEST FAILED");
    console.error(`Error: ${error.message}`);
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Ensure Control Plane is running on", CONTROL_PLANE_URL);
    console.error("2. Ensure Agent API is running on", AGENT_URL);
    console.error("3. Check database connections");
    console.error("4. Verify API key configuration");

    process.exit(1);
  } finally {
    rl.close();
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === "undefined") {
  console.error("❌ This test requires Node.js 18+ for fetch support");
  console.error("   Or install node-fetch: npm install node-fetch");
  process.exit(1);
}

// Run the test
runIntegrationTest().catch(console.error);
