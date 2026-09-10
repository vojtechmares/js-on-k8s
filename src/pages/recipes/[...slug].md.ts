import type { APIRoute } from 'astro';
import { recipeMarkdown, sortedRecipes, MARKDOWN_HEADERS, type Recipe } from '../../lib/markdown';

export async function getStaticPaths() {
  const recipes = await sortedRecipes();
  return recipes.map((recipe) => ({ params: { slug: recipe.id }, props: { recipe, all: recipes } }));
}

export const GET: APIRoute<{ recipe: Recipe; all: Recipe[] }> = ({ props }) =>
  new Response(recipeMarkdown(props.recipe, props.all), { headers: MARKDOWN_HEADERS });
