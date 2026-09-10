# Smoke test: humans get HTML, agents get Markdown, SEO files exist.
# Run against any deployment:  hurl --variable base=https://js-on-k8s.dev tests/smoke.hurl
# Against a local preview:     hurl --variable base=http://localhost:8787 tests/smoke.hurl

# --- Humans: a browser gets HTML ----------------------------------------------
GET {{base}}/
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
HTTP 200
[Asserts]
header "Content-Type" == "text/html; charset=utf-8"
header "Vary" contains "Accept"
xpath "string(//title)" == "JavaScript on Kubernetes (js-on-k8s)"
xpath "string(//link[@rel='canonical']/@href)" == "https://js-on-k8s.dev/"
xpath "string(//link[@rel='alternate'][@type='text/markdown']/@href)" == "/index.md"
xpath "count(//script[@type='application/ld+json'])" >= 1
body contains "Recipes"

# No Accept header at all: HTML.
GET {{base}}/recipes/graceful-shutdown/
HTTP 200
[Asserts]
header "Content-Type" == "text/html; charset=utf-8"
header "Vary" contains "Accept"
xpath "string(//h1)" == "Graceful shutdown on SIGTERM"

# --- Agents: text/markdown ranked above text/html gets Markdown -----------------
GET {{base}}/
Accept: text/markdown
HTTP 200
[Asserts]
header "Content-Type" == "text/markdown; charset=utf-8"
header "Content-Location" == "/index.md"
header "Vary" contains "Accept"
body startsWith "# JavaScript on Kubernetes"
body contains "- Canonical: https://js-on-k8s.dev/"
body contains "## Recipes"

GET {{base}}/recipes/graceful-shutdown/
Accept: text/markdown, text/html;q=0.9
HTTP 200
[Asserts]
header "Content-Type" == "text/markdown; charset=utf-8"
header "Content-Location" == "/recipes/graceful-shutdown.md"
body startsWith "# Graceful shutdown on SIGTERM"
body contains "```js"
body contains "## In this section"

# Nested recipe, wildcard fallback still prefers markdown.
GET {{base}}/recipes/graceful-shutdown/express/
Accept: text/markdown, */*;q=0.1
HTTP 200
[Asserts]
header "Content-Type" == "text/markdown; charset=utf-8"
header "Content-Location" == "/recipes/graceful-shutdown/express.md"
body contains "- Part of: https://js-on-k8s.dev/recipes/graceful-shutdown/"

# Recipes index has its own twin.
GET {{base}}/recipes/
Accept: text/markdown
HTTP 200
[Asserts]
header "Content-Type" == "text/markdown; charset=utf-8"
header "Content-Location" == "/recipes/index.md"
body contains "### Build"

# Explicit rejection of markdown: HTML.
GET {{base}}/recipes/graceful-shutdown/
Accept: text/markdown;q=0, */*
HTTP 200
[Asserts]
header "Content-Type" == "text/html; charset=utf-8"

# No preference expressed: HTML.
GET {{base}}/recipes/graceful-shutdown/
Accept: */*
HTTP 200
[Asserts]
header "Content-Type" == "text/html; charset=utf-8"

# Direct .md URL works without any Accept header.
GET {{base}}/recipes/container-images/dockerfile.md
HTTP 200
[Asserts]
header "Content-Type" == "text/markdown; charset=utf-8"
body startsWith "# A minimal multi-stage Dockerfile"

# --- Routing ------------------------------------------------------------------
GET {{base}}/recipes/probes
HTTP 307
[Asserts]
header "Location" endsWith "/recipes/probes/"

GET {{base}}/this-page-does-not-exist/
HTTP 404
[Asserts]
header "Content-Type" contains "text/html"
body contains "404"

GET {{base}}/this-page-does-not-exist/
Accept: text/markdown
HTTP 404

# --- SEO and agent discovery files --------------------------------------------
GET {{base}}/robots.txt
HTTP 200
[Asserts]
header "Content-Type" contains "text/plain"
body contains "Sitemap: https://js-on-k8s.dev/sitemap-index.xml"

GET {{base}}/sitemap-index.xml
HTTP 200
[Asserts]
header "Content-Type" contains "xml"
body contains "https://js-on-k8s.dev/sitemap-0.xml"

GET {{base}}/sitemap-0.xml
HTTP 200
[Asserts]
body contains "<loc>https://js-on-k8s.dev/</loc>"
body contains "<loc>https://js-on-k8s.dev/recipes/graceful-shutdown/express/</loc>"

GET {{base}}/llms.txt
HTTP 200
[Asserts]
header "Content-Type" contains "text/plain"
body startsWith "# JavaScript on Kubernetes"
body contains "https://js-on-k8s.dev/recipes/index.md"

GET {{base}}/og.png
HTTP 200
[Asserts]
header "Content-Type" == "image/png"
bytes count > 10000

GET {{base}}/favicon.svg
HTTP 200
[Asserts]
header "Content-Type" contains "image/svg+xml"

GET {{base}}/version.txt
HTTP 200
[Asserts]
body matches "^[0-9a-f]{40}\n$"
