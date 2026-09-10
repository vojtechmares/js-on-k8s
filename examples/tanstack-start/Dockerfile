# syntax=docker/dockerfile:1
# Recipe: https://www.js-on-k8s.dev/recipes/tanstack-start/
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
COPY --from=build --chown=nonroot:nonroot /app/.output ./.output
EXPOSE 3000
CMD [".output/server/index.mjs"]
