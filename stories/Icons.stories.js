// Icon library — every glyph rendered from the REAL built artifacts
// (build/icons/manifest.json + build/icons/svg/*.svg), the same outputs the
// sprite, raw-string map and React components are generated from by
// scripts/build-assets.mjs. Each built <svg> is width/height 1em on a single
// 24x24 viewBox (the manifest's only grid), so font-size IS the size switcher;
// every fill/stroke is rebound to currentColor, so CSS `color:` recolours a
// glyph. In Figma icons are named icon/<category>/<glyph>, but the exported
// code library is intentionally flat (the category only groups the Assets
// panel and is not in the manifest), so glyphs are listed A-Z by name.
// Outline+fill pairs ARE encoded: Style=Fill exports as `<glyph>-fill`.
import manifest from '../build/icons/manifest.json';
import { FONT, MUTED, BORDER } from './_helpers.js';

const svgRaw = import.meta.glob('../build/icons/svg/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const svgOf = (name) => svgRaw[`../build/icons/svg/${name}.svg`] ?? '';

export default { title: 'Assets/Icons' };

// Render sizes only — the source grid is always 24 (viewBox '0 0 24 24').
const SIZES = [16, 20, 24, 32, 40, 48];

const USAGE = `<code style="color:${MUTED};font-size:10.5px">import { icons } from '@novakid/design-system/icons'</code> · ` +
  `<code style="color:${MUTED};font-size:10.5px">@novakid/design-system/icons/react</code> · ` +
  `sprite: <code style="color:${MUTED};font-size:10.5px">&lt;use href="#nk-&lt;name&gt;"/&gt;</code>`;

export const Library = () => {
  const root = document.createElement('div');
  root.style.cssText = `padding:24px 28px;font-family:${FONT}`;

  root.innerHTML = `<h1 style="font-size:20px;margin:0 0 4px">Icons</h1>
    <p style="color:${MUTED};margin:0 0 14px;font-size:12px;max-width:78ch">${manifest.length} glyphs, one 24-grid, flat names (Figma's <code>icon/&lt;category&gt;/&lt;glyph&gt;</code> keeps only the glyph segment in code). ${USAGE}</p>
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 16px">
      <input data-filter type="search" placeholder="Filter by name…" style="font:inherit;font-size:13px;padding:7px 12px;border:1px solid ${BORDER};border-radius:8px;width:240px;outline:none">
      <div data-sizes style="display:flex;gap:4px">${SIZES.map((s) =>
        `<button data-size="${s}" style="font:inherit;font-size:12px;padding:6px 10px;border:1px solid ${BORDER};border-radius:8px;background:none;cursor:pointer">${s}</button>`).join('')}</div>
      <span data-count style="color:${MUTED};font-size:12px"></span>
    </div>
    <div data-grid style="--icon-size:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:8px">${manifest.map(({ name }) =>
      `<div data-name="${name}" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px 10px;border:1px solid ${BORDER};border-radius:12px">
        <div style="font-size:var(--icon-size);line-height:0;color:var(--nk-color-icon-default-primary)">${svgOf(name)}</div>
        <code style="font-size:9.5px;color:${MUTED};word-break:break-all;text-align:center">${name}</code>
      </div>`).join('')}</div>
    <h2 style="font-size:14px;margin:28px 0 4px">Colour = CSS <code>color</code></h2>
    <p style="color:${MUTED};margin:0 0 10px;font-size:12px;max-width:78ch">The build rebinds every hard-coded fill/stroke to <code>currentColor</code>, so one SVG recolours from the semantic <code>--nk-color-icon-*</code> tokens (the code analogue of the Figma <code>Icon/Default/Primary</code> binding).</p>
    <div style="display:flex;gap:18px;flex-wrap:wrap">${[
      'icon-default-primary', 'icon-default-secondary', 'icon-default-tertiary', 'icon-brand-violet-primary',
      'icon-danger-on-light', 'icon-success-on-light', 'icon-warning-on-light', 'icon-disabled-primary',
    ].map((t) =>
      `<div style="text-align:center;font-size:24px;line-height:0;color:var(--nk-color-${t})">${svgOf('heart-fill')}
        <code style="display:block;margin-top:8px;font-size:9.5px;line-height:1.4;color:${MUTED}">--nk-color-${t}</code>
      </div>`).join('')}</div>`;

  const grid = root.querySelector('[data-grid]');
  const count = root.querySelector('[data-count]');
  const cells = [...grid.children];

  const setSize = (px) => {
    grid.style.setProperty('--icon-size', `${px}px`);
    for (const b of root.querySelectorAll('[data-size]')) {
      const on = b.dataset.size === String(px);
      b.style.background = on ? 'var(--nk-color-background-brand-violet-secondary)' : 'none';
      b.style.fontWeight = on ? '700' : '400';
    }
  };
  root.querySelector('[data-sizes]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]');
    if (b) setSize(b.dataset.size);
  });
  setSize(24);

  const filter = root.querySelector('[data-filter]');
  const apply = () => {
    const q = filter.value.trim().toLowerCase();
    let shown = 0;
    for (const c of cells) {
      const hit = !q || c.dataset.name.includes(q);
      c.style.display = hit ? '' : 'none';
      if (hit) shown++;
    }
    count.textContent = `${shown} / ${manifest.length}`;
  };
  filter.addEventListener('input', apply);
  apply();

  return root;
};

// The 34 outline+fill pairs the exporter encodes as COMPONENT_SET variants:
// Style=Outline keeps the base filename, Style=Fill gets the -fill suffix.
export const StylePairs = () => {
  const names = new Set(manifest.map((m) => m.name));
  const pairs = manifest
    .filter((m) => m.name.endsWith('-fill') && names.has(m.name.slice(0, -5)))
    .map((m) => m.name.slice(0, -5));

  const root = document.createElement('div');
  root.style.cssText = `padding:24px 28px;font-family:${FONT}`;
  root.innerHTML = `<h1 style="font-size:20px;margin:0 0 4px">Style pairs</h1>
    <p style="color:${MUTED};margin:0 0 16px;font-size:12px;max-width:78ch">${pairs.length} glyphs ship as an outline+fill pair (a Figma component set with a <b>Style</b> property). In code the pair is two flat names: <code>&lt;glyph&gt;</code> and <code>&lt;glyph&gt;-fill</code>.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">${pairs.map((base) =>
      `<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid ${BORDER};border-radius:12px">
        <span style="font-size:28px;line-height:0;color:var(--nk-color-icon-default-primary)">${svgOf(base)}</span>
        <span style="font-size:28px;line-height:0;color:var(--nk-color-icon-default-primary)">${svgOf(`${base}-fill`)}</span>
        <code style="font-size:10px;color:${MUTED};word-break:break-all">${base}<br>${base}-fill</code>
      </div>`).join('')}</div>`;
  return root;
};
