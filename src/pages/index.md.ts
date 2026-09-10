import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { homeMarkdown, MARKDOWN_HEADERS } from '../lib/markdown';

export const GET: APIRoute = async () => {
  const page = await getEntry('pages', 'index');
  if (!page) return new Response('Not found', { status: 404 });
  return new Response(await homeMarkdown(page), { headers: MARKDOWN_HEADERS });
};
