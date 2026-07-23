// Logo + pattern + badge catalogue — rendered from the REAL built artifacts
// (build/{logo,patterns,badges}/*), the same files published under the
// `./logo/*`, `./patterns/*`, `./badges/*` export subpaths. Manifest-driven so a
// new asset appears here automatically (mirrors Icons.stories.js).
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

// Bound intrinsic-sized SVGs so a large asset can't blow out its swatch.
const fit = (svg, max = 80) => svg.replace('<svg', `<svg style="max-width:100%;max-height:${max}px;width:auto;height:auto"`);

export const Logo = () => {
  // Two marks (Symbol, Wordmark), each in a fixed-violet PRIMARY file and a
  // `-mono` file painted with currentColor (tints to any brand colour — the
  // code equivalent of Figma's 6 colour variants). Import primaries for a
  // drop-in violet mark; import `-mono` and set `color` to recolour.
  const primary = (mark) => {
    const file = `${mark}.svg`;
    const svg = fit(logoRaw[`../build/logo/${file}`] ?? '');
    return `<div style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
        <div style="height:110px;display:flex;align-items:center;justify-content:center;padding:18px;background:#fff">${svg}</div>
        <code style="display:block;padding:8px 12px;border-top:1px solid ${BORDER};font-size:10.5px;color:${MUTED}">@novakid/design-system/logo/${file}</code>
      </div>`;
  };
  // mono tinted in the 6 Figma brand colours (white shown on a dark surface).
  const TINTS = [
    ['violet', 'var(--nk-color-violet-600,#6D46FC)', '#fff'],
    ['black', 'var(--nk-color-grey-900,#2C2A33)', '#fff'],
    ['yellow', 'var(--nk-color-yellow-500,#FFE60A)', '#fff'],
    ['green', 'var(--nk-color-green-600,#31C838)', '#fff'],
    ['blue', 'var(--nk-color-blue-600,#0645BD)', '#fff'],
    ['white', '#fff', 'var(--nk-color-violet-600,#6D46FC)'],
  ];
  const tinted = (mark, max) => {
    const svg = fit(logoRaw[`../build/logo/${mark}-mono.svg`] ?? '', max);
    return TINTS.map(([name, color, bg]) =>
      `<div title="${name}" style="height:${max + 28}px;display:flex;align-items:center;justify-content:center;padding:12px;border:1px solid ${BORDER};border-radius:10px;background:${bg};color:${color}">${svg}</div>`
    ).join('');
  };
  return shell(
    '<h1 style="font-size:20px;margin:0 0 4px">Logo</h1>' +
    `<p style="color:${MUTED};margin:0 0 16px;font-size:12px;max-width:80ch">Two marks — <b>Symbol</b> (rocket) and <b>Wordmark</b> (lockup). Each ships a fixed-violet primary and a <code>-mono</code> variant that paints with <code>currentColor</code>, so it tints to any of the six brand colours via CSS <code>color</code>. Import: <code>@novakid/design-system/logo/&lt;file&gt;</code>.</p>` +
    '<h2 style="font-size:13px;margin:18px 0 8px">Primary (fixed violet)</h2>' +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">${primary('logo-symbol')}${primary('logo-wordmark')}</div>` +
    '<h2 style="font-size:13px;margin:24px 0 8px">Mono, tinted (<code>logo-symbol-mono</code> · <code>logo-wordmark-mono</code>)</h2>' +
    `<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;max-width:520px">${tinted('logo-symbol', 56)}</div>` +
    `<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:8px">${tinted('logo-wordmark', 40)}</div>`
  );
};

export const Patterns = () => {
  const cards = patternManifest.map((file) => {
    // Force the inline SVG to fill the card width at its native 480×286 ratio.
    const svg = (patternRaw[`../build/patterns/${file}`] ?? '').replace('<svg', '<svg style="display:block;width:100%;height:auto"');
    return `<div style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
        ${svg}
        <code style="display:block;padding:8px 12px;border-top:1px solid ${BORDER};font-size:10.5px;color:${MUTED}">@novakid/design-system/patterns/${file}</code>
      </div>`;
  }).join('');
  return shell(
    '<h1 style="font-size:20px;margin:0 0 4px">Patterns</h1>' +
    `<p style="color:${MUTED};margin:0 0 16px;font-size:12px;max-width:80ch">${patternManifest.length} brand background patterns (1024×613, all vector). Import: <code>@novakid/design-system/patterns/&lt;file&gt;</code>.</p>` +
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">${cards}</div>`
  );
};
