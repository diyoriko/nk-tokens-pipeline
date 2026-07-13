// Styles gate. Text / effect / paint styles carry real values (font size, shadow
// geometry, gradient stops) that variables can't hold — Tokens Studio recreates them
// on push, but a manual Figma edit afterwards diverges silently: CI, check-scopes and
// the variables drift check all look the other way (PARITY-2, audit 2026-07-13).
//
// This script versions the intended styles in tokens/styles.snapshot.json and enforces them:
//
//   node scripts/check-styles.mjs                # LAWS — validate the snapshot (CI, no Figma needed)
//   node scripts/check-styles.mjs --live FILE    # DRIFT — diff the snapshot against a live Figma dump
//   node scripts/check-styles.mjs --update FILE  # refresh the snapshot from a live dump (also: --live FILE --update)
//
// The live dump is a JSON of the same shape ({ text: [...], effect: [...], paint: [...] }).
// Produce it via figma/dump-styles.figma.js (plugin/MCP — the REST styles API doesn't return
// values on the Pro plan either), then commit the refreshed snapshot. Ritual: figma/RUNBOOK.md §9.
import fs from 'node:fs';

const SNAP_PATH = new URL('../tokens/styles.snapshot.json', import.meta.url);
const TOKENS_PATH = new URL('../tokens/tokens.json', import.meta.url);
const KINDS = ['text', 'effect', 'paint'];

const args = process.argv.slice(2);
const liveIdx = args.indexOf('--live');
const updIdx = args.indexOf('--update');
const doUpdate = updIdx >= 0;
const updArg = doUpdate && args[updIdx + 1] && !args[updIdx + 1].startsWith('--') ? args[updIdx + 1] : null;
const livePath = (liveIdx >= 0 ? args[liveIdx + 1] : null) || updArg || process.env.STYLES_LIVE;

const loadStyles = (p) => {
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  const data = raw.styles || raw; // accept the raw dump or a wrapper
  for (const k of KINDS) if (!Array.isArray(data[k])) { console.error(`✗ ${p instanceof URL ? 'snapshot' : p}: missing/invalid "${k}" array`); process.exit(1); }
  return data;
};

const live = livePath ? loadStyles(livePath) : null;

let snap = null;
let snapDoc;
if (fs.existsSync(SNAP_PATH)) {
  const rawSnap = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
  snapDoc = rawSnap._doc;
  snap = loadStyles(SNAP_PATH);
} else if (!(doUpdate && live)) {
  console.error('✗ tokens/styles.snapshot.json is missing — the styles gate has no baseline.');
  console.error('  Create it via the ritual in figma/RUNBOOK.md §9:');
  console.error('    1. run figma/dump-styles.figma.js in the Figma console / MCP → save the JSON to a file');
  console.error('    2. node scripts/check-styles.mjs --live <dump.json>     # inspect what would be recorded');
  console.error('    3. node scripts/check-styles.mjs --update <dump.json>   # write the snapshot, review, commit');
  process.exit(1);
}

// ---- LAWS (on the snapshot, or on the live dump when bootstrapping) --------
// Expected names come from tokens/tokens.json composites. Style names in Figma are
// the set-relative token path, optionally prefixed with the set name (both accepted
// until the first live dump pins the exact form — the mapping stays 1:1 either way):
//   text   ↔ $type "typography" in set "Typography"  (e.g. Display/Lg)
//   effect ↔ $type "boxShadow"  in set "Effect"      (e.g. Drop-Shadow/100)
//   paint  ↔ gradient color tokens in set "Color"    (e.g. Gradient/Brand-Spark)
const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
const walk = (node, path, hit, out) => {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if (v.$type) { if (hit(v)) out.push([...path, k].join('/')); }
    else walk(v, [...path, k], hit, out);
  }
};
const expected = { text: [], effect: [], paint: [] };
walk(tokens['Typography'] || {}, [], (t) => t.$type === 'typography', expected.text);
walk(tokens['Effect'] || {}, [], (t) => t.$type === 'boxShadow', expected.effect);
walk(tokens['Color'] || {}, [], (t) => t.$type === 'color' && typeof t.$value === 'string' && t.$value.includes('gradient('), expected.paint);
const SET_PREFIX = { text: 'Typography/', effect: 'Effect/', paint: 'Color/' };

