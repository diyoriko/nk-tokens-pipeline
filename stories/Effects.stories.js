import { cssVar, FONT, MUTED, BORDER } from './_helpers.js';
import raw from '../tokens/tokens.json';

export default { title: 'Tokens/Effects' };

const wrap = (inner) => { const d = document.createElement('div'); d.style.cssText = `padding:24px 28px;font-family:${FONT}`; d.innerHTML = inner; return d; };

export const Opacity = () => {
  const op = raw.Effect?.Opacity ?? {};
  const keys = Object.keys(op).filter((k) => !k.startsWith('$'));
  const roles = keys.filter((k) => !/^\d+$/.test(k));            // Disabled / Muted
  const scale = keys.filter((k) => /^\d+$/.test(k)).sort((a, b) => +a - +b); // 0..100
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Opacity</h1>' +
    `<p style="color:${MUTED};margin:0 0 16px;font-size:12px">Stored as percent for the Figma binding; the build divides by 100 (<code>--nk-effect-opacity-50: 0.5</code>). Reach for the roles first; promote a repeated scale step to a role.</p>`;
  html += `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};margin:18px 0 8px">roles</h2><div style="display:flex;gap:20px">`;
  for (const k of roles) {
    const v = cssVar(['effect', 'opacity', k.toLowerCase()]);
    html += `<div style="text-align:center;font-size:12px">
      <div style="width:80px;height:80px;border-radius:12px;border:1px solid ${BORDER};background:var(--nk-color-background-brand-violet-primary);opacity:var(${v})"></div>
      <div style="margin-top:6px;font-weight:700">${k}</div><code style="color:${MUTED};font-size:11px">${op[k].$value}%</code></div>`;
  }
  html += '</div>';
  html += `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};margin:24px 0 8px">scale 0–100</h2><div style="display:flex;gap:8px;align-items:flex-end">`;
  for (const k of scale) {
    const v = cssVar(['effect', 'opacity', k]);
    html += `<div style="text-align:center;font-size:10px">
      <div style="width:40px;height:40px;border-radius:8px;border:1px solid ${BORDER};background:var(--nk-color-background-brand-violet-primary);opacity:var(${v})"></div>
      <div style="margin-top:4px;color:${MUTED}">${k}</div></div>`;
  }
  return wrap(html + '</div>');
};

export const Backdrop = () => {
  const b = raw.Effect?.Backdrop ?? {};
  const keys = Object.keys(b).filter((k) => !k.startsWith('$'));
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Backdrop blur</h1>' +
    `<p style="color:${MUTED};margin:0 0 16px;font-size:12px">Frosted-surface blur radii. In code: <code>backdrop-filter: blur(var(--nk-effect-backdrop-*))</code>.</p>` +
    '<div style="display:flex;gap:20px;flex-wrap:wrap">';
  for (const k of keys) {
    const v = cssVar(['effect', 'backdrop', k.toLowerCase()]);
    html += `<div style="text-align:center;font-size:12px">
      <div style="position:relative;width:120px;height:96px;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};background:var(--nk-color-gradient-brand-spark,#6d46fc)">
        <div style="position:absolute;inset:24px;border-radius:8px;backdrop-filter:blur(var(${v}));-webkit-backdrop-filter:blur(var(${v}));background:rgba(255,255,255,.4)"></div></div>
      <div style="margin-top:6px;font-weight:700">${k}</div><code style="color:${MUTED};font-size:11px">${b[k].$value}px</code></div>`;
  }
  return wrap(html + '</div>');
};
