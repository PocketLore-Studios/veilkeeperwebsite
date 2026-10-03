// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://veilkeepergame.com',
    trailingSlash: 'ignore',
    // Astro 7 defaults to 'jsx', which strips the line breaks between text and
    // inline elements ("email<a>" rendered as "emailpress@..."). `true` keeps
    // the lossless compression this site was written against.
    compressHTML: true,
    integrations: [sitemap()]
});
