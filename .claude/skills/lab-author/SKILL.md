---
name: lab-author
description: Use when authoring or expanding learning content (concept/lesson/exercise/track MDX) in the learning-lab repo for ANY topic the user wants to learn — from a single concept to an entire domain curriculum (e.g. "AI Engineering A-Z"). Produces content in a consistent Feynman + For-Dummies voice, with verified external sources and proper knowledge-graph wiring, that passes validate:content and build.
---

# lab-author

Generate "learning content" for **any topic**, at **any size**, into the learning-lab repo.
Output MDX files that match the repo format and voice, link into the knowledge graph, cite
verified external sources, and pass `pnpm validate:content` + `pnpm build`.

**Input:** a topic (e.g. `MVP`, `Job-to-be-done`, `AI Engineering A-Z`) and optionally a target
track. The skill is track-agnostic — it works for any track and can create a new one.

> **LANGUAGE — non-negotiable.** This skill is written in English, but **ALL generated learner
> output is in Vietnamese**: concept/lesson/exercise/track bodies, callout text, examples,
> "Đọc thêm" descriptions, "Tự kiểm tra" questions, and any curriculum outline you present to
> the user. The ONLY English allowed is the `id` and `title` frontmatter fields (e.g.
> `id: concept-mvp`, `title: "MVP (Minimum Viable Product)"`). Never write body prose in English.

## 3 hard rules (never break)

A "raw" agent breaks these by instinct — comply absolutely:

1. **Never generate a `session` file.** Sessions are study-session recordings created by the
   user's *learning* AI agent — not curriculum. Even when other topics have sessions, even to
   "complete the concept→lesson→exercise→session arc", STOP at exercise.
2. **Every concept MUST have a "Đọc thêm" (Further reading) section with verified external links.**
   Actually web-search, open each link to confirm it's live — never invent URLs. 2-4 reputable
   sources, one line of description each.
3. **Every concept MUST have a "Tự kiểm tra" (Self-check) section** — 2-3 questions the user's
   learning agent can use as a quiz and grade.

## Voice: Feynman + For Dummies (the thing that matters most)

This is where a raw agent fails hardest: it writes like an **encyclopedia / textbook** (opens with
"X is a theory developed by...", dumps tables, lists facts dryly). Do NOT do that.

- **Intuition before definition (Feynman):** open every concept with ONE everyday analogy or a
  root-cause question that makes the reader go "oh, I get it" — *before* naming the theory/author.
- **Address the reader as "bạn", talk directly (For Dummies).** Not academic. Hit a jargon term →
  explain it in one sentence on the spot.
- **Concise, cut filler.** Short sentences, 2-4 line paragraphs. Concept ~250-400 words. When in
  doubt, cut. Use a table ONLY when it's genuinely tighter than prose — don't pad with tables to
  look thorough.

Content body is **Vietnamese**; `id`/`title` stay English (match existing seed files).

### Before / After (same concept, JTBD)

❌ **Encyclopedic (what a raw agent produces):**
> **Job-to-be-done** là lý thuyết do Clayton Christensen phát triển: người dùng không "mua sản
> phẩm" — họ "thuê" sản phẩm để hoàn thành một công việc.
> ## Ba loại job
> | Loại | Mô tả | Ví dụ | ... (table) ...

✅ **Feynman + For Dummies:**
> Bạn không mua cái máy khoan. Bạn mua **cái lỗ trên tường**. Máy khoan chỉ là thứ bạn "thuê" để
> có cái lỗ — mai có cách tạo lỗ tốt hơn, bạn bỏ nó ngay.
>
> Đó là Job-to-be-done: người ta "thuê" sản phẩm để xong một *việc* trong đời. Việc đó mới là thứ
> không đổi — sản phẩm chỉ là phương tiện.
>
> Nên khi ai xin "nút export Excel", đừng hỏi *làm nút thế nào*. Hỏi: *việc gì khiến bạn cần file
> đó?* Có khi họ chỉ muốn gửi sếp con số cuối tháng — một email tự động còn xong "việc" đó gọn hơn.

## Concept content blocks (a toolkit, not a rigid template)

Drop any block with no real content. Suggested order:

