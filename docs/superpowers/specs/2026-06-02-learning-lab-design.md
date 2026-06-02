# learning-lab — Design Spec (v1)

**Date:** 2026-06-02
**Status:** Approved design, pending implementation plan

## 1. Mục tiêu

learning-lab là **personal learning OS / knowledge gym** dạng website tĩnh. Repo là nơi lưu kiến thức canonical, lộ trình học, đề luyện tập, và **lịch sử các phiên học** (AI hỏi → user trả lời → AI giải thích/chấm).

**Nguyên tắc cốt lõi:**
- **MDX là source of truth.** Mọi nội dung sinh ra bằng cách commit file MDX.
- **Website chỉ để ĐỌC LẠI — không có input/form nào trên web.** Một AI agent (ở môi trường chat khác) tiến hành phiên học rồi commit transcript vào repo. Không có auth, database, backend, account, quiz engine, CMS, AI chat nhúng ở v1.
- **Chống trùng lặp kiến thức** để AI có thể liên tục thêm content mà repo không bị rối.
- **Mở rộng được** cho nhiều track (Product-minded Builder, AI Engineering, DevOps, System Design, Interview Prep, Software Architecture, Startup/Solo Builder...).

**Output:** chạy `npm install && npm run dev`, build `npm run build`, validate `npm run validate:content`. Deploy Vercel (output static, không cần adapter).

## 2. Tech stack

| Lớp | Lựa chọn |
|---|---|
| Framework | Astro (`output: 'static'`) + TypeScript |
| Nội dung | MDX qua **Astro Content Collections** + **Zod** schema |
| Styling | Tailwind CSS + `@tailwindcss/typography` |
| UI style | Custom Astro + Tailwind theo phong cách shadcn (KHÔNG Starlight, KHÔNG React) |
| Icons | **Lucide** |
| Animation | **Motion** (motion.dev) + **Astro View Transitions** (`<ClientRouter />`) |
| Search | **Pagefind** |
| Knowledge graph | **Cytoscape.js** (layout `fcose`), lazy-load chỉ trên trang map |
| Code blocks | **Expressive Code** (title/tab/line-highlight) |
| Diagrams | **Mermaid** (diagram-as-text trong MDX) |
| Charts | Khả năng score-over-time (suy từ session frontmatter) — **deferred**, dùng khi track cần |
| Math | KaTeX — **deferred** tới khi có track cần |
| Validation phụ | `scripts/validate-content.ts` chạy bằng `tsx` |

**Không dùng v1:** three.js / 3d-force-graph, D3 custom thuần, backend/auth/db.

## 3. Hướng UI — Hybrid

**Trang đọc (lesson / concept / exercise / session) = phong Substack:**
- Serif **Spectral**, một cột canh giữa `max-w-[680px]`, cỡ chữ ~20px, line-height thoáng.
- Layout: kicker (chữ hoa nhỏ) → tiêu đề serif lớn → dòng meta (avatar/nguồn · ngày · read time + badge) → divider mảnh → body.
- **Floating "CONTENTS" TOC** ở lề trái: thường thu thành 3 vạch, hover bung ra (chỉ ≥1280px).
- Top bar tối giản (✕ đóng · tên track · ··· menu).

**Trang điều hướng/tra cứu (Home, index từng loại, Knowledge Map) = phong shadcn:**
- Nền trung tính zinc, **một accent indigo** (`#6366f1`) — tạm giữ, chọn lại sau.
- Card grid, badge, SectionHeader. Quét nhanh, thống kê (đếm concept/lesson/exercise per track).

**Type colors** (dùng ở badge + node graph): concept=blue · lesson=green · exercise=amber · session=violet · rubric=rose · template=slate · track=indigo.

**Status badge:** draft = outline xám · published = solid xanh. Level = dot màu. estimatedMinutes = icon đồng hồ.

**Mobile-first:** sidebar gập thành **drawer** (☰); **bottom-nav** 4 mục hay dùng (Tracks · Concepts · Exercises · Search); content full-width; target chạm ≥44px; trang đọc giữ serif một cột; graph pinch-zoom.

