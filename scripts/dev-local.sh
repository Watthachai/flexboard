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
- On-Premise Agent API (localhost:3001) 
- On-Premise Viewer UI (localhost:3002)
- Control Plane UI (localhost:3003)

Press Ctrl+C to stop all services
"

# Start all development servers with Turbo
pnpm turbo dev

echo "✅ All services stopped"
