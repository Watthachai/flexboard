# ---- prune (keep only what api needs) ----
FROM node:20 AS prune
WORKDIR /repo
COPY . .
RUN corepack enable && corepack prepare pnpm@9 --activate \
  && pnpm dlx turbo@2 prune --scope=control-plane-api --docker

# ---- build ----
FROM node:20 AS build
WORKDIR /repo
COPY --from=prune /repo/out/full/ .
COPY --from=prune /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm --filter control-plane-api... build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# copy built files of the app only
COPY --from=build /repo/apps/control-plane-api/dist ./dist
COPY --from=build /repo/apps/control-plane-api/package.json ./
COPY --from=build /repo/pnpm-lock.yaml ./pnpm-lock.yaml

RUN corepack enable && corepack prepare pnpm@9 --activate \
  && pnpm install --prod --frozen-lockfile --ignore-scripts

# non-root
RUN addgroup -g 1001 -S nodejs && adduser -S flexboard -u 1001
USER flexboard

EXPOSE 8080
CMD ["node", "dist/server-firebase.js"]