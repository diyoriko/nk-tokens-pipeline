import { cssVar, FONT, MUTED, BORDER } from './_helpers.js';
import raw from '../tokens/tokens.json';

export default { title: 'Tokens/Brand' };

const wrap = (inner) => { const d = document.createElement('div'); d.style.cssText = `padding:24px 28px;font-family:${FONT}`; d.innerHTML = inner; return d; };
const kebab = (s) => s.toLowerCase();

export const Gradients = () => {
  const g = raw.Color?.Gradient ?? {};
  const names = Object.keys(g).filter((k) => !k.startsWith('$'));
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Brand gradients</h1>' +
    `<p style="color:${MUTED};margin:0 0 18px;font-size:12px">10 gradients built only from primitive ramp stops. In code: <code>var(--nk-color-gradient-*)</code>. In Figma: <code>Gradient/*</code> paint styles.</p>` +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px">';
  for (const name of names) {
    const v = cssVar(['color', 'gradient', kebab(name)]);
    const desc = (g[name].$description || '').split(' - ')[1]?.split('.')[0] || '';
    html += `<div>
      <div style="height:130px;border-radius:16px;border:1px solid ${BORDER};background:var(${v})"></div>
      <div style="margin-top:8px;font-weight:700;font-size:13px">${name}</div>
      <code style="color:${MUTED};font-size:11px">var(${v})</code>
      ${desc ? `<div style="color:${MUTED};font-size:11px;margin-top:2px">${desc}</div>` : ''}
    </div>`;
  }
  return wrap(html + '</div>');
};

export const Social = () => {
  const s = raw.Color?.Social ?? {};
  const names = Object.keys(s).filter((k) => !k.startsWith('$'));
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Social / messenger colours</h1>' +
    `<p style="color:${MUTED};margin:0 0 18px;font-size:12px">Vendor brand constants for share / login buttons — white foreground. Exempt from ramps & the contrast contract.</p>` +
    '<div style="display:flex;gap:24px;flex-wrap:wrap">';
  for (const name of names) {
    const v = cssVar(['color', 'social', name.toLowerCase()]);
    html += `<div style="text-align:center;font-size:12px">
      <div style="width:96px;height:96px;border-radius:16px;border:1px solid ${BORDER};background:var(${v});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">${name}</div>
      <code style="color:${MUTED};font-size:11px;display:block;margin-top:8px">${s[name].$value}</code></div>`;
  }
  return wrap(html + '</div>');
};
