# ---- prune ----
FROM node:20 AS prune
WORKDIR /repo
COPY . .
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm i -g turbo
RUN turbo prune --scope=control-plane-ui --docker

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
# ให้ Next เป็น standalone เพื่อง่ายต่อ runtime
# next.config.ts: export default { output: 'standalone' }
RUN pnpm --filter control-plane-ui... build

# ---- runtime (node) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone build
COPY --from=build /repo/apps/control-plane-ui/.next/standalone ./
COPY --from=build /repo/apps/control-plane-ui/.next/static ./apps/control-plane-ui/.next/static
COPY --from=build /repo/apps/control-plane-ui/public ./apps/control-plane-ui/public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 8080
CMD ["node", "apps/control-plane-ui/server.js"]
