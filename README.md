# nk-tokens-pipeline

---

## The pipeline

```
tokens.json ──▶ Tokens Studio ──▶ Figma Variables + Styles   (designers)
(source, Git)        ▲  │
                Pull │  │ Push
                     │  ▼
   Git (main) ──▶ Style Dictionary ──▶ build/{css,dart,ts} ──▶ npm + Storybook   (CI, on push)
```

`tokens.json` is the source of truth in Git. Tokens Studio **pulls** it to materialise
Figma Variables + Text/Effect Styles, and **pushes** designer edits back as a PR. CI
runs Style Dictionary on every push to produce `--nk-*` CSS, a `NkColors` Dart class,
and a typed TS tree.

**The one naming rule** (the Figma name *is* the contract): `/` → `-`, lowercase,
prefix `--nk-`. Applied per platform — nobody writes platform-specific names.

| Figma Variable | Web (CSS) | Mobile (Dart) | TypeScript |
|---|---|---|---|
| `color/background/brand-violet/primary` | `--nk-color-background-brand-violet-primary` | `NkColors.colorBackgroundBrandVioletPrimary` | `tokens.color.background['brand-violet'].primary` |

---

## Structure — 6 collections (SDS topology)

`tokens.json` holds **6 Tokens Studio sets**, each becoming one Figma Variable
collection:

| Set / collection | Tier | Contents |
|---|---|---|
| `color-primitives` | primitive | 8 hue ramps `100→1000` (`violet · yellow · magenta · blue · green · orange · coral · grey`) + `white` + `black`/`white-alpha` ramps (overlays, shadows) |
| `color` | semantic | `background · text · icon · border` surfaces aliasing the primitives |
| `size` | primitive | `space · radius · stroke · icon · blur · depth` (SDS values 1:1) |
| `typography-primitives` | primitive | `family` (Mikado) · `scale` (01–14) · `weight` (regular/bold) |
| `typography` | semantic | role Text Styles (`title-hero · title · subtitle · heading · body · label`) |
| `effect` | — | `drop-shadow` (100–600) → Figma Effect Styles |