1. **Intuition hook** — analogy / root-cause question (see the "After" sample).
2. **Là gì** — 1-2 sentence definition, plain language.
3. **Ví dụ thật** — one short, concrete example (prefer the topic's real-world context).
4. `<Callout title="Cẩn thận">` — pitfall / anti-pattern (if any).
5. `<Callout title="Nhớ nhé">` — one-line core takeaway.
6. **## Đọc thêm** — 2-4 verified external links (hard rule #2).
7. **## Tự kiểm tra** — 2-3 questions (hard rule #3).

**Callout** title conventions: `Mẹo` (tip) · `Cẩn thận` (pitfall) · `Nhớ nhé` (core) · `Góc kỹ thuật`
(deeper detail, skippable). Use sparingly — not one callout per paragraph.

**Lesson** (short, *references* concepts, never repeats theory): one insight that threads the
concepts together; `prerequisites` → concepts, `related` → exercise/rubric.
**Exercise**: one real scenario + 2-3 tasks; `related` → lesson/concept/rubric.

## Scale tiers — pick by how big the topic is

### Micro — one concept (e.g. "User Pain")
1 `concept` + 1 `lesson` + 1 `exercise`.

### Cluster — a topic spanning a few concepts (e.g. "Product Discovery")
- **N atomic `concept` files** — one per concept, each with its own example + pitfall.
- **1 `lesson`** threading them (link, don't re-explain).
- **1 `exercise`** for the cluster.
- **Confirmation gate:** before generating, print the planned concept list and ask the user to
  approve (e.g. *"Split 'Product Discovery' into 4 concepts: A, B, C, D — ok?"*). Wait for approval.

### Domain — an entire field (e.g. "AI Engineering A-Z")
This is a whole **track**, far too large for one run. Two phases:

**Phase 1 — Curriculum design (do this first, always):**
- Create or identify the `track` file.
- Propose a learning path: ordered **modules** (basic → advanced), and for each module an ordered
  list of lessons + the concepts each lesson introduces.
- **Present the outline to the user and get approval before writing any concept/lesson.** Do NOT
  dump dozens of files in one shot.
- Optionally save the approved outline as the track body (the curriculum map).

**Phase 2 — Author incrementally:**
- Generate content module-by-module (or lesson-by-lesson), each unit handled as a **Cluster**.
- Spread across multiple runs. At the start of a run, scan what already exists and continue from
  the next unfinished unit. Report progress (e.g. "module 2 of 6 done").

## Mechanics (match existing seed files exactly)

- **IDs** (unique across the whole repo):
  - Concepts are global and track-agnostic: `concept-<slug>` (e.g. `concept-mvp`).
  - Lessons/exercises carry a **track prefix**: `lesson-<prefix>-NNN`, `exercise-<prefix>-NNN`.
    Derive `<prefix>` from existing IDs in that track (scan files); if the track is new, derive a
    short slug from the track name (e.g. `ai-engineering` → `aieng`). Compute the next NNN.
- **Required frontmatter** (every file): `id`, `title`, `type`, `tags`, `status`. See
  `src/content.config.ts` for per-type fields (lesson/exercise need `track`; concept has `aliases[]`;
  track has `summary`).
- **Folders:** `concepts/`, `lessons/<track>/`, `exercises/<track>/`, `tracks/`.
- **Component import depth depends on folder depth** (this trips people up):
  - From `concepts/<file>` → `import Callout from '../../components/content/Callout.astro';`
  - From `lessons/<track>/<file>` or `exercises/<track>/<file>` → `'../../../components/content/Callout.astro';`
  - Rule of thumb: count directories from the file up to `src/`, that's the number of `../`.
- **Graph:** fill `prerequisites`/`related`; add manual edges to `src/content/registry/knowledge-map.yaml`
  when a relation isn't derivable from frontmatter; add new tags to `src/content/registry/tags.yaml`.

## Run flow

1. **Assess size** → Micro / Cluster / Domain. For Domain, run Phase 1 (curriculum + approval) first.
2. **Dedupe** — search existing content by id/title/aliases/tags. Existing concept → ask user
   whether to *expand* it or *use a different name*.
3. **Web-search sources** — 2-4 reputable articles, verify each link is live, one-line summary each.
4. **Confirmation gate** — Cluster: confirm concept list. Domain: confirm curriculum outline.
5. **Generate files** — per content blocks + voice + hard rules; assign IDs correctly.
6. **Wire the graph** — `prerequisites`/`related`, `knowledge-map.yaml`, `tags.yaml`.
7. **Validate + build** — run `pnpm validate:content` then `pnpm build`. On error, fix and re-run.
   Report files created + command results.

## Red flags — STOP if you are about to:

- Create a `session` file "to complete the set" → NO. Stop at exercise.
- Open a concept with "X is a theory developed by ..." → wrong voice. Open with an analogy/intuition.
- Invent "Đọc thêm" links or skip web-search → links must be real and verified.
- Omit the "Tự kiểm tra" section → the concept is incomplete.
- Dump a whole domain's files in one run without an approved outline → design the curriculum first.
- Pad with tables instead of intuitive explanation → cut, rewrite tighter and clearer.
- Make a lesson repeat a concept's theory → link to it instead.
- Guess the Callout import depth → concepts use `../../`, lessons/exercises use `../../../`.
