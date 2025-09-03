# ---- prune ----
FROM node:20 AS prune
WORKDIR /repo
COPY . .
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm dlx turbo@2 prune --scope=control-plane-ui --docker

# ---- deps ----
FROM node:20 AS deps
WORKDIR /repo
COPY --from=prune /repo/out/json/ .
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:20 AS build
WORKDIR /repo
COPY --from=prune /repo/out/full/ .
COPY --from=deps  /repo/node_modules ./node_modules
# ต้องตั้งใน next.config.{js,ts}:  module.exports = { output: 'standalone' }
RUN corepack enable && corepack prepare pnpm@9 --activate
# Install all dependencies including devDependencies for build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter control-plane-ui... build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# copy the Next standalone output
COPY --from=build /repo/apps/control-plane-ui/.next/standalone ./
COPY --from=build /repo/apps/control-plane-ui/.next/static ./apps/control-plane-ui/.next/static
COPY --from=build /repo/apps/control-plane-ui/public ./apps/control-plane-ui/public

# non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 8080
CMD ["node", "apps/control-plane-ui/server.js"]