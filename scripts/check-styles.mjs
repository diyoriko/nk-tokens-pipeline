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
const walk = (node, path, hit, out, map) => {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if (v.$type) { if (hit(v)) { const key = [...path, k].join('/'); out.push(key); if (map) map[key] = v.$value; } }
    else walk(v, [...path, k], hit, out, map);
  }
};
const expected = { text: [], effect: [], paint: [] };
const expectedTok = { text: {}, effect: {}, paint: {} };
walk(tokens['Typography'] || {}, [], (t) => t.$type === 'typography', expected.text, expectedTok.text);
walk(tokens['Effect'] || {}, [], (t) => t.$type === 'boxShadow', expected.effect, expectedTok.effect);
walk(tokens['Color'] || {}, [], (t) => t.$type === 'color' && typeof t.$value === 'string' && t.$value.includes('gradient('), expected.paint, expectedTok.paint);
const SET_PREFIX = { text: 'Typography/', effect: 'Effect/', paint: 'Color/' };

// ---- reference resolver over tokens.json (mirror of lint-tokens/build) -----
// Composite $values hold refs ({Size.60}, {Black.160}); comparing them against
// snapshot literals needs the same set→domain merge the build performs.
const SET_DOMAIN = {
  'Color Primitives': 'color', Color: 'color', Size: 'size',
  'Typography Primitives': 'typography', Typography: 'typography', Effect: 'effect',
  'Parent Area': 'color', // base brand overlay — part of the default build
};
const isGroup = (v) => v && typeof v === 'object' && v.$value === undefined;
const deepMerge = (a, b) => {
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = isGroup(out[k]) && isGroup(b[k]) ? deepMerge(out[k], b[k]) : b[k];
  return out;
};
const rootDomain = {};
const mergedDom = {};
for (const [s, dom] of Object.entries(SET_DOMAIN)) {
  if (!tokens[s]) continue;
  for (const rk of Object.keys(tokens[s])) if (!rk.startsWith('$')) rootDomain[rk] = dom;
  mergedDom[dom] = deepMerge(mergedDom[dom] ?? {}, tokens[s]);
}
const resolveVal = (val, depth = 0) => {
  const m = /^\{([^}]+)\}$/.exec(String(val));
  if (!m || depth > 4) return val;
  const segs = m[1].split('.');
  let n = mergedDom[rootDomain[segs[0]]];
  for (const seg of segs) n = n?.[seg];
  return n && n.$value !== undefined ? resolveVal(n.$value, depth + 1) : val;
};

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

