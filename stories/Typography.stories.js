import { tokens } from '../build/ts/tokens.ts';
import { FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Typography' };

// typography set holds primitives (family/scale/weight) + role composites; render the roles.
const PRIMS = new Set(['family', 'scale', 'weight']);
const ROLES = Object.keys(tokens.typography).filter((k) => !PRIMS.has(k));

export const Scale = () => {
  const wrap = document.createElement('div');
  wrap.style.cssText = `padding:24px;font-family:${FONT}`;
  for (const role of ROLES) {
    for (const variant of Object.keys(tokens.typography[role])) {
      const base = `--nk-typography-${role}-${variant}`;
      const t = tokens.typography[role][variant];
      const block = document.createElement('div');
      block.style.cssText = `padding:14px 0;border-bottom:1px solid ${BORDER}`;
      block.innerHTML = `
        <div style="font-size:11px;color:${MUTED};margin-bottom:4px">
          typography/${role}/${variant} · ${t['font-size']} / ${t['line-height']} · ${t['font-weight']}
        </div>
        <div style="font-size:var(${base}-font-size);line-height:var(${base}-line-height);font-weight:var(${base}-font-weight);font-family:var(--nk-typography-family-sans)">
          ${role}/${variant} — The quick brown fox
        </div>`;
      wrap.appendChild(block);
    }
  }
  return wrap;
};
