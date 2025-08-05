/**
 * Seed Dashboard Data Script
 * Creates sample dashboards in tenant subcollections
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin with environment variables
if (!process.env.FIREBASE_PROJECT_ID) {
  require("dotenv").config();
}

const firebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "flexboard-db736",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

try {
  initializeApp({
    credential: cert(firebaseConfig),
  });
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  process.exit(1);
}

const db = getFirestore();

// Sample dashboard configurations
const sampleDashboards = {
  "test-company": [
    {
      id: "sales-dashboard",
      name: "Sales Dashboard",
      slug: "sales-dashboard",
      description: "Real-time sales performance metrics and analytics",
      tenantId: "test-company",
      isActive: true,
      createdBy: "admin",
      updatedBy: "admin",
      visualConfig: {
        layout: {
          columns: 24,
          rows: 16,
          gridSize: 40,
        },
        widgets: [
          {
            id: "total-revenue",
            type: "metric",
            title: "Total Revenue",
            value: "$2,543,892",
            change: "+12.5%",
            trend: "up",
            position: { x: 0, y: 0, w: 6, h: 4 },
          },
          {
            id: "monthly-sales",
            type: "chart",
            title: "Monthly Sales Trend",
            chartType: "line",
            data: [
              { month: "Jan", value: 45000 },
              { month: "Feb", value: 52000 },
              { month: "Mar", value: 48000 },
              { month: "Apr", value: 61000 },
              { month: "May", value: 55000 },
              { month: "Jun", value: 67000 },
            ],
            position: { x: 6, y: 0, w: 12, h: 8 },
          },
          {
            id: "top-products",
            type: "table",
            title: "Top Products Performance",
            columns: ["Product", "Sales", "Growth"],
            data: [
              ["Product A", "$125,000", "+8.2%"],
              ["Product B", "$98,000", "+12.1%"],
              ["Product C", "$87,000", "-2.3%"],
              ["Product D", "$156,000", "+15.7%"],
              ["Product E", "$89,000", "+3.4%"],
            ],
            position: { x: 18, y: 0, w: 6, h: 8 },
          },
        ],
      },
    },
    {
      id: "analytics-dashboard",
      name: "Analytics Dashboard",
      slug: "analytics-dashboard",
      description: "User engagement and website analytics",
      tenantId: "test-company",
      isActive: true,
      createdBy: "admin",
      updatedBy: "admin",
      visualConfig: {
        layout: {
          columns: 24,
          rows: 16,
          gridSize: 40,
        },
        widgets: [
          {
            id: "active-users",
            type: "metric",
            title: "Active Users",
            value: "24,567",
            change: "+5.2%",
            trend: "up",
            position: { x: 0, y: 0, w: 6, h: 4 },
          },
          {
            id: "user-engagement",
            type: "chart",
            title: "User Engagement Analytics",
            chartType: "bar",
            data: [
              { category: "Page Views", value: 152000 },
              { category: "Sessions", value: 89000 },
              { category: "Bounce Rate", value: 2.3 },
              { category: "Avg Session Duration", value: 185 },
            ],
            position: { x: 6, y: 0, w: 12, h: 8 },
          },
          {
            id: "traffic-sources",
            type: "chart",
            title: "Traffic Sources",
            chartType: "pie",
            data: [
              { name: "Organic Search", value: 40 },
              { name: "Direct", value: 25 },
              { name: "Social Media", value: 20 },
              { name: "Email", value: 15 },
            ],
            position: { x: 18, y: 0, w: 6, h: 8 },
          },
        ],
      },
    },
  ],
  "vpi-co-ltd": [
    {
      id: "company-overview",
      name: "Company Overview Dashboard",
      slug: "company-overview",
      description: "VPI Co.Ltd company performance overview",
      tenantId: "vpi-co-ltd",
      isActive: true,
      createdBy: "admin",
      updatedBy: "admin",
      visualConfig: {
        layout: {
          columns: 24,
          rows: 16,
          gridSize: 40,
        },
        widgets: [
          {
            id: "annual-revenue",
            type: "metric",
            title: "Annual Revenue",
            value: "$8,750,000",
            change: "+18.3%",
            trend: "up",
            position: { x: 0, y: 0, w: 6, h: 4 },
          },
          {
            id: "quarterly-performance",
            type: "chart",
            title: "Quarterly Performance",
            chartType: "bar",
            data: [
              { quarter: "Q1", revenue: 2100000, profit: 420000 },
              { quarter: "Q2", revenue: 2250000, profit: 465000 },
              { quarter: "Q3", revenue: 2180000, profit: 445000 },
              { quarter: "Q4", revenue: 2320000, profit: 495000 },
            ],
            position: { x: 6, y: 0, w: 18, h: 8 },
          },
        ],
      },
    },
  ],
};

async function seedDashboards() {
  try {
    console.log("🌱 Starting dashboard seeding...");

    for (const [tenantId, dashboards] of Object.entries(sampleDashboards)) {
      console.log(`\n📊 Creating dashboards for tenant: ${tenantId}`);

      for (const dashboard of dashboards) {
        try {
          const dashboardRef = db
            .collection("tenants")
            .doc(tenantId)
            .collection("dashboards")
            .doc(dashboard.id);

          const dashboardData = {
            ...dashboard,
            // Convert visualConfig to JSON string to avoid Firestore nested object issues
            visualConfig: JSON.stringify(dashboard.visualConfig),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await dashboardRef.set(dashboardData);
          console.log(`  ✅ Created dashboard: ${dashboard.name}`);
        } catch (error) {
          console.error(
            `  ❌ Error creating dashboard ${dashboard.name}:`,
            error
          );
        }
      }
    }

    console.log("\n🎉 Dashboard seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding dashboards:", error);
    process.exit(1);
  }
}

// Run the seeding
seedDashboards();
