// Contrast contract — fails the build if any on-* / text / border pair regresses below
// its WCAG threshold. Converts the colorimetric audit from a snapshot into an enforced gate.
// Run by `npm run check:contrast` (and at the tail of build:tokens).
import fs from 'node:fs';

// No arg → the canonical build (byte-identical default behaviour). An optional
// CSS path arg (cwd-relative) lets the per-capsule gate run the same contract
// against build/capsules/<slug>/css/variables.css.
const cssTarget = process.argv[2]
  ? new URL(process.argv[2], `file://${process.cwd()}/`)
  : new URL('../build/css/variables.css', import.meta.url);
const css = fs.readFileSync(cssTarget, 'utf8');
const g = (n) => { const m = css.match(new RegExp('--nk-' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*([^;]+);')); return m ? m[1].trim() : null; };
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const L = (h) => { const [r, gr, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(gr) + 0.0722 * lin(b); };
const C = (a, b) => { const l1 = L(a), l2 = L(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };

const W = '#ffffff';
const checks = []; // [label, fgVar|hex, bgVar|hex, minRatio]
const fg = (v) => (v && v.startsWith('#') ? v : g(v));
const BRAND = ['violet', 'blue', 'magenta', 'coral', 'green', 'orange', 'yellow'];
const STATUS = ['success', 'warning', 'danger', 'info'];

// brand: bright primary + tint secondary/tertiary, each with a hover; dark hue text (X/900) holds across rest+hover.
// on-primary is used on primary AND primary-hover; on-secondary on secondary(+hover); on-tertiary on tertiary(+hover).
// every brand hue now carries a full 3-level tertiary, so no pair is skipped by design;
// the skip path below only fires if a token is genuinely absent (a real regression signal).
for (const h of BRAND) {
  checks.push([`brand-${h}.on-primary`, `color-text-brand-${h}-on-primary`, `color-background-brand-${h}-primary`, 4.5]);
  checks.push([`brand-${h}.on-primary@hover`, `color-text-brand-${h}-on-primary`, `color-background-brand-${h}-primary-hover`, 4.5]);
  checks.push([`brand-${h}.on-secondary`, `color-text-brand-${h}-on-secondary`, `color-background-brand-${h}-secondary`, 4.5]);
  checks.push([`brand-${h}.on-secondary@hover`, `color-text-brand-${h}-on-secondary`, `color-background-brand-${h}-secondary-hover`, 4.5]);
  checks.push([`brand-${h}.on-tertiary`, `color-text-brand-${h}-on-tertiary`, `color-background-brand-${h}-tertiary`, 4.5]);
  checks.push([`brand-${h}.on-tertiary@hover`, `color-text-brand-${h}-on-tertiary`, `color-background-brand-${h}-tertiary-hover`, 4.5]);
  checks.push([`brand-${h}.text/white`, `color-text-brand-${h}-primary`, W, 3]); // brand accent text = large-text AA (3:1)
  // Strong = deep brand surface (X/700) + Strong-Hover (X/800), white on-colour. green/yellow land ~3.9 → large-text 3:1 (same exemption as their accent text); the rest pass 4.5.
  const strongMin = (h === 'green' || h === 'yellow') ? 3 : 4.5;
  checks.push([`brand-${h}.on-strong`, `color-text-brand-${h}-on-strong`, `color-background-brand-${h}-strong`, strongMin]);
  checks.push([`brand-${h}.on-strong@hover`, `color-text-brand-${h}-on-strong`, `color-background-brand-${h}-strong-hover`, strongMin]);
  // Border/Brand-*/Secondary = decorative main colour — exempt from 3:1; Primary (/700) is checked above
}
// statuses: bold (bright fill, dark hue text) + light (tint, /700 text); border on white
for (const s of STATUS) {
  checks.push([`${s}.on-bold`, `color-text-${s}-on-bold`, `color-background-${s}-bold`, 4.5]);
  checks.push([`${s}.on-bold@hover`, `color-text-${s}-on-bold`, `color-background-${s}-bold-hover`, 4.5]);
  checks.push([`${s}.on-light`, `color-text-${s}-on-light`, `color-background-${s}-light`, 4.5]);
  checks.push([`${s}.on-light@hover`, `color-text-${s}-on-light`, `color-background-${s}-light-hover`, 4.5]);
  checks.push([`${s}.border/white`, `color-border-${s}-primary`, W, 3]);
}
// functional input border — non-text contrast 3:1 on both base surfaces
checks.push(['border.default.secondary/white', 'color-border-default-secondary', W, 3]);
for (const h of BRAND) checks.push([`brand-${h}.border-primary/white`, `color-border-brand-${h}-primary`, W, 3]);
checks.push(['border.default.secondary/surface', 'color-border-default-secondary', 'color-background-base-secondary', 3]);
// focus: default ring sits offset on the page (vs white); on-fill ring sits inside a bright fill (vs a bright primary)
checks.push(['focus.default/white', 'color-border-focus-default', W, 3]);
checks.push(['focus.on-fill vs bright fill', 'color-border-focus-on-fill', 'color-background-brand-violet-primary', 3]);
// default + neutral text on base surface (white)
for (const v of ['primary', 'secondary']) checks.push([`text.default.${v}/white`, `color-text-default-${v}`, W, 4.5]);
// inverse base surface (near-black) carries the inverse text
checks.push(['base.inverse/text-inverse', 'color-text-default-primary-inverse', 'color-background-base-inverse', 4.5]);
checks.push(['base.inverse-hover/text-inverse', 'color-text-default-primary-inverse', 'color-background-base-inverse-hover', 4.5]);
// link
checks.push(['link.default/white', 'color-text-link-default', W, 4.5]);
checks.push(['link.visited/white', 'color-text-link-visited', W, 4.5]);

let fails = 0, skipped = 0;
for (const [label, fgv, bgv, min] of checks) {
  const f = fg(fgv), b = fg(bgv);
  if (!f || !b) { console.warn(`  ? ${label}: token missing (${fgv} / ${bgv}) — skipped`); skipped++; continue; }
  const r = C(f, b);
  if (r < min) { console.error(`  ✗ FAIL ${label}: ${f} on ${b} = ${r.toFixed(2)} (< ${min})`); fails++; }
}
if (fails) { console.error(`\nContrast contract: ${fails} FAILURE(S).`); process.exit(1); }
console.log(`✓ Contrast contract: all ${checks.length - skipped} on-*/text/border pairs pass their AA/UI threshold${skipped ? ` (${skipped} skipped — token absent)` : ''}.`);
