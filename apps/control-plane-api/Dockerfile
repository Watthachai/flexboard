# ---- prune (keep only what api needs) ----
FROM node:20 AS prune
WORKDIR /repo
COPY . .
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm i -g turbo
RUN turbo prune --scope=control-plane-api --docker

# ---- deps (install pruned deps) ----
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
RUN pnpm --filter control-plane-api... build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# copy built files of the app only
COPY --from=build /repo/apps/control-plane-api/dist ./dist
COPY --from=build /repo/apps/control-plane-api/package.json ./
# include lockfile for deterministic install (optional but good)
COPY --from=build /repo/pnpm-lock.yaml ./pnpm-lock.yaml

RUN corepack enable && corepack prepare pnpm@9 --activate \
  && pnpm install --prod --frozen-lockfile --ignore-scripts

# non-root
RUN addgroup -g 1001 -S nodejs && adduser -S flexboard -u 1001
USER flexboard

EXPOSE 8080
CMD ["node", "dist/server-firebase.js"]