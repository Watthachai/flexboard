# ---- build ----
FROM node:20 AS build
WORKDIR /app

# Copy package files from the app directory
COPY apps/control-plane-ui/package.json apps/control-plane-ui/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code from the app directory
COPY apps/control-plane-ui/ .

# Build the application (Next.js with standalone output)
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# Copy the Next.js standalone output
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 8080
CMD ["node", "server.js"]