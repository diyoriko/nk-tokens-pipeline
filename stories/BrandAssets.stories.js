// Logo + pattern catalogue — rendered from the REAL built artifacts
// (build/logo/*, build/patterns/*), the same files published under the
// `./logo/*` and `./patterns/*` export subpaths. Both groups shipped with no
// story before; the manifests drive the list so a new asset appears here
// automatically (mirrors Icons.stories.js).
import logoManifest from '../build/logo/manifest.json';
import patternManifest from '../build/patterns/manifest.json';
import { FONT, MUTED, BORDER } from './_helpers.js';

const logoRaw = import.meta.glob('../build/logo/*.svg', { query: '?raw', import: 'default', eager: true });
const patternRaw = import.meta.glob('../build/patterns/*.svg', { query: '?raw', import: 'default', eager: true });

export default { title: 'Assets/Brand' };

const shell = (inner) => {
  const d = document.createElement('div');
  d.style.cssText = `padding:24px 28px;font-family:${FONT}`;
  d.innerHTML = inner;
  return d;
};

// The raw SVGs carry an intrinsic width/height (logo-symbol is 155×155); bound
// them to the swatch so a large asset can't blow out its card.
const FIT = 'max-width:100%;max-height:80px;width:auto;height:auto';
export const Logo = () => {
  const cards = logoManifest.map((file) => {
    const svg = (logoRaw[`../build/logo/${file}`] ?? '').replace('<svg', `<svg style="${FIT}"`);
    // The symbol ships a fixed brand fill (#6D46FC), so it is shown on neutral
    // surfaces that contrast with violet — not on a brand-violet fill where it
    // would vanish.
    return `<div style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
        <div style="height:120px;display:flex;align-items:center;justify-content:center;padding:20px;background:#fff">${svg}</div>
        <div style="height:120px;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--nk-color-background-neutral-primary,#f4f4f4)">${svg}</div>
        <code style="display:block;padding:8px 12px;border-top:1px solid ${BORDER};font-size:10.5px;color:${MUTED}">@novakid/nk-tokens/logo/${file}</code>
      </div>`;
  }).join('');
  return shell(
    '<h1 style="font-size:20px;margin:0 0 4px">Logo</h1>' +
    `<p style="color:${MUTED};margin:0 0 16px;font-size:12px;max-width:78ch">${logoManifest.length} logo asset(s) — a fixed brand-violet mark (<code>#6D46FC</code>), shown on light and neutral surfaces. Import: <code>@novakid/nk-tokens/logo/&lt;file&gt;</code>.</p>` +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">${cards}</div>`
  );
};

export const Patterns = () => {
  const cards = patternManifest.map((file) => {
    const svg = patternRaw[`../build/patterns/${file}`] ?? '';
    return `<div style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
        <div style="height:150px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#faf9ff">${svg}</div>
        <code style="display:block;padding:8px 12px;border-top:1px solid ${BORDER};font-size:10.5px;color:${MUTED}">@novakid/nk-tokens/patterns/${file}</code>
      </div>`;
  }).join('');
  return shell(
    '<h1 style="font-size:20px;margin:0 0 4px">Patterns</h1>' +
    `<p style="color:${MUTED};margin:0 0 16px;font-size:12px;max-width:78ch">${patternManifest.length} brand pattern(s) from the Brand-book. Import: <code>@novakid/nk-tokens/patterns/&lt;file&gt;</code>.</p>` +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px">${cards}</div>`
  );
};
