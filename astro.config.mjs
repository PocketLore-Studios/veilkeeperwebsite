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
    integrations: [sitemap()],
    // The Content-Security-Policy in public/_headers allows scripts and styles
    // from 'self' only, with no inline code. Astro inlines scripts and
    // stylesheets under 4 KB by default, which that policy would block, so both
    // are always emitted as files. `just smoke` fails if any inline code appears.
    build: { inlineStylesheets: 'never' },
    vite: { build: { assetsInlineLimit: 0 } }
});
