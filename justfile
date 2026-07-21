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
    test -f dist/units/index.html
    @count=$(ls -d dist/units/*/ | wc -l); \
        src=$(ls src/content/units/*.md | wc -l); \
        [ "$count" -eq "$src" ] || { echo "expected $src unit pages, found $count"; exit 1; }
    @test ! -e dist/sprite-preview.html && test ! -e dist/tools || { echo "dev-only preview harness leaked into dist/"; exit 1; }
    @echo "smoke OK: all routes present, $(ls src/content/devlog/*.md | wc -l) devlog + $(ls src/content/units/*.md | wc -l) unit pages built"

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

# Scaffold a new unit: just new-unit ash-warden "Ash Warden"
# For an animated sprite, uncomment the sprite/frame fields (tune them with
# `just sprite-preview`); or use `video:` for an MP4 loop instead.
new-unit slug name="TODO":
    @test ! -f "src/content/units/{{slug}}.md" || { echo "src/content/units/{{slug}}.md already exists"; exit 1; }
    @printf -- '---\nname: "{{name}}"\nrole: "TODO e.g. Vanguard"\n# faction: "TODO optional (enables grouping later)"\ntags: []\norder: 99\nimage: "/assets/units/{{slug}}.png"\nalt: "TODO describe the image"\nsummary: "TODO one-sentence summary (used on the roster card and OG description)"\n# Animated media (optional) — use EITHER video OR sprite, not both:\n#   video: "/assets/units/{{slug}}.mp4"\n#   sprite: "/assets/units/{{slug}}-sheet.png"\n#   frameWidth: 64\n#   frameHeight: 64\n#   frameCount: 8   # columns in the row you want to play\n#   fps: 12\n#   # spriteRow: 0   # which row of a multi-row sheet to play (0 = top)\n---\n\nTODO write the unit description in markdown. `##` headings and `-` lists match the site styles.\n' > "src/content/units/{{slug}}.md"
    @echo "created src/content/units/{{slug}}.md — remember to add /assets/units/{{slug}}.png to public/"

# Open the spritesheet preview/tuner in a browser (loads sheets locally; no server)
sprite-preview:
    @xdg-open tools/sprite-preview.html 2>/dev/null || echo "Open this in your browser: file://$(pwd)/tools/sprite-preview.html"
