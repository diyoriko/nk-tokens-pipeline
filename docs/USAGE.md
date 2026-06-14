# Using the design system in code

Package: `@diyoriko/nk-tokens`. One source of truth (Figma → Tokens Studio → this
repo), four consumable layers. Everything below is generated into `build/` and
shipped in the npm package.

## 1. Tokens (colour, type, size, effects, opacity)

CSS variables — the default for web:

```css
@import "@diyoriko/nk-tokens/css/variables.css";
.btn { background: var(--nk-color-background-brand-violet-primary); color: var(--nk-color-text-brand-violet-on-primary); }
```

Also available: `@diyoriko/nk-tokens` (TS tree), `/dart/nk_colors.dart` (Flutter).

## 2. Grids (responsive / Brand-book layout)

The Brand-book grid, as CSS. Breakpoints, container, and a 12/8/2 column grid that
switches at `768` / `1280` — the same numbers as the Figma grid styles
`Grid/Mobile · Grid/Tablet · Grid/Desktop`.

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
`--nk-responsive-desktop-device-width` (1440), `--nk-responsive-*-columns/-gutter/-margin`.

## 3. Icons

160 interface icons, one vector per concept, 24-grid, colour bound to `currentColor`
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
Patterns are 480×286 brand backgrounds (CSS `background-image`). Heavy halftone
patterns ship as @2× PNG; the rest are SVG.

## Refreshing assets from Figma

Tokens flow automatically (Tokens Studio → git → build). Icons/logos/patterns are
pulled with a script (needs a fresh Figma token — never the leaked one):

```sh
FIGMA_TOKEN=figd_xxx npm run export:icons   # pull all icon SVGs into assets/icons/
npm run build                                # tokens + grid + assets -> build/
```

`build:assets` strips Figma's section chrome and rebinds icon colour to `currentColor`.
