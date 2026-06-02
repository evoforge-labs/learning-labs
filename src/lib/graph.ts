import type { GraphNode, GraphEdge } from './types';

interface RawDoc { id: string; title: string; type: string; collection: string; slug: string;
  track?: string; exercise?: string; rubric?: string; prerequisites?: string[]; related?: string[]; }

const REF_FIELDS: { field: keyof RawDoc; rel: string }[] = [
  { field: 'exercise', rel: 'exercise' }, { field: 'rubric', rel: 'rubric' },
  { field: 'prerequisites', rel: 'prereq' }, { field: 'related', rel: 'related' },
];

export function buildGraph(docs: RawDoc[], extraEdges: GraphEdge[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const known = new Set(docs.map((d) => d.id));
  const nodes: GraphNode[] = docs.map((d) => ({ id: d.id, label: d.title, type: d.type, url: `/${d.collection}/${d.slug}` }));
  const edges: GraphEdge[] = [];
  for (const d of docs) {
    for (const { field, rel } of REF_FIELDS) {
      const v = d[field];
      const refs = Array.isArray(v) ? v : v ? [v as string] : [];
      for (const r of refs) if (known.has(r)) edges.push({ source: d.id, target: r, rel });
    }
  }
  for (const e of extraEdges) if (known.has(e.source) && known.has(e.target)) edges.push(e);
  return { nodes, edges };
}
