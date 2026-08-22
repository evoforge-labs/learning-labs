# learning-lab

Astro 6 + Tailwind v4 + MDX knowledge base. Content rules live in [CONTENT_GUIDE.md](CONTENT_GUIDE.md);
this file covers how to *work* in the repo.

## Authoring content

Use the `lab-author` skill (`.claude/skills/lab-author`) for any concept / lesson / exercise / track
MDX. It carries the voice, the frontmatter contract, and the source-verification rules.

Gate every change through both, in order:

```
pnpm validate:content    # dup ids, dup aliases, broken refs, registry edges
pnpm build               # Zod schemas + MDX compile
```

Broken **internal links** pass both gates. Audit them by hand: for each `](/x)` in
`src/content/**/*.mdx`, confirm `dist/x/index.html` exists after a build.

## Visual assets — pick by kind, don't improvise

| Kind | Tool | Output |
|---|---|---|
| **Diagram** — anything with nodes, edges, ranks, axes, flows, hierarchies | `diagram-design` skill | self-contained HTML in `docs/diagrams/`, SVG inlined into MDX |
| **Illustration / sketch** — hand-drawn figures, scene art, metaphor images | **Codex CLI** (`codex exec`, built-in `image_gen`) | PNG in `sketches-raw/<track>/` → `pnpm sketches:optimize` → `public/sketches/<track>/*.webp` |

**Never hand-write ASCII/unicode diagrams into content.** They break on narrow screens, ignore the
theme, and can't be restyled. ASCII is fine while *discussing* a structure in chat; it is not a
deliverable. If a structure is worth showing, it is worth the skill.

### Diagrams

The `diagram-design` profile for this repo is **`learning-lab`** — the marker `.diagram-design`
at the repo root selects it, so the skill picks up the "paper & ink" skin (warm stone paper,
deep-teal accent, Be Vietnam Pro + Spectral) without re-onboarding. Tokens were extracted from
`src/styles/global.css` and `src/lib/types.ts`; if either changes, re-run onboarding and
`update learning-lab`.

To embed: keep the source HTML in `docs/diagrams/<slug>.html`, then inline the `<svg>` into MDX
inside `<Diagram>` (`src/components/content/Diagram.astro`). Replace every hex with the
`var(--d-*)` token the component supplies — that is what makes one SVG serve light and dark.
Prefix marker ids per diagram (`arrow-cb`, `arrow-fvs`); two diagrams on one page with a bare
`id="arrow"` will collide. MDX rejects `<!-- -->` inside JSX, so strip the SVG's comments first.

**Size the diagram to where it is read.** The reading column is `max-w-[680px]` with `px-5` —
640px of content. An SVG scales to its container, so a 1000-unit `viewBox` there renders at 64%
and drags the type down with it (12px becomes 7.7px). `<Diagram>` handles this two ways: it
breaks out of the column to 1040px at `min-width: 1024px`, and it takes a second `portrait` slot
— a stacked redraw with a bigger type ramp (16px names) that replaces the wide one below 720px.
A wide multi-column graph cannot be read on a phone at any scale; redraw it, don't shrink it.

Before shipping a diagram, run the skill's `scripts/self_check.py` **and** verify no two
connectors cross without a bridge — a vertical dropping through another edge's horizontal run is
the failure that slips past every automated check. In a fan of edges, give the longest
horizontal run the lane furthest from the sources; assigning lanes in target order creates exactly
that crossing.

**Verify responsive layout with Playwright, not headless screenshots.** `chrome --headless
--window-size=390,...` does not set the layout viewport: the page lays out wide and the screenshot
is just a 390px crop, which reads as clipped body text and sends you hunting an overflow bug that
does not exist. Use `/Users/hoangcong/myspace/webwright/.venv/bin/python` with Playwright, set a
real `viewport`, and assert `document.documentElement.scrollWidth === clientWidth`.

### Illustrations

See the Codex CLI notes: one `codex exec` session at a time (concurrent sessions deadlock), and
reuse the same STYLE CONTRACT paragraph across a set so the art stays visually identical. Raw PNGs
stay in gitignored `sketches-raw/` — **never** in `public/`, or Astro copies them into `dist`.

## Working in this repo

Multiple Claude sessions often share this working tree, and another session may `git add -A`,
revert, or `pnpm install` at any moment. For anything longer than a couple of edits, take your own
worktree first:

```
git worktree add ../learning-lab-<topic> -b <branch>
cd ../learning-lab-<topic> && pnpm install   # a symlinked node_modules gets pruned by other sessions
```

Run `git status` before every `git add`, and stage explicit paths — never `git add -A` on a tree you
did not verify. Switching branches leaves a stale `.astro` cache; `rm -rf .astro dist` before
rebuilding.

Direct push to `main` is blocked. Open a PR and let the user merge it.
