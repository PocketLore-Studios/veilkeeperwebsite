import { getCollection, type CollectionEntry } from 'astro:content';

export type UnitEntry = CollectionEntry<'units'>;

/**
 * All units in roster order: explicit `order` ascending (unset sorts last),
 * then `name` ascending as a stable tiebreaker.
 */
export async function getSortedUnits(): Promise<UnitEntry[]> {
    const entries = await getCollection('units');

    return entries.sort(
        (a, b) =>
            (a.data.order ?? Infinity) - (b.data.order ?? Infinity) ||
            a.data.name.localeCompare(b.data.name)
    );
}

export function getUnitUrl(entry: UnitEntry): string {
    return `/units/${entry.id}/`;
}
