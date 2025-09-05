# Multi-stage build for OnPrem Viewer
FROM node:20 AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code  
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Build TypeScript scripts
RUN npx tsc scripts/cron-worker.ts --outDir dist --target es2020 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Create directories
RUN mkdir -p /app/data /app/dist
RUN chown -R nextjs:nodejs /app

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma

# Install only required dependencies for scripts
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules

# Environment variables
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

USER nextjs

EXPOSE 3002

# Start both Next.js server and cron worker
CMD ["sh", "-c", "npx prisma db push && node server.js & node dist/cron-worker.js & wait"]