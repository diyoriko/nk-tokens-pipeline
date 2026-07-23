// Runs the token build and every gate around it, then reports ALL failures at once.
//
// WHY. `build:tokens` used to be a shell `&&` chain, so the first non-zero exit ended the
// run. A contributor with three unrelated problems — a missing description, a contrast
// regression, a stale scopes snapshot — learned about them one per CI round, roughly six
// minutes apart. The gates were never the slow part; the serialisation was.
//
// The chain still has real ordering: the builders produce the files the checkers read, so
// a build failure must stop everything. What can be parallelised in *reporting* is the
// gates on either side of it, and that is what this does:
//
//   pre-build   check-no-legacy-refs, lint-tokens        all run, all reported, then stop if any failed
//   build       build-tokens, build-grid-css             sequential, stops on first failure
//   post-build  contrast, scopes, styles, outputs        all run, all reported
//
// Exit code is 1 if anything failed, so it fails closed exactly like the chain it replaces.
// Individual gates remain runnable on their own (`npm run check:contrast` etc.) — this
// only changes how they are sequenced, never what they assert.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PRE = [
  ['retired identity', 'scripts/check-no-legacy-refs.mjs'],
  ['token lint', 'scripts/lint-tokens.mjs'],
];
const BUILD = [
  ['tokens', 'build-tokens.mjs'],
  ['grid css', 'scripts/build-grid-css.mjs'],
];
const POST = [
  ['contrast', 'scripts/check-contrast.mjs'],
  ['scopes', 'scripts/check-scopes.mjs'],
  ['styles', 'scripts/check-styles.mjs'],
  ['output shapes', 'scripts/check-outputs.mjs'],
];

const run = (script) => {
  const r = spawnSync(process.execPath, [script], { cwd: ROOT, encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
};

const failures = [];

function phase(label, steps, { stopOnFirst = false } = {}) {
  for (const [name, script] of steps) {
    const { ok, out } = run(script);
    process.stdout.write(out);
    if (!ok) {
      failures.push({ phase: label, name, script });
      if (stopOnFirst) return false;
    }
  }
  return true;
}

phase('pre-build', PRE);
if (failures.length) {
  // Building on top of tokens that failed lint would emit garbage and bury the real
  // cause under a pile of downstream noise.
  report('The token sources did not pass — the build was not attempted.');
}

if (!phase('build', BUILD, { stopOnFirst: true })) report('The build failed — the gates that read its output were not run.');

phase('post-build', POST);
if (failures.length) report();

console.log(`\n✓ All gates passed (${PRE.length + BUILD.length + POST.length} steps).`);

function report(note) {
  console.error(`\n✗ ${failures.length} step(s) failed:`);
  for (const f of failures) console.error(`  ✗ ${f.phase} · ${f.name}  (node ${f.script})`);
  if (note) console.error(`\n  ${note}`);
  console.error('');
  process.exit(1);
}
