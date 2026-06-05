---
name: lab-session
description: Use when recording a learner's completed practice/quiz session into the learning-lab repo as a `session` MDX file — capturing the real multi-turn transcript and an honest rubric-based score. For the learning/coaching agent that quizzes the user and logs how it went, not for authoring curriculum (that is lab-author).
---

# lab-session

Record one completed study session as a `session` MDX file in the learning-lab repo, so it
shows up on the site and becomes part of the learner's history. The file format is simple and
has a clear example to copy (`src/content/sessions/.../export-excel-01.mdx`) — so this skill
focuses on the parts an agent gets wrong: a real **multi-turn transcript** and an **honest,
rubric-based score**.

> **LANGUAGE:** transcript/body in **Vietnamese** (the learner's language). Only `id`/`title`
> frontmatter in English.

## What this is / isn't

- **Is:** a faithful record of one attempt at an `exercise` — the actual Q&A and a graded verdict.
- **Isn't:** a lesson or theory. Don't explain concepts at length; link them. Don't invent a
  better answer than what the learner actually gave.

## The 3 things that matter (an agent gets these wrong)

1. **Capture the FULL multi-turn transcript, not one question.** A real session is several
   exchanges. Use one `<Ask>`/`<Answer>`/`<Explain>` trio per turn, in order. `<Answer>` is the
   learner's *actual* words (paraphrased honestly), `<Explain>` is your coaching on that turn.
2. **Score honestly against the rubric, mapped to its criteria.** Open the linked rubric, judge
   each weighted criterion, and let the total reflect that. Never inflate. If they missed
   something (e.g. didn't quantify frequency), the score and `<Explain>` must say so.
3. **One session file per attempt.** Same exercise attempted again → a NEW session file (next
   number), never overwrite the old one. History accumulates.

## Mechanics (copy the existing session file for exact format)

- **id:** `session-<track-prefix>-NNN` (e.g. `session-product-002`); scan existing sessions for
  the next number. **Filename:** `<exercise-slug>-NN.mdx` under `sessions/<track>/`.
- **Required frontmatter:** `id`, `title`, `type: session`, `track`, **`exercise`** (required —
  the id of the exercise attempted), `rubric` (the rubric the exercise uses), `date` (today,
  passed in — do not guess), `reviewedBy` (your model id), `score` (0–100 or null if ungraded),
  `tags`, `status: published`.
- **Imports:** `Ask`, `Answer`, `Explain` from `'../../../components/content/...'`.
- End with a short, actionable next-step in the final `<Explain>` ("lần tới hỏi thêm…").

## Run flow

1. Find the `exercise` id + its `rubric` (read the exercise frontmatter).
2. Compute the next `session-<prefix>-NNN` id and filename.
3. Write the multi-turn transcript (Vietnamese) + honest rubric-based `score`.
4. Run `pnpm validate:content` (the validator requires sessions to have `exercise`). Fix if needed.

## Red flags — STOP if you are about to:

- Write a single Q&A and call it a session → capture the whole conversation.
- Pick a score by vibe → map it to the rubric's weighted criteria; justify the gaps.
- Inflate the score or rewrite the learner's answer into a better one → record what truly happened.
- Overwrite a previous session for the same exercise → create a new numbered file.
- Explain the concept like a lesson → link it; a session is a record, not curriculum.
