// Golden snapshot of the generated outputs.
//
// WHY THIS EXISTS. `build/` is git-ignored, so a change to a transform, to the set→domain map,
// or to Style Dictionary's config order lands in a pull request as ZERO changed lines while
// silently rewriting every emitted value. None of the other gates catch that: lint checks the
// source tokens, check-contrast checks hex pairs, check-outputs checks shapes. This file is the
// only thing that makes an output change visible to a reviewer.
//
// Two layers:
//   1. a hash manifest of every file under build/ — catches anything, including assets;
//   2. verbatim copies of the three token outputs — so a value change is a readable diff in the
//      PR, not an opaque hash flip.
//
// The build is byte-deterministic (verified: two consecutive `npm run build` runs hash equal),
// so drift here always means a real change, never flake.
//
// Usage:
//   node tests/snapshot-outputs.mjs             verify (exits 1 on drift)
//   node tests/snapshot-outputs.mjs --update    accept the current output as the new baseline

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = resolve(ROOT, 'build');
const SNAP = resolve(ROOT, 'tests/__snapshots__');
const UPDATE = process.argv.includes('--update');

// Verbatim-snapshotted outputs: the ones a human should read in a diff.
const VERBATIM = ['css/variables.css', 'css/grid.css', 'ts/tokens.ts', 'dart/nk_colors.dart'];

if (!existsSync(BUILD)) {
  console.error('✗ build/ missing — run `npm run build` first.');
  process.exit(1);
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(BUILD);
const manifest = {};
for (const f of files) manifest[relative(BUILD, f).split('\\').join('/')] = sha(readFileSync(f));

const manifestPath = resolve(SNAP, 'outputs.manifest.json');
const serialised = JSON.stringify(manifest, null, 2) + '\n';

const problems = [];

if (UPDATE) {
  mkdirSync(SNAP, { recursive: true });
  writeFileSync(manifestPath, serialised);
  for (const rel of VERBATIM) {
    const src = resolve(BUILD, rel);
    if (!existsSync(src)) continue;
    const dest = resolve(SNAP, rel.replace(/\//g, '__'));
    writeFileSync(dest, readFileSync(src));
  }
  console.log(`✓ Snapshots updated: ${files.length} files hashed, ${VERBATIM.length} verbatim copies.`);
  process.exit(0);
}

if (!existsSync(manifestPath)) {
  console.error('✗ No snapshot baseline. Create it with: node tests/snapshot-outputs.mjs --update');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(manifestPath, 'utf8'));

const added = Object.keys(manifest).filter((k) => !(k in baseline));
const removed = Object.keys(baseline).filter((k) => !(k in manifest));
const changed = Object.keys(manifest).filter((k) => k in baseline && baseline[k] !== manifest[k]);

if (added.length) problems.push(`  ${added.length} new output file(s):\n${added.map((f) => `    + ${f}`).join('\n')}`);
if (removed.length)
  problems.push(`  ${removed.length} output file(s) DISAPPEARED:\n${removed.map((f) => `    - ${f}`).join('\n')}`);
if (changed.length)
  problems.push(`  ${changed.length} output file(s) changed:\n${changed.map((f) => `    ~ ${f}`).join('\n')}`);

// Verbatim diffs — report the first few differing lines so the cause is obvious from CI logs.
for (const rel of VERBATIM) {
  const src = resolve(BUILD, rel);
  const snapFile = resolve(SNAP, rel.replace(/\//g, '__'));
  if (!existsSync(src) || !existsSync(snapFile)) continue;
  const now = readFileSync(src, 'utf8').split('\n');
  const was = readFileSync(snapFile, 'utf8').split('\n');
  if (now.join('\n') === was.join('\n')) continue;
  const lines = [];
  for (let i = 0; i < Math.max(now.length, was.length) && lines.length < 6; i++) {
    if (now[i] !== was[i]) lines.push(`    line ${i + 1}:\n      was: ${was[i] ?? '(missing)'}\n      now: ${now[i] ?? '(missing)'}`);
  }
  problems.push(`  ${rel} differs:\n${lines.join('\n')}`);
}

if (problems.length) {
  console.error('✗ Generated output drifted from the committed snapshot:\n');
  console.error(problems.join('\n\n'));
  console.error(
    '\n  If the change is intended, review the diff above, then run:\n' +
      '    node tests/snapshot-outputs.mjs --update\n' +
      '  and commit tests/__snapshots__/ together with the change, so the PR shows what moved.\n'
  );
  process.exit(1);
}

console.log(`✓ Output snapshot: ${files.length} files match the committed baseline (${VERBATIM.length} verbatim).`);
