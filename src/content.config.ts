import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { xletSchema } from './content/schemas';

const xlets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/xlets' }),
  schema: xletSchema,
});

export const collections = { xlets };
