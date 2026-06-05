import { tokens } from '../build/ts/tokens.ts';
import { FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Typography' };

const PRIMS = new Set(['family', 'scale', 'weight']);
const maxSize = (role) =>
  Math.max(...Object.values(tokens.typography[role]).map((v) => parseFloat(v['font-size'])));

export const Scale = () => {
  const wrap = document.createElement('div');
  wrap.style.cssText = `padding:24px 28px;font-family:${FONT}`;

  // roles grouped, ordered by tier (largest role first); variants within a role largest → smallest
  const roles = Object.keys(tokens.typography)
    .filter((k) => !PRIMS.has(k))
    .sort((a, b) => maxSize(b) - maxSize(a));

  for (const role of roles) {
    const h = document.createElement('h3');
    h.textContent = role;
    h.style.cssText = `font:800 12px/1 ${FONT};text-transform:uppercase;letter-spacing:.08em;color:${MUTED};margin:34px 0 6px`;
    wrap.appendChild(h);

    const variants = Object.keys(tokens.typography[role]).sort(
      (a, b) => parseFloat(tokens.typography[role][b]['font-size']) - parseFloat(tokens.typography[role][a]['font-size']),
    );
    for (const variant of variants) {
      const base = `--nk-typography-${role}-${variant}`;
      const t = tokens.typography[role][variant];
      const block = document.createElement('div');
      block.style.cssText = `padding:12px 0;border-bottom:1px solid ${BORDER}`;
      block.innerHTML = `
        <div style="font-size:11px;color:${MUTED};margin-bottom:4px;font-variant-numeric:tabular-nums">
          ${role}/${variant} · ${t['font-size']} / ${t['line-height']} · ${t['font-weight']}${
            parseFloat(t['letter-spacing']) ? ' · ' + t['letter-spacing'] + ' ls' : ''
          }
        </div>
        <div style="font-size:var(${base}-font-size);line-height:var(${base}-line-height);font-weight:var(${base}-font-weight);letter-spacing:var(${base}-letter-spacing);font-family:var(--nk-typography-family-sans)">
          ${role}/${variant} — The quick brown fox
        </div>`;
      wrap.appendChild(block);
    }
  }
  return wrap;
};
