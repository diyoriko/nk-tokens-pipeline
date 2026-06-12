// Token lint — fails the build if tokens.json is structurally broken.
// Threat model: hand edits in the Tokens Studio UI (the convenient editing
// path) can silently produce values the pipeline mis-builds — a bare number
// in a composite lineHeight becomes 1.4px instead of 140%, a typo'd alias
// stops resolving, a renamed group gets a trailing space. This gate turns
// each of those into a red CI check minutes after the TS push, before
// anything is promoted to main.
//
// Scope: tokens/tokens.json only (the file TS pushes). code-only.json is
// hand-maintained in the repo and reviewed by PR. Run by `npm run lint:tokens`
// (and at the head of build:tokens, so every CI build and prepack is gated).
import fs from 'node:fs';

const SRC = new URL('../tokens/tokens.json', import.meta.url);
const tokens = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const KNOWN_SETS = ['Color Primitives', 'Color', 'Size', 'Typography Primitives', 'Typography', 'Effect'];
const SET_DOMAIN = {
  'Color Primitives': 'color', Color: 'color', Size: 'size',
  'Typography Primitives': 'typography', Typography: 'typography', Effect: 'effect',
};
// Primitives document themselves through their scale; descriptions are required
// where designers actually pick tokens (and where we promise 100% coverage).
const REQUIRED_DESC_SETS = ['Color', 'Size', 'Typography', 'Effect'];
const KNOWN_TYPES = ['color', 'dimension', 'number', 'fontFamily', 'fontWeight', 'typography', 'boxShadow'];

const errors = [];
const err = (path, msg) => errors.push(`${path}  —  ${msg}`);

// ---- mirror build-tokens.mjs reference resolution ------------------------
// rootDomain: top-level GROUP name -> domain; merged: one tree per domain.
const deepMerge = (a, b) => {
  const out = { ...a };
  for (const k of Object.keys(b))
    out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object'
      ? deepMerge(a[k], b[k]) : b[k];
  return out;
};
const rootDomain = {};
const merged = {};
for (const s of KNOWN_SETS) {
  if (!tokens[s]) continue;
  const dom = SET_DOMAIN[s];
  for (const rk of Object.keys(tokens[s])) if (!rk.startsWith('$')) rootDomain[rk] = dom;
  merged[dom] = deepMerge(merged[dom] ?? {}, tokens[s]);
}
const REF_RE = /^\{([^}]+)\}$/;
const resolve = (val, depth = 0) => {
  const m = REF_RE.exec(String(val));
  if (!m) return { value: val, ok: true };
  if (depth > 4) return { value: val, ok: false, why: `reference chain deeper than 4: {${m[1]}}` };
  const segs = m[1].split('.');
  let n = merged[rootDomain[segs[0]]];
  for (const seg of segs) n = n?.[seg];
  if (!n || n.$value === undefined) return { value: val, ok: false, why: `unresolved reference {${m[1]}}` };
  return resolve(n.$value, depth + 1);
};

// ---- value-format checks --------------------------------------------------
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGBA_RE = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/i;
const PCT_RE = /^\d+(\.\d+)?%$/;
const GRADIENT_RE = /^linear-gradient\(\s*\d+(\.\d+)?deg\s*(,\s*(\{[^}]+\}|#[0-9a-f]{6,8})\s+\d+(\.\d+)?%\s*)+\)$/i;

const isNum = (v) => typeof v === 'number' ? Number.isFinite(v) : (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)));

const checkColor = (path, raw) => {
  if (typeof raw === 'string' && raw.startsWith('linear-gradient')) {
    if (!GRADIENT_RE.test(raw)) return err(path, `gradient does not parse: "${raw}"`);
    for (const m of raw.matchAll(/\{[^}]+\}/g)) {
      const r = resolve(m[0]);
      if (!r.ok) return err(path, r.why);
      if (!HEX_RE.test(String(r.value))) return err(path, `gradient stop ${m[0]} resolves to non-colour "${r.value}"`);
    }
    return;
  }
  const r = resolve(raw);
  if (!r.ok) return err(path, r.why);
  const v = String(r.value);
  if (!HEX_RE.test(v) && !RGBA_RE.test(v)) err(path, `not a colour: "${v}"`);
};

const checkNumeric = (path, raw, label = 'value') => {
  const r = resolve(raw);
  if (!r.ok) return err(path, r.why);
  if (!isNum(r.value)) err(path, `${label} is not numeric: "${r.value}"`);
};

