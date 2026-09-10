# Post-deploy: the live site serves the expected commit.
#   hurl --variable base=https://www.js-on-k8s.dev --variable sha=$(git rev-parse HEAD) tests/version.hurl
GET {{base}}/version.txt
[Options]
retry: 40
retry-interval: 15000
HTTP 200
[Asserts]
body == "{{sha}}\n"
