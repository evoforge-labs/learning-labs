export const COLLECTION_TYPES = [
  'tracks', 'concepts', 'lessons', 'exercises', 'sessions', 'rubrics', 'templates',
] as const;
export type CollectionType = (typeof COLLECTION_TYPES)[number];

// ContentType = singular frontmatter `type` discriminant.
// Distinct from CollectionType (plural collection/folder name, e.g. 'concepts').
export type ContentType = 'concept' | 'lesson' | 'exercise' | 'session' | 'rubric' | 'template' | 'track';

// Single source of truth for all type/track colors — raw hex, not CSS vars,
// because the cytoscape canvas can't resolve CSS custom properties.
export const TYPE_COLOR: Record<string, string> = {
  concept: '#3b82f6',
  lesson: '#22c55e',
  exercise: '#f59e0b',
  session: '#8b5cf6',
  rubric: '#f43f5e',
  template: '#64748b',
  track: '#0d9488',
};

export const TYPE_LABEL: Record<string, string> = {
  concept: 'Concept', lesson: 'Lesson', exercise: 'Exercise', session: 'Session',
  rubric: 'Rubric', template: 'Template', track: 'Track',
};

// Safe accessor: callers pass a runtime string (frontmatter `type`); unknown
// types get a neutral grey so `undefined` never leaks into a CSS value.
export function typeColor(t: string): string {
  return TYPE_COLOR[t] ?? '#a8a29e';
}

// Per-track accent colors, keyed by track slug (entry.id, e.g. 'ai-engineering').
// Separate axis from TYPE_COLOR: "which curriculum" vs "what kind of thing".
export const TRACK_COLOR: Record<string, string> = {
  'ai-engineering': '#6366f1',
  'ai-product-management': '#d946ef',
  'building-with-ai-agents': '#8b5cf6',
  'communication-negotiation': '#d97706',
  'design-for-builders': '#ec4899',
  'founder-sales': '#e11d48',
  'growth-marketing': '#06b6d4',
  'philosophy': '#9333ea',
  'product-analytics': '#ca8a04',
  'product-minded-builder': '#0ea5e9',
  'security-for-builders': '#dc2626',
  'ship-and-operate': '#10b981',
  'solo-founder': '#f97316',
  'system-design-for-builders': '#2563eb',
  'thinking-and-learning': '#65a30d',
};

// Safe accessor: unknown track slugs get a neutral grey.
export function trackColor(slug: string): string {
  return TRACK_COLOR[slug] ?? '#a8a29e';
}

export interface GraphNode { id: string; label: string; type: string; url: string; track?: string; summary?: string; }
export interface GraphEdge { source: string; target: string; rel: string; }
