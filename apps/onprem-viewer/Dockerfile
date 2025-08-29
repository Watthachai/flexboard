# --- Stage 1: Build Stage ---
FROM node:22-alpine AS builder

ARG PNPM_VERSION=10
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

# Copy package.json files เพื่อทำ dependency caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the Next.js app for production
RUN pnpm build

# --- Stage 2: Production Stage ---
FROM node:22-alpine AS production

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy the built app from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port 3000
EXPOSE 3000

# Command to run the app
CMD ["node", "server.js"]