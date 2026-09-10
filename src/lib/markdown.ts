import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE, FULL_EXAMPLE_URL, exampleUrl, recipeUrl } from './site';

export type Recipe = CollectionEntry<'recipes'>;

export const SECTIONS = [
  { id: 'build', title: 'Build', blurb: 'From source to an image that is safe to ship.' },
  { id: 'run', title: 'Run', blurb: 'From an image to Pods that start, stop and route traffic correctly.' },
  { id: 'measure', title: 'Measure and right-size', blurb: 'See what the app does, then set the numbers.' },
  { id: 'misc', title: 'Misc', blurb: 'Everything else.' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

export function sectionOf(recipe: Recipe, byId: Map<string, Recipe>): SectionId {
  const p = parentId(recipe);
  const top = p === null ? recipe : byId.get(p);
  return top?.data.section ?? 'misc';
}

function sectionIndex(id: SectionId): number {
  return SECTIONS.findIndex((s) => s.id === id);
}

export const MARKDOWN_HEADERS = {
  'Content-Type': 'text/markdown; charset=utf-8',
  Vary: 'Accept',
};

export function parentId(recipe: Recipe): string | null {
  const i = recipe.id.lastIndexOf('/');
  return i === -1 ? null : recipe.id.slice(0, i);
}

export function isChild(recipe: Recipe): boolean {
  return parentId(recipe) !== null;
}

/** Depth-first order: each top-level recipe followed by its children. */
export async function sortedRecipes(): Promise<Recipe[]> {
  const all = await getCollection('recipes');
  const byId = new Map(all.map((r) => [r.id, r]));
  const key = (r: Recipe): [number, number, number] => {
    const s = sectionIndex(sectionOf(r, byId));
    const p = parentId(r);
    if (p === null) return [s, r.data.order, 0];
    const parent = byId.get(p);
    if (!parent) throw new Error(`Recipe ${r.id} has no parent ${p}`);
    return [s, parent.data.order, r.data.order];
  };
  return all.sort((a, b) => {
    const [a0, a1, a2] = key(a);
    const [b0, b1, b2] = key(b);
    return a0 - b0 || a1 - b1 || a2 - b2;
  });
}

export function childrenOf(recipe: Recipe, all: Recipe[]): Recipe[] {
  return all.filter((r) => parentId(r) === recipe.id);
}

/** Flat list with a heading whenever the section changes (only when `sections` is true). */
export function recipeListMarkdown(recipes: Recipe[], sections = false): string {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const lines: string[] = [];
  let current: SectionId | null = null;
  for (const r of recipes) {
    const s = sectionOf(r, byId);
    if (sections && s !== current) {
      const meta = SECTIONS.find((x) => x.id === s)!;
      lines.push(current === null ? `### ${meta.title}` : `\n### ${meta.title}`, '');
      current = s;
    }
    lines.push(`${isChild(r) ? '  ' : ''}- [${r.data.title}](${SITE.url}${recipeUrl(r.id)}) - ${r.data.description}`);
  }
  return lines.join('\n');
}

export function recipeMarkdown(recipe: Recipe, all: Recipe[]): string {
  const url = `${SITE.url}${recipeUrl(recipe.id)}`;
  const parent = parentId(recipe);
  const lines = [
    `# ${recipe.data.title}`,
    '',
    `> ${recipe.data.description}`,
    '',
    `- Canonical: ${url}`,
    `- Site: ${SITE.name} (${SITE.url})`,
    `- Updated: ${recipe.data.updated.toISOString().slice(0, 10)}`,
  ];
  if (parent) lines.push(`- Part of: ${SITE.url}${recipeUrl(parent)}`);
  if (recipe.data.tags.length) lines.push(`- Tags: ${recipe.data.tags.join(', ')}`);
  if (recipe.data.example) lines.push(`- Example: ${exampleUrl(recipe.data.example)}`);
  lines.push(`- Full example: ${FULL_EXAMPLE_URL}`, '', recipe.body ?? '');
  const children = childrenOf(recipe, all);
  if (children.length) {
    lines.push('', '## In this section', '', recipeListMarkdown(children).replace(/^ {2}/gm, ''));
  }
  lines.push('');
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
    recipeListMarkdown(recipes, true),
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
    recipeListMarkdown(recipes, true),
    '',
  ].join('\n');
}
