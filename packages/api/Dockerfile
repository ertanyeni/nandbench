# Cloud API runtime. Hono + pg in Node 20.
#
# Multi-stage:
#   1. deps — install workspace deps (cached on lockfile)
#   2. runtime — copy sources + node_modules into a minimal image,
#      run with tsx so we don't need a TS build step

FROM node:20-alpine AS deps
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/api/package.json packages/api/
COPY packages/engine/package.json packages/engine/
COPY packages/app/package.json packages/app/
COPY packages/cli/package.json packages/cli/
COPY packages/multiplayer/package.json packages/multiplayer/

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @gatecraft/api...

FROM node:20-alpine AS runtime
WORKDIR /repo
RUN corepack enable
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/api/node_modules ./packages/api/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY packages/api packages/api

# tsx is dev-only in package.json but pnpm pulled it in via --filter ...
# Running directly with tsx avoids a `tsc -b` step on every deploy.
WORKDIR /repo/packages/api
EXPOSE 4555
CMD ["sh", "-c", "node --import tsx/esm src/migrate.ts && node --import tsx/esm src/index.ts"]
