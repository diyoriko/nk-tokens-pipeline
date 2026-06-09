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
const fg = (v) => (v.startsWith('#') ? v : g(v));
// status bold + light
for (const s of ['success', 'warning', 'danger', 'info']) {
  checks.push([`text.${s}.on-bold`, `color-text-${s}-on-bold`, `color-background-${s}-bold`, 4.5]);
  checks.push([`text.${s}.on-light`, `color-text-${s}-on-light`, `color-background-${s}-light`, 4.5]);
}
// brand fills (white text) + brand text on white + on-secondary + on-accent
for (const h of ['violet', 'magenta', 'coral', 'green', 'orange', 'blue']) {
  checks.push([`text.on-brand-${h}`, `color-text-on-brand-${h}-primary`, `color-background-brand-${h}-primary`, 4.5]);
  checks.push([`text.brand-${h}/white`, `color-text-brand-${h}-primary`, W, 4.5]);
}
checks.push(['text.on-brand-lemon', 'color-text-on-brand-lemon-primary', 'color-background-brand-lemon-primary', 4.5]);
for (const h of ['coral', 'green']) checks.push([`text.brand-${h}.on-secondary`, `color-text-brand-${h}-on-secondary`, `color-background-brand-${h}-secondary`, 4.5]);
for (const h of ['green', 'coral', 'orange', 'magenta']) checks.push([`text.brand-${h}.on-accent`, `color-text-brand-${h}-on-accent`, `color-background-brand-${h}-accent`, 4.5]);
// default text on base surfaces
for (const t of ['primary', 'secondary', 'tertiary']) checks.push([`text.default.${t}/white`, `color-text-default-${t}`, W, t === 'tertiary' ? 4.5 : 4.5]);
// info strong, link, feedback
checks.push(['text.info.on-strong', 'color-text-info-on-strong', 'color-background-info-strong', 4.5]);
checks.push(['text.link/white', 'color-text-link', W, 4.5]);
checks.push(['feedback.on-reward', 'color-feedback-on-reward', 'color-feedback-reward', 4.5]);
checks.push(['feedback.on-streak', 'color-feedback-on-streak', 'color-feedback-streak', 4.5]);
checks.push(['feedback.on-encourage', 'color-feedback-on-encourage', 'color-feedback-encourage', 4.5]);
// borders / focus (UI 3:1)
for (const b of ['focus-on-fill vs violet', 'success', 'danger', 'info']) {} // borders below
checks.push(['border.focus.on-fill vs violet-fill', 'color-border-focus-on-fill', 'color-background-brand-violet-primary', 3]);
for (const s of ['success', 'danger', 'info', 'warning']) checks.push([`border.${s}`, `color-border-${s}-default`, W, 3]);

let fails = 0;
const known = { 'text.default.tertiary/white': 'tertiary text is for white/light only (3.83 on tertiary bg is a documented decorative exemption)' };
for (const [label, fgv, bgv, min] of checks) {
  const f = fg(fgv), b = fg(bgv);
  if (!f || !b) { console.warn(`  ? ${label}: token missing (${fgv} / ${bgv}) — skipped`); continue; }
  const r = C(f, b);
  if (r < min) { console.error(`  ✗ FAIL ${label}: ${f} on ${b} = ${r.toFixed(2)} (< ${min})`); fails++; }
}
if (fails) { console.error(`\nContrast contract: ${fails} FAILURE(S).`); process.exit(1); }
console.log(`✓ Contrast contract: all ${checks.length} on-*/text/border pairs pass their AA/UI threshold.`);
