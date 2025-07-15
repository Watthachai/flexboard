#!/usr/bin/env node

/**
 * Environment validation script for Flexboard
 * Validates that all required environment variables are present
 */

const fs = require("fs");
const path = require("path");

// Define required environment variables for each service
const serviceConfigs = {
  "apps/control-plane-api": {
    required: ["DATABASE_URL", "JWT_SECRET", "PORT"],
    optional: ["NODE_ENV", "CORS_ORIGINS", "HOST"],
  },
  "apps/control-plane-ui": {
    required: ["NEXT_PUBLIC_API_URL"],
    optional: ["NEXT_PUBLIC_APP_NAME", "NEXT_PUBLIC_ENVIRONMENT"],
  },
  "apps/onprem-agent-api": {
    required: ["DATABASE_URL", "PORT"],
    optional: ["NODE_ENV", "CONTROL_PLANE_URL", "AGENT_ID"],
  },
  "apps/onprem-viewer-ui": {
    required: ["NEXT_PUBLIC_API_URL"],
    optional: ["NEXT_PUBLIC_TENANT_ID", "NEXT_PUBLIC_API_KEY"],
  },
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  content.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  });

  return env;
}

function validateService(servicePath, config) {
  console.log(`\n🔍 Validating ${servicePath}...`);

  const envFiles = [
    path.join(servicePath, ".env"),
    path.join(servicePath, ".env.local"),
    path.join(servicePath, ".env.development"),
  ];

  let allEnvVars = {};

  // Load environment variables from all possible files
  envFiles.forEach((envFile) => {
    if (fs.existsSync(envFile)) {
      const envVars = loadEnvFile(envFile);
      allEnvVars = { ...allEnvVars, ...envVars };
      console.log(`  ✅ Found ${envFile}`);
    }
  });

  // Check required variables
  const missing = [];
  config.required.forEach((varName) => {
    if (!allEnvVars[varName] && !process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.log(`  ❌ Missing required variables: ${missing.join(", ")}`);
    return false;
  } else {
    console.log(`  ✅ All required variables present`);
  }

  // Check optional variables
  const missingOptional = [];
  config.optional.forEach((varName) => {
    if (!allEnvVars[varName] && !process.env[varName]) {
      missingOptional.push(varName);
    }
  });

  if (missingOptional.length > 0) {
    console.log(
      `  ⚠️  Missing optional variables: ${missingOptional.join(", ")}`
    );
  }

  return true;
}

function main() {
  console.log("🚀 Flexboard Environment Validation");
  console.log("=====================================");

  let allValid = true;

  Object.entries(serviceConfigs).forEach(([servicePath, config]) => {
    if (fs.existsSync(servicePath)) {
      const isValid = validateService(servicePath, config);
      allValid = allValid && isValid;
    } else {
      console.log(`\n⚠️  Service directory not found: ${servicePath}`);
    }
  });

  console.log("\n=====================================");
  if (allValid) {
    console.log("✅ Environment validation passed!");
    process.exit(0);
  } else {
    console.log("❌ Environment validation failed!");
    console.log("\n💡 Tips:");
    console.log("   - Copy .env.example files to .env");
    console.log("   - Run: npm run env:setup");
    console.log("   - Check documentation for required variables");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateService, loadEnvFile };
