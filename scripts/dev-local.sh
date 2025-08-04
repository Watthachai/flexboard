#!/bin/bash
# Local Development with Turbo

echo "🚀 Starting Flexboard Local Development Environment"

echo "1️⃣ Installing dependencies..."
pnpm install

echo "2️⃣ Building all packages..."
pnpm turbo build

echo "3️⃣ Starting all development servers..."
echo "
📋 Services that will start:
- Control Plane API (localhost:3000)
- Control Plane UI (localhost:3001)
- OnPrem Viewer UI (localhost:3002)

Press Ctrl+C to stop all services
"

# Start all development servers with Turbo
pnpm turbo dev

echo "✅ All services stopped"
