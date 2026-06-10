import { tokens } from '../build/ts/tokens.ts';
import { FONT, MUTED } from './_helpers.js';
import blurBg from './assets/blur-bg.png';

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

// ---- Backdrop blur (frosted / glass) — CSS backdrop-filter --------------
export const BackdropBlur = () => {
  const blur = tokens['backdrop-blur'] || {};
  const wrap = document.createElement('div');
  // Novakid Brand-book pattern behind the glass — blur reads clearly over the squiggle edges
  wrap.style.cssText =
    'min-height:560px;padding:48px;font-family:' + FONT +
    ';display:flex;gap:32px;flex-wrap:wrap;align-items:center;' +
    `background:url(${blurBg}) center/cover`;
  for (const name of Object.keys(blur)) {
    const cell = document.createElement('div');
    cell.style.cssText =
      `width:200px;height:130px;border-radius:18px;border:1px solid rgba(255,255,255,.4);` +
      `box-shadow:0 8px 24px rgba(12,12,13,.16);padding:16px;color:#2c2a33;` +
      `background:rgba(255,255,255,.3);backdrop-filter:blur(var(--nk-backdrop-blur-${name}));-webkit-backdrop-filter:blur(var(--nk-backdrop-blur-${name}))`;
    cell.innerHTML = `<div style="font-weight:700;font-size:15px">blur/${name}</div><div style="font-size:12px;color:#444;margin-top:4px;font-family:ui-monospace,monospace">${blur[name]}</div>`;
    wrap.appendChild(cell);
  }
  return wrap;
};
