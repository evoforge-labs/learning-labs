import { getCollection } from 'astro:content';
import { COLLECTION_TYPES, type CollectionType } from './types';

export async function getAll(type: CollectionType) {
  const entries = await getCollection(type as any);
  return entries.filter((e: any) => e.data.status !== 'archived');
}

// Return all non-archived entries (across ALL collections) whose frontmatter
// references `id` in any of: prerequisites, related, exercise, rubric.
// Excludes the entry whose own frontmatter id equals `id`.
export async function usedIn(id: string): Promise<Array<{ type: CollectionType; slug: string; title: string; dataType: string }>> {
  const results: Array<{ type: CollectionType; slug: string; title: string; dataType: string }> = [];
  for (const type of COLLECTION_TYPES) {
    const entries = await getCollection(type as any);
    for (const e of (entries as any[]).filter((e: any) => e.data.status !== 'archived')) {
      if (e.data.id === id) continue;
      const d = e.data;
      const refs: string[] = [
        ...(Array.isArray(d.prerequisites) ? d.prerequisites : d.prerequisites ? [d.prerequisites] : []),
        ...(Array.isArray(d.related) ? d.related : d.related ? [d.related] : []),
        ...(Array.isArray(d.exercise) ? d.exercise : d.exercise ? [d.exercise] : []),
        ...(Array.isArray(d.rubric) ? d.rubric : d.rubric ? [d.rubric] : []),
      ];
      if (refs.includes(id)) {
        results.push({ type, slug: e.id, title: d.title, dataType: d.type });
      }
    }
  }
  return results;
}

// Map every frontmatter id -> { type, slug, title, dataType } for fast linking.
// Only non-archived entries are indexed so urlForId never returns a URL to a
// page that is never generated (which would cause a 404 at build time).
export async function idIndex() {
  const index = new Map<string, { type: CollectionType; slug: string; title: string; dataType: string }>();
  for (const type of COLLECTION_TYPES) {
    const entries = await getCollection(type as any);
    for (const e of (entries as any[]).filter((e: any) => e.data.status !== 'archived')) {
      index.set(e.data.id, { type, slug: e.id, title: e.data.title, dataType: e.data.type });
    }
  }
  return index;
}

// URL for an entry id: search every collection for a matching frontmatter `id`.
export async function urlForId(id: string): Promise<string | null> {
  const idx = await idIndex();
  const hit = idx.get(id);
  return hit ? `/${hit.type}/${hit.slug}` : null;
}
