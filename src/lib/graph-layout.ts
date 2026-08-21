import Graph from 'graphology';
import circlepack from 'graphology-layout/circlepack';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphNode, GraphEdge } from './types';

/** A node with the coordinates + degree the renderer needs. */
export interface PositionedNode extends GraphNode { x: number; y: number; degree: number }

/**
 * Runs ForceAtlas2 at *build time* so the browser gets a finished layout and
 * never has to run a physics simulation just to draw the first frame. This is
 * the single biggest reason the map is smooth: the client does zero layout work
 * on load. Live physics is opt-in at runtime (see KnowledgeGraph.astro).
 */
export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations = 700,
): PositionedNode[] {
  // Degrees come from the full edge list, but only *connected* nodes go through
  // FA2. Unconnected ones have no forces acting on them, so FA2 just leaves them
  // wherever they were seeded — which showed up as a stray diagonal of dots that
  // also stretched the bounding box and pushed the real graph off-centre.
  const degree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const pairs = new Set<string>();
  for (const e of edges) {
    if (e.source === e.target) continue;
    if (!degree.has(e.source) || !degree.has(e.target)) continue;
    const key = e.source < e.target ? `${e.source} ${e.target}` : `${e.target} ${e.source}`;
    if (pairs.has(key)) continue;      // dedupe: prereq + related can repeat a pair
    pairs.add(key);
    degree.set(e.source, degree.get(e.source)! + 1);
    degree.set(e.target, degree.get(e.target)! + 1);
  }

  const g = new Graph({ type: 'undirected', multi: false, allowSelfLoops: false });
  for (const n of nodes) if (degree.get(n.id)! > 0) g.mergeNode(n.id, { type: n.type });
  for (const key of pairs) {
    const [s, t] = key.split(' ');
    g.mergeEdge(s, t);
  }

  // FA2 needs distinct starting positions, and seeding by type makes same-type
  // nodes start together so the converged layout reads as clusters.
  circlepack.assign(g, { hierarchyAttributes: ['type'], scale: 1.2 });

  forceAtlas2.assign(g, {
    iterations,
    settings: { ...forceAtlas2.inferSettings(g), barnesHutOptimize: true, adjustSizes: false },
  });

  // Normalise the connected core into a ~[-500, 500] box so camera defaults and
  // node sizes behave the same no matter how many nodes the graph has grown to.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  g.forEachNode((_id, a) => {
    minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
    minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
  });
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const k = 1000 / span;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const round = (v: number) => Math.round(v * 100) / 100;

  // Orphans get a deliberate ring just outside the core: it reads as "nothing
  // links here yet" instead of looking like a layout glitch, and it grows the
  // box symmetrically so the core stays centred.
  const orphans = nodes.filter((n) => degree.get(n.id) === 0);
  const R = 620;
  const orphanPos = new Map<string, { x: number; y: number }>();
  orphans.forEach((n, i) => {
    const a = (i / Math.max(orphans.length, 1)) * Math.PI * 2 - Math.PI / 2;
    orphanPos.set(n.id, { x: round(Math.cos(a) * R), y: round(Math.sin(a) * R) });
  });

  return nodes.map((n) => {
    const deg = degree.get(n.id)!;
    const p = deg > 0
      ? (() => { const a = g.getNodeAttributes(n.id); return { x: round((a.x - cx) * k), y: round((a.y - cy) * k) }; })()
      : orphanPos.get(n.id)!;
    return { ...n, x: p.x, y: p.y, degree: deg };
  });
}
