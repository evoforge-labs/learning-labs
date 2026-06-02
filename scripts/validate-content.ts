import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

export interface Doc { _file: string; [k: string]: any; }

// `track` is intentionally omitted: it holds a track slug (not a frontmatter id)
// so it cannot be validated against the id registry.
const REF_FIELDS = ['exercise', 'rubric', 'prerequisites', 'related'];

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
        if (!known.has(r)) errors.push(`${d._file}: broken reference "${r}" in ${field}`);
      }
    }
  }
  return errors;
}

// ---- filesystem runner (not exercised by unit tests) ----
function loadDocs(): Doc[] {
  const files = globSync('src/content/**/*.mdx', { cwd: process.cwd() });
  return files.map((rel: string) => {
    const fm = matter(readFileSync(join(process.cwd(), rel), 'utf8')).data;
    return { ...fm, _file: rel };
  });
}

function checkRegistry(known: Set<string>): string[] {
  const errs: string[] = [];
  try {
    const raw = readFileSync(join(process.cwd(), 'src/content/registry/knowledge-map.yaml'), 'utf8');
    const data: any = yaml.load(raw, { schema: yaml.CORE_SCHEMA }) ?? {};
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
