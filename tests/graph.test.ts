import { describe, it, expect } from 'vitest';
import { buildGraph } from '../src/lib/graph';

const docs = [
  { id: 'concept-mvp', title: 'MVP', type: 'concept', collection: 'concepts', slug: 'mvp' },
  { id: 'lesson-1', title: 'L1', type: 'lesson', collection: 'lessons', slug: 'l1', related: ['concept-mvp'] },
];

describe('buildGraph', () => {
  it('creates a node per doc', () => {
    expect(buildGraph(docs, []).nodes).toHaveLength(2);
  });
  it('creates edges from related field', () => {
    const { edges } = buildGraph(docs, []);
    expect(edges).toContainEqual({ source: 'lesson-1', target: 'concept-mvp', rel: 'related' });
  });
  it('drops edges to unknown ids', () => {
    const bad = [{ id: 'lesson-2', title: 'L2', type: 'lesson', collection: 'lessons', slug: 'l2', related: ['ghost'] }];
    expect(buildGraph(bad, []).edges).toHaveLength(0);
  });
  it('includes extra registry edges', () => {
    const { edges } = buildGraph(docs, [{ source: 'concept-mvp', target: 'lesson-1', rel: 'manual' }]);
    expect(edges.some(e => e.rel === 'manual')).toBe(true);
  });
});
