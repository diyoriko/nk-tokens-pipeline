import { tokens } from '../build/ts/tokens.ts';
import { FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Z-Index' };

const wrap = (inner) => { const d = document.createElement('div'); d.style.cssText = `padding:24px 28px;font-family:${FONT}`; d.innerHTML = inner; return d; };

const USE = {
  base: 'default content plane',
  dropdown: 'menus, selects, popovers',
  sticky: 'sticky headers / toolbars',
  overlay: 'scrims behind modals',
  modal: 'dialogs, sheets',
  toast: 'transient alerts (top-most)',
};

export const Layers = () => {
  const z = tokens['z-index'] || {};
  const order = Object.keys(z).sort((a, b) => parseFloat(z[a]) - parseFloat(z[b]));
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Z-Index</h1>' +
    `<p style="color:${MUTED};margin:0 0 16px;font-size:12px">Stacking scale (code-only). Higher = closer to the user; each layer clears the one below.</p>`;
  html += `<table style="border-collapse:collapse;font-size:13px"><thead><tr>${['Token', 'Value', 'Use'].map((h) => `<th style="text-align:left;padding:6px 28px 6px 0;color:${MUTED};font-weight:700">${h}</th>`).join('')}</tr></thead><tbody>`;
  for (const k of order) {
    html += `<tr style="border-top:1px solid ${BORDER}"><td style="padding:6px 28px 6px 0"><code>--nk-z-index-${k}</code></td><td style="padding:6px 28px 6px 0;font-variant-numeric:tabular-nums">${z[k]}</td><td style="padding:6px 28px 6px 0;color:${MUTED}">${USE[k] || ''}</td></tr>`;
  }
  html += '</tbody></table>';
  html += '<div style="position:relative;height:210px;margin-top:28px">';
  order.forEach((k, i) => {
    html += `<div style="position:absolute;left:${i * 34}px;top:${i * 22}px;width:150px;height:80px;border-radius:10px;background:var(--nk-color-background-brand-violet-${i % 2 ? 'secondary' : 'primary'});color:${i % 2 ? '#333' : '#fff'};box-shadow:0 6px 18px rgba(12,12,13,.18);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${k}</div>`;
  });
  html += '</div>';
  return wrap(html);
};
