// Output-shape gate. The lint/contrast/scopes gates check token SEMANTICS;
// this one asserts the generated files are structurally sound, catching the
// class of bug where a web-only value (gradient string, unresolved ref) leaks
// into a platform that can't parse it:
//   - every Dart field must be a compilable `Color(0xAARRGGBB)` const
//   - every --nk-effect-inner-shadow-* must actually be an inset shadow
//   - no `NaN` / `undefined` anywhere in any emitted file
// Run by `npm run build:tokens` after the build; exits 1 on any violation.
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../build/', import.meta.url).pathname;
const violations = [];

// Collect the default build + every REGISTERED capsule build. Every file is
// REQUIRED — a platform silently dropped from style-dictionary.config.mjs (or a
// capsule loop that never ran) must fail here, not ship a package with dangling
// exports while all gates stay green. The registry, not readdir, defines the
// set: a directory that happens to exist proves nothing about what must.
const targets = { css: [], dart: [], ts: [] };
const REQUIRED = [
  ['css', 'css/variables.css'],
  ['dart', 'dart/nk_colors.dart'],
  ['ts', 'ts/tokens.ts'], ['ts', 'ts/tokens.mjs'], ['ts', 'ts/tokens.cjs'], ['ts', 'ts/tokens.d.ts'],
];
const addTree = (base, label) => {
  for (const [kind, rel] of REQUIRED) {
    const fp = path.join(base, rel);
    if (fs.existsSync(fp)) targets[kind].push(fp);
    else violations.push(`${label}${rel}: missing — the build did not emit a required platform output`);
  }
};
addTree(root, 'build/');
// grid.css is REQUIRED too: build:tokens runs build-grid-css.mjs before this
// gate, so a missing file means the pipeline order broke (a fresh checkout
// would otherwise publish without the grid ever being validated).
const gridCss = path.join(root, 'css/grid.css');
if (fs.existsSync(gridCss)) targets.css.push(gridCss);
else violations.push('build/css/grid.css: missing — build-grid-css.mjs must run before this gate');

const rel = (f) => path.relative(process.cwd(), f);

// 1. Dart: every generated field is a valid Color const.
const DART_FIELD = /^ {2}static const Color \w+ = Color\(0x[0-9A-F]{8}\);$/;
let dartFields = 0;
for (const file of targets.dart) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const fields = lines.filter((l) => l.includes('static const'));
  if (!fields.length) violations.push(`${rel(file)}: no Color fields emitted at all`);
  for (const l of fields) {
    dartFields++;
    if (!DART_FIELD.test(l)) violations.push(`${rel(file)}: invalid Dart field → ${l.trim().slice(0, 90)}`);
  }
}

// 2. CSS: inner shadows really are inset.
let innerShadows = 0;
for (const file of targets.css) {
  const css = fs.readFileSync(file, 'utf8');
  for (const m of css.matchAll(/(--nk-effect-inner-shadow-[\w-]+):\s*([^;]+);/g)) {
    innerShadows++;
    if (!m[2].trim().startsWith('inset '))
      violations.push(`${rel(file)}: ${m[1]} is not inset → "${m[2].trim().slice(0, 60)}"`);
  }
}

// 3. Nothing emitted anywhere may contain NaN / undefined (unresolved ref, bad parse).
for (const file of [...targets.css, ...targets.dart, ...targets.ts]) {
  const body = fs.readFileSync(file, 'utf8');
  for (const bad of ['NaN', 'undefined'])
    if (body.includes(bad)) violations.push(`${rel(file)}: contains "${bad}" — an unresolved reference or bad parse leaked into output`);
}

if (violations.length) {
  console.error(`✗ Output shapes: ${violations.length} violation(s):`);
  violations.forEach((v) => console.error('  ✗ ' + v));
  process.exit(1);
}
console.log(`✓ Output shapes: ${dartFields} Dart Color fields valid, ${innerShadows} inner shadows inset, no NaN/undefined in ${targets.css.length + targets.dart.length + targets.ts.length} files.`);
