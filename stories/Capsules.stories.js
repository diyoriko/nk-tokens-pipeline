// Team capsules — the per-team brand packages, rendered from the REAL built
// artifacts (build/capsules/<slug>/css/variables.css), auto-discovered so a
// new team added to capsules/capsules.config.mjs shows up here on its own.
// Each capsule = shared core + Parent Area base + the team's overlay set;
// the overlay re-points only the shared brand slot (Brand-Violet/*, Link,
// Selected) — everything else stays identical across teams.
import { FONT, MUTED, BORDER } from './_helpers.js';

const capsuleCss = import.meta.glob('../build/capsules/*/css/variables.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export default { title: 'Tokens/Capsules' };

const SLOT = [
  ['Brand primary', 'color-background-brand-violet-primary'],
  ['Brand primary · hover', 'color-background-brand-violet-primary-hover'],
  ['Brand secondary', 'color-background-brand-violet-secondary'],
  ['Brand strong', 'color-background-brand-violet-strong'],
  ['Selected', 'color-background-selected-default'],
  ['Link text', 'color-text-link-default'],
];

const val = (css, name) => {
  const m = css.match(new RegExp(`--nk-${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};

export const TeamCapsules = () => {
  const root = document.createElement('div');
  root.style.cssText = `padding:24px 28px;font-family:${FONT}`;

  let html = '<h1 style="font-size:20px;margin:0 0 4px">Team capsules</h1>' +
    `<p style="color:${MUTED};margin:0 0 18px;font-size:12px;max-width:70ch">One shared foundation, one brand slot per team. A capsule is <b>core + Parent Area base + the team overlay</b>; the overlay re-points only the shared brand slot (<code>Brand-Violet/*</code>, <code>Link</code>, <code>Selected</code>). The default package (<code>@novakid/nk-tokens</code>) is value-identical to <code>capsules/parent-area</code>. In Figma these are the <b>modes</b> on the Color collection.</p>` +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px">';

  const entries = Object.entries(capsuleCss).sort(([a], [b]) => a.localeCompare(b));
  for (const [path, css] of entries) {
    const slug = path.match(/capsules\/([^/]+)\//)?.[1] ?? path;
    const cls = `nk-cap-${slug}`;
    const style = document.createElement('style');
    style.textContent = String(css).replaceAll(':root', `.${cls}`);
    root.appendChild(style);

    let rows = '';
    for (const [label, name] of SLOT) {
      const hex = val(String(css), name) ?? '—';
      rows += `<div style="display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid ${BORDER}">
        <div style="height:32px;border-radius:8px;border:1px solid ${BORDER};background:var(--nk-${name})"></div>
        <div style="font-size:12px"><b>${label}</b><br><code style="color:${MUTED};font-size:10.5px">--nk-${name}</code></div>
        <code style="font-size:11px;color:${MUTED}">${hex}</code>
      </div>`;
    }
    html += `<div class="${cls}" style="border:1px solid ${BORDER};border-radius:16px;padding:18px 20px">
      <div style="font-weight:700;font-size:14px;text-transform:capitalize">${slug.replace('-', ' ')}</div>
      <code style="color:${MUTED};font-size:10.5px;display:block;margin:2px 0 12px">@novakid/nk-tokens/capsules/${slug}/css/variables.css</code>
      ${rows}
      <div style="margin-top:12px;display:flex;gap:8px">
        <span style="flex:1;text-align:center;font-size:12px;font-weight:700;padding:9px 0;border-radius:999px;background:var(--nk-color-background-brand-violet-primary);color:var(--nk-color-text-brand-violet-on-primary)">Primary action</span>
        <span style="flex:1;text-align:center;font-size:12px;font-weight:700;padding:9px 0;border-radius:999px;background:var(--nk-color-background-brand-violet-secondary);color:var(--nk-color-text-brand-violet-on-secondary)">Secondary</span>
      </div>
    </div>`;
  }

  const body = document.createElement('div');
  body.innerHTML = html + '</div>';
  root.appendChild(body);
  return root;
};
