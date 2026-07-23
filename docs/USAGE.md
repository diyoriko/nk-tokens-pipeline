# Using the design system in code

Package: `@diyoriko/nk-tokens`. One source of truth (Figma → Tokens Studio → this
repo), four consumable layers. Everything below is generated into `build/` and
shipped in the npm package.

> **This page is for engineers.** Designers working in Figma want the
> [designer guide](https://diyoriko.github.io/nk-tokens-pipeline/guide/) instead —
> token naming, the `On-*` pairing rule, own-collection vs capsule, and token search.

> **Install first:** the package lives on **GitHub Packages** — point the
> `@diyoriko` scope at `https://npm.pkg.github.com` in your `.npmrc` with a
> `GITHUB_TOKEN` (see [README § Consuming the outputs](../README.md#consuming-the-outputs-devs)),
> or `npm install` will fail with `E404`/`E401`. (A move to `@novakid` on the
> Novakid Nexus registry is planned but not yet started.)

## Layout model — grid for the page, flex for components (read first)

Two layers, not either/or:

- **CSS Grid for the page scaffold** — the 12 / 8 / 2 column system (`.nk-grid` + `.nk-col-*`).
  Use it whenever blocks must align to the column ruler across breakpoints: page layouts,
  card grids, content + sidebar. Exact and 2-dimensional.
- **Flexbox for component internals** — toolbars, button rows, list items, nav, anything
  arranged in one direction with a gap. This is exactly what Figma **auto-layout** is.

Figma mapping (so design and code match):

| Figma | CSS | Layer |
|---|---|---|
| **Layout grid** (column overlay) | `.nk-grid` / CSS Grid — or just an alignment guide | page |
| **Auto layout** | `display:flex` (direction = gap = padding = fill→`flex:1`, hug→`fit-content`) | component |

The Figma column overlay does **not** lay anything out — it's a ruler you align auto-layout
(flex) content to. So: build with flex inside components, drop them onto the grid for the page.

## 1. Tokens (colour, type, size, effects, opacity)

CSS variables — the default for web:

```css
@import "@diyoriko/nk-tokens/css/variables.css";
.btn { background: var(--nk-color-background-brand-violet-primary); color: var(--nk-color-text-brand-violet-on-primary); }
```

Also available: `@diyoriko/nk-tokens` (TS tree), `/dart/nk_colors.dart` (Flutter — below).

**Working in a team capsule?** Import your team's package instead — same variable
names, your brand slot: `@diyoriko/nk-tokens/capsules/<team>/css/variables.css`
(see [CAPSULES.md](../foundations/CAPSULES.md) and the Storybook *Capsules* story).

### Flutter (Dart)

The Dart output is a single generated file, `build/dart/nk_colors.dart` — one
`NkColors` class of `static const Color` values (colour primitives + semantic
colours, hex only), zero dependencies beyond `dart:ui`. There is no pub.dev
package and no `pubspec.yaml` in this repo (and `build/` is git-ignored), so
pub cannot consume it as a git dependency — **copy the file into your project**
(vendoring is the supported path):

```sh
# From the published package (needs the @diyoriko scope -> GitHub Packages in your .npmrc):
npm pack @diyoriko/nk-tokens
tar -xf diyoriko-nk-tokens-*.tgz package/build/dart/nk_colors.dart
cp package/build/dart/nk_colors.dart <your-app>/lib/tokens/

# Or from source: clone the repo, then (Node 22)
npm ci && npm run build && cp build/dart/nk_colors.dart <your-app>/lib/tokens/
```

```dart
import 'tokens/nk_colors.dart';

Container(color: NkColors.colorBackgroundBrandVioletPrimary);
Text('hi', style: TextStyle(color: NkColors.colorTextDefaultPrimary));
```

The file header marks it generated — never edit it by hand; re-copy on every
token release (pin the version you vendored in a comment). Team capsules ship
their own variant at `capsules/<team>/dart/nk_colors.dart` — same class name,
that team's brand slot.

## 2. Grids (responsive / Brand-book layout)

The Brand-book grid, as CSS. Breakpoints, container, and a 12/8/2 column grid that
switches at `768` / `1280` / `1920` — the same numbers as the Figma grid styles
`Grid/Mobile · Grid/Tablet · Grid/Desktop · Grid/Wide`.

```css
@import "@diyoriko/nk-tokens/css/variables.css"; /* the --nk-responsive-* values */
@import "@diyoriko/nk-tokens/css/grid.css";       /* .nk-container / .nk-grid / .nk-col-* */
```

```html
<div class="nk-container">
  <div class="nk-grid">
    <article class="nk-col-12">hero</article>      <!-- full width -->
    <aside class="nk-col-4">side</aside>            <!-- 4 of 12 on desktop, full on mobile -->
  </div>
</div>
```

Raw breakpoints for your own media queries:
`--nk-responsive-tablet-breakpoint-min` (768), `--nk-responsive-desktop-breakpoint-min` (1280),
`--nk-responsive-wide-breakpoint-min` (1920), `--nk-responsive-desktop-device-width` (1440),
`--nk-responsive-*-columns/-gutter/-margin`.

**Wide tier is code-only.** The fourth tier (`Wide`: min-width 1920, 12 columns,
32px gutter, 160px margin — Brand-book 12-columns XXL) exists in
`tokens/responsive.json` and in everything generated from it (variables,
`grid.css`), but by design has **no mode on the Figma Responsive variable
collection** — Figma carries only Mobile / Tablet / Desktop modes. In Figma the
tier is represented solely by the grid style `Grid/Wide`. So a designer binding
Responsive variables never sees Wide values; in code, use the
`--nk-responsive-wide-*` variables (or `.nk-grid`, which switches automatically
at 1920).

## 3. Icons

Interface icons (160 today — `manifest.json` is the authoritative list), one vector
per concept, 24-grid, colour bound to `currentColor`
(the code analogue of the Figma `Icon/Default/Primary` binding — recolours from CSS
`color:`). The 6 Figma sizes (16–48) are a designer convenience; in code you size one
vector with a prop. Outline is the base name; the bold/filled twin is `<name>-fill`.

**React** (zero runtime deps):
```jsx
import { Home, HeartFill } from "@diyoriko/nk-tokens/icons/react";
<Home style={{ fontSize: 24, color: "var(--nk-color-icon-default-primary)" }} />
```

**Framework-agnostic** (raw strings + names):
```js
import { icons, iconNames } from "@diyoriko/nk-tokens/icons";
el.innerHTML = `<svg viewBox="0 0 24 24" width="24" fill="none">${icons["search"]}</svg>`;
```

**SVG sprite** (no JS):
```html
<svg width="24" height="24"><use href="/path/to/sprite.svg#nk-home"/></svg>
```

`manifest.json` lists every icon name. Social/brand marks are multi-colour and live
separately (not recoloured) — see the Figma `Social` group.

## 4. Logos & patterns (static assets)

`build/logo/*.svg` and `build/patterns/*.svg` ship as files (+ a `manifest.json` each):

```jsx
import symbol from "@diyoriko/nk-tokens/logo/logo-symbol.svg";
<img src={symbol} alt="Novakid" />
```
Patterns are 480×286 brand backgrounds (CSS `background-image`), all shipped as SVG.

## Refreshing assets from Figma

Tokens flow automatically (Tokens Studio → git → build). Icons/logos/patterns are
pulled with a script (needs a fresh Figma token — never the leaked one):

```sh
FIGMA_TOKEN=figd_xxx npm run export:icons   # pull all icon SVGs into assets/icons/
npm run build                                # tokens + grid + assets -> build/
```

`build:assets` strips Figma's section chrome and rebinds icon colour to `currentColor`.
