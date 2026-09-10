# JavaScript on Kubernetes

Source of [www.js-on-k8s.dev](https://www.js-on-k8s.dev): short, focused recipes for running Node.js on Kubernetes.

## Layout

```
src/content/pages/index.md     home page content (Markdown)
src/content/recipes/*.md       one recipe per file (Markdown + frontmatter)
src/pages/                     Astro routes: HTML pages and their .md twins, llms.txt
src/layouts/Base.astro         shell, SEO tags, JSON-LD
worker/index.ts                Cloudflare Worker: Accept: text/markdown negotiation, apex redirect
examples/full/                 every recipe applied to one small HTTP service
examples/frameworks/<name>/    graceful shutdown with Express, Fastify, Hono, Elysia, NestJS
examples/nextjs/               Next.js standalone output in a distroless image
examples/tanstack-start/       TanStack Start with the Nitro node-server preset
examples/private-packages/     NPM_TOKEN as a BuildKit secret
```

## Develop

```sh
pnpm install
pnpm dev            # Astro dev server (HTML only, no Accept negotiation)
pnpm build          # static build to dist/
pnpm preview        # wrangler dev on top of dist/, with the Worker
pnpm check          # worker type check
```

## Add a recipe

Create `src/content/recipes/<slug>.md` with this frontmatter:

```yaml
---
title: One thing, stated as the outcome
description: One sentence. Shown in lists, meta description and Markdown output.
order: 14
tags: [kubernetes]
updated: 2026-09-10
example: examples/full/path/to/file   # optional, linked from the page
---
```

The page is generated at `/recipes/<slug>/` and its Markdown twin at `/recipes/<slug>.md`.
To nest a recipe under another one, put it in a folder named after the parent slug
(`src/content/recipes/graceful-shutdown/express.md`). It is listed under the parent,
ordered by its own `order`, and served at `/recipes/graceful-shutdown/express/`.
Keep it to one screen, put the copy-paste snippet first, explanations after.

## Markdown for agents

Every page is available as Markdown:

```sh
curl -H 'Accept: text/markdown' https://www.js-on-k8s.dev/recipes/graceful-shutdown/
curl https://www.js-on-k8s.dev/recipes/graceful-shutdown.md
curl https://www.js-on-k8s.dev/llms.txt
```

Astro builds the `.md` files; the Worker in `worker/index.ts` picks them when
`text/markdown` outranks `text/html` in the `Accept` header (RFC 9110 quality values,
`q=0` respected, ties broken by client order). Responses carry `Vary: Accept`.

## Deploy

The site is a Cloudflare Worker with static assets. `wrangler.jsonc` declares
`www.js-on-k8s.dev` and `js-on-k8s.dev` as custom domains, so the first deploy
creates the DNS records and certificates in the zone automatically. The apex
redirects to `www`.

```sh
pnpm build
pnpm deploy         # wrangler deploy
```

`.github/workflows/deploy.yml` deploys on every push to `main`. It needs two
repository secrets: `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit, Workers Routes: Edit,
Zone DNS: Edit for js-on-k8s.dev) and `CLOUDFLARE_ACCOUNT_ID`.

## License

Content and code: MIT. See [LICENSE](LICENSE).
