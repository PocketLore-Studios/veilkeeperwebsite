// The current alpha roster, as shown on /gameplay.
//
// Role-based, player-facing descriptions only - no damage modifiers or other
// balance numbers, which change between builds. Knight and Mauler follow their
// in-game unit cards; adding a unit or changing a role is one edit here.

export type UnitRange = 'Melee' | 'Ranged';

export interface Unit {
    name: string;
    /** Headline role, e.g. "Frontline Anchor". */
    role: string;
    /** One-word battlefield class for the card's stat row. */
    position: string;
    range: UnitRange;
    summary: string;
}

export const UNITS: Unit[] = [
    {
        name: 'Knight',
        role: 'Frontline Anchor',
        position: 'Frontline',
        range: 'Melee',
        summary:
            'Slow, heavily armored, and hard to kill, threatening only adjacent tiles. Its job is to absorb counters and set the rest of the squad up for the kill.',
    },
    {
        name: 'Archer',
        role: 'Ranged Pressure',
        position: 'Backline',
        range: 'Ranged',
        summary:
            'Controls space from a distance and contributes damage without stepping into melee range.',
    },
    {
        name: 'Assassin',
        role: 'Positional Striker',
        position: 'Flanker',
        range: 'Melee',
        summary:
            'Built around reaching favorable angles. Side and rear attacks are where it becomes truly dangerous.',
    },
    {
        name: 'Mauler',
        role: 'Armor Breaker',
        position: 'Bruiser',
        range: 'Melee',
        summary:
            'A medium-speed melee bruiser built to run in and break heavily armored front lines - and less effective against lightly armored targets.',
    },
];
