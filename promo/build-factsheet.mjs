// Renders factsheet-source.html to the press factsheet PDF. Run it with
// `just factsheet`, which supplies Chromium.
//
// The source file ships with __TOKEN__ placeholders for the fonts and images so
// it stays readable and diffable in git. This script inlines them as data: URIs
// (the PDF has to be self-contained -- press contacts open it offline) and
// prints the result with headless Chrome.
//
// The factsheet table is the one piece of content duplicated from the /press
// page. Keep `rows` below in step with the `factsheet` array in
// src/pages/press/index.astro.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] ?? join(REPO, 'veilkeeper-press-factsheet.pdf');

const b64 = (rel) => readFileSync(join(REPO, rel)).toString('base64');

const rows = [
    ['Studio', 'PocketLore Studios'],
    ['Developer', 'John Serwatka - design, programming, and production', 'Solo developer'],
    ['Location', 'New York, United States'],
    ['Engine', 'Godot 4 (.NET / C#)'],
    ['Platforms', 'PC - Windows and Linux'],
    ['Genre', 'Tactical RPG'],
    ['Players', 'Single-player'],
    ['Status', 'Pre-alpha, in active development', 'Current tactical combat milestone v0.1'],
    // The web factsheet (src/pages/press/index.astro) carries the Steam store URL as
    // its own row; there is no vertical room for an eleventh row here before page 1
    // collides with the footer, so the URL lives in Contact & links on page 2 instead.
    ['Public alpha', 'August 20, 2026', 'Releasing on itch.io; the Steam page is live for wishlists now'],
    ['Commercial release', 'TBA'],
    ['Price', 'TBA'],
];

const rowsHtml = rows
    .map(([label, value, note]) =>
        `<tr><th>${label}</th><td>${value}${note ? `<span class="note">${note}</span>` : ''}</td></tr>`)
    .join('\n');

const body = readFileSync(join(REPO, 'promo/factsheet-source.html'), 'utf8')
    .replace('__CINZEL__', b64('public/assets/fonts/cinzel-latin.woff2'))
    .replace('__RALEWAY__', b64('public/assets/fonts/raleway-latin.woff2'))
    .replace('__VKLOGO__', b64('public/assets/logos/Veilkeeper_main_logo.webp'))
    // Pre-cropped to the band's visible slice -- see the .band comment in the source.
    .replace('__KEYART__', b64('promo/key-art/veilkeeper-key-art-banner.webp'))
    .replaceAll('__PLLOGO__', b64('public/assets/logos/pocketlore/pocketlore-logo-horizontal.png'))
    .replace('__SHOT__', b64('public/assets/press/press-damage-preview.webp'))
    .replace('__ROWS__', rowsHtml);

// A typo'd placeholder would otherwise render as a missing image, which is easy
// to miss in a 2-page PDF.
const missed = body.match(/__[A-Z]+__/g);
if (missed) throw new Error(`unsubstituted placeholder(s): ${[...new Set(missed)].join(', ')}`);

// The source is a fragment (it opens on <style>), and the generated table cells
// carry non-ASCII punctuation, so the charset declaration is not optional.
const work = mkdtempSync(join(tmpdir(), 'factsheet-'));
const html = join(work, 'factsheet.html');
writeFileSync(html, `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Veilkeeper Press Factsheet</title></head>
<body>
${body}
</body>
</html>
`);

const browser = process.env.CHROMIUM
    ?? ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome']
        .find((bin) => {
            try {
                execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' });
                return true;
            } catch {
                return false;
            }
        });

if (!browser) {
    throw new Error('no Chromium on PATH; run `just factsheet`, or set CHROMIUM=/path/to/chrome');
}

execFileSync(browser, [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${OUT}`,
    `file://${html}`,
], { stdio: 'inherit' });

console.log(`wrote ${OUT}`);
