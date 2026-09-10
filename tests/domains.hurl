# Production-only: canonical host, HTTPS and apex redirects.
#   hurl tests/domains.hurl

GET http://www.js-on-k8s.dev/recipes/
HTTP 301
[Asserts]
header "Location" == "https://www.js-on-k8s.dev/recipes/"

GET http://js-on-k8s.dev/
HTTP 301
[Asserts]
header "Location" == "https://www.js-on-k8s.dev/"

GET https://js-on-k8s.dev/recipes/probes/
HTTP 301
[Asserts]
header "Location" == "https://www.js-on-k8s.dev/recipes/probes/"

GET https://www.js-on-k8s.dev/
HTTP 200
[Asserts]
header "X-Robots-Tag" not exists