// ---- VALUES: snapshot ↔ tokens.json composites -----------------------------
// The names law proves the 1:1 mapping; this pass proves the VALUES agree, so a
// TS push that changes a composite can never leave the committed baseline
// silently stale with CI green (the PARITY-2 failure mode this gate exists for).
// Both files live in the repo — no Figma access needed. The --live drift check
// below still guards Figma-side manual edits.
const num = (v) => Number.parseFloat(String(resolveVal(v)));
const hex8 = (v) => {
  let h = String(v).replace('#', '').toUpperCase();
  if (h.length === 6) h += 'FF';
  return '#' + h;
};
const WEIGHT_STYLE = { 400: ['Regular'], 700: ['Bold'] }; // Mikado ships 2 weights, no italics
const cmpText = (s, tv) => {
  const out = [];
  const fam = String(resolveVal(tv.fontFamily));
  if (s.fontFamily !== fam) out.push(`fontFamily "${s.fontFamily}" ≠ token "${fam}"`);
  const w = Number(resolveVal(tv.fontWeight));
  if (!(WEIGHT_STYLE[w] ?? []).includes(s.fontStyle)) out.push(`fontStyle "${s.fontStyle}" ≠ token weight ${w} (expected ${(WEIGHT_STYLE[w] ?? ['?']).join('/')})`);
  if (num(tv.fontSize) !== s.fontSize) out.push(`fontSize ${s.fontSize} ≠ token ${num(tv.fontSize)}`);
  const lh = s.lineHeight ?? {};
  if (lh.unit !== 'PERCENT' || Number.parseFloat(String(resolveVal(tv.lineHeight))) !== lh.value)
    out.push(`lineHeight ${JSON.stringify(lh)} ≠ token "${resolveVal(tv.lineHeight)}"`);
  const ls = s.letterSpacing ?? { unit: 'PIXELS', value: 0 };
  if (ls.unit !== 'PIXELS' || num(tv.letterSpacing ?? '0') !== ls.value)
    out.push(`letterSpacing ${JSON.stringify(ls)} ≠ token ${num(tv.letterSpacing ?? '0')}px`);
  return out;
};
const EFFECT_TYPE = { dropShadow: 'DROP_SHADOW', innerShadow: 'INNER_SHADOW' };
const cmpEffect = (s, tv) => {
  const layers = Array.isArray(tv) ? tv : [tv];
  const effs = s.effects ?? [];
  if (layers.length !== effs.length) return [`effect layer count ${effs.length} ≠ token ${layers.length}`];
  const out = [];
  // Layer ORDER is not a shared contract — Figma's effects array and the token's
  // CSS emission order can legitimately differ (they do today for 200–500) — so
  // layers are matched as a multiset on their full value signature.
  const sig = (t, x, y, r, sp, c) => `type=${t} x=${x} y=${y} radius=${r} spread=${sp} color=${c}`;
  const tokenSigs = layers.map((l) => sig(EFFECT_TYPE[l.type] ?? 'DROP_SHADOW', num(l.x), num(l.y), num(l.blur), num(l.spread), hex8(resolveVal(l.color))));
  for (const e of effs) {
    if (e.visible === false) out.push(`effect layer hidden in Figma (visible:false) but present in the token`);
    const es = sig(e.type, e.offset?.x, e.offset?.y, e.radius, e.spread ?? 0, hex8(e.color));
    const i = tokenSigs.indexOf(es);
    if (i === -1) out.push(`no token layer matches Figma effect { ${es} }`);
    else tokenSigs.splice(i, 1);
  }
  for (const rest of tokenSigs) out.push(`no Figma effect matches token layer { ${rest} }`);
  return out;
};
const cmpPaint = (s, tv) => {
  const out = [];
  const paints = s.paints ?? [];
  if (paints.length !== 1) return [`expected exactly 1 gradient paint, snapshot has ${paints.length}`];
  const p = paints[0];
  if (p.opacity !== undefined && p.opacity !== 1) out.push(`paint opacity ${p.opacity} — gradient tokens cannot encode paint-level opacity`);
  const stops = [...String(tv).matchAll(/(\{[^}]+\}|#[0-9a-fA-F]{6,8})\s+(\d+(?:\.\d+)?)%/g)]
    .map((m) => ({ color: hex8(resolveVal(m[1])), position: Number(m[2]) / 100 }));
  const fstops = p.gradientStops ?? [];
  if (stops.length !== fstops.length) return [`gradient stop count ${fstops.length} ≠ token ${stops.length}`];
  stops.forEach((st, i) => {
    const f = fstops[i];
    if (Math.abs((f.position ?? -1) - st.position) > 0.005) out.push(`stop[${i}] position ${f.position} ≠ token ${st.position}`);
    if (hex8(f.color) !== st.color) out.push(`stop[${i}] color ${f.color} ≠ token ${st.color}`);
  });
  // gradient ANGLE (gradientTransform matrix) is intentionally not compared —
  // deg ↔ matrix needs Figma-side transform math; the --live drift diff catches it.
  return out;
};
const CMP = { text: cmpText, effect: cmpEffect, paint: cmpPaint };
for (const kind of KINDS) {
  for (const s of lawData[kind]) {
    if (!s.name) continue;
    const key = s.name.startsWith(SET_PREFIX[kind]) ? s.name.slice(SET_PREFIX[kind].length) : s.name;
    const tv = expectedTok[kind][key];
    if (tv === undefined) continue; // the names law above already flagged it
    for (const d of CMP[kind](s, tv)) violations.push(`${kind}|${s.name}: ${d}`);
  }
}

if (violations.length) {
  console.error(`✗ Styles laws: ${violations.length} violation(s):`);
  violations.forEach((v) => console.error('  ✗ ' + v));
  process.exit(1);
}
console.log(`✓ Styles laws: ${lawData.text.length} text / ${lawData.effect.length} effect / ${lawData.paint.length} paint — unique names, 1:1 with tokens.json composites AND values in agreement (${expected.text.length} typography / ${expected.effect.length} boxShadow / ${expected.paint.length} gradient).`);

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
