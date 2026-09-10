# syntax=docker/dockerfile:1
# Recipe: https://js-on-k8s.dev/recipes/container-images/build-secrets/
#
#   export NPM_TOKEN=...
#   docker build --secret id=NPM_TOKEN .
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json .npmrc ./
# The token exists only inside this RUN, as an environment variable.
RUN --mount=type=secret,id=NPM_TOKEN,env=NPM_TOKEN \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
COPY src ./src

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production PORT=3000
# No .npmrc here: the runtime image never needs the registry.
COPY --from=build --chown=nonroot:nonroot /app/package.json ./
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/src ./src
EXPOSE 3000
CMD ["src/server.js"]
