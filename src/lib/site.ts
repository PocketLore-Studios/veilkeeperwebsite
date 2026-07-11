// Single source of truth for site-wide values that appear in multiple places
// (social links especially — Discord invites get rotated).
export const SITE = {
    name: 'Veilkeeper',
    url: 'https://veilkeepergame.com',
    securityEmail: 'security@veilkeepergame.com',
    social: {
        discord: 'https://discord.gg/5zu23e46s6',
        bluesky: 'https://bsky.app/profile/veilkeepergame.bsky.social',
        x: 'https://x.com/Veilkeepergame'
    }
} as const;
