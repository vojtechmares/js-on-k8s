import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { recipeMarkdown, sortedRecipes, MARKDOWN_HEADERS } from '../../lib/markdown';

export async function getStaticPaths() {
  const recipes = await sortedRecipes();
  return recipes.map((recipe) => ({ params: { slug: recipe.id }, props: { recipe } }));
}

export const GET: APIRoute<{ recipe: CollectionEntry<'recipes'> }> = ({ props }) =>
  new Response(recipeMarkdown(props.recipe), { headers: MARKDOWN_HEADERS });
