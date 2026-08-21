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
  const g = new Graph({ type: 'undirected', multi: false, allowSelfLoops: false });
  for (const n of nodes) g.mergeNode(n.id, { type: n.type });
  for (const e of edges) if (e.source !== e.target) g.mergeEdge(e.source, e.target);

  // FA2 needs distinct starting positions, and seeding by type makes same-type
  // nodes start together so the converged layout reads as clusters.
  circlepack.assign(g, { hierarchyAttributes: ['type'], scale: 1.2 });

  forceAtlas2.assign(g, {
    iterations,
    settings: { ...forceAtlas2.inferSettings(g), barnesHutOptimize: true, adjustSizes: false },
  });

  // Normalise into a ~[-500, 500] box so camera defaults and node sizes behave
  // the same no matter how many nodes the graph has grown to.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  g.forEachNode((_id, a) => {
    minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
    minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
  });
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const k = 1000 / span;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;

  return nodes.map((n) => {
    const a = g.getNodeAttributes(n.id);
    return {
      ...n,
      x: Math.round((a.x - cx) * k * 100) / 100,
      y: Math.round((a.y - cy) * k * 100) / 100,
      degree: g.degree(n.id),
    };
  });
}