References are written **without** the domain prefix (`{grey.800}`, `{scale.08}`) —
Tokens Studio strips the set name, so the variable is `Grey/800` inside `Color
Primitives`, not `Color/Grey/800`. The build re-injects the domain so CSS names stay
`--nk-color-grey-800` (see [Scripts](#scripts)).

### Colour — semantic surfaces

- **Background** — full 6-variant matrix *(primary, primary-hover, secondary,
  secondary-hover, tertiary, tertiary-hover)* for: `base · neutral · brand-{violet,
  yellow, magenta, blue, green, orange, coral} · success · warning · danger` (+ `disabled`).
- **Text / Icon** — `primary / secondary / tertiary` + `on-{intent}` (foreground on a
  coloured fill). Hover lives on the background, not on text — per SDS practice.
- **Border** — `default` (3 tiers: primary / secondary / tertiary) + `focus` + per-intent. No hover token — states step between tiers (per SDS practice).

All `on-{intent}` pairs are **AA-verified** (white on every status/brand fill ≥ 4.5:1; dark text on yellow 9.65:1).

## Semantic intents — when to use what

Lightweight intent contract (the *meaning*; detailed per-component usage is documented with each component, not here). Variants: **primary** (strong) → **secondary** (light tint) → **tertiary** (lightest); `-hover` = the interactive hover of each.

**Background:** `base` page/card surfaces · `neutral` solid grey component fill (secondary button, chip) · `brand-violet` primary brand fill · `brand-yellow` accent (dark fg) · `brand-{magenta,blue,green,orange,coral}` decorative accents · `success/warning/danger` status surfaces · `disabled` inert.

**Text / Icon:** `default` primary/secondary/tertiary body · `brand-*/success/warning/danger` coloured (links, status) · `on-*` foreground on a coloured fill (e.g. `on-brand-violet` = white on the violet button) · `disabled`.

**Border:** `default` (3 tiers) neutral · `brand-*/success/warning/danger` status · `focus` ring · `disabled`.

---

## Quickstart

```bash
npm install
npm run build:tokens     # tokens.json → build/{css,dart,ts}
npm run storybook        # build tokens + open the catalogue at localhost:6006
```

```bash
grep background-brand-violet-primary build/css/variables.css
#  --nk-color-background-brand-violet-primary: #6d46fc;   (brand anchor, pinned)

grep background-success-primary build/css/variables.css
#  --nk-color-background-success-primary: #007d0b;        (green/700, white text AA 5.33)
```

---

## Repository map

| Path | What it is |
|---|---|
| **`tokens/tokens.json`** | **Input.** The DTCG token set (6 sets above). What Tokens Studio syncs with Figma. |
| **`build-tokens.mjs`** | **The build runner** (`npm run build:tokens`). Custom preprocessor/transforms/formats, then Style Dictionary. See [Scripts](#scripts). |
| **`style-dictionary.config.mjs`** | Style Dictionary platform config — outputs (css/dart/ts), transforms, `--nk-` prefix. |
| `build/` | **Output** (generated, git-ignored): `css/variables.css`, `dart/nk_colors.dart`, `ts/{tokens.ts,.mjs,.cjs,.d.ts}`. |
| `.storybook/`, `stories/*.stories.js` | Token catalogue (Colors, Sizing, Typography, Shadow). |
| `.github/workflows/` | CI: `build-tokens` (rebuild on token change), `deploy-storybook` (Pages), `publish-tokens` (npm on `v*` tag). |

---

## Scripts

| Command | Does |
|---|---|
| `npm run build:tokens` | `build-tokens.mjs`: reads `tokens.json`, resolves aliases, writes `build/{css,dart,ts}` (ts = tokens.ts/.mjs/.cjs/.d.ts). |
| `npm run storybook` | Builds tokens, opens Storybook at `localhost:6006`. |
| `npm run build-storybook` | Builds tokens + a static Storybook into `storybook-static/` (what CI deploys). |

**Inside `build-tokens.mjs`** (all generated output produced here, never hand-edited):
- `nk/flatten-sets` *(preprocessor)* — re-nests the 6 domain sets under their domain
  group, **decomposes** the composite `typography`/`boxShadow` tokens into the flat
  sub-tokens code wants (the composites exist in source only, so Tokens Studio can
  build Figma Text + Effect Styles), and re-injects the domain prefix into references.
- `nk/size-px` *(transform)* — bare-number dimensions (`8`) → `8px` on output.
- `nk/dart-colors` *(format)* — emits `NkColors`; handles `#RRGGBB` and the `#RRGGBBAA`
  alpha ramps (Flutter `0xAARRGGBB`).
- `nk/ts-nested` *(format)* — typed nested `tokens` tree.
- CSS uses `css/variables` with `outputReferences: false` — semantic aliases resolve to
  the primitive value.

---

## Consuming the outputs (devs)

Published as **`@diyoriko/nk-tokens`** to **GitHub Packages** on every `v*` tag
(`.github/workflows/publish-tokens.yml`).

```ini
# .npmrc in the consumer (e.g. parent-mf)
@diyoriko:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}   # PAT with read:packages
```
```ts
import '@diyoriko/nk-tokens/css/variables.css';      // injects :root { --nk-* }
import { tokens } from '@diyoriko/nk-tokens/tokens';  // typed token tree
```
```tsx
<Button sx={{ bgcolor: 'var(--nk-color-background-brand-violet-primary)' }} />
```

> **Production:** re-scope to `@novakid` under the org repo (GitHub Packages requires
> the package scope to match the repo owner).

---

## Tokens Studio setup (designer side)

Git is the source of truth — pull it into Figma, don't hand-build variables:

1. Install the **Tokens Studio** plugin.
2. **Settings → Sync → GitHub** → this repo, branch `develop`, file `tokens/tokens.json`,
   format **W3C DTCG**.
3. **Pull** → all 6 sets load → **Create Variables / Apply to Figma** → Variables +
   Text/Effect Styles materialise.
4. Edit a token → **Push** (PR to `develop`). CI lints + checks contrast on the PR;
   once merged, `develop` is promoted to `main` (prod). Never edit Figma variables
   outside Tokens Studio — it desyncs from Git. See `CLAUDE.md` for the full flow.

---

## Scope (Foundations v1)

Light mode only · 8 generated colour ramps (brand sign-off pending on the generated
steps; real anchors honoured — see `primitive-palette.md` for the real-source audit) ·
Size + Effects adopted from Figma SDS · dark mode deferred · `black`/`white` are the
only alpha ramps (overlays + shadow colour), every other surface colour is solid and
background-independent.

Every alias resolves to a real token — the build is clean (no dangling `{…}`).
</content>
</invoke>
