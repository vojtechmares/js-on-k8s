# Production-only: canonical host, HTTPS and www redirects.
#   hurl tests/domains.hurl

GET http://js-on-k8s.dev/recipes
HTTP 301
[Asserts]
header "Location" == "https://js-on-k8s.dev/recipes"

GET http://www.js-on-k8s.dev/
HTTP 301
[Asserts]
header "Location" == "https://js-on-k8s.dev/"

GET https://www.js-on-k8s.dev/recipes/probes
HTTP 301
[Asserts]
header "Location" == "https://js-on-k8s.dev/recipes/probes"

GET https://js-on-k8s.dev/
HTTP 200
[Asserts]
header "X-Robots-Tag" not exists