const checkTypography = (path, v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return err(path, 'typography $value must be an object');
  for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight'])
    if (v[k] === undefined) err(path, `composite missing "${k}"`);
  for (const k of Object.keys(v))
    if (!['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textCase', 'textDecoration', 'paragraphSpacing'].includes(k))
      err(path, `composite has unknown key "${k}"`);
  if (v.fontFamily !== undefined) {
    const r = resolve(v.fontFamily);
    if (!r.ok) err(path, r.why);
    else if (typeof r.value !== 'string' || !r.value.trim()) err(path, `fontFamily resolves to "${r.value}"`);
  }
  if (v.fontSize !== undefined) checkNumeric(path, v.fontSize, 'fontSize');
  if (v.fontWeight !== undefined) {
    const r = resolve(v.fontWeight);
    if (!r.ok) err(path, r.why);
    else if (![400, 700].includes(Number(r.value))) err(path, `fontWeight must resolve to 400 or 700, got "${r.value}"`);
  }
  if (v.lineHeight !== undefined) {
    // THE px-bug shield: Tokens Studio treats a bare number as PIXELS when it
    // builds Figma text styles. Line-height must stay a percent literal.
    const r = resolve(v.lineHeight);
    if (!r.ok) err(path, r.why);
    else if (!PCT_RE.test(String(r.value))) err(path, `lineHeight must be a percent string like "140%", got "${r.value}" (a bare number becomes PIXELS in Figma)`);
  }
  if (v.letterSpacing !== undefined) {
    const r = resolve(v.letterSpacing);
    if (!r.ok) err(path, r.why);
    else if (!isNum(r.value) && !/^-?\d+(\.\d+)?(px|%)$/.test(String(r.value))) err(path, `letterSpacing must be a number, px or percent, got "${r.value}"`);
  }
};

const checkShadow = (path, v) => {
  const layers = Array.isArray(v) ? v : [v];
  for (const [i, l] of layers.entries()) {
    const at = layers.length > 1 ? `${path}[${i}]` : path;
    if (!l || typeof l !== 'object') { err(at, 'shadow layer must be an object'); continue; }
    for (const k of ['x', 'y', 'blur', 'spread', 'color'])
      if (l[k] === undefined) err(at, `shadow layer missing "${k}"`);
    for (const k of ['x', 'y', 'blur', 'spread']) if (l[k] !== undefined) checkNumeric(at, l[k], k);
    if (l.color !== undefined) checkColor(at, l.color);
    if (l.type !== undefined && !['dropShadow', 'innerShadow'].includes(l.type)) err(at, `shadow type "${l.type}"`);
  }
};

// ---- walk -----------------------------------------------------------------
let leaves = 0;
const SEG_RE = /^[^{}.$/]+$/; // dots split refs, slashes split Figma paths, $ marks meta
const walk = (node, path, set) => {
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;
    if (key !== key.trim()) err(`${path}/${key}`, 'name has leading/trailing whitespace');
    else if (!SEG_RE.test(key)) err(`${path}/${key}`, 'name contains { } . $ or / — breaks references or Figma grouping');
    const child = node[key];
    const p = `${path}/${key}`;
    if (!child || typeof child !== 'object') { err(p, 'group must be an object'); continue; }
    if (child.$value === undefined) { walk(child, p, set); continue; }
    leaves++;
    const type = child.$type;
    if (!KNOWN_TYPES.includes(type)) { err(p, `unknown $type "${type}"`); continue; }
    if (REQUIRED_DESC_SETS.includes(set) && !String(child.$description ?? '').trim())
      err(p, 'missing $description (semantic tokens are documented 100%)');
    if (type === 'color') checkColor(p, child.$value);
    else if (type === 'dimension' || type === 'number') {
      checkNumeric(p, child.$value);
      if (set === 'Effect' && p.includes('/Opacity/')) {
        const n = Number(resolve(child.$value).value);
        if (n < 0 || n > 100) err(p, `opacity is stored as PERCENT (0–100), got ${n}`);
      }
    }
    else if (type === 'fontFamily') { if (typeof child.$value !== 'string' || !child.$value.trim()) err(p, 'fontFamily must be a string'); }
    else if (type === 'fontWeight') { if (![400, 700].includes(Number(resolve(child.$value).value))) err(p, 'fontWeight must be 400 or 700'); }
    else if (type === 'typography') checkTypography(p, child.$value);
    else if (type === 'boxShadow') checkShadow(p, child.$value);
  }
};

for (const set of Object.keys(tokens)) {
  if (set.startsWith('$')) continue;
  if (!KNOWN_SETS.includes(set)) { err(set, `unknown token set — pipeline only builds: ${KNOWN_SETS.join(', ')}`); continue; }
  walk(tokens[set], set, set);
}

// ---- $themes / $metadata sanity (TS corrupts these on bad exports) --------
if (tokens.$metadata?.tokenSetOrder)
  for (const s of tokens.$metadata.tokenSetOrder)
    if (!tokens[s]) err('$metadata', `tokenSetOrder lists missing set "${s}"`);
if (Array.isArray(tokens.$themes))
  for (const t of tokens.$themes)
    for (const [s, status] of Object.entries(t.selectedTokenSets ?? {})) {
      if (!tokens[s]) err(`$themes/${t.name}`, `references missing set "${s}"`);
      if (!['enabled', 'source', 'disabled'].includes(status)) err(`$themes/${t.name}`, `set "${s}" has invalid status "${status}"`);
    }

if (errors.length) {
  console.error(`✗ Token lint: ${errors.length} problem${errors.length > 1 ? 's' : ''} in tokens/tokens.json\n`);
  for (const e of errors) console.error('  ' + e);
  console.error('\nFix in Tokens Studio (or tokens.json) and push again — nothing was built.');
  process.exit(1);
}
console.log(`✓ Token lint: ${leaves} tokens pass (structure, references, formats, descriptions).`);
