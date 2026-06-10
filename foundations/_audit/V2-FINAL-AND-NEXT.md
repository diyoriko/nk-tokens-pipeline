# Novakid Tokens v2.0.0 — as-built state + next-session plan

> Authoritative handoff. Supersedes `V2-SPEC.md` where they differ (the spec drifted during the
> interactive build — this file reflects what is ACTUALLY in `tokens.json` as of 2026-06-10).
> Branch: **`feat/v2-foundations`** (committed locally, not pushed). Version bumped to **2.0.0**.

## Status: v2 built, reviewed in Storybook, APPROVED by Diyor. Not yet deployed.

Build is green: 544 CSS vars, 0 dangling refs, contrast contract 70/70 pass, `build-storybook` clean.
Local Storybook dev server: `npm run storybook` → http://localhost:6006.

---

## As-built — what's in tokens.json

### Colour (8 hues × /100–/1000, scheme B, smooth OKLCH)
`violet · blue · magenta · coral · green · orange · yellow · grey` + `white`/`black` alpha ramps.
- Main pinned at `/500`. lemon→**yellow**. Periwinkle folded into violet. blue = juicy true-blue `#0A58EA` (gen, H262).
- Reuse-real-where-fits: each step carries a legacy LDS/Brand name shown on the Storybook ramp
  (`= Chablis`, `≈ Persimmon`, `= Snake`, `Main`…); generated steps are blank. Source: `v2-ramps.json` → `stories/ramp-labels.json`.

**Semantic colour:**
- `background/brand-{hue}`: primary=`/500` · primary-hover = darken `/600` (white-text hues violet/blue) or lighten `/400` (dark-text hues) · secondary=`/200` · tertiary=`/100` (+hovers). All 7 brand hues are 3-level (uniform).
- `text/icon brand-{hue}`: on-primary = **white** (violet/blue) or **hue/900** (others) · on-secondary/on-tertiary = hue/900 · brand-as-text `primary` = `/700` (green/yellow also `/700` — **bright/accent, large-text AA 3:1**, not small-body).
- `border/brand-{hue}` = **MAIN `/500`** — DECORATIVE brand colour, deliberately exempt from 3:1 (Diyor's call: "semantics show brand colours first"). Pair with a fill/tint.
- Statuses (success=green · warning=orange · danger=coral · info=blue): bold=`/500` (on-bold = white for info, hue/900 others) · light=`/100` (on-light = `/700`; success on-light = green/**800**). Status `border` = `/600`–`/700` (FUNCTIONAL → kept AA ≥3).
- Preserved as-is (grey-based, refs survived): base, neutral, default text/icon, disabled, on-neutral, overlay, scrim, selected, link, feedback, data-viz/1..8, focus.

**Contrast contract** (`scripts/check-contrast.mjs`): brand text → 3:1 (large/accent); brand border → not checked (decorative); statuses → 4.5 text / 3 border; etc.

### Spacing / Size — Polaris «×25» naming (matches SDS), NO semantic-spacing layer
`0 · 050=2 · 100=4 · 150=6 · 200=8 · 300=12 · 400=16 · 500=20 · 600=24 · 800=32 · 1000=40 · 1200=48 · 1600=64 · 1800=72 · 2000=80 · 2200=88 · 2400=96 · 3200=128 · 4000=160` + `negative/*` mirror.
(Name = px×25. component/section semantic layer was REMOVED — SDS has none; spacing is the raw scale.)
Radius: 4,8,12,16,20,24,32,40,full (28 dropped). stroke + icon as before.

### Typography — primitives + semantic styles
- Primitives: `family/sans`=Mikado · `weight/{regular 400,bold 700}` · `size/{10,12,14,16,18,20,24,32,36,40,48,60}` · `line-height/{100..150}` (number=ratio) · `letter-spacing/{none,wide,wider}`.
- Semantic: `display/{lg60,md48,sm40,xs36}` (120%) · `heading/{lg32,md24,sm20,xs16}` (130%) · `body/{lg,md,sm}` + `-strong` (140%) · `label/{lg,sm}` (**100% single-line**, ls wide) · `caption`+`strong` (140%) · `overline` (10, 150%, ls wider, UPPERCASE at component layer).
- NOTE: composite `letterSpacing` is a **literal** ("0"/"0.5px"/"1px") — the `{letter-spacing.X}` ref didn't resolve in the boxShadow/typography decompose; `lineHeight` refs DO resolve.

### Effects
- `drop-shadow/100..600` — **single-layer** (2-layer deferred, see below).
- `inner-shadow/{100 subtle, 200 pressed}`.
- `backdrop-blur/{overlay 8, scrim 16, glass 24, heavy 40}` — in `tokens/code-only.json`, domain added to `SET_DOMAIN` in build-tokens.mjs.

### Storybook (reorganised — the "review")
- **Colors** → Primitives (one row per hue, all steps, + legacy names) · Semantic (each token shows `→ primitive` ref + resolved hex).
- **Typography** → Primitives · Semantic (specimens).
- **Shadow** → Drop · Inner · Backdrop-blur (over Brand-book pattern `stories/assets/blur-bg.png`).
- **Sizing** → Space (primitives + negative) · Radius.
- Reference display works because the story reads `tokens.json` refs (CSS stays resolved, `outputReferences:false`).

---

## Gotchas
- **Mikado .woff2 are NOT committed** (commercial; now gitignored via `*.woff2`). Storybook falls back to Nunito Sans/system. Local prototypes in `_audit/*.html` (gitignored) load it via @font-face from `~/Documents/Novakid/resources/Mikado/`.
- `stories/assets/blur-bg.png` = Brand-book pattern (Figma node 948-19705) — committed, used by the Backdrop-blur story import.
- npm already has 1.0.0 / 1.0.1 / 1.0.2 tagged. This is **2.0.0** (breaking: hue renames, step renumbering, structure).

---

## NEXT SESSION — plan

### B. Deploy (on Diyor's "go")
1. `feat/v2-foundations` is committed locally → `git push -u origin feat/v2-foundations`.
2. `gh pr create --base main --fill` → review (CI) → `gh pr merge --squash --delete-branch`.
3. Auto: Storybook → GitHub Pages; create tag **v2.0.0** → publish-tokens → npm (GitHub Packages). Ships ts/mjs/cjs/d.ts + css + dart.
4. Respect: max 3 releases/week, 3-min spacing; never commit direct to main (hook).

### C. Figma + comms
5. Tokens Studio in the new Foundations file: **Pull `main` → Apply** → variables/styles materialise (Diyor's step).
6. Build **SDS-style showcase frames** in Figma via Figma MCP (`/figma-use`): colour ramps, type specimens, shadows, spacing grid, blur.
7. Confluence token-tree doc + Slack announce.

### D. Security — DO NOT SKIP
8. **Revoke exposed PATs** (leaked in transcript/screens this session): Figma PAT `figd_…` (Figma → Settings → Personal access tokens) and GitHub PAT `github_pat_…` (GitHub → Developer settings → Tokens). Rotate before anything else public.

### Optional fast-follow
9. **2-layer drop-shadows** (Material/Tailwind ambient+key). Needs a build enhancement: the boxShadow decompose currently splits a single shadow into part-vars; for multi-layer + inset, emit a composed `box-shadow` value (or per-layer parts). Difo approved 2-layer earlier but single-layer was accepted in review — do as polish.
