import { getCollection, type CollectionEntry } from 'astro:content';

export type DevlogEntry = CollectionEntry<'devlog'>;

/** All devlog entries, newest first (slug breaks date ties, e.g. devlog-03/04). */
export async function getSortedDevlogs(): Promise<DevlogEntry[]> {
    const entries = await getCollection('devlog');

    return entries.sort(
        (a, b) =>
            b.data.date.getTime() - a.data.date.getTime() ||
            b.id.localeCompare(a.id)
    );
}

/** "July 2026" — matches the old client-side formatting (UTC to avoid date shifts). */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        timeZone: 'UTC'
    }).format(date);
}

export function getPostUrl(entry: DevlogEntry): string {
    return `/devlog/${entry.id}/`;
}
