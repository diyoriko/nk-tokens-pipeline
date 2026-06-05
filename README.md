# nk-tokens-pipeline-demo

Runnable end-to-end demo of the **Novakid design-token pipeline** — one source of
truth in Figma becomes `--nk-*` CSS, Dart, and TypeScript, automatically. Built to
show the dev team how it works in ~5 minutes.

> Grammar & token values are **locked and eng-signed** (Confluence "Tokens arch &
> naming"; `final-token-tree.md §7.1`). This repo *demonstrates* that contract — it
> doesn't re-open it. The token set here is the **v3 generic real-only palette**
> (2026-06-05): **42 colour primitives** (40 real + 2 brand-approved AA darks),
> **54 live semantic aliases + 1 gated**.

**Live token catalogue (Storybook):** https://diyoriko.github.io/nk-tokens-pipeline-demo/

**Truth sources** (design-code foundations, not in this repo):
`primitive-palette.md` — authoritative real-only primitive inventory + legacy→token lookup ·
`final-token-tree.md` — the v3 master token tree ·
Confluence **["Token Tree"](https://novakidschool.atlassian.net/wiki/spaces/UD/pages/7245791234)**.

---

## The pipeline

```
Figma Variables ──▶ Tokens Studio ──▶ tokens.json ──▶ Style Dictionary ──▶ build/
(source of truth)   plugin: Push      (DTCG, in Git)   (CI, on push)        ├─ css/variables.css   --nk-*  → web (MUI)
                                                                            ├─ dart/nk_colors.dart  NkColors → Flutter
                                                                            └─ ts/tokens.ts         typed tree → TS
                                                                                   │
                                                                                   └─▶ Storybook (visual catalogue)
```

**The one naming rule** (the Figma name *is* the contract): `/` → `-`, lowercase,
prefix `--nk-`. Style Dictionary applies it per platform — designers never write
platform-specific names.

| Figma Variable | Web (CSS) | Mobile (Dart) | TypeScript |
|---|---|---|---|
| `color/background/brand/default` | `var(--nk-color-background-brand-default)` | `NkColors.colorBackgroundBrandDefault` | `tokens.color.background.brand.default` |

---

## Naming architecture — generic hue + step

Primitives are named **`color/<hue>/<step>`** — a generic perceptual hue plus a
numeric step on the standard `{50,100,200,300,400,500,600,700,800,900}` ladder,
light→dark. There are **8 hues + `white`**:

```
violet · blue · magenta · green · lemon · coral · orange · grey   (+ white)
```

This ladder covers **all Landing DS colours *and* all Brand-Book colours**. The
key move in v3: **marketing swatch names are NOT token names.** "Persian Indigo",
"Daisy Bush", "Heliotrope" (now `magenta`), "Persimmon" (now `coral`), "Periwinkle"
(folded into `blue`), "Melrose", "Gin Fizz"… each describes *one shade* and doesn't
compose into a system. They survive losslessly as a **legacy→token lookup** in
`primitive-palette.md` §D/§E — nothing is dropped, everything is findable. A rebrand
re-shades a step in place and every consumer follows with no rename.

Semantic tokens then alias the primitives through a closed dictionary:
`color/{surface}/{intent}/{variant}`.

---

## Quickstart

```bash
npm install
npm run build:tokens     # tokens.json → build/{css,dart,ts}
npm run storybook        # build tokens + open the catalogue at localhost:6006
```

Check the round-trip: semantic aliases resolve to the primitive hex, no leaks in names.
```bash
grep background-brand-default build/css/variables.css
#  --nk-color-background-brand-default: #6d46fc;   (= color/violet/600, the brand anchor)

grep on-lemon build/css/variables.css
#  --nk-color-text-neutral-on-lemon: #2c2a33;      (= color/grey/800 — grey/900 is dropped)
```

---

## Repository map

| Path | What it is |
|---|---|
| **`tokens/tokens.json`** | **Input.** The DTCG token set Tokens Studio pushes from Figma. Holds the **42 colour primitives** (8 hue ramps + white) + space/radius/stroke + atomic typography + atomic shadow, plus the **54 live semantic** role aliases. |
| `tokens/gated.tokens.jsonc` | The **1 gated** token (`accent/default → lemon/100`), documented but **not built** — the `.jsonc` extension keeps it out of the Style Dictionary source glob. |
| **`build-tokens.mjs`** | **The build runner** (`npm run build:tokens`). Registers the custom formats/transforms and runs Style Dictionary. See [Scripts](#scripts). |
| **`style-dictionary.config.mjs`** | Style Dictionary platform config — which outputs (css/dart/ts), transforms, `--nk-` prefix. |
| `tokens/` → `build/` | **Output** (generated, git-ignored): `css/variables.css`, `dart/nk_colors.dart`, `ts/tokens.ts`. |
| `.storybook/` | Storybook config (`main.js`, `preview.js`). The catalogue renders from `build/`. |
| `stories/*.stories.js` | Token catalogue stories: Colors, Sizing, Typography, Shadow. |
| `.github/workflows/build-tokens.yml` | CI: on push to `tokens/`, rebuild + upload `build/` as an artifact. |
| `.github/workflows/deploy-storybook.yml` | CI: on push to `main`, build Storybook + deploy to GitHub Pages. |

---

## What's in here

The build produces **175 `--nk-*` variables** from `tokens.json`:

| Group | Count | Notes |
|---|---:|---|
| **Colour — primitives** | 42 | 8 generic hue ramps + `white`. 40 **real** (exist in Landing DS Variables and/or the Brand Book) + **2 brand-approved AA darks** (`green/700 #0E7A1E` 5.50:1, `blue/600 #1C6FB0` 5.32:1) added 2026-06-05 to clear AA for status text. No `grey/900` (dropped). |
| **Colour — semantic** | 54 | `color/{surface}/{intent}/{variant}` aliases (background/text/border/icon × the intents). |
| **Size** | 16 | `space` (10) + `radius` (4) + `stroke` (2). |
| **Typography** | 33 | 10 roles × {size, font-weight, line-height} + `font-family/main` + 2 weights. |
| **Shadow** | 30 | 5 tiers × 6 atoms (colour repointed `grey/900` → `grey/800`). |

`gated.tokens.jsonc` holds the **1 gated** token — `accent/default → lemon/100` —
documented but not built (`accent` is not yet in the closed intent dict). It is the
only role still behind the gate.

---

## Scripts

| Command | Does |
|---|---|
| `npm run build:tokens` | Runs `build-tokens.mjs`: reads `tokens/tokens.json`, resolves aliases, writes `build/{css,dart,ts}`. |
| `npm run storybook` | Builds tokens, then opens Storybook (catalogue) at `localhost:6006`. |
| `npm run build-storybook` | Builds tokens, then a static Storybook into `storybook-static/` (what CI deploys). |

**Inside `build-tokens.mjs`** (all generated output is produced here, never hand-edited):
- `nk/flatten-sets` *(preprocessor)* — merges the `primitives` + `semantic` sets back into one tree. They're split so Tokens Studio makes two Figma collections; Style Dictionary doesn't want the set layer in the token path.
- `nk/size-px` *(transform)* — dimensions are bare numbers in source (`8`), rendered as px on output (`8px`). Colours, opacity, and font-weight are untouched.
- `nk/dart-colors` *(format)* — emits the `NkColors` Dart class (colour tokens only).
- `nk/ts-nested` *(format)* — emits the typed nested `tokens` tree.
- CSS output uses Style Dictionary's `css/variables` with `outputReferences: false`, so semantic aliases resolve to the primitive hex.

---

## Consuming the outputs (devs)

The outputs are published as a versioned npm package — **`@diyoriko/nk-tokens`** — to
**GitHub Packages** on every `v*` tag (see `.github/workflows/publish-tokens.yml`).

```ini
# .npmrc in the consumer (e.g. parent-mf). GitHub Packages needs auth even for public packages.
@diyoriko:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}   # a PAT with read:packages
```
```bash
npm i @diyoriko/nk-tokens
```
```ts
import '@diyoriko/nk-tokens/css/variables.css';      // injects :root { --nk-* }
import { tokens } from '@diyoriko/nk-tokens/tokens';  // typed token tree
```

Use the vars directly — they coexist with MUI's `--mui-*` (different prefix, no clash):
```tsx
<Button sx={{ bgcolor: 'var(--nk-color-background-brand-default)' }} />
```

A token change → new package version → Renovate/Dependabot opens a bump PR in the
consumer, which the dev reviews and merges. Semver lets consumers upgrade deliberately.

> **Production:** re-scope to `@novakid` under the org repo — GitHub Packages requires
> the package scope to match the repo owner.

---

## Tokens Studio setup (designer side, free Starter — €0)

Once, in the Figma Foundations file:

1. Install the **Tokens Studio** plugin.
2. **Settings → Sync → GitHub** → this repo, branch `figma-changes`, file `tokens/tokens.json`, format **W3C DTCG**.
3. Edit a token → **Push** (commits to `figma-changes` → open a PR to `main`). To update the Figma file itself, also run **Export to Figma** (Variables).

> Free Starter covers the MVP (colour, dimension, number, **atomic** typography/shadow, single-file sync). Paywall (Starter Plus): multi-file split · Themes · **composite** token types · branch switching. That's why typography/shadow stay atomic here and composites live as Figma Styles.

---

## Scope (honoring the locked spec)

Light mode only · **`warning` is LIVE (real LDS Orange — `orange/500 #B36007`, 4.57:1
AA)**, not amber and not gated · `accent` is the **only** gated token (`lemon/100`;
intent not in the closed dict) · **dark mode deferred** (no generated dark family to
lean on — real-only by design) · `size/radius/300` reserved (not built).

The palette is **generic real-only**: every primitive physically exists in the
Landing DS colour Variables or the Brand Book, **except** the 2 brand-approved AA
darks (`green/700 #0E7A1E`, `blue/600 #1C6FB0`) added as the minimum needed to clear
AA for success/info text. `grey/900 #1A1A1A` is **dropped** — `grey/800 #2C2A33` is
the darkest real grey and the on-lemon anchor. `lemon/100 #FFE60A` is the brand
secondary-accent anchor (background/accent only — fails white at 1.27:1, so its
foreground is always a dark grey).

Every alias in `tokens.json` resolves to a real primitive, so the build is clean
(no dangling `{…}` references).
