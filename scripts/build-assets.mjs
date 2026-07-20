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
// raw-string map (framework-agnostic): import { icons } from '@novakid/nk-tokens/icons'
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
const REACT_FACTORY = `import React from 'react';
import { icons } from './index.js';

const make = (name) => {
  const Icon = /*#__PURE__*/React.forwardRef(function NkIcon(props, ref) {
    const { title, children, ...rest } = props || {};
    const labelled = title != null || rest['aria-label'] != null || rest['aria-labelledby'] != null;
    const a11y = labelled ? { role: 'img' } : { 'aria-hidden': true, focusable: false };
    return /*#__PURE__*/React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24',
      width: '1em', height: '1em', fill: 'none',
      ...a11y, ...rest, ref,
      dangerouslySetInnerHTML: { __html: (title != null ? '<title>' + title + '</title>' : '') + icons[name] },
    });
  });
  Icon.displayName = name;
  return Icon;
};
`;
const comps = manifest.map(({ name }) => `export const ${pascal(name)} = /*#__PURE__*/make('${name}');`).join('\n');
fs.writeFileSync(B('icons/react.js'), REACT_FACTORY + comps + '\n');
fs.writeFileSync(B('icons/react.d.ts'),
  `import * as React from 'react';\n` +
  `export interface NkIconProps extends React.SVGProps<SVGSVGElement> {\n  /** Accessible name. When set, the icon is exposed as role="img" with an in-SVG <title>; otherwise it is aria-hidden. */\n  title?: string;\n}\n` +
  `export type NkIcon = React.ForwardRefExoticComponent<NkIconProps & React.RefAttributes<SVGSVGElement>>;\n` +
  `${manifest.map((m) => `export declare const ${pascal(m.name)}: NkIcon;`).join('\n')}\n`);

// ---------------- LOGO + PATTERNS (static assets) ----------------
function copyAssets(kind) {
  const dir = A(kind);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => /\.(svg|png)$/.test(f)).sort();
  ensure(B(kind));
  for (const f of files) fs.copyFileSync(path.join(dir, f), B(`${kind}/${f}`));
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
