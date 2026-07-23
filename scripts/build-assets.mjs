// Build the asset layer of the design system: turns the raw SVGs in assets/
// (icons / logo / patterns) into the artifacts a developer actually imports.
//
//   assets/icons/*.svg   ->  build/icons/svg/*.svg   (cleaned, currentColor, 24-grid)
//                            build/icons/sprite.svg   (one <symbol> per icon)
//                            build/icons/manifest.json
//                            build/icons/index.js + .d.ts  (raw-string map)
//                            build/icons/react.js + .d.ts (React components)
//   assets/logo/*.svg    ->  build/logo/*  + manifest
//   assets/patterns/*    ->  build/patterns/* + manifest
//
// Why a build step: Figma exports carry the section background + frame chrome
// and a hard-coded fill. We strip that and rebind the colour to `currentColor`
// so a single SVG recolours from CSS `color:` (the code analogue of the Figma
// `Icon/Default/Primary` binding). Run via `npm run build:assets`.
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const A = (p) => path.join(root, 'assets', p);
const B = (p) => path.join(root, 'build', p);
const ensure = (d) => fs.mkdirSync(d, { recursive: true });
const pascal = (s) => s.replace(/(^|[-/])([a-z0-9])/g, (_, __, c) => c.toUpperCase()).replace(/[^A-Za-z0-9]/g, '');

