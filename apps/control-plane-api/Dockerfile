# ---- build ----
FROM node:20 AS build
WORKDIR /app

# Copy package files from the app directory
COPY apps/control-plane-api/package.json apps/control-plane-api/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code from the app directory
COPY apps/control-plane-api/ .

# Build the application
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# Copy package files and install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S flexboard -u 1001
USER flexboard

EXPOSE 8080
CMD ["node", "dist/server-firebase.js"]