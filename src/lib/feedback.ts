// Single source of truth for the /feedback form.
//
// Both the Astro page (src/pages/feedback/index.astro) and the Cloudflare Worker
// (worker/index.ts) import this module so the rendered fields, the server-side
// allowlist, and the email formatting can never drift apart.

export type FieldType = 'text' | 'textarea' | 'select' | 'email' | 'url';

export interface FieldDef {
    /** Form control `name` — also the allowlist key on the server. */
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    /** Hard per-field character cap, enforced client- and server-side. */
    maxLength: number;
    /** Options for `select` fields. */
    options?: string[];
    placeholder?: string;
    /** Longer helper copy rendered under the label. */
    help?: string;
}

export interface CategoryDef {
    /** Stable machine value (radio value, `category` field, allowlist key). */
    value: string;
    label: string;
    /** One-line description shown beside the option. */
    blurb: string;
    /** Field `name` whose value seeds the email subject line. */
    summaryField: string;
    fields: FieldDef[];
}

// Shared limits ------------------------------------------------------------

export const EMAIL_MAX = 254;
/** Cap on the combined length of all submitted field values. */
export const MAX_TOTAL_CHARS = 20_000;
/** Reject request bodies larger than this before parsing (bytes). */
export const MAX_BODY_BYTES = 128 * 1024;

const SHORT = 200;
const LONG = 2_000;
const URLLEN = 500;

// The optional contact field is shared across every category and used only as
// the Reply-To on the notification email.
export const EMAIL_FIELD: FieldDef = {
    name: 'email',
    label: 'Your email (optional)',
    type: 'email',
    maxLength: EMAIL_MAX,
    placeholder: 'you@example.com',
    help: 'Only used if we need to follow up. Never shared.',
};

/** Hidden honeypot control name — any value means "bot". */
export const HONEYPOT_FIELD = 'company';

export const CATEGORIES: CategoryDef[] = [
    {
        value: 'bug',
        label: 'Bug report',
        blurb: 'Something broke, crashed, or behaved incorrectly.',
        summaryField: 'bug_what',
        fields: [
            { name: 'bug_build', label: 'Build version', type: 'text', required: true, maxLength: SHORT, placeholder: 'e.g. 0.4.2 or itch build 214' },
            { name: 'bug_os', label: 'Operating system', type: 'text', required: true, maxLength: SHORT, placeholder: 'e.g. Windows 11, macOS 14, Linux' },
            { name: 'bug_what', label: 'What happened?', type: 'textarea', required: true, maxLength: LONG },
            { name: 'bug_before', label: 'What were you doing beforehand?', type: 'textarea', maxLength: LONG },
            { name: 'bug_expected', label: 'What did you expect to happen?', type: 'textarea', maxLength: LONG },
            { name: 'bug_repro', label: 'Can you reproduce it?', type: 'select', maxLength: SHORT, options: ['Always', 'Sometimes', 'Only once', 'Not sure'] },
            { name: 'bug_log', label: 'Screenshot or log link (optional)', type: 'url', maxLength: URLLEN, placeholder: 'https://…', help: 'Paste a link to an image or log. File uploads coming later.' },
        ],
    },
    {
        value: 'gameplay',
        label: 'Gameplay feedback',
        blurb: 'How an encounter felt to play.',
        summaryField: 'gp_encounter',
        fields: [
            { name: 'gp_encounter', label: 'Which encounter did you play?', type: 'text', required: true, maxLength: SHORT },
            { name: 'gp_good', label: 'What felt good?', type: 'textarea', maxLength: LONG },
            { name: 'gp_confusing', label: 'What felt confusing?', type: 'textarea', maxLength: LONG },
            { name: 'gp_unit', label: 'Did any unit feel too strong or weak?', type: 'textarea', maxLength: LONG },
            { name: 'gp_unexplained', label: 'Did anything happen you could not explain?', type: 'textarea', maxLength: LONG },
            { name: 'gp_else', label: 'Anything else?', type: 'textarea', maxLength: LONG },
        ],
    },
    {
        value: 'interface',
        label: 'Confusing interface or mechanic',
        blurb: 'A screen, control, or rule that did not read clearly.',
        summaryField: 'ui_element',
        fields: [
            { name: 'ui_element', label: 'Which screen, mechanic, or UI element?', type: 'text', required: true, maxLength: SHORT },
            { name: 'ui_expected', label: 'What did you expect it to do?', type: 'textarea', maxLength: LONG },
            { name: 'ui_actual', label: 'What actually happened, or how did it read to you?', type: 'textarea', required: true, maxLength: LONG },
            { name: 'ui_build', label: 'Build version (optional)', type: 'text', maxLength: SHORT },
        ],
    },
    {
        value: 'balance',
        label: 'Balance feedback',
        blurb: 'A unit, ability, or encounter felt over- or under-tuned.',
        summaryField: 'bal_subject',
        fields: [
            { name: 'bal_subject', label: 'Which unit, ability, or encounter?', type: 'text', required: true, maxLength: SHORT },
            { name: 'bal_direction', label: 'Too strong or too weak?', type: 'select', maxLength: SHORT, options: ['Too strong', 'Too weak', 'Both / situational'] },
            { name: 'bal_why', label: 'What happened that made it feel that way?', type: 'textarea', required: true, maxLength: LONG },
            { name: 'bal_context', label: 'Which encounter or context?', type: 'text', maxLength: SHORT },
        ],
    },
    {
        value: 'other',
        label: 'Other',
        blurb: 'Anything that does not fit the categories above.',
        summaryField: 'other_subject',
        fields: [
            { name: 'other_subject', label: 'Subject', type: 'text', required: true, maxLength: SHORT },
            { name: 'other_message', label: 'Your message', type: 'textarea', required: true, maxLength: LONG },
        ],
    },
];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

export function getCategory(value: string): CategoryDef | undefined {
    return CATEGORIES.find((c) => c.value === value);
}
