import { tokens } from '../build/ts/tokens.ts';
import { leaves, cssVar, FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Colors' };

const HUES = ['white', 'violet', 'grey', 'lemon', 'coral', 'green', 'blue'];
const SURFACES = ['background', 'text', 'border', 'icon'];

function grid(entries) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:24px;font-family:${FONT}`;
  for (const { path, value } of entries) {
    const v = cssVar(path);
    const cell = document.createElement('div');
    cell.style.cssText = `border:1px solid ${BORDER};border-radius:8px;overflow:hidden`;
    cell.innerHTML = `
      <div style="height:64px;background:var(${v});border-bottom:1px solid ${BORDER}"></div>
      <div style="padding:8px 10px;font-size:12px;line-height:1.5">
        <div style="font-weight:700">${path.join('/')}</div>
        <div style="color:${MUTED}">var(${v})</div>
        <div style="color:${MUTED}">${value}</div>
      </div>`;
    wrap.appendChild(cell);
  }
  return wrap;
}

const all = leaves(tokens.color, ['color']);

export const Primitives = () => grid(all.filter((e) => HUES.includes(e.path[1])));
export const Semantic = () => grid(all.filter((e) => SURFACES.includes(e.path[1])));