**Dark mode:** Tailwind `class` strategy + toggle ở header.

**Component kiểu shadcn:** `Card`, `Badge` (variant theo type/status, dùng `class-variance-authority`), `Button`, `SectionHeader`, callout MDX (Note/Tip/Warning), `RelatedLinks`, `MetaBadges`, `Prose` wrapper.

Mockup tham chiếu: `docs/superpowers/mockups/ui-mockup.html`.

## 4. Mô hình nội dung (content model)

```
track    : lộ trình lớn theo chủ đề
concept  : kiến thức canonical (1 file duy nhất / khái niệm), có aliases
lesson   : bài học; chỉ LINK về concept, không lặp lý thuyết dài
exercise : thư viện đề/prompt tái dùng — AI dùng lại để hỏi user (read-only)
session  : bản ghi 1 lần tương tác (thay cho 'answer' trong spec gốc)
rubric   : tiêu chí chấm, tách riêng để tái dùng
template : mẫu tái dùng (PRD, answer, system design, interview)
```

**Quan hệ chính:** `exercise` 1 ──N─→ `session` (một đề có nhiều session theo thời gian → xem tiến bộ qua score).

### Session = transcript nhiều lượt
Mỗi session hiển thị dạng hội thoại read-only: các lượt **AI HỎI → BẠN TRẢ LỜI → AI GIẢI THÍCH**, kèm bảng điểm theo rubric.

**Frontmatter = chỉ metadata; transcript viết ở thân MDX bằng component** (`<Ask> <Answer> <Explain>`) để câu trả lời dài vẫn tự nhiên, dễ AI tạo và dễ đọc.

```yaml
id: session-product-001
title: "Session 02 — Export Excel"
type: "session"
track: product-minded-builder
exercise: exercise-product-001      # bắt buộc — link về đề gốc
rubric: rubric-product-thinking     # optional
date: 2026-05-31
reviewedBy: claude-opus             # AI nào đánh giá
score: 82                           # number | null
status: published
```

```mdx
<Ask>Một user nhắn "cho tôi nút export Excel"...</Ask>
<Answer>Tôi sẽ hỏi: họ định làm gì với file đó?...</Answer>
<Explain>Tốt — bạn đã đào tới job-to-be-done...</Explain>
```

### Frontmatter chuẩn theo loại
Tất cả có **base**: `id` (unique toàn repo), `title`, `type`, `tags`, `status`.

- **concept**: + `aliases[]`. Trang concept hiện aliases chips + "Used in" (backlink lesson/exercise tham chiếu nó).
- **lesson**: + `track, module, level, prerequisites[], related[]`.
- **exercise**: + `track, skill, estimatedMinutes, related[]`. Trang exercise hiện đề + "Nhiệm vụ" + danh sách session đã ghi + preview rubric. KHÔNG có nút nhập.
- **session**: như trên.
- **rubric / template**: base + nội dung MDX.

## 5. Cấu trúc thư mục

```
src/
  content/
    config.ts                      # Zod schemas cho mọi collection
    tracks/<track>/track.mdx
    concepts/*.mdx
    lessons/<track>/*.mdx
    exercises/<track>/*.mdx
    sessions/<track>/*.mdx          # ('answers/' cũ → đổi tên 'sessions/')
    rubrics/*.mdx
    templates/*.mdx
    registry/ tags.yaml  knowledge-map.yaml
  components/
    ui/        Card, Badge, Button, SectionHeader
    layout/    BaseLayout, Header (dark toggle), Sidebar, Drawer, BottomNav, Footer, ReadingLayout
    content/   MetaBadges, RelatedLinks, Callout, Prose, Ask/Answer/Explain (session transcript), KnowledgeGraph (island)
  lib/         content.ts (query helpers), graph.ts (build {nodes,edges})
  pages/       index.astro, tracks/[...], concepts/[...], lessons/[...],
               exercises/[...], sessions/[...], rubrics/[...], templates/[...],
               knowledge-map.astro
scripts/validate-content.ts
astro.config.mjs  tailwind.config  tsconfig.json
README.md  CONTENT_GUIDE.md  .gitignore  package.json
```

