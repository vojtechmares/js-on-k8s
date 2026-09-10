# Private packages with Docker build secrets

Recipe: https://js-on-k8s.dev/recipes/container-images/build-secrets

The `.npmrc` here references `${NPM_TOKEN}` and is safe to commit. The token is
passed as a BuildKit secret and exists only during `npm ci`.

```sh
export NPM_TOKEN=ghp_...
docker build --secret id=NPM_TOKEN -t private-packages .
docker history --no-trunc private-packages | grep -ci token   # 0
```

This example only depends on public packages, so it builds with or without the
secret: npm reads the token only when it talks to the `@acme` registry. Add a
real `@acme/...` dependency and the build fails with a 401 unless the secret is
passed. Swap `@acme` for your scope.
