import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const devlog = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/devlog' }),
    schema: z.object({
        label: z.string(),
        title: z.string(),
        date: z.coerce.date(),
        image: z.string(),
        alt: z.string().min(1),
        summary: z.string()
    })
});

export const collections = { devlog };
