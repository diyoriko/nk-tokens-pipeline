import { FONT, MUTED, BORDER } from './_helpers.js';
import raw from '../tokens/tokens.json';
import '../build/css/grid.css';

export default { title: 'Tokens/Grid' };

const wrap = (inner) => { const d = document.createElement('div'); d.style.cssText = `padding:24px 28px;font-family:${FONT}`; d.innerHTML = inner; return d; };
const px = (t) => String(t.$value).replace('px', '');

export const Responsive = () => {
  const r = raw.responsive ?? {};
  const order = ['Mobile', 'Tablet', 'Desktop'];
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Responsive grid</h1>' +
    `<p style="color:${MUTED};margin:0 0 18px;font-size:12px">From the Brand-book Grids page. Three tiers; the Figma grid styles Grid/Mobile · Grid/Tablet · Grid/Desktop mirror these. CSS: <code>.nk-container</code> / <code>.nk-grid</code> / <code>.nk-col-*</code>.</p>`;
  // spec table
  html += `<table style="border-collapse:collapse;font-size:12px;margin-bottom:24px">
    <thead><tr>${['Tier', 'Width', 'Columns', 'Gutter', 'Margin', 'Breakpoint min'].map((h) => `<th style="text-align:left;padding:6px 16px 6px 0;color:${MUTED};font-weight:700">${h}</th>`).join('')}</tr></thead><tbody>`;
  for (const k of order) {
    const t = r[k]; if (!t) continue;
    html += `<tr style="border-top:1px solid ${BORDER}">${[k, px(t['Device-Width']) + 'px', t.Columns.$value, px(t.Gutter) + 'px', px(t.Margin) + 'px', px(t['Breakpoint-Min']) + 'px'].map((c) => `<td style="padding:6px 16px 6px 0;font-variant-numeric:tabular-nums">${c}</td>`).join('')}</tr>`;
  }
  html += '</tbody></table>';
  // visual columns per tier
  for (const k of order) {
    const t = r[k]; if (!t) continue;
    const cols = t.Columns.$value;
    html += `<div style="margin-bottom:18px">
      <div style="font-weight:700;font-size:13px;margin-bottom:6px">${k} <span style="color:${MUTED};font-weight:400">· ${px(t['Device-Width'])} · ${cols} col</span></div>
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${px(t.Gutter)}px;max-width:${Math.min(px(t['Device-Width']), 960)}px">
        ${Array.from({ length: cols }, () => `<div style="height:64px;border-radius:6px;background:rgba(199,110,242,.18)"></div>`).join('')}
      </div></div>`;
  }
  // live .nk-grid demo
  html += `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};margin:24px 0 8px">.nk-grid (resize the window)</h2>
    <div class="nk-grid" style="--demo:1">
      <div class="nk-col-12" style="background:var(--nk-color-background-brand-violet-primary);color:#fff;border-radius:8px;padding:12px;font-size:12px">.nk-col-12</div>
      <div class="nk-col-4" style="background:var(--nk-color-background-brand-violet-secondary);border-radius:8px;padding:12px;font-size:12px">.nk-col-4</div>
      <div class="nk-col-8" style="background:var(--nk-color-background-brand-violet-secondary);border-radius:8px;padding:12px;font-size:12px">.nk-col-8</div>
    </div>`;
  return wrap(html);
};
