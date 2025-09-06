#!/usr/bin/env node

/**
 * Show Network IP Script
 * Displays local network IP addresses for OnPrem access
 */

import os from "os";

function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const networkInterface of interfaces[name]) {
      // Skip over non-IPv4 and internal addresses
      if (networkInterface.family === "IPv4" && !networkInterface.internal) {
        ips.push({
          interface: name,
          address: networkInterface.address,
        });
      }
    }
  }

  return ips;
}

console.log("\n🌐 FlexBoard OnPrem Network Access Information");
console.log("==============================================");

const networkIPs = getNetworkIPs();

console.log("\n📍 Server is running on:");
console.log(`   • Local:   http://localhost:3002`);

if (networkIPs.length > 0) {
  console.log("\n🔗 Network Access URLs (for other computers):");
  networkIPs.forEach((ip) => {
    console.log(`   • ${ip.interface}: http://${ip.address}:3002`);
  });

  console.log("\n📋 Share these URLs with other computers on your network:");
  networkIPs.forEach((ip) => {
    console.log(`   http://${ip.address}:3002`);
  });
} else {
  console.log("\n⚠️  No network interfaces found");
}

console.log("\n💡 Instructions:");
console.log("   1. Copy one of the network URLs above");
console.log("   2. Open it in a web browser on another computer");
console.log("   3. Make sure both computers are on the same network");

console.log("\n🔥 Firewall Check:");
console.log("   If other computers cannot access, check firewall settings:");
const platform = os.platform();
if (platform === "win32") {
  console.log(
    '   Windows: netsh advfirewall firewall add rule name="FlexBoard" dir=in action=allow protocol=TCP localport=3002'
  );
} else if (platform === "linux") {
  console.log("   Linux: sudo ufw allow 3002");
} else if (platform === "darwin") {
  console.log("   macOS: Usually no firewall changes needed");
}

console.log("\n✅ FlexBoard OnPrem is ready for network access!\n");
