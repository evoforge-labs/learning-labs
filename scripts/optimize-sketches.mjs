// Convert raw sketch PNGs into the web-sized WebP files the site serves.
//
// Raw art is generated with the Codex CLI (built-in image_gen tool), e.g.:
//   codex exec -s workspace-write "<style contract> ... save to sketches-raw/phil/<slug>.png"
// Raw files are ~1250px / 1-3MB each and are NOT committed (see .gitignore);
// the committed artifact is the WebP under public/sketches/<track>/.
//
// Run: pnpm sketches:optimize
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';

const RAW_ROOT = 'sketches-raw';
const OUT_ROOT = 'public/sketches';
const WIDTH = 1000;
const QUALITY = 82;

let count = 0;
let tracks = [];
try { tracks = (await readdir(RAW_ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()); }
catch { console.log(`no ${RAW_ROOT}/ directory — nothing to do`); }

for (const t of tracks) {
  const files = (await readdir(join(RAW_ROOT, t.name))).filter((f) => /\.(png|jpe?g)$/i.test(f));
  if (!files.length) continue;
  await mkdir(join(OUT_ROOT, t.name), { recursive: true });
  for (const f of files) {
    const out = join(OUT_ROOT, t.name, basename(f, extname(f)) + '.webp');
    await sharp(join(RAW_ROOT, t.name, f)).resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY }).toFile(out);
    const { size } = await stat(out);
    console.log(`${out}  ${(size / 1024).toFixed(0)}KB`);
    count++;
  }
}
console.log(`\n✓ ${count} sketch(es) optimized (${WIDTH}px, webp q${QUALITY})`);
