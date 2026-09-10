# syntax=docker/dockerfile:1
# Recipes:
#   https://www.js-on-k8s.dev/recipes/dockerfile/
#   https://www.js-on-k8s.dev/recipes/distroless-image/
#   https://www.js-on-k8s.dev/recipes/run-node-directly/

# --- build stage: install production dependencies ---------------------------
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production

# Dependency layer: only rebuilt when the lockfile changes.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Application code.
COPY src ./src

# --- runtime stage: node, your code, nothing else ---------------------------
FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

COPY --from=build --chown=nonroot:nonroot /app/package.json ./
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/src ./src

EXPOSE 3000
# ENTRYPOINT is ["node"] in the distroless image. node is PID 1 and gets SIGTERM.
CMD ["src/server.js"]
