// Scopes gate. Figma variable *scopes* (which property pickers a variable shows up in)
// live only in Figma — Tokens Studio doesn't export them — so a scope regression
// (e.g. a primitive turned ALL_SCOPES and polluting every picker, or a semantic losing
// its scope and vanishing from the picker) is otherwise invisible to CI.
//
// This script versions the intended scopes in tokens/scopes.snapshot.json and enforces them:
//
//   node scripts/check-scopes.mjs              # LAWS — validate the snapshot (CI, no Figma needed)
//   node scripts/check-scopes.mjs --live FILE  # DRIFT — diff the snapshot against a live Figma dump
//
// The live dump is a JSON of the same shape ({ "Collection": { "Var/Name": ["SCOPE", ...] } }).
// Produce it via the Figma plugin / MCP (the REST variables API is Enterprise-only, so on the
// Pro plan CI can't fetch it directly — run the drift check locally after a Tokens Studio
// re-import, then commit the refreshed snapshot). To refresh the snapshot: --live FILE --update.
import fs from 'node:fs';

const SNAP_PATH = new URL('../tokens/scopes.snapshot.json', import.meta.url);
const snap = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));

const args = process.argv.slice(2);
const liveIdx = args.indexOf('--live');
const livePath = liveIdx >= 0 ? args[liveIdx + 1] : process.env.SCOPES_LIVE;
const doUpdate = args.includes('--update');

const PRIMITIVE_COLLECTIONS = ['Color Primitives', 'Typography Primitives'];
// Color semantic surface → the scope it MUST carry (catches a mis-scoped semantic).
const COLOR_SURFACE_RULE = [
  { prefix: 'Text/', must: 'TEXT_FILL' },
  { prefix: 'Icon/', must: 'SHAPE_FILL' },
  { prefix: 'Border/', must: 'STROKE_COLOR' },
  { prefix: 'Background/', mustAny: ['FRAME_FILL', 'SHAPE_FILL'] },
  { prefix: 'Social/', mustAny: ['FRAME_FILL', 'SHAPE_FILL'] },
];
const collections = (o) => Object.keys(o).filter((k) => !k.startsWith('_'));

// ---- LAWS (always) -------------------------------------------------------
const violations = [];
for (const col of collections(snap)) {
  const vars = snap[col];
  for (const [name, scopes] of Object.entries(vars)) {
    if (!Array.isArray(scopes)) { violations.push(`${col}|${name}: scopes is not an array`); continue; }
    if (scopes.includes('ALL_SCOPES')) violations.push(`${col}|${name}: ALL_SCOPES pollutes every picker — scope it explicitly`);
    if (PRIMITIVE_COLLECTIONS.includes(col) && scopes.length !== 0)
      violations.push(`${col}|${name}: primitive must be hidden (scopes=[]), got [${scopes}]`);
  }
}
// Semantic Color: non-empty + surface-family scope
if (snap['Color']) {
  for (const [name, scopes] of Object.entries(snap['Color'])) {
    if (scopes.length === 0) { violations.push(`Color|${name}: semantic token must be scoped (got [])`); continue; }
    const rule = COLOR_SURFACE_RULE.find((r) => name.startsWith(r.prefix));
    if (!rule) continue; // Data-Viz etc. — non-empty already checked
    if (rule.must && !scopes.includes(rule.must)) violations.push(`Color|${name}: ${rule.prefix}* must include ${rule.must}, got [${scopes}]`);
    if (rule.mustAny && !rule.mustAny.some((s) => scopes.includes(s))) violations.push(`Color|${name}: ${rule.prefix}* must include one of [${rule.mustAny}], got [${scopes}]`);
  }
}

let total = 0;
for (const col of collections(snap)) total += Object.keys(snap[col]).length;

if (violations.length) {
  console.error(`✗ Scopes laws: ${violations.length} violation(s):`);
  violations.forEach((v) => console.error('  ✗ ' + v));
  process.exit(1);
}
console.log(`✓ Scopes laws: ${total} variables across ${collections(snap).length} collections pass (primitives hidden, semantics scoped, no ALL_SCOPES).`);

// ---- DRIFT (optional) ----------------------------------------------------
if (!livePath) {
  console.log('  (run with --live <figma-dump.json> to diff against live Figma)');
  process.exit(0);
}
const liveRaw = JSON.parse(fs.readFileSync(livePath, 'utf8'));
const live = liveRaw.snapshot || liveRaw; // accept the raw use_figma dump or a bare snapshot
const norm = (a) => [...a].sort().join(',');
const drift = [];
for (const col of new Set([...collections(snap), ...collections(live)])) {
  const a = snap[col] || {}, b = live[col] || {};
  for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!(name in a)) drift.push(`+ ${col}|${name}: in Figma, missing from snapshot → [${b[name]}]`);
    else if (!(name in b)) drift.push(`- ${col}|${name}: in snapshot, missing from Figma`);
    else if (norm(a[name]) !== norm(b[name])) drift.push(`~ ${col}|${name}: snapshot [${a[name]}] ≠ Figma [${b[name]}]`);
  }
}
if (drift.length) {
  console.error(`\n✗ Scope DRIFT vs live Figma: ${drift.length}`);
  drift.forEach((d) => console.error('  ' + d));
  if (doUpdate) {
    const next = { _doc: snap._doc };
    for (const col of collections(live)) next[col] = live[col];
    fs.writeFileSync(SNAP_PATH, JSON.stringify(next, null, 2) + '\n');
    console.error('\n→ snapshot refreshed from live (--update). Review the diff and commit.');
    process.exit(0);
  }
  process.exit(1);
}
console.log(`✓ Scope drift: none — snapshot matches live Figma.`);
