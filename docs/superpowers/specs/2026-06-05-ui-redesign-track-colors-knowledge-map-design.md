# UI Redesign — Track Accent Colors + Knowledge Map Upgrade

**Date:** 2026-06-05
**Status:** Approved (brainstorm)
**Scope:** Two areas only — (1) per-track accent color layer, (2) Knowledge Map from "nice to look at" to "usable navigation tool". The concept/lesson page redesign is explicitly **out of scope** (kept as-is).

> Context note: this redesign work is separate from two bug fixes already shipped in the same session — the home track-card concept count (`index.astro`) and the dev-mode `/search` Pagefind crash. Those are done and verified by a full `pnpm build`; they are not part of this spec.

## Goals

- Make the 5 track cards visually distinguishable (today they look identical: same layout, same grey dot).
- Make the Knowledge Map navigable: legend, filter, search, color-by toggle, hover highlight, click-to-peek.
- Keep changes low-risk and tasteful; do not introduce visual clutter.

## Non-Goals

- No concept/lesson page layout changes (no 3-column rail, no TOC).
- No full theme/branding overhaul — neutral zinc base stays.
- No change to existing `--type-*` colors or where they're used (badges, sidebar dots, default graph node color).

---

## Part 1: Track Accent Color Layer

### Approach
Approach A (approved): a **track accent layer that sits on top of** the existing `--type-*` color system. Two independent color axes:
- **Type color** (existing) = "what kind of thing is this" — badges, sidebar dots, default graph node color. **Unchanged.**
- **Track color** (new) = "which curriculum does this belong to" — used only on track-level surfaces.

### Color tokens
Add 5 CSS variables to `src/styles/global.css` alongside the existing `--type-*` block:

| Track id | Variable | Hex | Name |
|---|---|---|---|
| `track-ai-engineering` | `--track-ai-engineering` | `#6366f1` | indigo |
| `track-building-with-ai-agents` | `--track-building-with-ai-agents` | `#8b5cf6` | violet |
| `track-product-minded-builder` | `--track-product-minded-builder` | `#14b8a6` | teal |
| `track-solo-founder` | `--track-solo-founder` | `#f97316` | orange |
| `track-system-design-for-builders` | `--track-system-design-for-builders` | `#0ea5e9` | sky |

Track ids correspond to the track entry id (`entry.id`, the slug — e.g. `ai-engineering`), so the key form used by the helper must match what the cards/pages have. The helper maps the **track slug** (e.g. `ai-engineering`) to its color; define the map keyed by slug.

### Helper
In `src/lib/types.ts`, mirror the existing `typeColor()`:

```ts
export const TRACK_COLOR: Record<string, string> = {
  'ai-engineering': 'var(--track-ai-engineering)',
  'building-with-ai-agents': 'var(--track-building-with-ai-agents)',
  'product-minded-builder': 'var(--track-product-minded-builder)',
  'solo-founder': 'var(--track-solo-founder)',
  'system-design-for-builders': 'var(--track-system-design-for-builders)',
};
export function trackColor(slug: string): string {
  return TRACK_COLOR[slug] ?? '#a1a1aa'; // neutral grey fallback for unknown ids
}
```

### Where applied (restrained — these surfaces ONLY)
1. **Home track cards** (`src/pages/index.astro`): add a 4px left border in the track color, and change the existing dot from `--type-track` to the per-track color (`trackColor(t.id)`).
2. **Track detail header** (`src/pages/[type]/[...slug].astro`, only when `d.type === 'track'`): a track-colored chip/strip in the header. Must not affect non-track pages.

### Explicitly NOT changed
Type badges, sidebar nav dots, graph node colors (those stay type-colored by default; track coloring in the graph is opt-in via the toggle in Part 2).

---

## Part 2: Knowledge Map Upgrade

### Files touched
- `src/components/content/KnowledgeGraph.astro` — add control UI (legend/filter, search, color-by toggle, reset) and client logic (hover highlight, peek panel, filter, search-to-node).
- `src/pages/knowledge-map.astro` — pass additional node fields (`type`, `track`, `summary`) into the graph payload.
- `src/lib/graph.ts` (`buildGraph`) — include `type`, `track`, and a short `summary` on each node so the peek panel and color-by-track have data. (Verify current node shape; today nodes carry `id, label, type, url`.)

### Features
1. **Legend = filter** (left, fixed): list each content type with its color swatch and a count. Clicking a legend item toggles visibility of that type's nodes. Filtering hides nodes via a CSS/display class (e.g. cytoscape `.hidden` class with `display: none`), **not** by removing elements — so the physics layout doesn't jump.
2. **Search box**: typing highlights/dims nodes by label match; Enter centers + zooms (`cy.animate({center, zoom})`) on the first match.
3. **Color-by toggle (Type / Track)**: switches node `background-color` between type color (default, current behaviour) and track color (using Part 1's 5 colors via the payload's `colors`/`trackColors` maps). Nodes with no track → grey.
4. **Hover highlight**: on `mouseover` of a node, add a `.faded` class to all elements, then remove it from the hovered node + its direct neighborhood (`node.closedNeighborhood()`) and connecting edges; restore on `mouseout`.
5. **Click → Peek panel** (replaces current tap-to-navigate): clicking a node opens a small panel (corner on desktop, bottom sheet on mobile) showing title, type badge, short summary, and an "Mở trang →" button linking to `url`. Clicking the background closes it. The direct-navigation `cy.on('tap', 'node', ...)` is removed in favor of this.
6. **Reset view**: button that fits all (visible) elements back to the initial framing.

### Technical notes
- The `cola` layout currently runs `infinite: true`. Keep physics for initial settle, then `stop()` once stable to avoid CPU burn; filtering toggles node visibility rather than re-running an infinite layout, preventing layout jumps. (If hiding nodes mid-`infinite` run still jitters, gate the stop on a `layoutstop`/timeout as today's `setTimeout` fit already does.)
- Payload (`#cy-data` JSON island) must carry per-node `type`, `track`, `summary`, plus a `trackColors` map in addition to the existing type `colors` map.
- Keep the existing `astro:before-swap` cleanup that stops the running layout.

### Responsive
- `<768px`: legend/filter collapse into a horizontally-scrolling chip row above the graph; peek panel becomes a bottom sheet.

---

## Testing / Verification

- `pnpm build` passes (exit 0), Pagefind step still runs.
- Visual verification via Playwright screenshots (reuse `outputs/ui-review/shoot.py` harness on the running dev server):
  - Home: 5 track cards show 5 distinct left-border/dot colors.
  - Track detail: header chip uses the right track color.
  - Knowledge Map: legend visible with counts; toggling a legend item hides that type; search centers a node; color-by-track recolors nodes; hovering fades the rest; clicking opens the peek panel (no immediate navigation).
- Existing content tests (`pnpm test`) and `pnpm validate:content` still pass (no content schema changes expected; if `buildGraph` summary requires reading a frontmatter field, confirm it exists or derive from existing fields).

## Risks / Open Questions

- `summary` source for peek panel: tracks/lessons have `summary`; concepts may not. Fallback: first paragraph is not available at graph-build time, so use `title` only when `summary` is absent. (Decide during implementation; default to title-only fallback.)
- Track color hexes are a first proposal; easy to tweak in one place (`global.css`).
