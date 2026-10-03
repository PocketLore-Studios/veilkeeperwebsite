// Single source of truth for Veilkeeper's development layers.
//
// Read by the /roadmap page (everything), the /press page (title, status,
// description) and promo/build-factsheet.mjs (title, status, summary), so the
// three can never describe the plan differently. Edit the plan here only.

export type LayerStatusKind = 'current' | 'iterating' | 'planned';

export interface LayerStatus {
    label: string;
    /** Maps to the .tag--<kind> pill colours in src/styles/components.css. */
    kind: LayerStatusKind;
}

export interface RoadmapLayer {
    /** "Phase I" etc. */
    phase: string;
    title: string;
    /** Short system label shown as a neutral pill, e.g. "Tactical combat". */
    tag: string;
    statuses: LayerStatus[];
    /** Accent stripe class from src/styles/sections.css (.phase-*). */
    colorClass: string;
    /** A few words - the printed factsheet fits title, pills and this on one line. */
    summary: string;
    /** A paragraph - the press kit and roadmap page. */
    description: string;
    /** Concrete pieces of the layer - the roadmap page only. */
    points: string[];
}

export const ROADMAP: RoadmapLayer[] = [
    {
        phase: 'Phase I',
        title: 'The Expedition',
        tag: 'Tactical combat',
        statuses: [
            { label: 'Playable', kind: 'current' },
            { label: 'In active development', kind: 'iterating' },
        ],
        colorClass: 'phase-expedition',
        summary: 'Grid tactics: executing a plan under pressure.',
        description:
            'Direct unit control on a grid, where winning feels like executing a plan under pressure without losing anyone you could not afford to lose. The satisfaction is in foresight, not reaction.',
        points: [
            'Grid combat with facing and positional damage across four unit roles',
            'The shrinking army: one unit left behind to hold the relay after every fight',
            'Mouse, keyboard, and controller support',
        ],
    },
    {
        phase: 'Phase II',
        title: 'The Shard',
        tag: 'Home base',
        statuses: [{ label: 'Planned', kind: 'planned' }],
        colorClass: 'phase-shard',
        summary: 'A settlement that keeps running while you are away.',
        description:
            'A settlement you build and return to, which will run autonomously while you are away. It is not meant to be a second job - it is an exhale. Somewhere to notice what changed, make a few decisions, and go back out.',
        points: [
            'Home base growth that continues while you are away',
            'Hero housing',
            'Cosmetic and systemic upgrades',
        ],
    },
    {
        phase: 'Phase III',
        title: 'The Campaign',
        tag: 'Rift campaign',
        statuses: [{ label: 'Planned', kind: 'planned' }],
        colorClass: 'phase-campaign',
        summary: 'A chain of relays across the rift, held at the cost of your units.',
        description:
            'Expeditions push into rifts along a chain of signal relays, and holding that chain costs bodies. Units left behind to garrison a relay are units that do not reach the next fight, so deciding which unit to leave where is as consequential as any individual battle.',
        points: [
            'Relay networks stretched across the rift',
            'Node defense - deciding which links are worth holding',
            'Strategic pressure across the rift map',
        ],
    },
    {
        phase: 'Phase IV',
        title: 'The Community',
        tag: 'Stream integration',
        statuses: [{ label: 'Future', kind: 'planned' }],
        colorClass: 'phase-community',
        summary: 'Viewers shape the home shard while you raid. Optional by design.',
        description:
            'Viewers will be able to interact with the home shard while the Veilkeeper is away raiding. An enhancement layer only - Veilkeeper is designed to remain fully playable offline.',
        points: [
            'Viewer characters and stream events',
            'Community shards and audience participation',
            'Optional by design - Veilkeeper stays fully playable offline',
        ],
    },
];
