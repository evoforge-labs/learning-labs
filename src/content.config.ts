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
