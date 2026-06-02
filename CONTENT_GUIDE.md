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
