# learning-lab v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Astro + MDX "personal learning OS" website that is read-only (no forms), with a hybrid UI (Substack-style reading pages + shadcn-style navigation), an interactive knowledge graph, and a two-layer content validation system.

**Architecture:** MDX is the source of truth, organized into Astro Content Collections with Zod schemas (type-safe, build fails on bad frontmatter). A `validate-content.ts` script adds cross-file checks Zod can't do (duplicate ids, alias clashes, broken references). Pages are DRY: one home page, one generic collection index, one generic detail/reading page driven by `type`, plus a knowledge-map page. Output is fully static; Cytoscape (graph), Motion (animation), Mermaid (diagrams) and Pagefind (search) load client-side only where needed.

**Tech Stack:** Astro 5, TypeScript, MDX, Tailwind CSS v4 (`@tailwindcss/vite`), `@tailwindcss/typography`, Lucide (`@lucide/astro`), Motion (`motion`), Cytoscape.js (`cytoscape` + `cytoscape-fcose`), Mermaid, Pagefind, `astro-expressive-code`, Vitest (tests), `tsx` (validate script), `@fontsource-variable/inter` + `@fontsource/spectral`.

---

## File Structure

```
astro.config.mjs                 # integrations: mdx, expressive-code; vite tailwind plugin
package.json                     # scripts: dev/build/preview/validate:content/test
tsconfig.json
src/
  content.config.ts              # Zod schemas for all collections (Astro 5 content layer)
  styles/global.css              # tailwind import + @theme tokens + type colors + dark variant
  lib/
    types.ts                     # shared TS types (CollectionType, GraphNode, GraphEdge)
    content.ts                   # query helpers over collections
    graph.ts                     # build {nodes, edges} from frontmatter + registry
  components/
    ui/        Card.astro Badge.astro Button.astro SectionHeader.astro
    layout/    BaseLayout.astro Header.astro Sidebar.astro Drawer.astro BottomNav.astro Footer.astro ReadingLayout.astro
    content/   MetaBadges.astro RelatedLinks.astro Callout.astro Mermaid.astro
               Ask.astro Answer.astro Explain.astro KnowledgeGraph.astro
  pages/
    index.astro                  # home (shadcn card grid)
    [type]/index.astro           # generic collection listing
    [type]/[...slug].astro       # generic detail / reading page
    knowledge-map.astro          # Cytoscape island
  content/
    tracks/ concepts/ lessons/ exercises/ sessions/ rubrics/ templates/
    registry/ tags.yaml knowledge-map.yaml
scripts/validate-content.ts
tests/validate-content.test.ts
tests/graph.test.ts
README.md  CONTENT_GUIDE.md  .gitignore
```

DRY note: the 7 content "types" (tracks, concepts, lessons, exercises, sessions, rubrics, templates) all route through `[type]/index.astro` and `[type]/[...slug].astro`. The detail page swaps header/footer blocks based on `type`.

---

## Task 1: Scaffold Astro project + dependencies

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`

- [ ] **Step 1: Create a minimal Astro project in the current directory**

Run (current dir already contains `docs/` and `.git`; use the empty-template, non-interactive):
```bash
npm create astro@latest . -- --template minimal --no-install --no-git --skip-houston --yes
```
Expected: creates `src/`, `public/`, `astro.config.mjs`, `package.json`, `tsconfig.json`. If it refuses because the directory is non-empty, accept the prompt to continue / merge.

- [ ] **Step 2: Install runtime + dev dependencies**

```bash
pnpm add @astrojs/mdx astro-expressive-code tailwindcss @tailwindcss/vite @tailwindcss/typography @lucide/astro motion cytoscape cytoscape-fcose mermaid @fontsource-variable/inter @fontsource/spectral js-yaml
pnpm add -D tsx vitest gray-matter @types/cytoscape @types/js-yaml pagefind
```
Expected: dependencies appear in `package.json`, exit 0.

- [ ] **Step 3: Write `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';
import tailwindcss from '@tailwindcss/vite';

