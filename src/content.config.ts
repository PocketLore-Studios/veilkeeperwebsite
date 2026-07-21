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
        // Optional looping MP4; when present, `image` doubles as its poster
        // frame and remains the OG image.
        video: z.string().optional(),
        summary: z.string()
    })
});

const units = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/units' }),
    schema: z
        .object({
            name: z.string(),
            role: z.string(),
            faction: z.string().optional(),
            tags: z.array(z.string()).default([]),
            // Manual roster order; entries without `order` sort last (see units.ts).
            order: z.number().optional(),
            // Static frame / key art — also the poster, OG image, and the
            // prefers-reduced-motion fallback for sprites.
            image: z.string(),
            alt: z.string().min(1),
            summary: z.string(),
            // Media modes, in render precedence: sprite → video → image.
            video: z.string().optional(),
            // Spritesheet PNG under /assets/units/; animated in-browser via CSS steps().
            sprite: z.string().optional(),
            frameWidth: z.number().int().positive().optional(),
            frameHeight: z.number().int().positive().optional(),
            // Frames (columns) in the animated row.
            frameCount: z.number().int().positive().optional(),
            // Which row of a multi-row sheet to play (0-indexed); default the top row.
            spriteRow: z.number().int().nonnegative().default(0),
            fps: z.number().positive().default(12)
        })
        // A sprite can't animate without its frame geometry.
        .refine(d => !d.sprite || (d.frameWidth && d.frameHeight && d.frameCount), {
            message: 'sprite requires frameWidth, frameHeight, and frameCount',
            path: ['sprite']
        })
});

export const collections = { devlog, units };
