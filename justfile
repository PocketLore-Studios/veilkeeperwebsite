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
# Uses Cloudflare's Turnstile test keys (site key falls back automatically in
# the page); email sends are simulated/logged unless the binding is remote.
wrangler-dev: build
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
    test -f dist/css/base.css
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
new-devlog slug title="TODO":
    @test ! -f "src/content/devlog/{{slug}}.md" || { echo "src/content/devlog/{{slug}}.md already exists"; exit 1; }
    @printf -- '---\nlabel: "TODO e.g. Devlog 09"\ntitle: "{{title}}"\ndate: %s\nimage: "/assets/devlog/{{slug}}.png"\nalt: "TODO describe the image"\nsummary: "TODO one-sentence summary (used on the homepage card, archive, OG description, and RSS)"\n---\n\nTODO write the post in markdown. `##` headings and `-` lists match the site styles.\n' "$(date +%Y-%m-%d)" > "src/content/devlog/{{slug}}.md"
    @echo "created src/content/devlog/{{slug}}.md — remember to add /assets/devlog/{{slug}}.png to public/"
