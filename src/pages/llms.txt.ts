import type { APIRoute } from 'astro';
import { SITE, FULL_EXAMPLE_URL } from '../lib/site';
import { sortedRecipes } from '../lib/markdown';

export const GET: APIRoute = async () => {
  const recipes = await sortedRecipes();
  const body = [
    `# ${SITE.name} (${SITE.short})`,
    '',
    `> ${SITE.description}`,
    '',
    'Every page is available as Markdown: append `.md` to the URL, or send `Accept: text/markdown`.',
    '',
    '## Pages',
    '',
    `- [Home](${SITE.url}/index.md): overview and principles`,
    `- [Recipes](${SITE.url}/recipes/index.md): list of all recipes`,
    '',
    '## Recipes',
    '',
    ...recipes.map((r) => `- [${r.data.title}](${SITE.url}/recipes/${r.id}.md): ${r.data.description}`),
    '',
    '## Source',
    '',
    `- [Repository](${SITE.repo})`,
    `- [Full example](${FULL_EXAMPLE_URL}): every recipe applied to one app`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
