# AGENTS.md

Source of https://www.js-on-k8s.dev - a single-page docs site plus recipes about running Node.js on Kubernetes.

## Stack

- Astro (static output) + Tailwind CSS v4, JetBrains Mono everywhere, light theme only, no dark mode.
- Content is Markdown in `src/content/` (`pages/index.md`, `recipes/*.md`). Never put prose in `.astro` files.
- Deployed as a Cloudflare Worker with static assets (`worker/index.ts`, `wrangler.jsonc`).
- `examples/` holds standalone apps (full, frameworks/*, nextjs, tanstack-start, private-packages); keep them in sync with the recipes. Each has its own Dockerfile and lockfile.

## Conventions

- English only. Sentence case headings. Hyphens, never em dashes.
- Headings render as ASCII rules (`====`, `----`, `### `) via CSS in `src/styles/global.css`. Do not add heading styles elsewhere.
- One recipe = one thing. Snippet first, explanation after, a short "Notes" list at the end. Fits on a screen.
- Every HTML route needs a `.md` twin (`src/pages/**/*.md.ts`) so `Accept: text/markdown` works.
- Recipe frontmatter: `title`, `description`, `order`, `tags`, `updated`, optional `example` (path in repo).
- Nested recipes live in `src/content/recipes/<parent>/<child>.md`; `order` sorts within the parent.

## Commands

```
pnpm dev        # astro dev (HTML only)
pnpm build      # static build to dist/
pnpm preview    # wrangler dev serving dist/ through the Worker
pnpm check      # tsc for the worker
pnpm deploy     # wrangler deploy
node scripts/og.mjs   # regenerate public/og.png
```

When starting the dev server in an agent session, use `astro dev --background` and manage it with `astro dev stop|status|logs`.

## Docs

- https://docs.astro.build (content collections, routing)
- https://developers.cloudflare.com/workers/static-assets/
- https://acceptmarkdown.com/recipes/astro