// expressive-code must come before mdx
export default defineConfig({
  output: 'static',
  integrations: [
    expressiveCode({ themes: ['github-dark', 'github-light'] }),
    mdx(),
  ],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: Set `package.json` scripts**

Edit the `"scripts"` block to exactly:
```json
{
  "dev": "astro dev",
  "build": "astro build && pagefind --site dist",
  "preview": "astro preview",
  "validate:content": "tsx scripts/validate-content.ts",
  "test": "vitest run"
}
```

- [ ] **Step 5: Verify the scaffold boots**

Run: `pnpm dev -- --host` then stop after it prints the local URL (Ctrl-C).
Expected: "astro" dev server starts with no config errors.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold astro project with deps and config"
```

---

## Task 2: Global styles, theme tokens, fonts

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* class-based dark mode */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-brand: #6366f1;
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-read: "Spectral", Georgia, serif;
}

/* type colors used by badges + graph nodes */
:root {
  --type-concept: #3b82f6;
  --type-lesson: #22c55e;
  --type-exercise: #f59e0b;
  --type-session: #8b5cf6;
  --type-rubric: #f43f5e;
  --type-template: #64748b;
  --type-track: #6366f1;
}

html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); }

/* Substack-style reading body */
.read-body { font-family: var(--font-read); font-size: 20px; line-height: 1.75; letter-spacing: .1px; }
.read-body p { margin: 1.15em 0; }
.read-body h2 { font-weight: 600; font-size: 1.45rem; margin: 1.6em 0 .2em; }
.read-body a { text-decoration: underline; text-underline-offset: 3px; }

/* floating TOC */
.toc-wrap:hover .toc-panel { opacity: 1; visibility: visible; transform: translateX(0); }
.toc-wrap:hover .toc-handle { opacity: 0; }
.toc-panel { opacity: 0; visibility: hidden; transform: translateX(-6px); transition: .18s; }
```

- [ ] **Step 2: Verify Tailwind compiles**

Temporarily add `import '../styles/global.css'` is not yet wired; instead run `pnpm build` after BaseLayout imports it (Task 7). For now run: `pnpm exec astro check || true` to confirm no syntax error in config.
Expected: no CSS import errors reported by Vite during next build.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add global styles, theme tokens, dark variant"
```

---

## Task 3: Content Collections + Zod schemas

**Files:**
- Create: `src/content.config.ts`
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write `src/lib/types.ts`**

```ts
export const COLLECTION_TYPES = [
  'tracks', 'concepts', 'lessons', 'exercises', 'sessions', 'rubrics', 'templates',
] as const;
export type CollectionType = (typeof COLLECTION_TYPES)[number];

export const TYPE_COLOR: Record<string, string> = {
  concept: 'var(--type-concept)',
  lesson: 'var(--type-lesson)',
  exercise: 'var(--type-exercise)',
  session: 'var(--type-session)',
  rubric: 'var(--type-rubric)',
  template: 'var(--type-template)',
  track: 'var(--type-track)',
};

export interface GraphNode { id: string; label: string; type: string; url: string; }
export interface GraphEdge { source: string; target: string; rel: string; }
```

- [ ] **Step 2: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const status = z.enum(['draft', 'published', 'archived']).default('draft');
const base = { title: z.string(), tags: z.array(z.string()).default([]), status };
// `id` is the file slug; we also keep an explicit `id` field for cross-repo uniqueness checks.
const idField = { id: z.string() };

const tracks = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/tracks' }),
  schema: z.object({ ...idField, ...base, type: z.literal('track'),
    summary: z.string().optional() }),
});
const concepts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/concepts' }),
  schema: z.object({ ...idField, ...base, type: z.literal('concept'),
    aliases: z.array(z.string()).default([]) }),
});
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({ ...idField, ...base, type: z.literal('lesson'),
    track: z.string(), module: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    prerequisites: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]) }),
});
const exercises = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/exercises' }),
  schema: z.object({ ...idField, ...base, type: z.literal('exercise'),
    track: z.string(), skill: z.string().optional(),
    estimatedMinutes: z.number().optional(),
    related: z.array(z.string()).default([]) }),
});
const sessions = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/sessions' }),
  schema: z.object({ ...idField, ...base, type: z.literal('session'),
    track: z.string(), exercise: z.string(),
    rubric: z.string().optional(),
    date: z.coerce.date().optional(),
    reviewedBy: z.string().nullable().default(null),
    score: z.number().nullable().default(null) }),
});
const rubrics = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/rubrics' }),
  schema: z.object({ ...idField, ...base, type: z.literal('rubric') }),
});
const templates = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/templates' }),
  schema: z.object({ ...idField, ...base, type: z.literal('template') }),
});

export const collections = { tracks, concepts, lessons, exercises, sessions, rubrics, templates };
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: define content collections with zod schemas"
```

---

## Task 4: Content query helpers (`lib/content.ts`)

**Files:**
- Create: `src/lib/content.ts`

- [ ] **Step 1: Write `src/lib/content.ts`**

```ts
import { getCollection } from 'astro:content';
import { COLLECTION_TYPES, type CollectionType } from './types';

export async function getAll(type: CollectionType) {
  const entries = await getCollection(type as any);
  return entries.filter((e: any) => e.data.status !== 'archived');
}

// URL for an entry id: search every collection for a matching frontmatter `id`.
export async function urlForId(id: string): Promise<string | null> {
  for (const type of COLLECTION_TYPES) {
    const entries = await getCollection(type as any);
    const hit = entries.find((e: any) => e.data.id === id);
    if (hit) return `/${type}/${hit.id.replace(/^[a-z]+-/, '') || hit.id}`;
  }
  return null;
}

// Map every frontmatter id -> { type, slug, title, dataType } for fast linking.
export async function idIndex() {
  const index = new Map<string, { type: CollectionType; slug: string; title: string; dataType: string }>();
  for (const type of COLLECTION_TYPES) {
    const entries = await getCollection(type as any);
    for (const e of entries as any[]) {
      index.set(e.data.id, { type, slug: e.id, title: e.data.title, dataType: e.data.type });
    }
  }
  return index;
}
```

Note: detail-page URLs use the entry's file slug (`e.id`), e.g. `/concepts/mvp`. `urlForId` resolves a frontmatter `id` (e.g. `concept-mvp`) to that route via `idIndex`. Replace the naive `urlForId` body with the index lookup:

```ts
export async function urlForId(id: string): Promise<string | null> {
  const idx = await idIndex();
  const hit = idx.get(id);
  return hit ? `/${hit.type}/${hit.slug}` : null;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add content query helpers"
```

---

## Task 5: Content validation script (TDD)

**Files:**
- Create: `scripts/validate-content.ts`
- Create: `tests/validate-content.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
```

- [ ] **Step 2: Write the failing test `tests/validate-content.test.ts`**

The validator core is a pure function `validateDocs(docs)` taking parsed frontmatter objects and returning an array of error strings. Test it directly (no filesystem).

```ts
import { describe, it, expect } from 'vitest';
import { validateDocs } from '../scripts/validate-content';

const ok = { id: 'concept-mvp', title: 'MVP', type: 'concept', status: 'published',
  aliases: ['minimum viable product'], _file: 'concepts/mvp.mdx' };

describe('validateDocs', () => {
  it('passes a valid set', () => {
    expect(validateDocs([ok])).toEqual([]);
  });
  it('flags duplicate id', () => {
    const errs = validateDocs([ok, { ...ok, _file: 'concepts/mvp2.mdx' }]);
    expect(errs.some(e => e.includes('duplicate id'))).toBe(true);
  });
  it('flags missing title/type/status', () => {
    const errs = validateDocs([{ id: 'x', _file: 'a.mdx' }]);
    expect(errs.some(e => e.includes('missing title'))).toBe(true);
    expect(errs.some(e => e.includes('missing type'))).toBe(true);
    expect(errs.some(e => e.includes('missing status'))).toBe(true);
  });
  it('flags session without exercise', () => {
    const errs = validateDocs([{ id: 'session-1', title: 'S', type: 'session',
      status: 'draft', _file: 'sessions/s.mdx' }]);
    expect(errs.some(e => e.includes('session') && e.includes('exercise'))).toBe(true);
  });
  it('flags duplicate concept alias across concepts', () => {
    const a = { ...ok, id: 'concept-a', _file: 'concepts/a.mdx', aliases: ['mvp x'] };
    const b = { ...ok, id: 'concept-b', _file: 'concepts/b.mdx', aliases: ['mvp x'] };
    const errs = validateDocs([a, b]);
    expect(errs.some(e => e.includes('alias'))).toBe(true);
  });
  it('flags broken reference', () => {
    const lesson = { id: 'lesson-1', title: 'L', type: 'lesson', status: 'published',
      track: 't', prerequisites: ['concept-nope'], _file: 'lessons/l.mdx' };
    const errs = validateDocs([lesson]);
    expect(errs.some(e => e.includes('broken reference') && e.includes('concept-nope'))).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/validate-content.test.ts`
Expected: FAIL — `validateDocs` is not exported / module not found.

- [ ] **Step 4: Write `scripts/validate-content.ts`**

```ts
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

export interface Doc { _file: string; [k: string]: any; }

const REF_FIELDS = ['track', 'exercise', 'rubric', 'prerequisites', 'related'];

export function validateDocs(docs: Doc[]): string[] {
  const errors: string[] = [];
  const ids = new Map<string, string>();        // id -> file
  const aliasOwner = new Map<string, string>();  // alias -> file

  for (const d of docs) {
    const f = d._file;
    if (!d.title) errors.push(`${f}: missing title`);
    if (!d.type) errors.push(`${f}: missing type`);
    if (!d.status) errors.push(`${f}: missing status`);

    if (d.id) {
      if (ids.has(d.id)) errors.push(`${f}: duplicate id "${d.id}" (also in ${ids.get(d.id)})`);
      else ids.set(d.id, f);
    } else {
      errors.push(`${f}: missing id`);
    }

    if (d.type === 'session' && !d.exercise) {
      errors.push(`${f}: session missing required field "exercise"`);
    }

    if (d.type === 'concept' && Array.isArray(d.aliases)) {
      for (const a of d.aliases) {
        const key = String(a).toLowerCase().trim();
        if (aliasOwner.has(key)) errors.push(`${f}: duplicate concept alias "${a}" (also in ${aliasOwner.get(key)})`);
        else aliasOwner.set(key, f);
      }
    }
  }

  // broken references (only check after all ids collected)
  const known = new Set(ids.keys());
  for (const d of docs) {
    for (const field of REF_FIELDS) {
      const v = d[field];
      const refs = Array.isArray(v) ? v : v ? [v] : [];
      for (const r of refs) {
        // `track` references a track slug, not a frontmatter id — skip if it matches a track type doc
        if (field === 'track') continue;
        if (!known.has(r)) errors.push(`${d._file}: broken reference "${r}" in ${field}`);
      }
    }
  }
  return errors;
}

// ---- filesystem runner (not exercised by unit tests) ----
function loadDocs(): Doc[] {
  const files = globSync('src/content/**/*.mdx', { cwd: process.cwd() });
  return files.map((rel) => {
    const fm = matter(readFileSync(join(process.cwd(), rel), 'utf8')).data;
    return { ...fm, _file: rel };
  });
}

function checkRegistry(known: Set<string>): string[] {
  const errs: string[] = [];
  try {
    const raw = readFileSync('src/content/registry/knowledge-map.yaml', 'utf8');
    const data: any = yaml.load(raw) ?? {};
    for (const edge of data.edges ?? []) {
      for (const end of [edge.source, edge.target]) {
        if (end && !known.has(end)) errs.push(`registry/knowledge-map.yaml: unknown id "${end}"`);
      }
    }
  } catch { /* registry optional */ }
  return errs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const docs = loadDocs();
  const known = new Set(docs.map((d) => d.id).filter(Boolean));
  const errors = [...validateDocs(docs), ...checkRegistry(known)];
  if (errors.length) {
    console.error(`\n✖ ${errors.length} content problem(s):\n` + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }
  console.log(`✓ content OK (${docs.length} docs)`);
}
```

Note: `node:fs` `globSync` requires Node 22+. The environment is Node 24, so this is fine.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/validate-content.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add content validation script with tests"
```

---

## Task 6: UI components (shadcn-style)

**Files:**
- Create: `src/components/ui/Card.astro`, `Badge.astro`, `Button.astro`, `SectionHeader.astro`

- [ ] **Step 1: Write `src/components/ui/Card.astro`**

```astro
---
interface Props { href?: string; class?: string; }
const { href, class: cls = '' } = Astro.props;
const base = 'block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition hover:border-brand/60 hover:shadow-sm';
const Tag = href ? 'a' : 'div';
---
<Tag href={href} class={`${base} ${cls}`}><slot /></Tag>
```

- [ ] **Step 2: Write `src/components/ui/Badge.astro`**

```astro
---
import { TYPE_COLOR } from '../../lib/types';
interface Props { type?: string; status?: string; label?: string; }
const { type, status, label } = Astro.props;
const color = type ? TYPE_COLOR[type] : undefined;
const text = label ?? type ?? status ?? '';
---
{type ? (
  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
    style={`background:color-mix(in srgb,${color} 14%,transparent);color:${color};border:1px solid color-mix(in srgb,${color} 35%,transparent)`}>{text}</span>
) : status === 'published' ? (
  <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">● published</span>
) : (
  <span class="text-[11px] px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-500">{text}</span>
)}
```

- [ ] **Step 3: Write `src/components/ui/Button.astro`**

```astro
---
interface Props { href?: string; variant?: 'primary' | 'outline'; class?: string; }
const { href, variant = 'primary', class: cls = '' } = Astro.props;
const styles = {
  primary: 'bg-brand text-white hover:opacity-90',
  outline: 'border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900',
};
const Tag = href ? 'a' : 'button';
---
<Tag href={href} class={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${styles[variant]} ${cls}`}><slot /></Tag>
```

- [ ] **Step 4: Write `src/components/ui/SectionHeader.astro`**

```astro
---
interface Props { title: string; href?: string; linkText?: string; }
const { title, href, linkText } = Astro.props;
---
<div class="flex items-baseline justify-between mb-4">
  <h2 class="text-sm font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
  {href && <a href={href} class="text-xs text-brand hover:underline">{linkText ?? 'View all →'}</a>}
</div>
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add shadcn-style ui components"
```

---

## Task 7: Layout shell (BaseLayout, Header, Sidebar, Drawer, BottomNav, Footer)

**Files:**
- Create: `src/components/layout/BaseLayout.astro`, `Header.astro`, `Sidebar.astro`, `Drawer.astro`, `BottomNav.astro`, `Footer.astro`

- [ ] **Step 1: Write `src/components/layout/Sidebar.astro`** (shared nav data)

```astro
---
import { Compass, BookOpen, GraduationCap, Dumbbell, MessageSquareText, ClipboardCheck, LayoutTemplate, GitFork } from '@lucide/astro';
const items = [
  { href: '/tracks', label: 'Tracks', Icon: Compass, dot: 'var(--type-track)' },
  { href: '/concepts', label: 'Concepts', Icon: BookOpen, dot: 'var(--type-concept)' },
  { href: '/lessons', label: 'Lessons', Icon: GraduationCap, dot: 'var(--type-lesson)' },
  { href: '/exercises', label: 'Exercises', Icon: Dumbbell, dot: 'var(--type-exercise)' },
  { href: '/sessions', label: 'Sessions', Icon: MessageSquareText, dot: 'var(--type-session)' },
  { href: '/rubrics', label: 'Rubrics', Icon: ClipboardCheck, dot: 'var(--type-rubric)' },
  { href: '/templates', label: 'Templates', Icon: LayoutTemplate, dot: 'var(--type-template)' },
  { href: '/knowledge-map', label: 'Knowledge Map', Icon: GitFork, dot: 'var(--color-brand)' },
];
const path = Astro.url.pathname;
---
<nav class="text-sm space-y-1">
  <div class="text-[11px] uppercase tracking-wider text-zinc-400 mb-2 px-2">Library</div>
  {items.map(({ href, label, Icon }) => (
    <a href={href} class:list={["flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900",
        path.startsWith(href) && href !== '/' ? 'bg-brand/10 text-brand font-medium' : '']}>
      <Icon class="w-4 h-4" /> {label}
    </a>
  ))}
</nav>
```

- [ ] **Step 2: Write `src/components/layout/Header.astro`**

```astro
---
import { Moon, Sun, Menu, Search } from '@lucide/astro';
---
<header class="sticky top-0 z-50 border-b border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
  <div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
    <button id="drawer-open" class="lg:hidden w-9 h-9 grid place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"><Menu class="w-5 h-5" /></button>
    <a href="/" class="font-semibold tracking-tight">learning-lab</a>
    <div class="ml-auto flex items-center gap-1">
      <a href="/search" class="w-9 h-9 grid place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"><Search class="w-4 h-4" /></a>
      <button id="theme-toggle" class="w-9 h-9 grid place-items-center rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900">
        <Moon class="w-4 h-4 dark:hidden" /><Sun class="w-4 h-4 hidden dark:block" />
      </button>
    </div>
  </div>
</header>
<script>
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches)) root.classList.add('dark');
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
  });
</script>
```

- [ ] **Step 3: Write `src/components/layout/Drawer.astro`**

```astro
---
import Sidebar from './Sidebar.astro';
---
<div id="drawer" class="fixed inset-0 z-[60] hidden lg:hidden">
  <div id="drawer-backdrop" class="absolute inset-0 bg-black/40"></div>
  <div class="absolute inset-y-0 left-0 w-72 bg-white dark:bg-zinc-900 p-3 shadow-2xl overflow-y-auto">
    <Sidebar />
  </div>
</div>
<script>
  const drawer = document.getElementById('drawer');
  document.getElementById('drawer-open')?.addEventListener('click', () => drawer?.classList.remove('hidden'));
  document.getElementById('drawer-backdrop')?.addEventListener('click', () => drawer?.classList.add('hidden'));
</script>
```

- [ ] **Step 4: Write `src/components/layout/BottomNav.astro`**

```astro
---
import { Compass, BookOpen, Dumbbell, Search } from '@lucide/astro';
const items = [
  { href: '/tracks', label: 'Tracks', Icon: Compass },
  { href: '/concepts', label: 'Concepts', Icon: BookOpen },
  { href: '/exercises', label: 'Exercises', Icon: Dumbbell },
  { href: '/search', label: 'Search', Icon: Search },
];
const path = Astro.url.pathname;
---
<nav class="lg:hidden fixed bottom-0 inset-x-0 z-50 h-14 grid grid-cols-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] text-zinc-500">
  {items.map(({ href, label, Icon }) => (
    <a href={href} class:list={["grid place-items-center", path.startsWith(href) ? 'text-brand' : '']}>
      <Icon class="w-4 h-4" />{label}
    </a>
  ))}
</nav>
```

- [ ] **Step 5: Write `src/components/layout/Footer.astro`**

```astro
<footer class="border-t border-zinc-200 dark:border-zinc-800 mt-16">
  <div class="max-w-6xl mx-auto px-4 py-8 text-sm text-zinc-400">learning-lab — a personal knowledge gym.</div>
</footer>
```

- [ ] **Step 6: Write `src/components/layout/BaseLayout.astro`**

```astro
---
import '../../styles/global.css';
import '@fontsource-variable/inter';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/600.css';
import '@fontsource/spectral/700.css';
import { ClientRouter } from 'astro:transitions';
import Header from './Header.astro';
import Footer from './Footer.astro';
import BottomNav from './BottomNav.astro';
import Drawer from './Drawer.astro';
interface Props { title: string; }
const { title } = Astro.props;
---
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} · learning-lab</title>
    <ClientRouter />
  </head>
  <body class="bg-zinc-50 text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 antialiased pb-16 lg:pb-0">
    <Header />
    <Drawer />
    <slot />
    <Footer />
    <BottomNav />
  </body>
</html>
```

- [ ] **Step 7: Verify build compiles with layout + styles**

Create a temporary `src/pages/index.astro`:
```astro
---
import BaseLayout from '../components/layout/BaseLayout.astro';
---
<BaseLayout title="Home"><main class="max-w-6xl mx-auto px-4 py-10">hello</main></BaseLayout>
```
Run: `pnpm build`
Expected: build succeeds, `dist/index.html` produced, Tailwind + fonts compiled. (Task 9 replaces this index.)

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add layout shell with header, drawer, bottom-nav, dark mode"
```

---

## Task 8: Reading layout + content components

**Files:**
- Create: `src/components/layout/ReadingLayout.astro`
- Create: `src/components/content/MetaBadges.astro`, `RelatedLinks.astro`, `Callout.astro`, `Mermaid.astro`, `Ask.astro`, `Answer.astro`, `Explain.astro`

- [ ] **Step 1: Write `src/components/content/MetaBadges.astro`**

```astro
---
import Badge from '../ui/Badge.astro';
import { Clock } from '@lucide/astro';
interface Props { type: string; status?: string; level?: string; minutes?: number; reviewedBy?: string | null; score?: number | null; }
const { type, status, level, minutes, reviewedBy, score } = Astro.props;
---
<div class="flex flex-wrap items-center gap-2 text-[11px]">
  <Badge type={type} />
  {status && <Badge status={status} />}
  {level && <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500"><span class="w-2 h-2 rounded-full" style="background:var(--type-lesson)"></span>{level}</span>}
  {minutes && <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500"><Clock class="w-3 h-3" />{minutes}m</span>}
  {reviewedBy && <span class="px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500">reviewed by {reviewedBy}</span>}
  {typeof score === 'number' && <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-semibold">{score} / 100</span>}
</div>
```

- [ ] **Step 2: Write `src/components/content/RelatedLinks.astro`**

```astro
---
import { idIndex } from '../../lib/content';
import { TYPE_COLOR } from '../../lib/types';
interface Props { ids: string[]; title?: string; }
const { ids, title = 'Related' } = Astro.props;
const idx = await idIndex();
const links = ids.map((id) => ({ id, hit: idx.get(id) })).filter((x) => x.hit);
---
{links.length > 0 && (
  <div class="mt-12 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
    <div class="text-[11px] uppercase tracking-wider text-zinc-400 mb-3">{title}</div>
    <div class="flex flex-wrap gap-2 text-sm">
      {links.map(({ hit }) => (
        <a href={`/${hit!.type}/${hit!.slug}`} class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-brand/50">
          <span class="w-2 h-2 rounded-full" style={`background:${TYPE_COLOR[hit!.dataType]}`}></span>{hit!.title}
        </a>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: Write `src/components/content/Callout.astro`**

```astro
---
import { Lightbulb } from '@lucide/astro';
interface Props { title?: string; }
const { title = 'Tip' } = Astro.props;
---
<div class="not-prose my-7 rounded-lg border-l-[3px] border-brand bg-brand/5 px-5 py-4 read-body !text-[17px]">
  <div class="font-semibold text-brand mb-1 font-sans text-sm flex items-center gap-1.5"><Lightbulb class="w-4 h-4" />{title}</div>
  <slot />
</div>
```

- [ ] **Step 4: Write `src/components/content/Mermaid.astro`**

```astro
---
interface Props { chart: string; }
const { chart } = Astro.props;
---
<pre class="mermaid not-prose my-6 flex justify-center">{chart}</pre>
<script>
  import mermaid from 'mermaid';
  const dark = document.documentElement.classList.contains('dark');
  mermaid.initialize({ startOnLoad: true, theme: dark ? 'dark' : 'default' });
  document.addEventListener('astro:page-load', () => mermaid.run());
</script>
```

- [ ] **Step 5: Write `src/components/content/Ask.astro`**

```astro
---
import { Bot } from '@lucide/astro';
---
<div class="my-5">
  <div class="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-1.5"><Bot class="w-4 h-4 text-brand" />AI HỎI</div>
  <div class="read-body !text-[18px] rounded-xl bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-4"><slot /></div>
</div>
```

- [ ] **Step 6: Write `src/components/content/Answer.astro`**

```astro
---
import { User } from '@lucide/astro';
---
<div class="my-5">
  <div class="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-1.5"><User class="w-4 h-4" style="color:var(--type-session)" />BẠN TRẢ LỜI</div>
  <div class="read-body !text-[18px] rounded-xl border-l-[3px] px-5 py-4" style="border-color:var(--type-session);background:color-mix(in srgb,var(--type-session) 6%,transparent)"><slot /></div>
</div>
```

- [ ] **Step 7: Write `src/components/content/Explain.astro`**

```astro
---
import { Sparkles } from '@lucide/astro';
---
<div class="my-5">
  <div class="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-1.5"><Sparkles class="w-4 h-4 text-emerald-500" />AI GIẢI THÍCH</div>
  <div class="read-body !text-[18px] rounded-xl border-l-[3px] border-emerald-500 bg-emerald-500/5 px-5 py-4"><slot /></div>
</div>
```

- [ ] **Step 8: Write `src/components/layout/ReadingLayout.astro`** (Substack shell + floating TOC + entrance animation)

```astro
---
import BaseLayout from './BaseLayout.astro';
import { X } from '@lucide/astro';
interface Props { title: string; kicker?: string; trackLabel?: string; headings?: { text: string; slug: string }[]; }
const { title, kicker, trackLabel, headings = [] } = Astro.props;
---
<BaseLayout title={title}>
  <div class="border-b border-zinc-200/70 dark:border-zinc-800/80">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center">
      <a href="javascript:history.back()" class="w-9 h-9 grid place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"><X class="w-4 h-4" /></a>
      {trackLabel && <div class="mx-auto text-sm text-zinc-500">{trackLabel}</div>}
      <div class="w-9"></div>
    </div>
  </div>
  {headings.length > 0 && (
    <div class="toc-wrap hidden xl:block fixed left-8 top-1/2 -translate-y-1/2 z-40">
      <div class="toc-handle space-y-1.5 cursor-pointer transition"><div class="w-6 h-0.5 bg-zinc-400/70 rounded"></div><div class="w-5 h-0.5 bg-zinc-400/70 rounded ml-1"></div><div class="w-6 h-0.5 bg-zinc-400/70 rounded"></div></div>
      <div class="toc-panel absolute left-0 top-1/2 -translate-y-1/2 w-64 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-4 text-sm">
        <div class="text-[11px] uppercase tracking-wider text-zinc-400 mb-2">Contents</div>
        <ul class="space-y-2 text-zinc-500">{headings.map((h) => <li><a href={`#${h.slug}`} class="hover:text-zinc-800 dark:hover:text-zinc-200">{h.text}</a></li>)}</ul>
      </div>
    </div>
  )}
  <article class="max-w-[680px] mx-auto px-5 pt-12 pb-24">
    {kicker && <div class="anim text-xs font-semibold uppercase tracking-[.14em] text-zinc-400 mb-4">{kicker}</div>}
    <h1 class="anim font-read text-[2.6rem] leading-[1.12] font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
    <slot />
  </article>
  <script>
    import { animate, stagger } from 'motion';
    function run() {
      const els = document.querySelectorAll('.anim');
      if (els.length) animate(els, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] }, { delay: stagger(0.05), duration: 0.45 });
    }
    run();
    document.addEventListener('astro:page-load', run);
  </script>
</BaseLayout>
```

- [ ] **Step 9: Verify build still compiles** (components are imported by pages in Task 10; just typecheck)

Run: `pnpm exec astro check`
Expected: 0 errors (warnings about unused props acceptable).

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: add reading layout and MDX content components"
```

---

## Task 9: Home page (shadcn card grid)

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/pages/index.astro`**

```astro
---
import BaseLayout from '../components/layout/BaseLayout.astro';
import Card from '../components/ui/Card.astro';
import Badge from '../components/ui/Badge.astro';
import SectionHeader from '../components/ui/SectionHeader.astro';
import Button from '../components/ui/Button.astro';
import { Compass, GitFork } from '@lucide/astro';
import { getAll } from '../lib/content';

const tracks = await getAll('tracks');
const counts = async (track: string) => {
  const [l, e, c] = await Promise.all([getAll('lessons'), getAll('exercises'), getAll('concepts')]);
  return {
    lessons: l.filter((x: any) => x.data.track === track).length,
    exercises: e.filter((x: any) => x.data.track === track).length,
    concepts: c.length,
  };
};
const trackCards = await Promise.all(tracks.map(async (t: any) => ({ t, c: await counts(t.id) })));

const recent = (await Promise.all((['lessons', 'exercises', 'concepts', 'rubrics'] as const).map(getAll)))
  .flat().slice(0, 6);
---
<BaseLayout title="Home">
  <main class="max-w-6xl mx-auto px-4 py-10">
    <div class="mb-10">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Your personal knowledge gym</h1>
      <p class="mt-3 max-w-2xl text-zinc-500 dark:text-zinc-400">Lộ trình học, kiến thức canonical, bài luyện tập, lịch sử session — tất cả trong một repo MDX.</p>
      <div class="mt-5 flex gap-2">
        <Button href="/tracks"><Compass class="w-4 h-4" />Tracks</Button>
        <Button href="/knowledge-map" variant="outline"><GitFork class="w-4 h-4" />Knowledge Map</Button>
      </div>
    </div>

    <SectionHeader title="Tracks" href="/tracks" />
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {trackCards.map(({ t, c }) => (
        <Card href={`/tracks/${t.id}`} class="group">
          <div class="flex items-center gap-2 mb-2"><span class="w-2 h-2 rounded-full" style="background:var(--type-track)"></span><span class="text-[11px] uppercase tracking-wide text-zinc-400">Track</span></div>
          <h3 class="font-semibold text-zinc-900 dark:text-white group-hover:text-brand">{t.data.title}</h3>
          <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t.data.summary}</p>
          <div class="mt-4 flex gap-3 text-xs text-zinc-500"><span>{c.concepts} concepts</span><span>·</span><span>{c.lessons} lessons</span><span>·</span><span>{c.exercises} exercises</span></div>
        </Card>
      ))}
    </div>

    <div class="mt-10"><SectionHeader title="Recently added" /></div>
    <div class="grid sm:grid-cols-2 gap-3">
      {recent.map((e: any) => (
        <a href={`/${e.collection}/${e.id}`} class="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
          <Badge type={e.data.type} /><span class="text-sm flex-1">{e.data.title}</span>
        </a>
      ))}
    </div>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Commit** (build verified after seed content exists in Task 12)

```bash
git add -A && git commit -m "feat: add home page with track cards"
```

---

## Task 10: Generic collection index + detail (reading) pages

**Files:**
- Create: `src/pages/[type]/index.astro`
- Create: `src/pages/[type]/[...slug].astro`

- [ ] **Step 1: Write `src/pages/[type]/index.astro`**

```astro
---
import type { GetStaticPaths } from 'astro';
import BaseLayout from '../../components/layout/BaseLayout.astro';
import Card from '../../components/ui/Card.astro';
import Badge from '../../components/ui/Badge.astro';
import { COLLECTION_TYPES } from '../../lib/types';
import { getAll } from '../../lib/content';

export const getStaticPaths = (() =>
  COLLECTION_TYPES.map((type) => ({ params: { type } }))) satisfies GetStaticPaths;

const { type } = Astro.params;
const entries = await getAll(type as any);
const labels: Record<string, string> = { tracks: 'Tracks', concepts: 'Concepts', lessons: 'Lessons', exercises: 'Exercises', sessions: 'Sessions', rubrics: 'Rubrics', templates: 'Templates' };
---
<BaseLayout title={labels[type!]}>
  <main class="max-w-6xl mx-auto px-4 py-10">
    <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">{labels[type!]}</h1>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((e: any) => (
        <Card href={`/${type}/${e.id}`} class="group">
          <div class="mb-2"><Badge type={e.data.type} /></div>
          <h3 class="font-semibold text-zinc-900 dark:text-white group-hover:text-brand">{e.data.title}</h3>
          {e.data.tags?.length > 0 && <div class="mt-2 text-xs text-zinc-400">{e.data.tags.join(' · ')}</div>}
        </Card>
      ))}
      {entries.length === 0 && <p class="text-zinc-400 text-sm">Chưa có nội dung.</p>}
    </div>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Write `src/pages/[type]/[...slug].astro`**

```astro
---
import type { GetStaticPaths } from 'astro';
import { render } from 'astro:content';
import ReadingLayout from '../../components/layout/ReadingLayout.astro';
import MetaBadges from '../../components/content/MetaBadges.astro';
import RelatedLinks from '../../components/content/RelatedLinks.astro';
import Callout from '../../components/content/Callout.astro';
import Mermaid from '../../components/content/Mermaid.astro';
import Ask from '../../components/content/Ask.astro';
import Answer from '../../components/content/Answer.astro';
import Explain from '../../components/content/Explain.astro';
import { COLLECTION_TYPES } from '../../lib/types';
import { getAll } from '../../lib/content';

export const getStaticPaths = (async () => {
  const paths = [];
  for (const type of COLLECTION_TYPES) {
    const entries = await getAll(type as any);
    for (const entry of entries) paths.push({ params: { type, slug: entry.id }, props: { entry } });
  }
  return paths;
}) satisfies GetStaticPaths;

const { entry } = Astro.props as { entry: any };
const d = entry.data;
const { Content, headings } = await render(entry);
const components = { Callout, Mermaid, Ask, Answer, Explain };

const kicker = d.type === 'session' ? `Session · ${d.exercise}` :
  d.module ? `${d.module}` : d.skill ? `${d.skill}` : d.type;
const trackLabel = d.track;
const related = [...(d.prerequisites ?? []), ...(d.related ?? [])];
---
<ReadingLayout title={d.title} kicker={kicker} trackLabel={trackLabel}
  headings={headings.filter((h: any) => h.depth === 2).map((h: any) => ({ text: h.text, slug: h.slug }))}>
  <div class="anim mt-6">
    <MetaBadges type={d.type} status={d.status} level={d.level} minutes={d.estimatedMinutes} reviewedBy={d.reviewedBy} score={d.score} />
  </div>
  <hr class="anim my-8 border-zinc-200 dark:border-zinc-800" />
  <div class="anim read-body text-zinc-700 dark:text-zinc-300 prose dark:prose-invert max-w-none prose-headings:font-read">
    <Content components={components} />
  </div>
  {d.type === 'concept' && d.aliases?.length > 0 && (
    <div class="anim mt-8 flex flex-wrap gap-2 text-xs items-center"><span class="text-zinc-400">aka:</span>
      {d.aliases.map((a: string) => <span class="px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500">{a}</span>)}
    </div>
  )}
  {related.length > 0 && <div class="anim"><RelatedLinks ids={related} title="Related · từ frontmatter" /></div>}
</ReadingLayout>
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add generic collection index and reading pages"
```

---

## Task 11: Knowledge graph (lib/graph.ts + Cytoscape island + page)

**Files:**
- Create: `src/lib/graph.ts`
- Create: `src/components/content/KnowledgeGraph.astro`
- Create: `src/pages/knowledge-map.astro`
- Create: `tests/graph.test.ts`

- [ ] **Step 1: Write the failing test `tests/graph.test.ts`**

The graph builder core is pure: `buildGraph(docs, extraEdges)` → `{ nodes, edges }`.

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/graph.test.ts`
Expected: FAIL — `buildGraph` not found.

- [ ] **Step 3: Write `src/lib/graph.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/graph.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write `src/components/content/KnowledgeGraph.astro`** (client island)

```astro
---
import type { GraphNode, GraphEdge } from '../../lib/types';
interface Props { nodes: GraphNode[]; edges: GraphEdge[]; }
const { nodes, edges } = Astro.props;
const TYPE_HEX: Record<string, string> = { concept: '#3b82f6', lesson: '#22c55e', exercise: '#f59e0b', session: '#8b5cf6', rubric: '#f43f5e', template: '#64748b', track: '#6366f1' };
---
<div id="cy" class="w-full h-[70vh] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"></div>
<script define:vars={{ nodes, edges, TYPE_HEX }}>
  import cytoscape from 'cytoscape';
  import fcose from 'cytoscape-fcose';
  cytoscape.use(fcose);
  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [
      ...nodes.map((n) => ({ data: { id: n.id, label: n.label, url: n.url, color: TYPE_HEX[n.type] || '#888' } })),
      ...edges.map((e, i) => ({ data: { id: `e${i}`, source: e.source, target: e.target } })),
    ],
    style: [
      { selector: 'node', style: { 'background-color': 'data(color)', label: 'data(label)', color: '#a1a1aa', 'font-size': 10, 'text-valign': 'bottom', 'text-margin-y': 4 } },
      { selector: 'edge', style: { width: 1.5, 'line-color': '#a1a1aa66', 'curve-style': 'bezier' } },
    ],
    layout: { name: 'fcose', animate: true, randomize: true },
  });
  cy.on('tap', 'node', (evt) => { const url = evt.target.data('url'); if (url) location.href = url; });
</script>
```

- [ ] **Step 6: Write `src/pages/knowledge-map.astro`**

```astro
---
import BaseLayout from '../components/layout/BaseLayout.astro';
import KnowledgeGraph from '../components/content/KnowledgeGraph.astro';
import { buildGraph } from '../lib/graph';
import { COLLECTION_TYPES } from '../lib/types';
import { getAll } from '../lib/content';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

const docs: any[] = [];
for (const type of COLLECTION_TYPES) {
  for (const e of await getAll(type as any)) {
    docs.push({ id: e.data.id, title: e.data.title, type: e.data.type, collection: type, slug: e.id,
      track: e.data.track, exercise: e.data.exercise, rubric: e.data.rubric,
      prerequisites: e.data.prerequisites, related: e.data.related });
  }
}
let extra: any[] = [];
try { extra = (yaml.load(readFileSync('src/content/registry/knowledge-map.yaml', 'utf8')) as any)?.edges ?? []; } catch {}
const { nodes, edges } = buildGraph(docs, extra);
---
<BaseLayout title="Knowledge Map">
  <main class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">Knowledge Map</h1>
    <p class="text-sm text-zinc-500 mb-4">Node tô màu theo type · kéo-thả & zoom · click để mở trang.</p>
    <KnowledgeGraph nodes={nodes} edges={edges} />
  </main>
</BaseLayout>
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add knowledge graph builder, cytoscape island, and page"
```

---

## Task 12: Seed content

**Files:** create the MDX files below + `src/content/registry/tags.yaml` + `knowledge-map.yaml`.

- [ ] **Step 1: Track — `src/content/tracks/product-minded-builder/track.mdx`**

```mdx
---
id: track-product-minded-builder
title: "Product-minded Builder"
type: "track"
summary: "Suy nghĩ như một product builder: discovery, MVP, đo lường giá trị."
tags: [product, discovery, solo-builder]
status: published
---

Lộ trình rèn tư duy sản phẩm cho người làm kỹ thuật: phân biệt problem vs feature,
đào nỗi đau người dùng, và build phiên bản tối thiểu hữu ích.
```

Note: track folder slug is `product-minded-builder`; the entry `id` (file slug) becomes `product-minded-builder/track`. To get clean URLs like `/tracks/product-minded-builder`, name the file `product-minded-builder.mdx` directly under `tracks/` instead of a nested `track.mdx`. Use:

`src/content/tracks/product-minded-builder.mdx` (same frontmatter + body as above). Lessons/exercises reference the track by the string `product-minded-builder`.

- [ ] **Step 2: Concepts — three files**

`src/content/concepts/mvp.mdx`:
```mdx
---
id: concept-mvp
title: "MVP"
type: "concept"
aliases: ["minimum viable product", "smallest useful version"]
tags: [product, startup, validation]
status: published
---

Phiên bản nhỏ nhất nhưng vẫn **hữu ích** để kiểm chứng giả định cốt lõi với người dùng thật.
MVP không phải bản lỗi — nó là bản đủ để học.
```

`src/content/concepts/user-pain.mdx`:
```mdx
---
id: concept-user-pain
title: "User Pain"
type: "concept"
aliases: ["nỗi đau người dùng", "pain point"]
tags: [product, discovery]
status: published
---

Nỗi đau là khoảng cách giữa điều người dùng muốn đạt được và thực tế họ đang chật vật.
Tìm pain trước khi nghĩ giải pháp.
```

`src/content/concepts/product-discovery.mdx`:
```mdx
---
id: concept-product-discovery
title: "Product Discovery"
type: "concept"
aliases: ["khám phá sản phẩm", "discovery"]
tags: [product, discovery, research]
status: published
---

Quá trình giảm rủi ro trước khi build: ta đang giải đúng vấn đề chưa, cho đúng người chưa.
```

- [ ] **Step 3: Lesson — `src/content/lessons/product-minded-builder/day-01-problem-vs-feature.mdx`**

```mdx
---
id: lesson-product-001
title: "Problem vs Feature"
type: "lesson"
track: product-minded-builder
module: discovery
level: beginner
tags: [product-thinking, discovery, solo-builder]
prerequisites: [concept-user-pain]
related: [concept-mvp, rubric-product-thinking]
status: published
---
import Callout from '../../../components/content/Callout.astro';

Người mới thường nhảy thẳng vào *feature* mà bỏ qua *problem*.

## Vì sao khác biệt này quan trọng

Một feature là **giải pháp đề xuất**. Một problem là **nỗi đau cần giải quyết**.
Lý thuyết đầy đủ nằm ở khái niệm liên kết — bài này chỉ tham chiếu.

<Callout title="Tip">
Trước khi build, hỏi: "User đang cố hoàn thành việc gì khi yêu cầu cái này?"
</Callout>
```

- [ ] **Step 4: Exercise — `src/content/exercises/product-minded-builder/export-excel.mdx`**

```mdx
---
id: exercise-product-001
title: "User muốn Export Excel"
type: "exercise"
track: product-minded-builder
skill: problem-discovery
estimatedMinutes: 15
related: [lesson-product-001, concept-user-pain, rubric-product-thinking]
status: published
---

Một khách hàng nhắn: *"Cho tôi nút export ra Excel đi."*

**Nhiệm vụ:**
1. Liệt kê 5 câu hỏi để hiểu problem phía sau yêu cầu.
2. Đề xuất giải pháp tối thiểu (không phải build cả Excel export).
```

- [ ] **Step 5: Session — `src/content/sessions/product-minded-builder/export-excel-01.mdx`**

```mdx
---
id: session-product-001
title: "Session 01 — Export Excel"
type: "session"
track: product-minded-builder
exercise: exercise-product-001
rubric: rubric-product-thinking
date: 2026-05-31
reviewedBy: claude-opus
score: 82
tags: [product-thinking]
status: published
---
import Ask from '../../../components/content/Ask.astro';
import Answer from '../../../components/content/Answer.astro';
import Explain from '../../../components/content/Explain.astro';

<Ask>Một user nhắn "cho tôi nút export Excel". Bạn sẽ hỏi lại gì trước khi build?</Ask>
<Answer>Họ định làm gì với file đó? Gửi cho ai? Bao lâu một lần? Hiện giờ đang xoay sở thế nào?</Answer>
<Explain>Tốt — bạn đào tới *job-to-be-done* thay vì gật theo feature. Lần tới thêm câu định lượng tần suất để ưu tiên.</Explain>
```

- [ ] **Step 6: Rubric — `src/content/rubrics/product-thinking-rubric.mdx`**

```mdx
---
id: rubric-product-thinking
title: "Product Thinking Rubric"
type: "rubric"
tags: [product, rubric]
status: published
---

| Tiêu chí | Trọng số |
|---|---|
| Đào đúng problem, không dừng ở feature | 40% |
| Chất lượng câu hỏi discovery | 35% |
| Giải pháp tối thiểu hợp lý | 25% |
```

- [ ] **Step 7: Templates — four files**

`src/content/templates/exercise-answer-template.mdx`:
```mdx
---
id: template-exercise-answer
title: "Exercise Answer Template"
type: "template"
tags: [template, answer]
status: published
---

## Problem hiểu được
## Câu hỏi discovery
## Giải pháp tối thiểu đề xuất
## Rủi ro / giả định
```

`src/content/templates/prd-template.mdx`:
```mdx
---
id: template-prd
title: "PRD Template"
type: "template"
tags: [template, product]
status: published
---

## Problem
## Goal & non-goals
## Users & use cases
## Solution outline
## Success metrics
```

`src/content/templates/interview-answer-template.mdx`:
```mdx
---
id: template-interview-answer
title: "Interview Answer Template"
type: "template"
tags: [template, interview]
status: published
---

## Clarify
## Approach
## Tradeoffs
## Summary
```

`src/content/templates/system-design-template.mdx`:
```mdx
---
id: template-system-design
title: "System Design Template"
type: "template"
tags: [template, system-design]
status: published
---

## Requirements (functional / non-functional)
## API & data model
## High-level architecture
## Scaling & bottlenecks
## Tradeoffs
```

- [ ] **Step 8: Registry — `src/content/registry/tags.yaml`**

```yaml
tags:
  - product
  - discovery
  - validation
  - startup
  - solo-builder
  - rubric
  - template
  - interview
  - system-design
```

- [ ] **Step 9: Registry — `src/content/registry/knowledge-map.yaml`**

```yaml
# Optional manual edges to supplement frontmatter-derived ones.
edges:
  - source: concept-product-discovery
    target: lesson-product-001
    rel: supports
```

- [ ] **Step 10: Run content validation**

Run: `pnpm validate:content`
Expected: `✓ content OK (N docs)` with exit 0.

- [ ] **Step 11: Run full build**

Run: `pnpm build`
Expected: Astro build succeeds (Zod validation passes), Pagefind indexes `dist`, no errors.

- [ ] **Step 12: Manual smoke check**

Run: `pnpm preview`, open the printed URL. Verify: Home shows the track card with counts; `/lessons/lesson-product-001`... actually `/lessons/day-01-problem-vs-feature` renders as a Substack reading page with serif body, MetaBadges, Callout, and Related links; `/sessions/...` renders Ask/Answer/Explain blocks; `/knowledge-map` shows an interactive Cytoscape graph; toggle dark mode; resize to mobile width to see drawer + bottom-nav. Stop the server.

- [ ] **Step 13: Commit**

```bash
git add -A && git commit -m "feat: add seed content for product-minded-builder track"
```

---

## Task 13: Search page (Pagefind UI)

**Files:**
- Create: `src/pages/search.astro`

- [ ] **Step 1: Write `src/pages/search.astro`**

```astro
---
import BaseLayout from '../components/layout/BaseLayout.astro';
---
<BaseLayout title="Search">
  <main class="max-w-3xl mx-auto px-4 py-10">
    <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">Search</h1>
    <div id="search"></div>
  </main>
  <link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
  <script>
    document.addEventListener('astro:page-load', async () => {
      // @ts-ignore - served from /pagefind after build
      await import('/pagefind/pagefind-ui.js');
      // @ts-ignore
      new PagefindUI({ element: '#search', showSubResults: true });
    });
  </script>
</BaseLayout>
```

Note: `/pagefind/*` only exists after `pagefind --site dist` runs (part of `pnpm build`). In `astro dev` the widget will 404 — that is expected; search works in `preview`/production. Document this in README.

- [ ] **Step 2: Verify search after build**

Run: `pnpm build && pnpm preview`, open `/search`, type "MVP".
Expected: Pagefind returns the concept page. Stop server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add pagefind search page"
```

---

## Task 14: Docs — README + CONTENT_GUIDE

**Files:**
- Create: `README.md`, `CONTENT_GUIDE.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# learning-lab

Personal learning OS / knowledge gym. Static Astro + MDX site, read-only. An AI agent records
learning sessions (questions, your answers, explanations) by committing MDX — there is no input form on the site.

## Commands
```bash
pnpm install
pnpm dev               # local dev (search widget is inactive in dev)
pnpm build             # static build + pagefind search index
pnpm preview           # preview the production build (search works here)
pnpm validate:content  # check ids, aliases, references, required fields
pnpm test              # unit tests (validator + graph)
```

## Adding content
1. Pick the right type: track / concept / lesson / exercise / session / rubric / template.
2. Read `CONTENT_GUIDE.md` first — search existing content to avoid duplicates.
3. Add an `.mdx` file under `src/content/<type>/...` with required frontmatter
   (`id`, `title`, `type`, `tags`, `status`). See existing seed files for examples.
4. Run `pnpm validate:content` then `pnpm build`.

## Deploy
Static output. Push to a Git repo and import into Vercel — it auto-detects Astro. No adapter needed.
````

- [ ] **Step 2: Write `CONTENT_GUIDE.md`**

```markdown
# Content Guide

Principles that keep the knowledge base from duplicating or drifting.

## Rules
- **One canonical file per concept** in `src/content/concepts/`. Never duplicate a concept.
- **Lessons/exercises do not repeat long theory** — link/reference the concept instead.
- Every MDX file has `id`, `title`, `type`, `tags`, `status`. **`id` is unique across the whole repo.**
- Use `aliases` on concepts to avoid creating near-duplicate files for the same idea.
- **Sessions must link to their source `exercise`** via the `exercise` frontmatter field.
- Separate a rubric into its own file when it is reused more than once.
- **Before creating new content, search existing content** by title / id / aliases / tags.
- Never commit secrets, `.env`, tokens, or credentials.
- Commit using **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`...).

## Content types
| type | folder | key fields |
|---|---|---|
| track | tracks/ | summary |
| concept | concepts/ | aliases[] |
| lesson | lessons/<track>/ | track, module, level, prerequisites[], related[] |
| exercise | exercises/<track>/ | track, skill, estimatedMinutes, related[] |
| session | sessions/<track>/ | track, exercise (required), rubric, date, reviewedBy, score |
| rubric | rubrics/ | — |
| template | templates/ | — |

## Sessions
A session is a recorded interaction. Frontmatter holds metadata; the transcript is the MDX body
using `<Ask>`, `<Answer>`, `<Explain>` components. One exercise can have many sessions over time.

## Validation
`pnpm validate:content` checks: duplicate ids, missing required fields, sessions missing
`exercise`, duplicate concept aliases, and broken references (`prerequisites/related/exercise/rubric`
and `registry/knowledge-map.yaml` edges). The Astro build additionally enforces Zod schemas.
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: add README and CONTENT_GUIDE"
```

---

## Task 15: Final verification

- [ ] **Step 1: Clean install + full pipeline**

```bash
rm -rf node_modules dist .pagefind && pnpm install && pnpm test && pnpm validate:content && pnpm build
```
Expected: tests pass, validation prints `✓ content OK`, build completes with Pagefind index, exit 0 at every stage.

- [ ] **Step 2: Commit any lockfile/cleanup changes**

```bash
git add -A && git commit -m "chore: finalize learning-lab v1" || echo "nothing to commit"
```

---

## Self-Review Notes (author)

- **Spec §2 stack:** Tasks 1, 5, 8, 11, 13 cover every library (Astro/MDX/Tailwind/Lucide/Motion/Cytoscape/Mermaid/Pagefind/Expressive Code/Vitest/tsx). KaTeX + charts intentionally deferred per spec (not tasked).
- **Spec §3 hybrid UI:** shadcn home/index (Tasks 9, 10a), Substack reading (Task 8 ReadingLayout + 10b), mobile drawer/bottom-nav + dark mode (Task 7). ✅
- **Spec §4 content model:** schemas (Task 3), session via Ask/Answer/Explain (Task 8/12), exercise→session 1:N shown on session pages. ✅
- **Spec §6 two-layer validation:** Zod (Task 3) + validate script with tests covering all six checks (Task 5). ✅
- **Spec §7 knowledge map:** graph builder with tests + Cytoscape island (Task 11). ✅
- **Spec §8 CONTENT_GUIDE / §10 scripts / §11 git+deploy / §13 acceptance:** Tasks 14, 1, scaffold, 15. ✅
- **Type consistency:** `validateDocs`, `buildGraph`, `idIndex`, `getAll`, `urlForId`, `TYPE_COLOR`, `COLLECTION_TYPES` referenced consistently across tasks.
- **Known runtime caveats documented:** Pagefind widget inactive in `dev`; `node:fs` `globSync` needs Node ≥22 (env is 24); track file named flat (`product-minded-builder.mdx`) for clean URL.
