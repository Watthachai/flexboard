# ---- prune (ตัดของที่ไม่เกี่ยวให้อิมเมจเล็ก) ----
FROM node:20 AS prune
WORKDIR /repo
COPY . .
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm i -g turbo
RUN turbo prune --scope=control-plane-api --docker

# ---- deps ----
FROM node:20 AS deps
WORKDIR /repo
COPY --from=prune /repo/out/json/ .
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm i --frozen-lockfile

# ---- build ----
FROM node:20 AS build
WORKDIR /repo
COPY --from=prune /repo/out/full/ .
COPY --from=deps  /repo/node_modules ./node_modules
RUN pnpm --filter control-plane-api... build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=build /repo/apps/control-plane-api/dist ./dist
COPY --from=build /repo/apps/control-plane-api/package.json ./

# Install production dependencies
RUN corepack enable && corepack prepare pnpm@9 --activate \
  && pnpm i --prod --ignore-scripts

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S flexboard -u 1001
USER flexboard

EXPOSE 8080
CMD ["node", "dist/server-firebase.js"]
