import { tokens } from '../build/ts/tokens.ts';
import { cssVar, FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Sizing' };

function rows(group, names) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `padding:24px;font-family:${FONT};font-size:13px`;
  for (const name of names) {
    const path = ['size', group, name];
    const v = cssVar(path);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:16px;margin-bottom:10px';
    const isFull = name === 'full';
    row.innerHTML = `
      <code style="width:220px;color:${MUTED}">var(${v})</code>
      <div style="height:16px;width:var(${v});max-width:480px;background:var(--nk-color-background-brand-default);${
        isFull ? 'width:120px;border-radius:var(--nk-size-radius-full)' : ''
      }"></div>
      <span style="color:${MUTED}">${tokens.size[group][name]}</span>`;
    wrap.appendChild(row);
  }
  return wrap;
}

export const Space = () => rows('space', Object.keys(tokens.size.space));
export const Radius = () => {
  const wrap = document.createElement('div');
  wrap.style.cssText = `display:flex;gap:24px;flex-wrap:wrap;padding:24px;font-family:${FONT}`;
  for (const name of Object.keys(tokens.size.radius)) {
    const v = cssVar(['size', 'radius', name]);
    const cell = document.createElement('div');
    cell.style.cssText = 'text-align:center;font-size:12px';
    cell.innerHTML = `
      <div style="width:96px;height:96px;background:var(--nk-color-background-brand-secondary);border:1px solid ${BORDER};border-radius:var(${v})"></div>
      <div style="margin-top:8px;font-weight:700">radius/${name}</div>
      <div style="color:${MUTED}">${tokens.size.radius[name]}</div>`;
    wrap.appendChild(cell);
  }
  return wrap;
};
