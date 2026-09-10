---
title: Private packages with Docker build secrets
description: Pass NPM_TOKEN as a BuildKit secret. Never put it in an ARG, an ENV, or a copied .npmrc.
order: 10
tags: [dockerfile, npm, secrets, private-registry]
updated: 2026-09-10
example: examples/private-packages
---

`ARG NPM_TOKEN` ends up in the image history. `COPY .npmrc` with a token in it ends
up in a layer. BuildKit secrets are mounted only for the `RUN` they belong to and
never written to the image.

## .npmrc in the repository, without the token

```ini
@acme:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

npm expands `${NPM_TOKEN}` from the environment when it reads the file. It is safe
to commit and safe to copy.

## Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=secret,id=NPM_TOKEN,env=NPM_TOKEN \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
COPY src ./src

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/src ./src
CMD ["src/server.js"]
```

The `.npmrc` stays in the build stage. The runtime stage never sees it.

## Build

```sh
export NPM_TOKEN=...
docker build --secret id=NPM_TOKEN .
```

With no `src` or `env` given, `--secret id=NAME` reads the environment variable
of the same name.

## GitHub Actions

```yaml
- uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: ghcr.io/acme/app:${{ github.sha }}
    secrets: |
      NPM_TOKEN=${{ secrets.NPM_TOKEN }}
```

## Notes

- Prefer the environment form over mounting a whole `.npmrc`. It works with pnpm
  as well, and with Yarn Berry via `npmAuthToken: "${NPM_TOKEN}"` in `.yarnrc.yml`.
- To mount a complete file instead: `--mount=type=secret,id=npmrc,target=/root/.npmrc` and `--secret id=npmrc,src=$HOME/.npmrc`.
- Check the result: `docker history --no-trunc image | grep -i token` must print nothing.
- npm reads the token only when it contacts that registry. A missing secret shows up as a 401 on the first private package, not as a config error.
- Buildpacks: bind a `npmrc` service binding, or set `NPM_TOKEN` as a build-time env with `--env`. Paketo does not persist build envs into the image.
