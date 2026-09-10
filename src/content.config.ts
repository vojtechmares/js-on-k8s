import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recipes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    tags: z.array(z.string()).default([]),
    updated: z.coerce.date(),
    // Path inside examples/ that shows this recipe applied, relative to repo root.
    example: z.string().optional(),
    // Top-level recipes only. Groups the list: build > run > measure > misc.
    section: z.enum(['build', 'run', 'measure', 'misc']).optional(),
  }),
});

export const collections = { pages, recipes };
