import { tokens } from '../build/ts/tokens.ts';
import { FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Colors' };

const HUES = ['violet', 'lemon', 'magenta', 'blue', 'green', 'orange', 'coral', 'grey', 'white', 'black'];
const SURFACES = ['background', 'text', 'border', 'icon'];

// transparency checkerboard — makes alpha ramps (white/black) read as transparent
const CHECKER = `background-color:#fff;background-image:linear-gradient(45deg,#dcdce0 25%,transparent 25%),linear-gradient(-45deg,#dcdce0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#dcdce0 75%),linear-gradient(-45deg,transparent 75%,#dcdce0 75%);background-size:12px 12px;background-position:0 0,0 6px,6px -6px,-6px 0`;

const card = (label, varName, value) => `
  <div style="flex:0 0 104px;min-width:104px">
    <div style="height:60px;border-radius:8px;border:1px solid ${BORDER};overflow:hidden;${CHECKER}">
      <div style="height:100%;background:var(${varName})"></div>
    </div>
    <div style="margin-top:6px;font-size:11px;line-height:1.45">
      <div style="font-weight:700;word-break:break-word">${label}</div>
      <div style="color:${MUTED};font-variant-numeric:tabular-nums">${value}</div>
    </div>
  </div>`;

const row = (label, cardsHtml) => `
  <div style="display:flex;gap:20px;align-items:flex-start;padding:14px 0;border-bottom:1px solid ${BORDER}">
    <div style="flex:0 0 156px;font-size:12.5px;font-weight:700;padding-top:4px">${label}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${cardsHtml}</div>
  </div>`;

const heading = (text) =>
  `<h3 style="font:800 12px/1 ${FONT};text-transform:uppercase;letter-spacing:.08em;color:${MUTED};margin:36px 0 8px">${text}</h3>`;

function render(buildRows) {
  const el = document.createElement('div');
  el.style.cssText = `padding:28px 32px;font-family:${FONT};max-width:1280px`;
  el.innerHTML = buildRows();
  return el;
}

export const Primitives = () =>
  render(() =>
    HUES.map((hue) => {
      const steps = tokens.color[hue];
      if (!steps) return '';
      const cards = Object.keys(steps)
        .map((s) => card(`${hue}/${s}`, `--nk-color-${hue}-${s}`, steps[s]))
        .join('');
      return row(hue, cards);
    }).join(''),
  );

export const Semantic = () =>
  render(() =>
    SURFACES.map((surface) => {
      const intents = tokens.color[surface] || {};
      const block = Object.keys(intents)
        .map((intent) => {
          const variants = intents[intent];
          const cards = Object.keys(variants)
            .map((v) => card(v, `--nk-color-${surface}-${intent}-${v}`, variants[v]))
            .join('');
          return row(intent, cards);
        })
        .join('');
      return heading(surface) + block;
    }).join(''),
  );
