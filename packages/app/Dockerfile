# Frontend build image. Compiles the React app to static assets and
# copies them into a shared volume that the production Caddy reads.
#
# Multi-stage:
#   1. builder — pnpm install + vite build for the whole workspace
#      (engine + cli + app are all needed because app imports
#      @gatecraft/engine via workspace protocol)
#   2. output — minimal alpine that copies the built dist/ into a
#      volume on container start and exits.

FROM node:20-alpine AS builder
WORKDIR /repo

RUN corepack enable

# Workspace manifests first so installs cache well.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/engine/package.json packages/engine/
COPY packages/app/package.json packages/app/
COPY packages/cli/package.json packages/cli/
COPY packages/multiplayer/package.json packages/multiplayer/
COPY packages/api/package.json packages/api/

RUN pnpm install --frozen-lockfile --ignore-scripts

# Now copy sources and build only the app + the engine it depends on.
COPY tsconfig.base.json ./
COPY packages/engine packages/engine
COPY packages/app packages/app
COPY packages/multiplayer packages/multiplayer

# VITE_GATECRAFT_API is baked into the bundle at build time. The
# infra/docker-compose passes it via build args.
ARG VITE_GATECRAFT_API=https://api.nandbench.ertanyeni.com
ENV VITE_GATECRAFT_API=${VITE_GATECRAFT_API}

RUN pnpm --filter @gatecraft/app build

FROM alpine:3.20 AS output
COPY --from=builder /repo/packages/app/dist /app/dist
# Replace the contents of the mounted volume on every container start
# so a fresh deploy actually replaces stale assets.
CMD ["sh", "-c", "rm -rf /dist/* /dist/.[!.]* 2>/dev/null; cp -rf /app/dist/. /dist/"]
