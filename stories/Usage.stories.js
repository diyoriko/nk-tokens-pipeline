import { FONT, MUTED, BORDER } from './_helpers.js';

export default { title: 'Tokens/Semantic intents' };

const SECTIONS = [
  ['Background — what surface / fill to reach for', [
    ['base', 'Structural surfaces — page canvas + card/panel layers. primary=white, secondary/tertiary=grey layers.'],
    ['neutral', 'Solid neutral component fill with no brand colour — secondary button, neutral chip, toggle-off.'],
    ['brand-violet', 'Primary brand fill — primary button, brand emphasis. (the #6D46FC anchor)'],
    ['brand-yellow', 'Accent fill — highlights, badges, marketing pops. Foreground is always dark.'],
    ['brand-magenta / blue / green / orange / coral', 'Decorative brand accents — illustrative surfaces, category colours.'],
    ['success', 'Positive status surface — confirmation banners, success states.'],
    ['warning', 'Caution status surface — warnings, attention-needed.'],
    ['danger', 'Error / destructive surface — errors, delete confirmations.'],
    ['disabled', 'Inert / unavailable surface.'],
  ]],
  ['Text / Icon — foreground', [
    ['default', 'Body text & icons on light surfaces. primary (main), secondary (muted), tertiary (faint).'],
    ['brand-* / success / warning / danger', 'Coloured text/icon — links, status labels, emphasised numerals.'],
    ['on-*', 'Foreground that sits ON a coloured fill — e.g. on-brand-violet = white text on the violet button.'],
    ['disabled', 'Inert text / icon.'],
  ]],
  ['Border', [
    ['default', 'Neutral borders — inputs, dividers, cards. hover for interactive.'],
    ['brand-* / success / warning / danger', 'Coloured borders — active / status states.'],
    ['focus', 'Focus ring (keyboard / a11y).'],
    ['disabled', 'Inert border.'],
  ]],
];

export const Intents = () => {
  const el = document.createElement('div');
  el.style.cssText = `padding:32px;font-family:${FONT};max-width:920px;line-height:1.5`;
  el.innerHTML = `
    <h2 style="margin:0 0 6px">Semantic intents — when to use what</h2>
    <p style="color:${MUTED};margin:0 0 8px;font-size:14px">Variants per intent: <b>primary</b> (strong) → <b>secondary</b> (light tint) → <b>tertiary</b> (lightest); <code>-hover</code> = the interactive hover of each. Detailed per-component usage is documented with each component, not here.</p>
    ${SECTIONS.map(([title, rows]) => `
      <h3 style="font:800 12px/1 ${FONT};text-transform:uppercase;letter-spacing:.08em;color:${MUTED};margin:28px 0 10px;padding-bottom:8px;border-bottom:1px solid ${BORDER}">${title}</h3>
      ${rows.map(([name, desc]) => `
        <div style="display:flex;gap:18px;padding:7px 0">
          <code style="flex:0 0 230px;font-weight:700;font-size:13px">${name}</code>
          <div style="font-size:14px">${desc}</div>
        </div>`).join('')}
    `).join('')}`;
  return el;
};
