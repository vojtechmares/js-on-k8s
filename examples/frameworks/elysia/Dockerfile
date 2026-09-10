# syntax=docker/dockerfile:1
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src ./src

FROM oven/bun:1-distroless
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/package.json ./
COPY --from=build --chown=nonroot:nonroot /app/src ./src
USER nonroot
EXPOSE 3000
# ENTRYPOINT is ["bun"], so this runs `bun src/server.ts`.
CMD ["src/server.ts"]
