// Single source of truth for site-wide values that appear in multiple places
// (social links especially - Discord invites get rotated).
export const SITE = {
    name: 'Veilkeeper',
    url: 'https://veilkeepergame.com',
    studioUrl: 'https://pocketlorestudios.com',
    securityEmail: 'security@veilkeepergame.com',
    pressEmail: 'press@veilkeepergame.com',
    // Shared Drive folder holding the logo pack, gameplay captures, and a plain-text
    // factsheet. Lives here because Drive share links change if the folder is moved.
    pressKitUrl: 'https://drive.google.com/drive/folders/1m0PQFAN_wZorhucjl0Aq6KH-WOprkFxw',
    social: {
        discord: 'https://discord.gg/5zu23e46s6',
        bluesky: 'https://bsky.app/profile/veilkeepergame.bsky.social',
        x: 'https://x.com/Veilkeepergame'
    }
} as const;
