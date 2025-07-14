# Flexboard Control Plane API Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src ./src/
COPY tsconfig.json ./

# Generate Prisma client and build TypeScript
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy built application and Prisma files
COPY --from=base /app/dist ./dist/
COPY --from=base /app/src/generated ./src/generated/
COPY prisma ./prisma/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S flexboard -u 1001

USER flexboard

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["pnpm", "start"]
