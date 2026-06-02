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
