# nk-tokens-pipeline-demo

Runnable end-to-end demo of the **Novakid design-token pipeline** — one source of
truth in Figma becomes `--nk-*` CSS, Dart, and TypeScript, automatically. Built to
show the dev team how it works in ~5 minutes.

> Grammar & token values are **locked and eng-signed** (Confluence "Tokens arch &
> naming"; `final-token-tree.md §7.1`). This repo *demonstrates* that contract — it
> doesn't re-open it.

**Live token catalogue (Storybook):** https://diyoriko.github.io/nk-tokens-pipeline-demo/

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

## Quickstart

```bash
npm install
npm run build:tokens     # tokens.json → build/{css,dart,ts}
npm run storybook        # build tokens + open the catalogue at localhost:6006
```

Check the round-trip: semantic aliases resolve to the primitive hex, no leaks in names.
```bash
grep background-brand-default build/css/variables.css
#  --nk-color-background-brand-default: #6d46fc;   (= color/violet/600)
```

---

## Repository map

| Path | What it is |
|---|---|
| **`tokens/tokens.json`** | **Input.** The DTCG token set Tokens Studio pushes from Figma. Two sets: `primitives` (35 colours + space/radius/stroke + atomic typography + atomic shadow) and `semantic` (48 role aliases). |
| `tokens/gated.tokens.jsonc` | The 5 *gated* tokens (warning/accent), documented but **not built** — not loaded by the build. |
| **`build-tokens.mjs`** | **The build runner** (`npm run build:tokens`). Registers the custom formats/transforms and runs Style Dictionary. See [Scripts](#scripts). |
| **`style-dictionary.config.mjs`** | Style Dictionary platform config — which outputs (css/dart/ts), transforms, `--nk-` prefix. |
| `tokens/` → `build/` | **Output** (generated, git-ignored): `css/variables.css`, `dart/nk_colors.dart`, `ts/tokens.ts`. |
| `.storybook/` | Storybook config (`main.js`, `preview.js`). The catalogue renders from `build/`. |
| `stories/*.stories.js` | Token catalogue stories: Colors, Sizing, Typography, Shadow. |
| `.github/workflows/build-tokens.yml` | CI: on push to `tokens/`, rebuild + upload `build/` as an artifact. |
| `.github/workflows/deploy-storybook.yml` | CI: on push to `main`, build Storybook + deploy to GitHub Pages. |

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

## Tokens Studio setup (designer side, free Starter — €0)

Once, in the Figma Foundations file:

1. Install the **Tokens Studio** plugin.
2. **Settings → Sync → GitHub** → this repo, branch `figma-changes`, file `tokens/tokens.json`, format **W3C DTCG**.
3. Edit a token → **Push** (commits to `figma-changes` → open a PR to `main`). To update the Figma file itself, also run **Export to Figma** (Variables).

> Free Starter covers the MVP (colour, dimension, number, **atomic** typography/shadow, single-file sync). Paywall (Starter Plus): multi-file split · Themes · **composite** token types · branch switching. That's why typography/shadow stay atomic here and composites live as Figma Styles.

---

## Scope (honoring the locked spec)

Light mode only · `amber`/`warning` provisioned but not built · `accent` not in the
closed intent dict · `lemon/300` + `lemon/600–900` + `radius/300` reserved · no
Responsive collection (web adaptivity stays in MUI/CSS). Every alias in `tokens.json`
resolves to a real primitive, so the build is clean.
