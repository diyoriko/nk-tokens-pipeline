import { tokens } from '../build/ts/tokens.ts';
import { cssVar, FONT, MUTED } from './_helpers.js';

export default { title: 'Tokens/Motion' };

const wrap = (inner) => { const d = document.createElement('div'); d.style.cssText = `padding:24px 28px;font-family:${FONT}`; d.innerHTML = inner; return d; };
const h2 = (t) => `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};margin:26px 0 10px">${t}</h2>`;

export const Motion = () => {
  const m = tokens.motion || {};
  const dur = m.duration || {};
  const eas = m.easing || {};
  let html = '<h1 style="font-size:20px;margin:0 0 4px">Motion</h1>' +
    `<p style="color:${MUTED};margin:0 0 8px;font-size:12px">Duration + easing scales (code-only — Figma can't bind these). Hover a row to play it.</p>`;
  html += `<style>
    .nk-mo{display:flex;align-items:center;gap:16px;margin-bottom:8px}
    .nk-mo code{width:230px;color:${MUTED};font-size:12px}
    .nk-mo .track{flex:1;max-width:360px;height:10px;border-radius:6px;background:var(--nk-color-background-base-secondary,#f5f5f5);position:relative;overflow:hidden}
    .nk-mo .dot{position:absolute;top:1px;left:1px;width:8px;height:8px;border-radius:50%;background:var(--nk-color-background-brand-violet-primary)}
    .nk-mo:hover .dot{transform:translateX(340px)}
  </style>`;
  html += h2('duration (easing: standard)');
  for (const k of Object.keys(dur)) {
    html += `<div class="nk-mo"><code>--nk-motion-duration-${k}</code>
      <div class="track"><div class="dot" style="transition:transform var(${cssVar(['motion', 'duration', k])}) var(--nk-motion-easing-standard,ease)"></div></div>
      <span style="color:${MUTED};font-size:12px">${dur[k]}</span></div>`;
  }
  html += h2('easing (duration: slower)');
  for (const k of Object.keys(eas)) {
    html += `<div class="nk-mo"><code>--nk-motion-easing-${k}</code>
      <div class="track"><div class="dot" style="transition:transform var(--nk-motion-duration-slower,500ms) var(${cssVar(['motion', 'easing', k])})"></div></div>
      <span style="color:${MUTED};font-size:12px;font-family:ui-monospace,monospace">${eas[k]}</span></div>`;
  }
  return wrap(html);
};
