import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE, FULL_EXAMPLE_URL, exampleUrl, recipeUrl } from './site';

export const MARKDOWN_HEADERS = {
  'Content-Type': 'text/markdown; charset=utf-8',
  Vary: 'Accept',
};

export async function sortedRecipes(): Promise<CollectionEntry<'recipes'>[]> {
  const all = await getCollection('recipes');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export function recipeListMarkdown(recipes: CollectionEntry<'recipes'>[]): string {
  return recipes
    .map((r) => `- [${r.data.title}](${SITE.url}${recipeUrl(r.id)}) - ${r.data.description}`)
    .join('\n');
}

export function recipeMarkdown(recipe: CollectionEntry<'recipes'>): string {
  const url = `${SITE.url}${recipeUrl(recipe.id)}`;
  const lines = [
    `# ${recipe.data.title}`,
    '',
    `> ${recipe.data.description}`,
    '',
    `- Canonical: ${url}`,
    `- Site: ${SITE.name} (${SITE.url})`,
    `- Updated: ${recipe.data.updated.toISOString().slice(0, 10)}`,
  ];
  if (recipe.data.tags.length) lines.push(`- Tags: ${recipe.data.tags.join(', ')}`);
  if (recipe.data.example) lines.push(`- Example: ${exampleUrl(recipe.data.example)}`);
  lines.push(`- Full example: ${FULL_EXAMPLE_URL}`, '', recipe.body ?? '', '');
  return lines.join('\n');
}

export async function homeMarkdown(page: CollectionEntry<'pages'>): Promise<string> {
  const recipes = await sortedRecipes();
  return [
    `# ${page.data.title}`,
    '',
    `> ${page.data.description}`,
    '',
    `- Canonical: ${SITE.url}/`,
    `- Source: ${SITE.repo}`,
    `- Full example: ${FULL_EXAMPLE_URL}`,
    '',
    page.body ?? '',
    '',
    '## Recipes',
    '',
    recipeListMarkdown(recipes),
    '',
    `Each recipe is also available as Markdown: append \`.md\` to its URL, or request it with \`Accept: text/markdown\`.`,
    '',
  ].join('\n');
}

export async function recipesIndexMarkdown(): Promise<string> {
  const recipes = await sortedRecipes();
  return [
    `# Recipes - ${SITE.name}`,
    '',
    `> ${recipes.length} focused recipes for running Node.js on Kubernetes. One thing per recipe.`,
    '',
    `- Canonical: ${SITE.url}/recipes/`,
    `- Full example: ${FULL_EXAMPLE_URL}`,
    '',
    recipeListMarkdown(recipes),
    '',
  ].join('\n');
}
