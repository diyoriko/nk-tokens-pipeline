import { tokens } from '../build/ts/tokens.ts';
import { cssVar, FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Sizing' };

const isNum = (v) => typeof v === 'string';
const bar = (varName, label, px, val) => {
  const w = Math.max(0, Math.abs(parseFloat(px)));
  return `<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
    <code style="width:240px;color:${MUTED};font-size:12px">var(${varName})</code>
    <div style="height:16px;width:${Math.min(w, 520)}px;background:var(--nk-color-background-brand-violet-primary);border-radius:2px"></div>
    <span style="color:${MUTED};font-variant-numeric:tabular-nums;font-size:12px">${val}</span>
  </div>`;
};
const h2 = (t, sub) => `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};margin:26px 0 8px">${t}${sub ? ` <span style="text-transform:none;letter-spacing:0;font-weight:400">— ${sub}</span>` : ''}</h2>`;
const wrap = (inner) => { const d = document.createElement('div'); d.style.cssText = `padding:24px 28px;font-family:${FONT}`; d.innerHTML = inner; return d; };

export const Space = () => {
  const sp = tokens.size.space;
  // primitives: numeric leaf keys
  const prims = Object.keys(sp).filter((k) => isNum(sp[k])).sort((a, b) => parseFloat(sp[a]) - parseFloat(sp[b]));
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Spacing</h1>' +
    `<p style="color:${MUTED};margin:0;font-size:12px">Primitives (sequential scale) + semantic groups (component / section / negative).</p>`;
  html += h2('primitives', '0 → 160px');
  html += prims.map((k) => bar(cssVar(['size', 'space', k]), k, sp[k], sp[k])).join('');
  // semantic: component
  if (sp.component) {
    html += h2('component (semantic)', 'padding inside components');
    html += Object.keys(sp.component).map((k) => bar(cssVar(['size', 'space', 'component', k]), k, sp.component[k], `${k} = ${sp.component[k]}`)).join('');
  }
  if (sp.section) {
    html += h2('section (semantic)', 'layout / page sections');
    html += Object.keys(sp.section).map((k) => bar(cssVar(['size', 'space', 'section', k]), k, sp.section[k], `${k} = ${sp.section[k]}`)).join('');
  }
  if (sp.negative) {
    html += h2('negative', 'pull / overlap');
    html += Object.keys(sp.negative).sort((a, b) => parseFloat(sp.negative[b]) - parseFloat(sp.negative[a])).map((k) => bar(cssVar(['size', 'space', 'negative', k]), k, sp.negative[k], sp.negative[k])).join('');
  }
  return wrap(html);
};

export const Radius = () => {
  const r = tokens.size.radius;
  let html = '<h1 style="font-size:20px;margin:0 0 14px">Radius</h1><div style="display:flex;gap:24px;flex-wrap:wrap">';
  for (const name of Object.keys(r).sort((a, b) => parseFloat(r[a]) - parseFloat(r[b]))) {
    html += `<div style="text-align:center;font-size:12px">
      <div style="width:96px;height:96px;background:var(--nk-color-background-brand-violet-secondary);border:1px solid ${BORDER};border-radius:var(${cssVar(['size', 'radius', name])})"></div>
      <div style="margin-top:8px;font-weight:700">radius/${name}</div>
      <div style="color:${MUTED}">${r[name]}</div></div>`;
  }
  return wrap(html + '</div>');
};

export const IconSizes = () => {
  const ic = tokens.size.icon || {};
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Icon sizes</h1>' +
    `<p style="color:${MUTED};margin:0 0 14px;font-size:12px">Icon box sizes — the rendered icon fills this square.</p>` +
    '<div style="display:flex;gap:32px;align-items:flex-end;flex-wrap:wrap">';
  for (const k of Object.keys(ic).sort((a, b) => parseFloat(ic[a]) - parseFloat(ic[b]))) {
    html += `<div style="text-align:center;font-size:12px">
      <div style="display:flex;align-items:flex-end;justify-content:center;height:40px"><div style="width:${ic[k]};height:${ic[k]};background:var(--nk-color-background-brand-violet-primary);border-radius:4px"></div></div>
      <div style="margin-top:8px;font-weight:700">icon/${k}</div><div style="color:${MUTED}">${ic[k]}</div></div>`;
  }
  return wrap(html + '</div>');
};

export const Stroke = () => {
  const st = tokens.size.stroke || {};
  let html = '<h1 style="font-size:20px;margin:0 0 14px">Stroke</h1>';
  for (const k of Object.keys(st)) html += bar(cssVar(['size', 'stroke', k]), k, st[k], `stroke/${k} = ${st[k]}`);
  return wrap(html);
};

export const Blur = () => {
  const bl = tokens.size.blur || {};
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Blur radii</h1>' +
    `<p style="color:${MUTED};margin:0 0 14px;font-size:12px">Layer-blur radii (icon/image blur — distinct from backdrop blur).</p>` +
    '<div style="display:flex;gap:20px;flex-wrap:wrap">';
  for (const k of Object.keys(bl).sort((a, b) => parseFloat(bl[a]) - parseFloat(bl[b]))) {
    html += `<div style="text-align:center;font-size:12px">
      <div style="width:96px;height:96px;border-radius:12px;background:linear-gradient(135deg,#6d46fc,#c76ef2);filter:blur(var(${cssVar(['size', 'blur', k])}))"></div>
      <div style="margin-top:8px;font-weight:700">blur/${k}</div><div style="color:${MUTED}">${bl[k]}</div></div>`;
  }
  return wrap(html + '</div>');
};

export const Depth = () => {
  const dp = tokens.size.depth || {};
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Depth</h1>' +
    `<p style="color:${MUTED};margin:0 0 14px;font-size:12px">Elevation / translate offsets — positive lifts, negative insets.</p>`;
  for (const k of Object.keys(dp).sort((a, b) => parseFloat(dp[a]) - parseFloat(dp[b]))) html += bar(cssVar(['size', 'depth', k]), k, dp[k], `depth/${k} = ${dp[k]}`);
  return wrap(html);
};

export const Focus = () => {
  const fc = tokens.size.focus || {};
  let html = '<h1 style="font-size:20px;margin:0 0 14px">Focus ring</h1>' +
    `<div style="padding:8px 0 20px"><button style="font:inherit;font-size:13px;padding:8px 16px;border-radius:8px;border:1px solid ${BORDER};background:#fff;outline:var(--nk-size-focus-ring,2px) solid var(--nk-color-border-focus-default,#572bd7);outline-offset:var(--nk-size-focus-offset,2px)">Focused control</button></div>`;
  for (const k of Object.keys(fc)) html += bar(cssVar(['size', 'focus', k]), k, fc[k], `focus/${k} = ${fc[k]}`);
  return wrap(html);
};
