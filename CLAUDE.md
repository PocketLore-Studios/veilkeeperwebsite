# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Marketing/devlog site for Veilkeeper (a tactical RPG by PocketLore Studios), served at https://veilkeepergame.com. Built with Astro 5 as a fully static site — no client-side framework; the only shipped JS is the mobile menu toggle in `src/components/Header.astro`. Deployed to Cloudflare (project `veilkeepergame`); `wrangler.jsonc` serves `./dist`.

## Commands

The dev machine is NixOS — Node is not on the PATH. Run `nix-shell` first (provides Node 22 via `shell.nix`); `just` is installed globally.

```bash
just            # list recipes
just dev        # dev server with hot reload
just ci         # what CI runs: npm ci + astro check + build + smoke test
just check      # type-check and validate content frontmatter
just build      # production build to dist/
just smoke      # assert all expected routes exist in dist/ (needs a prior build)
just new-devlog devlog-09 "Title"   # scaffold a devlog entry
```

There is no unit test suite; `just ci` (check + build + smoke) is the verification path. GitHub Actions (`.github/workflows/ci.yml`) runs `just ci` on pushes/PRs as a check only. Deployment is handled by Cloudflare's Workers Builds git integration (configured in the Cloudflare dashboard: build command `npm run build`, deploy command `npx wrangler deploy`), which deploys on pushes to `main`. `just deploy` exists as a manual escape hatch but note the two are independent — Cloudflare deploys even if GitHub checks fail.

Work happens on `development`; `main` is the release/PR target and auto-deploys via Cloudflare.

## Architecture

**Devlog posts are the content collection** in `src/content/devlog/*.md` — filename is the slug (`devlog-09.md`, `aotv-04.md` for "Art of the Veil" art posts). Schema lives in `src/content.config.ts`: `label`, `title`, `date`, `image` (path under `/assets/devlog/` in `public/`), `alt` (must be non-empty), `summary`, plus optional `video` (an MP4 under the same path). When `video` is set, the three render sites (homepage card, archive, post page) show an autoplaying muted loop and `image` serves as its poster frame and the OG image — convert GIFs to MP4 rather than shipping them (`ffmpeg -movflags +faststart -pix_fmt yuv420p`). The `summary` doubles as the homepage card text, archive blurb, OG description, and RSS description. Body is plain Markdown (`##` headings, `-` lists match the site styles).

**Ordering:** everything sorts newest-first via `getSortedDevlogs()` in `src/lib/devlog.ts` — date descending, slug descending as tiebreaker (devlog-03/04 share a date). The homepage "Development Status" card always shows the newest entry; prev/next navigation on post pages follows the same order. Use the shared helpers (`getSortedDevlogs`, `formatDate`, `getPostUrl`) rather than re-sorting.

**Routes** (all prerendered at build time):
- `src/pages/index.astro` — homepage, renders the latest devlog card
- `src/pages/devlog/index.astro` — archive
- `src/pages/devlog/[slug].astro` — one page per collection entry, with per-post OG tags (`ogImage` = the entry image)
- `src/pages/security/index.astro` — security policy
- `src/pages/404.astro` — not-found page, served with a real 404 status via `not_found_handling: "404-page"` in `wrangler.jsonc`
- `src/pages/rss.xml.js` — RSS feed of all devlogs

A sitemap (`sitemap-index.xml`, via `@astrojs/sitemap`) and `public/robots.txt` are also emitted. `public/_headers` is interpreted by Cloudflare's static-asset serving (Pages-style syntax): baseline security headers on everything plus tiered cache-control (`/_astro/*` immutable, `/assets/*` 30 days, `/css/*` 4 hours). Site-wide constants (social URLs — the Discord invite especially, since invites get rotated — site URL, security email) live in `src/lib/site.ts`; never hardcode them in markup.

**`BaseLayout.astro`** (`src/layouts/`) owns the entire `<head>`: SEO/OG/Twitter meta, canonical URL (derived from `Astro.site` + path), stylesheet links, fonts, RSS discovery link. Props: `title`, `description`, optional `ogImage`/`ogType`. It renders `Header`/`Footer` components (ported from the old runtime-fetched partials) and `<main id="top">` (the footer's back-to-top anchor). New pages should always use it.

**Styling is deliberately untouched from the pre-Astro site:** five plain global stylesheets in `public/css/` loaded in order (`base`, `layout`, `components`, `sections`, `responsive`) — no scoped Astro styles, no CSS build. Card-style elements share the `surface` class. Keep new markup compatible with these classes rather than adding scoped styles.

**Legacy URL shim:** `public/devlog/post.html` JS-redirects old `/devlog/post.html?slug=X` links (shared on Discord/Bluesky before the migration) to `/devlog/X/`. Don't delete it. `public/.well-known/security.txt` (RFC 9116) must stay a plain static file. The retired devlog GIFs (`devlog-02..05.gif`) also stay in `public/assets/devlog/` for the same reason — old social embeds link to them — even though no page references them.

**Adding a devlog post:** `just new-devlog <slug> "Title"`, fill in the frontmatter TODOs, drop the image in `public/assets/devlog/`, done — the homepage, archive, post page, prev/next nav, and RSS all derive from the collection. If a new post shares a date with an existing one, the slug tiebreaker (descending) decides which counts as newer.