const lawData = snap || live;
const violations = [];
for (const kind of KINDS) {
  const seen = new Set();
  const claimed = new Set();
  for (const s of lawData[kind]) {
    if (!s.name) { violations.push(`${kind}: style without a name`); continue; }
    if (seen.has(s.name)) violations.push(`${kind}|${s.name}: duplicate style name`);
    seen.add(s.name);
    const key = s.name.startsWith(SET_PREFIX[kind]) ? s.name.slice(SET_PREFIX[kind].length) : s.name;
    if (!expected[kind].includes(key)) violations.push(`${kind}|${s.name}: no matching ${kind === 'text' ? 'typography' : kind === 'effect' ? 'boxShadow' : 'gradient'} token in tokens.json`);
    else if (claimed.has(key)) violations.push(`${kind}|${s.name}: token ${key} already claimed by another style (not 1:1)`);
    claimed.add(key);
  }
  for (const key of expected[kind]) {
    if (!claimed.has(key)) violations.push(`${kind}: token ${key} has no matching style`);
  }
}

if (violations.length) {
  console.error(`✗ Styles laws: ${violations.length} violation(s):`);
  violations.forEach((v) => console.error('  ✗ ' + v));
  process.exit(1);
}
console.log(`✓ Styles laws: ${lawData.text.length} text / ${lawData.effect.length} effect / ${lawData.paint.length} paint — unique names, 1:1 with tokens.json composites (${expected.text.length} typography / ${expected.effect.length} boxShadow / ${expected.paint.length} gradient).`);

// ---- DRIFT (optional) ------------------------------------------------------
if (!live) {
  console.log('  (run with --live <figma-dump.json> to diff against live Figma)');
  process.exit(0);
}

const writeSnapshot = () => {
  const next = {
    _doc: snapDoc || 'Source-of-truth snapshot of Figma local styles (text / effect / paint) with their values. Style values live only in Figma — Tokens Studio recreates styles on push but nothing re-checks them after a manual edit — so this file versions them and lets check-styles.mjs (a) lint the laws in CI and (b) diff against a live Figma dump from figma/dump-styles.figma.js. See figma/RUNBOOK.md §9.',
  };
  const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  for (const k of KINDS) next[k] = [...live[k]].sort(byName);
  fs.writeFileSync(SNAP_PATH, JSON.stringify(next, null, 2) + '\n');
};

if (!snap) {
  writeSnapshot();
  console.log(`→ tokens/styles.snapshot.json created from live dump (--update). Review and commit.`);
  process.exit(0);
}

// Field-by-field diff, keyed by style name within each kind.
const flat = (v, p, out) => {
  if (v === null || typeof v !== 'object') { out[p] = JSON.stringify(v); return out; }
  for (const [k, w] of Object.entries(v)) flat(w, p ? `${p}.${k}` : k, out);
  return out;
};
const drift = [];
for (const kind of KINDS) {
  const a = Object.fromEntries(snap[kind].map((s) => [s.name, s]));
  const b = Object.fromEntries(live[kind].map((s) => [s.name, s]));
  for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!(name in a)) { drift.push(`+ ${kind}|${name}: in Figma, missing from snapshot`); continue; }
    if (!(name in b)) { drift.push(`- ${kind}|${name}: in snapshot, missing from Figma`); continue; }
    const fa = flat(a[name], '', {});
    const fb = flat(b[name], '', {});
    for (const f of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
      if (fa[f] !== fb[f]) drift.push(`~ ${kind}|${name}: ${f} ${fa[f] ?? '(absent)'} -> ${fb[f] ?? '(absent)'}`);
    }
  }
}
if (drift.length) {
  console.error(`\n✗ Style DRIFT vs live Figma: ${drift.length}`);
  drift.forEach((d) => console.error('  ' + d));
  if (doUpdate) {
    writeSnapshot();
    console.error('\n→ snapshot refreshed from live (--update). Review the diff and commit.');
    process.exit(0);
  }
  process.exit(1);
}
console.log(`✓ Style drift: none — snapshot matches live Figma.`);
