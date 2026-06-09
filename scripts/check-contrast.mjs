// Contrast contract — fails the build if any on-* / text / border pair regresses below
// its WCAG threshold. Converts the colorimetric audit from a snapshot into an enforced gate.
// Run by `npm run check:contrast` (and at the tail of build:tokens).
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../build/css/variables.css', import.meta.url), 'utf8');
const g = (n) => { const m = css.match(new RegExp('--nk-' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*([^;]+);')); return m ? m[1].trim() : null; };
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const L = (h) => { const [r, gr, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(gr) + 0.0722 * lin(b); };
const C = (a, b) => { const l1 = L(a), l2 = L(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };

const W = '#ffffff';
const checks = []; // [label, fgVar|hex, bgVar|hex, minRatio]
const fg = (v) => (v && v.startsWith('#') ? v : g(v));
const BRAND = ['violet', 'blue', 'magenta', 'coral', 'green', 'orange', 'lemon'];
const STATUS = ['success', 'warning', 'danger', 'info'];

// brand: bright primary + tint secondary, dark hue text (X/900); brand-as-text on white; border on white
for (const h of BRAND) {
  checks.push([`brand-${h}.on-primary`, `color-text-brand-${h}-on-primary`, `color-background-brand-${h}-primary`, 4.5]);
  checks.push([`brand-${h}.on-secondary`, `color-text-brand-${h}-on-secondary`, `color-background-brand-${h}-secondary`, 4.5]);
  checks.push([`brand-${h}.text/white`, `color-text-brand-${h}-primary`, W, 4.5]);
  checks.push([`brand-${h}.border/white`, `color-border-brand-${h}-default`, W, 3]);
}
// statuses: bold (bright fill, dark hue text) + light (tint, /700 text); border on white
for (const s of STATUS) {
  checks.push([`${s}.on-bold`, `color-text-${s}-on-bold`, `color-background-${s}-bold`, 4.5]);
  checks.push([`${s}.on-light`, `color-text-${s}-on-light`, `color-background-${s}-light`, 4.5]);
  checks.push([`${s}.border/white`, `color-border-${s}-default`, W, 3]);
}
// focus: default ring sits offset on the page (vs white); on-fill ring sits inside a bright fill (vs a bright primary)
checks.push(['focus.default/white', 'color-border-focus-default', W, 3]);
checks.push(['focus.on-fill vs bright fill', 'color-border-focus-on-fill', 'color-background-brand-violet-primary', 3]);
// default + neutral text on base surface (white)
for (const v of ['primary', 'secondary']) checks.push([`text.default.${v}/white`, `color-text-default-${v}`, W, 4.5]);
// link + feedback
checks.push(['link.default/white', 'color-text-link-default', W, 4.5]);
checks.push(['link.visited/white', 'color-text-link-visited', W, 4.5]);
checks.push(['feedback.reward.on', 'color-feedback-reward-on', 'color-feedback-reward-default', 4.5]);
checks.push(['feedback.streak.on', 'color-feedback-streak-on', 'color-feedback-streak-default', 4.5]);
checks.push(['feedback.encourage.on', 'color-feedback-encourage-on', 'color-feedback-encourage-default', 4.5]);

let fails = 0, skipped = 0;
for (const [label, fgv, bgv, min] of checks) {
  const f = fg(fgv), b = fg(bgv);
  if (!f || !b) { console.warn(`  ? ${label}: token missing (${fgv} / ${bgv}) — skipped`); skipped++; continue; }
  const r = C(f, b);
  if (r < min) { console.error(`  ✗ FAIL ${label}: ${f} on ${b} = ${r.toFixed(2)} (< ${min})`); fails++; }
}
if (fails) { console.error(`\nContrast contract: ${fails} FAILURE(S).`); process.exit(1); }
console.log(`✓ Contrast contract: all ${checks.length - skipped} on-*/text/border pairs pass their AA/UI threshold${skipped ? ` (${skipped} skipped — token absent)` : ''}.`);
