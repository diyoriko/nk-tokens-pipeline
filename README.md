# nk-tokens-pipeline

Novakid design tokens. `tokens/tokens.json` is the source of truth; Style Dictionary
generates `--nk-*` CSS + a `NkColors` Dart class + a typed TS tree, plus a grid CSS layer
and an SVG/React asset bundle. Published as **`@diyoriko/nk-tokens`** (GitHub Packages) and
as a token-catalogue **Storybook** on GitHub Pages
([diyoriko.github.io/nk-tokens-pipeline](https://diyoriko.github.io/nk-tokens-pipeline/)).

> Working rules (branch flow, gates, Tokens Studio) live in **[`CLAUDE.md`](./CLAUDE.md)**.

---

## The pipeline

```
                       ┌─▶ Tokens Studio  ⇄  Figma Variables + Text/Effect/Grid Styles   (designers, sync on `develop`)
tokens.json  (Git) ────┤
  source of truth      └─▶ Style Dictionary ─▶ build/{css,dart,ts} + grid.css + icons ─▶ npm + Storybook   (CI)
```

`tokens.json` is the source of truth in Git. Tokens Studio **pulls** it to materialise
Figma Variables + Styles, and **pushes** designer edits back as a PR to `develop`. CI runs
Style Dictionary to produce the generated outputs (the default package + a capsule package
per team); production (npm + Pages) builds from `main`. See [`CLAUDE.md`](./CLAUDE.md) for
the full branch flow, and [`figma/RUNBOOK.md`](./figma/RUNBOOK.md) for every Figma-side
sync procedure (scopes, brand modes, responsive collection, icons).

**The one naming rule** (the Figma name *is* the contract): `/` → `-`, lowercase, prefix
`--nk-`. Applied per platform — nobody writes platform-specific names.

| Figma Variable | Web (CSS) | Mobile (Dart) | TypeScript |
|---|---|---|---|
| `color/background/brand-violet/primary` | `--nk-color-background-brand-violet-primary` | `NkColors.colorBackgroundBrandVioletPrimary` | `tokens.color.background['brand-violet'].primary` |

---

## Structure

Eight **Tokens Studio sets** in `tokens.json` — six core sets (each becoming one Figma
Variable collection) plus two **team capsule overlays** (the modes on the Figma `Color`
collection — see [`foundations/CAPSULES.md`](./foundations/CAPSULES.md)) — plus two
**code-only** sets (not synced to Figma — Figma can't bind them):

| Set / collection | Tier | Contents |
|---|---|---|
| `Color Primitives` | primitive | 8 hue ramps `100→1000` (`violet · blue · magenta · coral · green · orange · yellow · grey`) + `white` / `black` alpha ramps (overlays, scrims, shadows) |
| `Color` | semantic | `background · text · icon · border` surfaces + `data-viz` (8-series chart palette) + `social` (vendor brand colours) + `gradient` (→ Figma paint styles) — all aliasing primitives |
| `Size` | primitive | `space · radius · stroke · icon · blur · depth · focus` (SDS values 1:1) |
| `Typography Primitives` | primitive | `family` (Mikado) · `weight` (regular/bold) · `size` (10–72) · `line-height` · `letter-spacing` |
| `Typography` | semantic | role Text Styles — `Display · Heading · Body · Label · Caption · Overline` (composites in source → Figma Text Styles) |
| `Effect` | — | `drop-shadow` (100–600) · `inner-shadow` (100–200) → Figma Effect Styles; `backdrop` blur radii + `opacity` scale (roles + 0–100) |
| `Parent Area` | capsule | the **base brand overlay** (violet) — layered into the default build and under every team capsule. In Figma: the default mode of `Color`. |
| `Demo Team` | capsule | worked-example team overlay (magenta rebrand of the shared brand slot) → `@diyoriko/nk-tokens/capsules/demo-team`. In Figma: the `Demo Team` mode. |
| `responsive` *(code-only)* | — | breakpoint grid — `Mobile / Tablet / Desktop / Wide` (from the Brand-book Grids). Drives `build/css/grid.css` + the Figma grid styles. |
| `motion` + `z-index` *(code-only)* | — | duration / easing scales + a stacking scale |

References are written **without** the domain prefix (`{grey.800}`, `{violet.500}`) — Tokens
Studio strips the set name, so the variable is `Grey/800` inside `Color Primitives`. The
build re-injects the domain so CSS names stay `--nk-color-grey-800`.

### Colour — semantic surfaces

- **Background** — 6-variant matrix *(primary, primary-hover, secondary, secondary-hover,
  tertiary, tertiary-hover)* for `base · neutral · brand-{violet, blue, magenta, coral,
  green, orange, yellow} · success · warning · danger · info` (+ `disabled`, `overlay`,
  `scrim`, `frosted`, `selected`).
- **Text / Icon** — `primary / secondary / tertiary` + `on-{intent}` (foreground on a
  coloured fill) + `*-inverse` (on dark surfaces). Hover lives on the background, not on
  text — per SDS practice.
- **Border** — `default` (**3 tiers**: primary / secondary / tertiary) + `focus` +
  per-intent. **No hover token** — states step between tiers.
- **Data-Viz / Social / Gradient** — categorical chart palette · 9 vendor brand colours
  (WhatsApp/Telegram/Facebook/VK/Messenger/X/Viber/LINE/Kakao) · 10 brand gradients (Figma
  paint styles).

The contrast contract (`scripts/check-contrast.mjs`, **100 pairs**) AA-verifies every
`on-*` / text / border pair at build time.

### Design laws (encoded in `$description`)

Main pinned at `/500` · hover steps *away* from its on-colour · white on-text by tier
(on-**primary**: violet + blue only; on-**strong**: all 7 brand hues) · border = 3 tiers, no
hover · text 900 / 600 / 400 (tertiary = decorative) · opacity stored as percent, divided to
a fraction on build.

---

## Quickstart

```bash
# Node 22 (see .nvmrc — Style Dictionary 5 requires >=22)
npm install
npm run build            # tokens + grid + assets → build/
npm run storybook        # build + open the catalogue at localhost:6006
```

```bash
grep background-brand-violet-primary build/css/variables.css
#  --nk-color-background-brand-violet-primary: #6d46fc;   (brand anchor, pinned)
```

---

## Repository map

| Path | What it is |
|---|---|
| **`tokens/tokens.json`** | **Input.** The DTCG token sets (incl. capsule overlays). What Tokens Studio syncs with Figma. |
| `tokens/responsive.json`, `tokens/code-only.json` | Code-only sets (grid breakpoints; motion + z-index). |
| `tokens/scopes.snapshot.json` | Versioned Figma variable scopes (Figma-only data) — enforced by `check-scopes`. |
| `tokens/styles.snapshot.json` | Versioned Figma paint/effect/text styles — enforced by `check-styles`. |
| **`capsules/capsules.config.mjs`** | **The team registry.** One entry per capsule; lint + build + Storybook derive from it. |
| **`build-tokens.mjs`** | Build runner — custom preprocessor/transforms/formats, then Style Dictionary (default + per-capsule). |
| **`style-dictionary.config.mjs`** | SD platform config — css / dart / ts outputs, `--nk-` prefix. |
| `scripts/lint-tokens.mjs` | Pre-build gate: structure, references, formats, 100% semantic descriptions. |
| `scripts/check-capsule-consistency.mjs` | Pre-build gate: capsule registry ↔ token sets ↔ exports coherence. |
| `scripts/check-contrast.mjs` | Contrast contract gate (100 AA/UI pairs; fails closed on missing/non-hex values). |
| `scripts/check-scopes.mjs` | Scope laws + drift vs a live Figma dump (`--live`, `--update`). |
| `scripts/check-styles.mjs` | Figma style laws (name ↔ token mapping) + drift vs a live style dump (`--live`, `--update`). |
| `scripts/check-outputs.mjs` | Output-shape gate: valid Dart consts, inset inner shadows, no NaN/undefined. |
| `scripts/check-capsule-gates.mjs` | Re-runs the contrast contract per capsule package. |
| `scripts/build-grid-css.mjs` | Emits `build/css/grid.css` (`.nk-container` / `.nk-grid` / `.nk-col-*`) from `responsive.json`. |
| `scripts/build-assets.mjs` | `assets/{icons,logo,patterns}/*.svg` → sprite + React components + manifest (icons rebound to `currentColor`). |
| `scripts/export-figma-assets.mjs` | Bulk-pull icons from Figma via REST (needs `FIGMA_TOKEN`; fails on partial export). |
| `build/` | **Output** (generated, git-ignored): `css/{variables,grid}.css`, `dart/nk_colors.dart`, `ts/{tokens.ts,.mjs,.cjs,.d.ts}`, `capsules/<slug>/`, `icons/`, `logo/`, `patterns/`. |
| `.storybook/`, `stories/*.stories.js` | Token catalogue — Colors, Capsules, Spacing, Typography, Shadow, Effects, Gradients, Grid, Motion, Z-Index, Usage. |
| `.github/workflows/` | `build-tokens` (**gate PRs**: all token gates + regression tests + Storybook build), `deploy-storybook` (GitHub Pages, from `develop`), `publish-tokens` (GitHub Packages + Release, on `v*` tag). |

---

## Scripts

| Command | Does |
|---|---|
| `npm run build` | `build:tokens` + `build:assets`. |
| `npm run build:tokens` | **lint** → **capsule consistency** → Style Dictionary build (default + capsules) → grid CSS → **contrast contract** → **scopes laws** → **style laws** → **output shapes** → **capsule gates**. All gates `exit 1` on failure. |
| `npm run build:grid` | Regenerates `build/css/grid.css` from `responsive.json`. |
| `npm run build:assets` | Rebuilds the icon/logo/pattern bundle. |
| `npm run export:icons` | `FIGMA_TOKEN=… npm run export:icons` — pulls icon SVGs from the Figma library. |
| `npm run storybook` / `build-storybook` | Open / build the static catalogue. |

**Inside `build-tokens.mjs`:** `nk/flatten-sets` (re-nests the domain sets, decomposes
composite typography/shadow tokens, re-injects the domain prefix into refs) · `nk/size-px`
(bare-number dimensions → `px`) · `nk/opacity-fraction` (percent → fraction) · `nk/dart-colors`
(`NkColors`, `#RRGGBBAA` → `0xAARRGGBB`) · `nk/ts-nested` (typed `tokens` tree). CSS resolves
aliases to the primitive value (`outputReferences: false`).

---

## Authoring tokens (maintainers)

Add or change a token in **`tokens/tokens.json`** (the only source of truth), then let the gates check you:

1. **Name by role, not value** — `Background/<role>`, `Text/<role>`, `Icon/<role>`, `Border/<role>`. Reference a primitive by alias (`{violet.500}`), never a raw hex. The Figma name *is* the contract (`/` → `-`, lowercase, `--nk-` prefix).
2. **Scope it** — semantics get a single scope (`FRAME_FILL` / `TEXT_FILL` / `SHAPE_FILL` / `STROKE_COLOR`), never `ALL_SCOPES`; primitives stay hidden. Scopes live only in Figma, so they're versioned in `tokens/scopes.snapshot.json` and enforced by `check:scopes` — refresh the snapshot (`node scripts/check-scopes.mjs --live <figma-dump.json> --update`) when you add a scoped variable.
3. **Describe it** — every semantic needs a `$description` (the lint gate requires 100% coverage and the design laws are encoded there).
4. **Run the gates** — `npm run build` chains `lint → build → contrast → scopes`, each `exit 1` on failure. Add the new `on-*` / text / border pairing to the contrast contract if you introduce one.
5. **Branch flow** — edit on a feature branch → PR to `develop`; `main` is the released line (see [`CLAUDE.md`](./CLAUDE.md)). Designers — including teams that want their *own* semantics on top of the primitives — are served by the [designer guide](#designer-guide), not by this section.

---

## Consuming the outputs (devs)

Published as **`@diyoriko/nk-tokens`** to **GitHub Packages** on every `v*` tag.

```ini
# .npmrc in the consumer
@diyoriko:registry=https://npm.pkg.github.com
# GitHub Packages requires auth even for reads:
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

> **Migration planned:** the package will move to the `@novakid` scope on the
> Novakid Nexus registry (`nexus.novakidschool.com`) once devops provisions the
> credentials — see [`CLAUDE.md`](./CLAUDE.md) § Release. Until then it stays
> `@diyoriko` on GitHub Packages (zero production consumers today).
```ts
import '@diyoriko/nk-tokens/css/variables.css';      // injects :root { --nk-* }
import '@diyoriko/nk-tokens/css/grid.css';           // .nk-container / .nk-grid / .nk-col-*
import { tokens } from '@diyoriko/nk-tokens';         // typed token tree
import { Home, HeartFill } from '@diyoriko/nk-tokens/icons/react';
```
```tsx
<Button sx={{ bgcolor: 'var(--nk-color-background-brand-violet-primary)' }} />
```

**Team capsules** — per-team brand packages on the same foundation
([`foundations/CAPSULES.md`](./foundations/CAPSULES.md)):

```ts
import '@diyoriko/nk-tokens/capsules/demo-team/css/variables.css'; // magenta rebrand of the brand slot
import demoTokens from '@diyoriko/nk-tokens/capsules/demo-team';    // typed tree, same shape
```

---

## Storybook showcase

The token catalogue is published to **GitHub Pages** from `develop`:
**https://diyoriko.github.io/nk-tokens-pipeline/**. Every merge to `develop`
redeploys it, so the public showcase always reflects the latest merged work —
no promote-to-`main` needed just to update the catalogue. For in-progress
previews before merging, run it locally with `npm run storybook`.

## Designer guide

**https://diyoriko.github.io/nk-tokens-pipeline/guide/** — the single designer-facing
document: what lives where, how to read a token name, the `On-*` pairing rule, the
own-collection-vs-capsule decision tree, legacy name lookup, and a search over every
token. In Russian, since its readers are the design team.

It is **generated** by [`scripts/build-guide.mjs`](./scripts/build-guide.mjs) from
`tokens.json` + the scopes snapshot + the built CSS, so it cannot drift from the system
it documents — a new token is a new row without anyone editing prose. Built by
`npm run build:guide` into `guide-dist/` (deliberately outside `build/`, so it is never
packed into the npm tarball) and copied into the Pages artifact by `deploy-storybook.yml`.

---

## Scope

Light mode only · 8 colour ramps + alpha · Size / Effects adopted from Figma SDS · responsive
grid (Mobile/Tablet/Desktop/Wide) · dark mode deferred · components are a separate phase.
Every alias resolves to a real token — the build is clean (no dangling `{…}`).
