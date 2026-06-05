export const COLLECTION_TYPES = [
  'tracks', 'concepts', 'lessons', 'exercises', 'sessions', 'rubrics', 'templates',
] as const;
export type CollectionType = (typeof COLLECTION_TYPES)[number];

// ContentType = singular frontmatter `type` discriminant.
// Distinct from CollectionType (plural collection/folder name, e.g. 'concepts').
export type ContentType = 'concept' | 'lesson' | 'exercise' | 'session' | 'rubric' | 'template' | 'track';

export const TYPE_COLOR: Record<string, string> = {
  concept: 'var(--type-concept)',
  lesson: 'var(--type-lesson)',
  exercise: 'var(--type-exercise)',
  session: 'var(--type-session)',
  rubric: 'var(--type-rubric)',
  template: 'var(--type-template)',
  track: 'var(--type-track)',
};

// Safe accessor: callers pass a runtime string (frontmatter `type`); unknown
// types get a neutral grey so `undefined` never leaks into a CSS value.
export function typeColor(t: string): string {
  return TYPE_COLOR[t] ?? '#a1a1aa';
}

// Per-track accent colors, keyed by track slug (entry.id, e.g. 'ai-engineering').
// Separate axis from TYPE_COLOR: "which curriculum" vs "what kind of thing".
export const TRACK_COLOR: Record<string, string> = {
  'ai-engineering': 'var(--track-ai-engineering)',
  'building-with-ai-agents': 'var(--track-building-with-ai-agents)',
  'product-minded-builder': 'var(--track-product-minded-builder)',
  'solo-founder': 'var(--track-solo-founder)',
  'system-design-for-builders': 'var(--track-system-design-for-builders)',
};

// Safe accessor: unknown track slugs get a neutral grey.
export function trackColor(slug: string): string {
  return TRACK_COLOR[slug] ?? '#a1a1aa';
}

export interface GraphNode { id: string; label: string; type: string; url: string; track?: string; summary?: string; }
export interface GraphEdge { source: string; target: string; rel: string; }
