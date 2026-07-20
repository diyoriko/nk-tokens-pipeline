import { cssVar, FONT, MUTED, BORDER } from './_helpers.js';
import { tokens } from '../build/ts/tokens.ts';
import raw from '../tokens/tokens.json';
import rampLabels from './ramp-labels.json';

export default { title: 'Tokens/Colors' };

// Semantic surfaces (own render below) and reserved groups that have their own
// story or render path. Everything else under tokens.color is a primitive ramp
// and is DERIVED — so a hue added in Tokens Studio can't silently vanish from
// this catalogue the way a hardcoded list would (the drift #112 set out to kill).
const SURFACES = ['background', 'text', 'icon', 'border'];
const RESERVED = ['data-viz', 'social', 'gradient', 'alpha']; // data-viz→DataViz story, gradient→Gradients story, alpha→below
const SOLID_RAMPS = Object.keys(tokens.color).filter((k) => !SURFACES.includes(k) && !RESERVED.includes(k));
// alpha ramps carry real transparency → show them on a checkerboard.
const ALPHA_KEYS = ['white', 'black'].filter((k) => tokens.color.alpha?.[k]);
const CHECKER =
  'background-color:#fff;background-image:linear-gradient(45deg,#dcdce0 25%,transparent 25%),linear-gradient(-45deg,#dcdce0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#dcdce0 75%),linear-gradient(-45deg,transparent 75%,#dcdce0 75%);background-size:12px 12px;background-position:0 0,0 6px,6px -6px,-6px 0';

const card = (label, varName, value, checker, ref) => `
  <div style="width:104px">
    <div style="height:56px;border-radius:8px;border:1px solid ${BORDER};overflow:hidden;${checker ? CHECKER : ''}">
      <div style="height:100%;background:var(${varName})"></div>
    </div>
    <div style="font-size:11px;font-weight:600;margin-top:6px;word-break:break-word">${label}</div>
    ${ref ? `<div style="font-size:10px;color:#7a5bf0;font-family:ui-monospace,monospace">→ ${ref}</div>` : ''}
    <div style="font-size:10px;color:${MUTED};font-variant-numeric:tabular-nums">${value}</div>
  </div>`;

const wrap = (inner) => {
  const d = document.createElement('div');
  d.style.cssText = `padding:24px 28px;font-family:${FONT};max-width:1280px`;
  d.innerHTML = inner;
  return d;
};
const h2 = (t) => `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};margin:26px 0 6px">${t}</h2>`;
const grid = (cards) => `<div style="display:flex;flex-wrap:wrap;gap:14px">${cards}</div>`;

// ---- PRIMITIVES (one row per hue — every step fits) ---------------------
const pcell = (label, varName, value, checker, legacy) => `
  <div style="min-width:0">
    <div style="height:48px;border-radius:7px;border:1px solid ${BORDER};overflow:hidden;${checker ? CHECKER : ''}">
      <div style="height:100%;background:var(${varName})"></div>
    </div>
    <div style="font-size:9.5px;font-weight:600;margin-top:5px;white-space:nowrap">${label}</div>
    <div style="font-size:9px;color:${MUTED};font-variant-numeric:tabular-nums">${value}</div>
    ${legacy ? `<div style="font-size:8.5px;color:#9a8;font-style:italic;white-space:nowrap" title="legacy LDS/Brand name">${legacy}</div>` : ''}
  </div>`;
// name = display label ("violet" or "alpha/white"); its slash-split segments are
// also the token path under color/ (so cssVar resolves --nk-color-alpha-white-100).
const ramp = (name, steps, checker) => {
  const keys = Object.keys(steps);
  if (!keys.length) return '';
  const seg = name.split('/');
  const labels = rampLabels[name] || {};
  return h2(name) +
    `<div style="display:grid;grid-template-columns:repeat(${keys.length},1fr);gap:8px">` +
    keys.map((s) => pcell(`${name}/${s}`, cssVar(['color', ...seg, s]), steps[s], checker, labels[s])).join('') +
    `</div>`;
};
export const Primitives = () => {
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Colour primitives</h1>' +
    `<p style="color:${MUTED};margin:0;font-size:12px">Raw ramps — never used directly. Semantic tokens alias these. <b>${SOLID_RAMPS.length} ramps</b>, derived from the build.</p>`;
  for (const hue of SOLID_RAMPS) html += ramp(hue, tokens.color[hue] || {}, /^(white|black)$/.test(hue));
  // alpha aliases (tokens.color.alpha.{white,black}) — the transparent overlay ramps.
  if (ALPHA_KEYS.length) {
    html += '<h1 style="font-size:20px;margin:34px 0 4px">Alpha</h1>' +
      `<p style="color:${MUTED};margin:0;font-size:12px">Transparent overlay ramps (on a checkerboard). Alias <code>color/white</code> · <code>color/black</code> at each opacity.</p>`;
    for (const a of ALPHA_KEYS) html += ramp(`alpha/${a}`, tokens.color.alpha[a] || {}, true);
  }
  return wrap(html);
};

// ---- SEMANTIC (with primitive reference) --------------------------------
// tokens.json carries Figma-facing Capitalized names ("Color" / "Background/Brand-Violet");
// normalise keys to lowercase so story lookups stay case-stable.
const lcDeep = (o) => {
  if (!o || typeof o !== 'object' || Array.isArray(o) || '$value' in o) return o;
  const r = {};
  for (const k of Object.keys(o)) r[k.toLowerCase()] = lcDeep(o[k]);
  return r;
};
const rawColor = lcDeep(raw['Color'] ?? raw.color ?? {});
const refOf = (surface, intent, variant) => {
  const node = rawColor[surface] && rawColor[surface][intent] && rawColor[surface][intent][variant];
  const v = node && node.$value;
  if (typeof v !== 'string') return null;
  const m = /^\{([^}]+)\}$/.exec(v);
  return m ? m[1].replace('.', '/') : null; // {coral.500} -> coral/500
};

export const Semantic = () => {
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Semantic colour</h1>' +
    `<p style="color:${MUTED};margin:0;font-size:12px">Each token shows its <b style="color:#7a5bf0">→ primitive reference</b> and the resolved hex.</p>`;
  for (const surface of SURFACES) {
    const intents = tokens.color[surface] || {};
    html += `<h2 style="font-size:15px;margin:30px 0 4px;text-transform:capitalize">${surface}</h2>`;
    for (const intent of Object.keys(intents)) {
      const variants = intents[intent];
      if (variants == null || typeof variants !== 'object') continue;
      const checker = /overlay|scrim/.test(intent);
      const cards = Object.keys(variants).map((variant) =>
        card(`${intent}/${variant}`, cssVar(['color', surface, intent, variant]), variants[variant], checker, refOf(surface, intent, variant))
      ).join('');
      html += `<div style="margin:8px 0"><div style="font-size:11px;font-weight:700;color:#333;margin-bottom:6px">${intent}</div>${grid(cards)}</div>`;
    }
  }
  return wrap(html);
};

// ---- DATA-VIZ (categorical chart palette) -------------------------------
export const DataViz = () => {
  const dv = tokens.color['data-viz'] || {};
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Data-Viz</h1>' +
    `<p style="color:${MUTED};margin:0 0 16px;font-size:12px">Categorical chart palette — 8 distinct series hues (each aliases a brand/grey primitive at /500).</p>`;
  const cards = Object.keys(dv).map((k) => card(`data-viz/${k}`, cssVar(['color', 'data-viz', k]), dv[k], false, null)).join('');
  return wrap(html + grid(cards));
};
