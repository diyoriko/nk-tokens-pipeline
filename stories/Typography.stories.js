import { tokens } from '../build/ts/tokens.ts';
import { FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Typography' };

const PRIMS = new Set(['family', 'weight', 'size', 'line-height', 'letter-spacing']);
const wrap = (inner) => {
  const d = document.createElement('div');
  d.style.cssText = `padding:24px 28px;font-family:${FONT}`;
  d.innerHTML = inner;
  return d;
};
const h2 = (t) => `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};margin:28px 0 8px">${t}</h2>`;
const trow = (name, val, sample) =>
  `<tr><td style="padding:5px 16px 5px 0;font-family:ui-monospace,monospace;font-size:12px;font-weight:600">${name}</td><td style="padding:5px 16px;color:${MUTED};font-variant-numeric:tabular-nums">${val}</td>${sample !== undefined ? `<td style="padding:5px 0">${sample}</td>` : ''}</tr>`;

// ---- PRIMITIVES ---------------------------------------------------------
export const Primitives = () => {
  const t = tokens.typography;
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Typography primitives</h1>' +
    `<p style="color:${MUTED};margin:0;font-size:12px">Atoms — composed into the semantic text styles.</p>`;
  html += h2('family') + '<table>' + Object.keys(t.family).map((k) => trow('family/' + k, t.family[k], `<span style="font-family:var(--nk-typography-family-${k});font-size:18px">Mikado — Aa Бб 123</span>`)).join('') + '</table>';
  html += h2('weight') + '<table>' + Object.keys(t.weight).map((k) => trow('weight/' + k, t.weight[k], `<span style="font-weight:var(--nk-typography-weight-${k});font-size:18px">Novakid</span>`)).join('') + '</table>';
  html += h2('size') + '<table>' + Object.keys(t.size).sort((a, b) => +a - +b).map((k) => trow('size/' + k, t.size[k], `<span style="font-size:var(--nk-typography-size-${k})">Aa</span>`)).join('') + '</table>';
  html += h2('line-height') + '<table>' + Object.keys(t['line-height']).map((k) => trow('line-height/' + k, k + '%')).join('') + '</table>';
  html += h2('letter-spacing') + '<table>' + Object.keys(t['letter-spacing']).map((k) => trow('letter-spacing/' + k, t['letter-spacing'][k])).join('') + '</table>';
  return wrap(html);
};

// ---- SEMANTIC (composite text styles) -----------------------------------
const SAMPLE = 'Novakid — английский для детей · English for kids';
export const Semantic = () => {
  const t = tokens.typography;
  const roles = Object.keys(t).filter((k) => !PRIMS.has(k));
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Semantic text styles</h1>' +
    `<p style="color:${MUTED};margin:0;font-size:12px">display › heading › body › label › caption › overline. Each composes the primitives.</p>`;
  for (const role of roles) {
    html += h2(role);
    const variants = Object.keys(t[role]).sort((a, b) => parseFloat(t[role][b]['font-size']) - parseFloat(t[role][a]['font-size']));
    for (const v of variants) {
      const base = `--nk-typography-${role}-${v}`;
      const s = t[role][v];
      const upper = role === 'overline' ? 'text-transform:uppercase;' : '';
      html += `<div style="padding:10px 0;border-bottom:1px solid ${BORDER}">
        <div style="font-size:10.5px;color:${MUTED};margin-bottom:3px;font-variant-numeric:tabular-nums;font-family:ui-monospace,monospace">${role}/${v} · ${s['font-size']} · ${s['font-weight']} · LH ${String(s['line-height']).includes('%') ? s['line-height'] : Math.round(parseFloat(s['line-height']) * 100) + '%'}${parseFloat(s['letter-spacing']) ? ' · ls ' + s['letter-spacing'] : ''}</div>
        <div style="${upper}font-size:var(${base}-font-size);line-height:var(${base}-line-height);font-weight:var(${base}-font-weight);letter-spacing:var(${base}-letter-spacing);font-family:var(--nk-typography-family-sans)">${SAMPLE}</div>
      </div>`;
    }
  }
  return wrap(html);
};
