import { tokens } from '../build/ts/tokens.ts';
import { FONT, MUTED } from './_helpers.js';

export default { title: 'Tokens/Shadow' };

// Effect Styles in Figma; recomposed here from the atomic tokens the build emits.
function grid(group, inset) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `display:flex;gap:40px;flex-wrap:wrap;padding:48px;font-family:${FONT};background:var(--nk-color-background-base-primary)`;
  const tiers = tokens.effect[group] || {};
  for (const tier of Object.keys(tiers)) {
    const s = tiers[tier];
    // build now emits ready CSS strings (incl. 2-layer + inset); legacy part-objects still composable
    const shadow = typeof s === 'string' ? s : `${inset ? 'inset ' : ''}${s['offset-x']} ${s['offset-y']} ${s.blur} ${s.spread} ${s.color}`;
    const cell = document.createElement('div');
    cell.style.cssText = 'text-align:center;font-size:12px';
    cell.innerHTML = `
      <div style="width:120px;height:120px;border-radius:var(--nk-size-radius-400);background:var(--nk-color-background-base-primary);box-shadow:${shadow}"></div>
      <div style="margin-top:12px;font-weight:700">${group}/${tier}</div>
      <div style="color:${MUTED};max-width:160px">${shadow}</div>`;
    wrap.appendChild(cell);
  }
  return wrap;
}

export const DropShadow = () => grid('drop-shadow', false);
export const InnerShadow = () => grid('inner-shadow', true);

// Backdrop blur lives in Tokens/Effects → Backdrop (single canonical home).
