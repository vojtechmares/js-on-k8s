/**
 * Serves the static Astro build from Workers Static Assets and adds content
 * negotiation: a request with `Accept: text/markdown` (ranked above text/html)
 * gets the Markdown source of the page instead of the HTML.
 *
 * Every HTML page has a Markdown twin built by Astro:
 *   /              -> /index.md
 *   /recipes/      -> /recipes/index.md
 *   /recipes/foo/  -> /recipes/foo.md
 */

interface Env {
  ASSETS: Fetcher;
}

const CANONICAL_HOST = 'www.js-on-k8s.dev';
const REDIRECT_HOSTS = new Set(['js-on-k8s.dev']);

type MediaRange = { type: string; subtype: string; q: number; index: number };

function parseAccept(header: string | null): MediaRange[] {
  if (!header) return [];
  return header
    .split(',')
    .map((part, index) => {
      const [range, ...params] = part.trim().split(';');
      const [type = '*', subtype = '*'] = range.trim().toLowerCase().split('/');
      let q = 1;
      for (const p of params) {
        const [k, v] = p.trim().split('=');
        if (k === 'q' && v !== undefined) {
          const n = Number(v);
          // Malformed q values are ignored, as in the reference implementation.
          if (!Number.isNaN(n)) q = Math.min(1, Math.max(0, n));
        }
      }
      return { type, subtype, q, index };
    })
    .filter((r) => r.type.length > 0);
}

/** Best matching range for a concrete media type, by specificity (RFC 9110 12.5.1). */
function match(ranges: MediaRange[], mediaType: string): MediaRange | undefined {
  const [type, subtype] = mediaType.split('/');
  let best: MediaRange | undefined;
  let bestSpecificity = -1;
  for (const r of ranges) {
    let specificity: number;
    if (r.type === type && r.subtype === subtype) specificity = 2;
    else if (r.type === type && r.subtype === '*') specificity = 1;
    else if (r.type === '*' && r.subtype === '*') specificity = 0;
    else continue;
    if (specificity > bestSpecificity) {
      best = r;
      bestSpecificity = specificity;
    }
  }
  return best;
}

export function prefersMarkdown(accept: string | null): boolean {
  const ranges = parseAccept(accept);
  const md = match(ranges, 'text/markdown');
  if (!md || md.q === 0) return false;
  const html = match(ranges, 'text/html');
  const htmlQ = html?.q ?? 0;
  if (md.q !== htmlQ) return md.q > htmlQ;
  // Tie: the client's own order decides.
  return html === undefined || md.index < html.index;
}

function markdownCandidates(pathname: string): string[] {
  if (pathname === '/') return ['/index.md'];
  const trimmed = pathname.replace(/\/+$/, '');
  return [`${trimmed}.md`, `${trimmed}/index.md`];
}

function appendVaryAccept(headers: Headers): void {
  const existing = headers.get('Vary');
  if (!existing) {
    headers.set('Vary', 'Accept');
    return;
  }
  const tokens = existing.split(',').map((s) => s.trim().toLowerCase());
  if (!tokens.includes('accept') && !tokens.includes('*')) headers.set('Vary', `${existing}, Accept`);
}

function withHeaders(res: Response, headers: Record<string, string>): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
  appendVaryAccept(out.headers);
  return out;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (REDIRECT_HOSTS.has(url.hostname) || url.protocol === 'http:') {
      if (REDIRECT_HOSTS.has(url.hostname)) url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    const isRead = request.method === 'GET' || request.method === 'HEAD';

    if (isRead && !url.pathname.endsWith('.md') && prefersMarkdown(request.headers.get('accept'))) {
      for (const candidate of markdownCandidates(url.pathname)) {
        const mdUrl = new URL(candidate, url);
        const res = await env.ASSETS.fetch(new Request(mdUrl, { method: request.method, headers: request.headers }));
        if (res.ok) {
          return withHeaders(res, {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Location': mdUrl.pathname,
          });
        }
      }
      // No Markdown twin: fall through to whatever the asset store has.
    }

    const res = await env.ASSETS.fetch(request);
    const type = res.headers.get('content-type') ?? '';
    // Preview URLs and any other host: serve, but keep search engines on the canonical host.
    const extra: Record<string, string> = url.hostname === CANONICAL_HOST ? {} : { 'X-Robots-Tag': 'noindex' };
    if (res.ok && url.pathname.endsWith('.md')) {
      return withHeaders(res, { 'Content-Type': 'text/markdown; charset=utf-8', ...extra });
    }
    if (type.startsWith('text/html')) {
      return withHeaders(res, { 'Content-Type': 'text/html; charset=utf-8', ...extra });
    }
    return res;
  },
} satisfies ExportedHandler<Env>;
