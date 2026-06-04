import { tokens } from '../build/ts/tokens.ts';
import { hexToRgba, FONT, MUTED } from './_helpers.js';

export default { title: 'Tokens/Shadow' };

// Recompose the composite box-shadow from the atomic tokens (Style Dictionary keeps
// them atomic; a consumer assembles them — here, and a Figma Effect Style in design).
export const Elevation = () => {
  const wrap = document.createElement('div');
  wrap.style.cssText = `display:flex;gap:40px;flex-wrap:wrap;padding:48px;font-family:${FONT};background:var(--nk-color-background-default-default)`;
  for (const tier of Object.keys(tokens.effect.shadow)) {
    const s = tokens.effect.shadow[tier];
    const shadow = `${s['offset-x']} ${s['offset-y']} ${s.blur} ${s.spread} ${hexToRgba(s.color, s.opacity)}`;
    const cell = document.createElement('div');
    cell.style.cssText = 'text-align:center;font-size:12px';
    cell.innerHTML = `
      <div style="width:120px;height:120px;border-radius:var(--nk-size-radius-400);background:var(--nk-color-background-default-default);box-shadow:${shadow}"></div>
      <div style="margin-top:12px;font-weight:700">shadow/${tier}</div>
      <div style="color:${MUTED};max-width:140px">${shadow}</div>`;
    wrap.appendChild(cell);
  }
  return wrap;
};
