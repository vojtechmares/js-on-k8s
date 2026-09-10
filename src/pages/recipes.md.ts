import type { APIRoute } from 'astro';
import { recipesIndexMarkdown, MARKDOWN_HEADERS } from '../lib/markdown';

export const GET: APIRoute = async () =>
  new Response(await recipesIndexMarkdown(), { headers: MARKDOWN_HEADERS });
