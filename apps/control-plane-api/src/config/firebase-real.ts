/**
 * Firebase Admin SDK Configuration (Real Firebase)
 * ใช้ Firebase Admin SDK จริงด้วย Service Account Key
 */

// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { envConfig } from "./env";

// Initialize Firebase Admin SDK
let app;

if (getApps().length === 0) {
  try {
    // Validate required environment variables
    const requiredEnvVars = [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_PRIVATE_KEY_ID",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_CLIENT_ID",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required Firebase environment variables: ${missingVars.join(
          ", "
        )}`
      );
    }

    // สร้าง Service Account Credentials จาก Environment Variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri:
        process.env.FIREBASE_AUTH_URI ||
        "https://accounts.google.com/o/oauth2/auth",
      token_uri:
        process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url:
        process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
        "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    console.log("🔥 Initializing Firebase Admin SDK...");
    console.log("📋 Project ID:", process.env.FIREBASE_PROJECT_ID);
    console.log("📧 Service Account Email:", process.env.FIREBASE_CLIENT_EMAIL);

    app = initializeApp({
      credential: cert(serviceAccount as any),
      projectId: process.env.FIREBASE_PROJECT_ID,
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
    });

    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    throw error;
  }
} else {
  app = getApps()[0];
  console.log("♻️  Using existing Firebase app");
}

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Collection names
export const COLLECTIONS = {
  TENANTS: "tenants",
  DASHBOARDS: "dashboards",
  WIDGETS: "widgets",
  METADATA_VERSIONS: "metadataVersions",
  SYNC_LOGS: "syncLogs",
  LICENSES: "licenses", // สำหรับเก็บ License Keys
  USER_SESSIONS: "userSessions", // สำหรับติดตาม User Sessions
  USERS: "users", // สำหรับเก็บข้อมูล User แบบเต็ม (Control Plane เท่านั้น)
} as const;

// Firebase connection test
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log("🔍 Testing Firebase connection...");

    // Test write and read
    const testRef = db.collection("_health").doc("connection_test");
    await testRef.set({
      timestamp: new Date(),
      test: "connection_successful",
      environment: process.env.NODE_ENV || "development",
    });

    const testDoc = await testRef.get();
    const testData = testDoc.data();

    console.log("✅ Firebase connection test successful:", {
      exists: testDoc.exists,
      data: testData,
    });

    // Clean up test document
    await testRef.delete();

    return true;
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
    return false;
  }
};

export default app;
