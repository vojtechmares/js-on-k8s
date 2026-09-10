export const SITE = {
  name: 'JavaScript on Kubernetes',
  short: 'js-on-k8s',
  url: 'https://www.js-on-k8s.dev',
  description:
    'Practical recipes for running Node.js and JavaScript applications on Kubernetes: container images, graceful shutdown, health checks, manifests, Helm, Kustomize.',
  repo: 'https://github.com/vojtechmares/js-on-k8s',
  author: {
    name: 'Vojtěch Mareš',
    url: 'https://vojtechmares.com',
  },
} as const;

export const FULL_EXAMPLE_URL = `${SITE.repo}/tree/main/examples/full`;

export function exampleUrl(path: string): string {
  return `${SITE.repo}/tree/main/${path.replace(/^\/+/, '')}`;
}

export function recipeUrl(id: string): string {
  return `/recipes/${id}/`;
}

export function markdownPath(pathname: string): string {
  if (pathname === '/') return '/index.md';
  if (pathname.endsWith('/index/')) return pathname.replace(/\/index\/$/, '/index.md');
  const trimmed = pathname.replace(/\/$/, '');
  return `${trimmed}.md`;
}
