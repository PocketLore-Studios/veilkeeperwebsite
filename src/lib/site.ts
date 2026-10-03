// Single source of truth for site-wide values that appear in multiple places
// (social links especially - Discord invites get rotated).
export const SITE = {
    name: 'Veilkeeper',
    url: 'https://veilkeepergame.com',
    studioUrl: 'https://pocketlorestudios.com',
    securityEmail: 'security@veilkeepergame.com',
    pressEmail: 'press@veilkeepergame.com',
    // Where feedback lands; also FEEDBACK_DESTINATION in wrangler.jsonc.
    supportEmail: 'support@veilkeepergame.com',
    // Shared Drive folder holding the logo pack, gameplay captures, and a plain-text
    // factsheet. Lives here because Drive share links change if the folder is moved.
    pressKitUrl: 'https://drive.google.com/drive/folders/1m0PQFAN_wZorhucjl0Aq6KH-WOprkFxw',
    // Steam store page. Also hardcoded in public/_redirects (the /play vanity
    // link) because static _redirects cannot import this file - keep them in
    // sync; `just smoke` fails if the app IDs diverge.
    steamUrl: 'https://store.steampowered.com/app/4515130/Veilkeeper/',
    // The one feature being worked on right now, in player terms. Shown as the
    // "Currently building" strip on the homepage and on /roadmap.
    // MAINTENANCE: whenever a new devlog is published, check this still matches
    // the actual focus and update it if not - a stale "currently" is worse than
    // none. Not a progress figure, ETA, or task list; one short phrase.
    currentFocus: 'An isometric battlefield, with cursor controls to match',
    // itch.io page hosting the public alpha build.
    itchUrl: 'https://pocketlore-studios.itch.io/veilkeeper',
    social: {
        discord: 'https://discord.gg/5zu23e46s6',
        bluesky: 'https://bsky.app/profile/veilkeepergame.bsky.social',
        x: 'https://x.com/Veilkeepergame'
    }
} as const;
