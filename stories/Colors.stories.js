import { tokens } from '../build/ts/tokens.ts';
import { leaves, cssVar, FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Colors' };

const HUES = ['white', 'violet', 'grey', 'lemon', 'coral', 'green', 'blue'];
const SURFACES = ['background', 'text', 'border', 'icon'];

function swatch({ path, value }) {
  const v = cssVar(path);
  const cell = document.createElement('div');
  cell.style.cssText = `border:1px solid ${BORDER};border-radius:8px;overflow:hidden`;
  cell.innerHTML = `
    <div style="height:56px;background:var(${v});border-bottom:1px solid ${BORDER}"></div>
    <div style="padding:8px 10px;font-size:11px;line-height:1.5">
      <div style="font-weight:700">${path.slice(1).join('/')}</div>
      <div style="color:${MUTED}">var(${v})</div>
      <div style="color:${MUTED}">${value}</div>
    </div>`;
  return cell;
}

// Render one titled section: a heading + a swatch grid.
function section(title, entries) {
  const block = document.createElement('section');
  block.style.cssText = 'margin-bottom:32px';
  const h = document.createElement('h3');
  h.textContent = title;
  h.style.cssText = `font:700 13px/1 ${FONT};text-transform:uppercase;letter-spacing:.06em;color:${MUTED};margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid ${BORDER}`;
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px';
  entries.forEach((e) => grid.appendChild(swatch(e)));
  block.append(h, grid);
  return block;
}

function page(groups, order, label = (g) => g) {
  const all = leaves(tokens.color, ['color']);
  const wrap = document.createElement('div');
  wrap.style.cssText = `padding:24px;font-family:${FONT}`;
  for (const g of order) {
    const entries = all.filter((e) => e.path[1] === g && groups.includes(g));
    if (entries.length) wrap.appendChild(section(label(g), entries));
  }
  return wrap;
}

// Primitives grouped by hue (violet, grey, lemon, …).
export const Primitives = () => page(HUES, HUES);

// Semantic grouped by surface (background, text, border, icon).
export const Semantic = () => page(SURFACES, SURFACES);
