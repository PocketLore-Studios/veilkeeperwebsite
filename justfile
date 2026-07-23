# Veilkeeper landing site — task runner
#
# Local (NixOS): `nix-shell` provides Node 22; `just` is on PATH.
# CI: .github/workflows/ci.yml runs `just ci` on every push/PR.

set shell := ["bash", "-euo", "pipefail", "-c"]

# List available recipes
default:
    @just --list

# ── Development ─────────────────────────────────────────────

# Install dependencies from the lockfile (CI-safe, reproducible)
install:
    npm ci

# Start the dev server with hot reload
dev:
    npm run dev

# Serve the last production build locally
preview port="4321":
    npm run preview -- --port {{port}}

# Run the Worker + static assets locally to exercise the /feedback endpoint.
# Builds with Cloudflare's Turnstile *test* site key (the page otherwise defaults
# to the real production key) and runs with the matching test secret, so the
# widget passes on localhost. RESEND_FROM_ADDRESS / FEEDBACK_DESTINATION come
# from wrangler.jsonc; put a real RESEND_API_KEY in a gitignored .dev.vars for a
# real send, or omit it to exercise the Resend non-2xx (502) error path.
wrangler-dev:
    PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build
    npx wrangler@4 dev \
        --var ALLOWED_ORIGINS:http://localhost:8787 \
        --var ALLOWED_HOSTNAMES:example.com,localhost,127.0.0.1 \
        --var TURNSTILE_SECRET:1x0000000000000000000000000000000AA \
        --var TURNSTILE_ACTION:

# Remove build output and caches
clean:
    rm -rf dist .astro node_modules/.vite

# ── Quality gates ───────────────────────────────────────────

# Type-check .astro/.ts files and validate content frontmatter
check:
    npx astro check

# Production build (also validates the devlog content schema)
build:
    npm run build

# Assert every route the site promises actually exists in dist/
smoke:
    test -f dist/index.html
    test -f dist/devlog/index.html
    test -f dist/security/index.html
    test -f dist/feedback/index.html
    test -f dist/rss.xml
    test -f dist/devlog/post.html
    test -f dist/.well-known/security.txt
    test -f dist/favicon.png
    @ls dist/_astro/*.css >/dev/null || { echo "no hashed CSS bundle in dist/_astro"; exit 1; }
    test -f dist/404.html
    test -f dist/sitemap-index.xml
    test -f dist/robots.txt
    test -f dist/_headers
    @count=$(ls -d dist/devlog/*/ | wc -l); \
        src=$(ls src/content/devlog/*.md | wc -l); \
        [ "$count" -eq "$src" ] || { echo "expected $src devlog pages, found $count"; exit 1; }
    @echo "smoke OK: all routes present, $(ls src/content/devlog/*.md | wc -l) devlog pages built"

# Full pipeline as CI runs it
ci: install check build smoke

# ── Deployment ──────────────────────────────────────────────

# Build and deploy dist/ to Cloudflare (needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in CI)
deploy: build
    npx wrangler@4 deploy

# Preview what wrangler would upload without deploying
deploy-dry-run: build
    npx wrangler@4 deploy --dry-run

# ── Authoring ───────────────────────────────────────────────

# Scaffold a new devlog entry: just new-devlog devlog-09 "Post title"
# Tip: for animated media, add an optional `video: "/assets/devlog/<slug>.mp4"`
# field to the frontmatter — `image` then serves as the poster/OG image.
new-devlog slug title="TODO":
    @test ! -f "src/content/devlog/{{slug}}.md" || { echo "src/content/devlog/{{slug}}.md already exists"; exit 1; }
    @printf -- '---\nlabel: "TODO e.g. Devlog 09"\ntitle: "{{title}}"\ndate: %s\nimage: "/assets/devlog/{{slug}}.png"\nalt: "TODO describe the image"\nsummary: "TODO one-sentence summary (used on the homepage card, archive, OG description, and RSS)"\n---\n\nTODO write the post in markdown. `##` headings and `-` lists match the site styles.\n' "$(date +%Y-%m-%d)" > "src/content/devlog/{{slug}}.md"
    @echo "created src/content/devlog/{{slug}}.md — remember to add /assets/devlog/{{slug}}.png to public/"


# ── Git convenience ───────────────────────────────────────────────

# Show the working-tree summary, then prompt for a message and commit everything.
commit:
	#!/usr/bin/env bash
	set -euo pipefail
	git status -s
	echo
	git diff --stat
	echo
	read -rp "Commit message: " msg
	[ -n "$msg" ] || { echo "Aborted: empty message"; exit 1; }
	git add -A
	git commit -m "$msg"

# Pick a local branch from a numbered menu and switch to it.
switch:
	#!/usr/bin/env bash
	set -euo pipefail
	PS3="Switch to which branch? "
	select b in $(git branch --format='%(refname:short)'); do
		[ -n "${b:-}" ] || { echo "Invalid selection"; exit 1; }
		git switch "$b"
		break
	done

# Create and switch to a new branch (prompts for the name).
new:
	#!/usr/bin/env bash
	set -euo pipefail
	read -rp "New branch name: " name
	[ -n "$name" ] || { echo "Aborted: empty name"; exit 1; }
	git switch -c "$name"

# Push the current branch to origin.
push:
	git push origin $(git branch --show-current)

# High-level view of what's changed.
status:
	git status -s
	@echo
	git diff --stat