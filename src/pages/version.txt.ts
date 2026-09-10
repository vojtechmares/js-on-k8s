import type { APIRoute } from 'astro';
import { execSync } from 'node:child_process';

// The commit this build came from. Cloudflare Workers Builds sets WORKERS_CI_COMMIT_SHA;
// GitHub Actions sets GITHUB_SHA; locally we ask git. Used by the post-deploy smoke test
// to wait until the new build is live before testing it.
function commitSha(): string {
  const fromEnv = process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

export const GET: APIRoute = () =>
  new Response(`${commitSha()}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