// --- SVG cleaner: strip Figma section chrome, rebind colour to currentColor ---
function cleanIconSvg(raw) {
  let body = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  // drop the section background rect + frame border paths Figma adds
  body = body
    .replace(/<rect\b[^>]*fill="#[Ff]5[Ff]5[Ff]5"[^>]*\/>/g, '')
    .replace(/<path\b[^>]*fill="#[Ff]5[Ff]5[Ff]5"[^>]*\/>/g, '')
    .replace(/<path\b[^>]*fill-opacity="0\.1"[^>]*\/>/g, '');
  // Strip Figma's full-box clipPath chrome — but NOT for the loader (the only icon with a
  // <foreignObject>): its <defs> carry the conic-gradient's angular clip-path, which is
  // load-bearing, not a no-op. Every other icon's <defs> holds only a full-box clip.
  if (!/<foreignObject/i.test(body)) {
    body = body
      .replace(/<defs>[\s\S]*?<\/defs>/g, '')           // full-box clipPath defs
      .replace(/<clipPath\b[\s\S]*?<\/clipPath>/g, '')   // any stray clipPath outside <defs>
      .replace(/<g\b[^>]*\bclip-path="[^"]*"[^>]*>/g, '') // the clip-path group wrapper (open tag)
      .replace(/\s+clip-path="[^"]*"/g, '');             // any residual clip-path ref on a path
  }
  body = body
    .replace(/<g id="\d+">/g, '')        // the "<g id='24'>" size wrapper
    .replace(/<g id="icon\/[^"]*">/g, '') // the per-icon wrapper
    .replace(/<\/g>/g, '');
  // every remaining hard-coded colour becomes currentColor (mono icons)
  body = body
    .replace(/stroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"')
    .replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"');
  body = body.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return body;
}

// ---------------- ICONS ----------------
// Paint gate: after cleaning, a mono icon may paint ONLY with currentColor (or
// none) — the hex rewrite above cannot catch named colours ("white") or rgb(),
// and a literal paint is exactly the tintability bug class #116 fixed for the
// loader (tint the icon white → the knockout disappears; any other surface →
// literal white artefact). Known offenders are allowlisted pending the Figma
// redraw decision (evenodd knockouts, like check-circle-fill does it) — see the
// 2026-07-17 review; do NOT add to this list, fix the master in Figma instead.
const PAINT_ALLOWLIST = new Set(['question-circle-fill', 'referral', 'referral-fill']);
const paintViolations = [];
const checkPaints = (name, body) => {
  const bad = [...body.matchAll(/(?:fill|stroke)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((v) => v !== 'currentColor' && v !== 'none');
  if (bad.length && !PAINT_ALLOWLIST.has(name))
    paintViolations.push(`${name}.svg: literal paint(s) ${[...new Set(bad)].join(', ')} — icons must resolve to currentColor/none (fix the Figma master, e.g. evenodd knockout)`);
};

const iconDir = A('icons');
const icons = fs.existsSync(iconDir) ? fs.readdirSync(iconDir).filter((f) => f.endsWith('.svg')).sort() : [];
// Idempotent: purge the per-icon svg dir so a renamed/removed icon (or a stray
// file) can't linger append-only and drift from the manifest / ship via the
// ./icons/svg/* export. The other icon outputs (sprite/manifest/index/react)
// are single files that get overwritten each build.
fs.rmSync(B('icons/svg'), { recursive: true, force: true });
ensure(B('icons/svg'));
const manifest = [];
const rawMap = {};
const symbols = [];
for (const file of icons) {
  const name = file.replace(/\.svg$/, '');
  const body = cleanIconSvg(fs.readFileSync(path.join(iconDir, file), 'utf8'));
  checkPaints(name, body);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none">${body}</svg>`;
  fs.writeFileSync(B(`icons/svg/${name}.svg`), svg + '\n');
  manifest.push({ name, viewBox: '0 0 24 24' });
  rawMap[name] = body;
  symbols.push(`<symbol id="nk-${name}" viewBox="0 0 24 24" fill="none">${body}</symbol>`);
}
if (paintViolations.length) {
  console.error(`✗ Icon paints: ${paintViolations.length} violation(s):`);
  paintViolations.forEach((v) => console.error('  ✗ ' + v));
  process.exit(1);
}
// sprite
fs.writeFileSync(B('icons/sprite.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`);
// manifest
fs.writeFileSync(B('icons/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
// raw-string map (framework-agnostic): import { icons } from '@novakid/design-system/icons'
fs.writeFileSync(B('icons/index.js'),
  `// Generated by build-assets.mjs. Raw inner-SVG per icon (24x24, currentColor).\nexport const icons = ${JSON.stringify(rawMap)};\nexport const iconNames = ${JSON.stringify(manifest.map((m) => m.name))};\n`);
fs.writeFileSync(B('icons/index.d.ts'),
  `export type NkIconName = ${manifest.map((m) => `'${m.name}'`).join(' | ') || 'never'};\nexport declare const icons: Record<NkIconName, string>;\nexport declare const iconNames: NkIconName[];\n`);
// React components (no runtime dep; size via font-size, colour via CSS `color`).
// A shared forwardRef factory gives every icon: (1) ref forwarding (works on
// React <19 where a bare function component drops ref); (2) decorative-by-default
// a11y — aria-hidden + focusable=false unless an aria-label / title is passed,
// then role="img" + an in-SVG <title>; (3) no children/dangerouslySetInnerHTML
// collision — children are stripped before the spread.
//
// `title` is rendered as a real React child, NOT concatenated into the innerHTML
// payload. That is a security boundary, not a style choice: SVG <title> is an HTML
// integration point in the fragment-parsing algorithm, so anything interpolated into
// it is parsed as HTML — `<image src=x onerror=…>` becomes a live `<img onerror>`.
// The prop is documented as an "Accessible name", i.e. exactly the place a consumer
// passes a teacher's or a child's name straight from the API. React escapes children,
// so there is nothing left to escape by hand. The generated (trusted) icon body keeps
// its innerHTML path, moved into a nested <g> — a transparent group, visually inert.
// ONE MODULE PER ICON. The previous shape — a single `icons` object plus
// `make(name)` reading `icons[name]` — was a dynamic property access, which no bundler
// can split. Measured on the real tarball with two bundlers: importing SIX icons pulled
// 162.5 kB minified / 53.1 kB gzip, i.e. the entire set, while `sideEffects` advertised
// that tree-shaking worked. Each icon now owns its body as a literal, so an unused
// module is simply never reached.
//
// `react.js` stays a barrel of re-exports so existing imports keep working; a barrel of
// `export { X } from './react/X.js'` IS shakeable, unlike a barrel that closes over a
// shared map. `./icons/react/*` is also exported for consumers who prefer the direct path.
const FACTORY = `import React from 'react';

// Shared by every icon module; a few hundred bytes, counted once.
export const make = (name, body) => {
  const Icon = /*#__PURE__*/React.forwardRef(function NkIcon(props, ref) {
    const { title, children, ...rest } = props || {};
    const labelled = title != null || rest['aria-label'] != null || rest['aria-labelledby'] != null;
    const a11y = labelled ? { role: 'img' } : { 'aria-hidden': true, focusable: false };
    return /*#__PURE__*/React.createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24',
        width: '1em', height: '1em', fill: 'none',
        ...a11y, ...rest, ref,
      },
      title != null ? /*#__PURE__*/React.createElement('title', null, title) : null,
      /*#__PURE__*/React.createElement('g', { dangerouslySetInnerHTML: { __html: body } })
    );
  });
  Icon.displayName = name;
  return Icon;
};
`;

const FACTORY_DTS = `import * as React from 'react';
export interface NkIconProps extends React.SVGProps<SVGSVGElement> {
  /** Accessible name. When set, the icon is exposed as role="img" with an in-SVG <title>;
   *  otherwise it is aria-hidden. Rendered as a React child, so it is escaped. */
  title?: string;
}
export type NkIcon = React.ForwardRefExoticComponent<NkIconProps & React.RefAttributes<SVGSVGElement>>;
export declare const make: (name: string, body: string) => NkIcon;
`;

// Idempotent, exactly like icons/svg above: a renamed or removed icon must not linger.
fs.rmSync(B('icons/react'), { recursive: true, force: true });
ensure(B('icons/react'));
fs.writeFileSync(B('icons/react/_factory.js'), FACTORY);
fs.writeFileSync(B('icons/react/_factory.d.ts'), FACTORY_DTS);

for (const { name } of manifest) {
  const C = pascal(name);
  fs.writeFileSync(
    B(`icons/react/${C}.js`),
    `import { make } from './_factory.js';\nexport const ${C} = /*#__PURE__*/make(${JSON.stringify(name)}, ${JSON.stringify(rawMap[name])});\nexport default ${C};\n`
  );
  fs.writeFileSync(
    B(`icons/react/${C}.d.ts`),
    `import type { NkIcon } from './_factory.js';\nexport declare const ${C}: NkIcon;\nexport default ${C};\n`
  );
}

fs.writeFileSync(
  B('icons/react.js'),
  `// Generated by build-assets.mjs. Re-export barrel — each icon is its own module under\n` +
    `// ./react/, so importing one from here does not pull the other ${manifest.length - 1}.\n` +
    manifest.map(({ name }) => `export { ${pascal(name)} } from './react/${pascal(name)}.js';`).join('\n') +
    '\n'
);
fs.writeFileSync(
  B('icons/react.d.ts'),
  `export type { NkIconProps, NkIcon } from './react/_factory.js';\n` +
    manifest.map(({ name }) => `export { ${pascal(name)} } from './react/${pascal(name)}.js';`).join('\n') +
    '\n'
);

// Static SVG-asset cleaner (logo + patterns). Unlike icons these keep their
// colours (they're brand marks / decorative backgrounds, not tintable glyphs),
// but Figma exports still carry two hazards this strips:
//   1. ID COLLISIONS — Figma reuses ids like `clip0_0_1` / `paint0_linear_0_1`
//      across every export, so inlining two patterns on one page makes the
//      second reference the first's gradient/clip (wrong render). Namespace
//      every id + reference with the file name.
//   2. EXPORT CHROME — a section-background `#F5F5F5` rect and an oversized
//      translated page-background rect that aren't part of the asset.
function cleanSvgAsset(raw, name) {
  const ns = name.replace(/[^a-zA-Z0-9]+/g, '-');
  let s = raw;
  const ids = [...new Set([...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))];
  for (const id of ids) {
    const nid = `${ns}--${id}`.replace(/[^a-zA-Z0-9_-]+/g, '-');
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(`\\bid="${esc}"`, 'g'), `id="${nid}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, 'g'), `url(#${nid})`)
      .replace(new RegExp(`(href=")#${esc}(")`, 'g'), `$1#${nid}$2`);
  }
  s = s
    .replace(/<rect\b[^>]*\bfill="#[Ff]5[Ff]5[Ff]5"[^>]*\/>/g, '')
    .replace(/<rect\b[^>]*\btransform="translate\([^)]*\)"[^>]*\bfill="white"[^>]*\/>/g, '');
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// ---------------- LOGO + PATTERNS (static assets) ----------------
function copyAssets(kind) {
  const dir = A(kind);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => /\.(svg|png)$/.test(f)).sort();
  fs.rmSync(B(kind), { recursive: true, force: true }); // idempotent: drop stale assets
  ensure(B(kind));
  for (const f of files) {
    if (f.endsWith('.svg')) {
      fs.writeFileSync(B(`${kind}/${f}`), cleanSvgAsset(fs.readFileSync(path.join(dir, f), 'utf8'), f.replace(/\.svg$/, '')));
    } else {
      fs.copyFileSync(path.join(dir, f), B(`${kind}/${f}`));
    }
  }
  fs.writeFileSync(B(`${kind}/manifest.json`), JSON.stringify(files, null, 2) + '\n');
  return files;
}
const logos = copyAssets('logo');
const patterns = copyAssets('patterns');

// Strip stray macOS .DS_Store from build/ so they never reach the npm tarball.
function rmDsStore(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) rmDsStore(p);
    else if (e.name === '.DS_Store') fs.rmSync(p);
  }
}
rmDsStore(B(''));

console.log(`✓ Assets built: ${icons.length} icons (svg+sprite+react+manifest), ${logos.length} logo, ${patterns.length} pattern files.`);
if (!icons.length) console.warn('  (assets/icons is empty — run `npm run export:icons` to pull them from Figma.)');