## 6. Validation — hai lớp bổ trợ

**Lớp 1 — Content Collections + Zod (`src/content/config.ts`):** type-safe khi viết; `astro build` **fail** nếu frontmatter sai schema (thiếu/sai field, sai enum status...).

**Lớp 2 — `scripts/validate-content.ts`** (`npm run validate:content`, exit ≠ 0 khi lỗi): kiểm tra thứ Zod khó làm:
- Trùng `id` toàn repo.
- Thiếu `title` / `type` / `status` (phòng hờ).
- `session` thiếu field `exercise`.
- `concept` alias trùng nhau (giữa các concept).
- **Broken references**: mọi `prerequisites / related / track / exercise / rubric` và reference trong `registry/*.yaml` phải trỏ tới `id` có thật.

## 7. Knowledge Map

`lib/graph.ts` quét toàn bộ frontmatter lúc build → `{ nodes, edges }` (node = mỗi item, màu theo type; edge từ `track / prerequisites / related / exercise / rubric` + bổ sung thủ công từ `registry/knowledge-map.yaml`). Trang `knowledge-map.astro` nhúng **một client island Cytoscape.js** (lazy-load): layout `fcose` (animated physics), zoom/kéo-thả, lọc theo type, click node → mở trang. Đây là JS client-side đáng kể duy nhất; phần còn lại tĩnh.

## 8. CONTENT_GUIDE.md (nguyên tắc chống trùng)

- Mỗi concept = **một** file canonical trong `concepts/`.
- Lesson/exercise **không lặp lý thuyết dài** — chỉ link/reference concept.
- Mỗi MDX phải có `id, title, type, tags, status`; `id` **unique toàn repo**.
- Dùng `aliases` cho concept để tránh tạo file trùng nghĩa.
- `session` phải link về `exercise` gốc.
- Rubric tách riêng nếu tái dùng nhiều lần.
- **Trước khi tạo content mới, search existing theo title/id/aliases/tags.**
- Không commit secrets/.env/token/credential.
- Commit theo **Conventional Commits**.

## 9. Seed content (chứng minh cấu trúc)

- **Track:** Product-minded Builder.
- **Concepts:** MVP, User Pain, Product Discovery.
- **Lesson:** Day 01 — Problem vs Feature (chỉ link concept).
- **Exercise:** User muốn Export Excel.
- **Session:** 1 session mẫu cho exercise trên (transcript Q→A→explain + score) để minh hoạ entity mới.
- **Rubric:** Product Thinking Rubric.
- **Templates:** Exercise Answer, PRD, Interview Answer, System Design.
- **Registry:** `tags.yaml`, `knowledge-map.yaml` mẫu.

## 10. npm scripts

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "validate:content": "tsx scripts/validate-content.ts"
}
```

## 11. Git & deploy

`git init`, `.gitignore` chặn `.env`/secrets/`node_modules`/`dist`/`.pagefind`. Commit đầu theo Conventional Commits. `output: 'static'` — Vercel auto-detect Astro, không cần adapter.

## 12. Ngoài scope v1

auth · database · user account · progress tracking backend · AI chat nhúng · quiz engine phức tạp · CMS · input/form trên web · three.js/3D graph.

## 13. Tiêu chí hoàn thành

- [ ] `npm install && npm run dev` chạy được.
- [ ] `npm run build` build static thành công (Zod validate pass).
- [ ] `npm run validate:content` chạy, bắt được các lỗi ở mục 6.
- [ ] Seed content render đúng: Home (card grid), trang đọc Substack (lesson/concept/exercise/session), Knowledge Map (Cytoscape), mobile drawer + bottom-nav, dark mode.
- [ ] README.md + CONTENT_GUIDE.md đầy đủ.
- [ ] Sẵn sàng deploy Vercel.
