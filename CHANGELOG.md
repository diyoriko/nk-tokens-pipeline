# Changelog

All notable changes to the published package (`@diyoriko/nk-tokens`) are
documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows the
policy at the bottom of this file.

## [4.0.0] — 2026-07-20

### Removed
- **Depth scale trimmed to the used range.** Removed 8 unused `size/depth`
  tokens — `Depth/800` (32px), `Depth/1200` (48px), and all six negatives
  (`Negative-025/100/200/400/800/1200`). The shipped shadows only ever consumed
  `0 / 1 / 4 / 8 / 12 / 16`px (verified: 0 references to the removed tokens, incl.
  inner shadows), and 48px was too deep for the brand's shadow language. The
  scale is now `Depth/0 · 025 · 100 · 200 · 300 · 400`. The Storybook Depth story
  is token-driven and updates automatically; the Figma "Blur · Depth" spec sheet
  was updated to `Depth 4 / 8 / 16` and the negative row removed.
  > **Tokens Studio follow-up:** these tokens must also be removed in Tokens
  > Studio (source of truth) so the Figma variables drop and the next TS push
  > doesn't re-add them — this changelog covers the code side only.

## [3.0.0] — 2026-07-20

### Removed
- **Award badges dropped** — the `./badges/*` export subpath and the four raster
  badge assets (`badge-roundel/star/rocket/mono`) are removed to keep the package
  **vector-only and lean** (they were embedded-PNG illustrations, ~270 kB). The
  badges remain available in the Figma Brand Assets page; re-add them here only
  if a consumer needs them. Major bump per the versioning policy (a published
  export path was removed) — there were no known consumers of `./badges/*`.

## [2.8.0] — 2026-07-20

### Changed
- **Brand patterns refreshed and replaced.** The pattern set is now the new
  15-pattern collection from Figma (node `547:2118`), replacing the previous
  11 — all shipped as `pattern-01.svg`..`pattern-15.svg`, **all vector**
  (1024×613), no more embedded-raster patterns. Content of `pattern-01..12`
  changes; `pattern-13..15` are new. Each is exported, chrome-stripped, and
  **SVGO-optimised** (`--precision=2`, viewBox preserved) — the halftone
  patterns shrink ~57% with no visible change. `figma/RUNBOOK.md` documents the
  export + optimise step.

## [2.7.0] — 2026-07-20

Full **brand-asset sync with Figma** (Brand Assets page of the DS file), plus
the logo/pattern fixes below. New export subpath `./badges/*`.

> **Package size note:** three patterns (02, 03, 05) and all four badges are
> **raster** illustrations (embedded PNG) in Figma, so they ship as ~52–102 kB
> each. The published tarball grows to ~670 kB (from ~250 kB). The vector marks
> and patterns stay small. If a leaner, vector-only package is preferred, the
> raster assets can be dropped in a follow-up.

### Added
- **Wordmark mark.** The full `NOVAKID` lockup now ships alongside the rocket
  symbol: `logo-wordmark.svg` (fixed violet) + `logo-wordmark-mono.svg`
  (`currentColor`, tintable).
- **Tintable `-mono` logo variants.** `logo-symbol-mono.svg` /
  `logo-wordmark-mono.svg` paint with `currentColor`, so a mark recolours to any
  of the six Figma brand colours (violet · white · black · yellow · green ·
  blue) via CSS `color` — the code equivalent of Figma's colour variants. The
  bare `logo-symbol.svg` / `logo-wordmark.svg` stay fixed violet (drop-in,
  work via `<img>`).
- **Patterns 01, 02, 03, 05, 06, 07** added — the package now ships 11 of the
  12 Figma background patterns (pattern 04 is a Figma symbol that would not
  export via the API; export it manually to complete the set). Previously only
  08–12 shipped.
- **Badges** (`./badges/*`): the four award badges — `badge-roundel`,
  `badge-star`, `badge-rocket`, `badge-mono` — from the Brand Assets page.
- New Storybook stories: Logo (primary + tinted mono), Badges.

### Fixed
- **Logo restored to the real Novakid mark.** The shipped `logo-symbol.svg` had
  lost the inner **"N"** subpath (the letterform knocked out of the rocket body),
  rendering as a solid violet blob. Re-exported from the DS file (node 171:11)
  and cleaned of Figma chrome — the mark now shows the N knockout, matching Figma.
- **Logo & pattern SVGs are cleaned at build time** (`cleanSvgAsset`): Figma
  export chrome (the `#F5F5F5` section rect, oversized page-background rect, and
  frame-border paths) is stripped, and every internal `id` is namespaced per
  file. Figma reuses ids like `clip0_…` / `paint0_linear_…` across exports, so
  inlining two patterns on one page previously made the second reference the
  first's gradient/clip — now collision-proof.
- **`build:assets` is idempotent.** `build/icons/svg`, `build/logo`,
  `build/patterns`, `build/badges` are purged before each write, so a
  renamed/removed asset can no longer linger append-only and ship a stale file
  through the `*` export subpaths.

## [2.6.0] — 2026-07-20

Stays `@diyoriko/nk-tokens` on **GitHub Packages** (same registry as 2.5.1) —
token names, exports, and outputs are unchanged from a consumer's view; this
release is a large **pipeline-hardening + Storybook** pass (see below).

> **Migration deferred.** The repo is pre-wired for a future move to the
> `@novakid` scope on the Novakid Nexus registry (#120), but that move is **not
> started** — it needs a devops-provisioned `NEXUS_NPM_TOKEN` and a
> repo-governance decision (the repo is a personal public repo). Until then
> everything stays on personal infra. When the migration lands it will be its
> own release with the scope/registry change called out.

### Changed
- **Storybook now deploys from `develop`** (GitHub Pages), so the public
  showcase always reflects the latest merged work without a promote-to-`main`.
  The redundant Cloudflare Pages preview workflow was removed (solo repo; local
  `npm run storybook` covers in-progress previews).
- **Number tokens are now real numbers in the TS/JS outputs** (`z-index`,
  responsive `columns`, font weights, unitless line-heights). They were emitted
  as strings (`'1000'`, `'2'`), which broke downstream arithmetic and locked
  the `.d.ts` to string literals. CSS and Dart outputs are unaffected.
- **Gate order**: `grid.css` is now generated before the output gates run, so
  `check-outputs` actually validates it. Previously a fresh (CI) checkout never
  checked grid.css at all, and a malformed `responsive.json` could ship
  `NaNpx` CSS with all gates green.
- Token lint now covers the responsive and code-only token files, not just the
  Tokens Studio sets.
- Capsule overlay merge precedence now follows the capsule registry instead of
  the physical key order of `tokens.json` — reordering sets in the file can no
  longer silently change which set wins a collision (outputs verified
  value-identical before/after).

### Added
- **Gate regression tests** (`tests/gates.test.mjs`, `node --test`) — encode the
  fail-open corruption experiments from the 2026-07-17 review (missing output,
  drifted style value, 3-digit hex, capsule primitive override, missing export
  target, non-currentColor icon) so a future edit that reopens a hole is caught
  in CI. Each restores the tree in `finally`; CI asserts it stayed pristine.
- **Pack + install smoke test** (`tests/pack-smoke.mjs`) — `npm pack`, install the
  tarball into a throwaway project, and resolve EVERY export subpath through
  Node's resolver (ESM import, CJS require, raw-asset paths); proves the core
  surfaces load with react ABSENT (optional peer) and `/icons/react` works with
  it present. Both suites run in `build-tokens.yml`.
- **`license` field** (`UNLICENSED`) and **`sideEffects`** (the CSS entrypoints)
  in package.json — kills the npm "No license field" publish/install warning and
  lets bundlers tree-shake the JS/TS token tree.
- **`scripts/check-exports.mjs`** — a final gate in `npm run build` that expands
  every `package.json` "exports" subpath (including `*` patterns) and fails if
  any target is missing or empty, so a config regression can't publish a package
  whose exports resolve to nothing. Also asserts the icon index/react component
  count stays in sync with the manifest.
- New export subpaths: per-icon SVGs (`./icons/svg/*.svg`) and the capsule
  `tokens.ts` / `dart/nk_colors.dart` outputs (previously built but unreachable).
- Icon **paint gate** in `build:assets`: a cleaned icon may paint only with
  `currentColor`/`none`; literal colours (named like `white`, or `rgb()`) that
  the hex→currentColor rewrite can't catch now fail the build. Three known
  white-paint icons (`question-circle-fill`, `referral`, `referral-fill`) are
  allowlisted pending a Figma knockout redraw (see 2026-07-17 review).
- **Generated React icon components are now robust**: each is a
  `React.forwardRef` (ref works on React <19 too), decorative by default
  (`aria-hidden` + `focusable=false`) but exposed as `role="img"` with an in-SVG
  `<title>` when a `title`/`aria-label` is passed, and `children` are stripped
  before the spread so passing them no longer throws the React
  children-vs-`dangerouslySetInnerHTML` error. Types updated to
  `ForwardRefExoticComponent` with a documented `title` prop.
- Icons showcase story in Storybook — the full icon set is now browsable in
  code, not only in Figma.
- `scripts/check-styles.mjs` — automated value-drift check for Figma paint /
  effect / text styles (the largest previously unchecked parity surface).
  Baseline `tokens/styles.snapshot.json` bootstrapped from a live Figma dump
  (23 text / 8 effect / 10 paint, zero drift) and the laws now run in the
  `build:tokens` gate chain. Procedure in `figma/RUNBOOK.md`.
- `export:icons` accepts `FIGMA_ACCESS_TOKEN` in addition to `FIGMA_TOKEN`.
- Icon export supports Figma Style variant sets (#118); SVG assets refreshed
  from the DS file via the new exporter (#119).

### Fixed
- Docs: stale `~/Documents/Novakid/…` absolute paths updated after the
  2026-07-13 workspace move (audit workflow scripts + foundations docs; dated
  handoffs keep their historical paths with a move note). README build chain
  and repository map now match the #122 gate order (`check-capsule-consistency`,
  grid-before-gates, `check-styles`); the Cloudflare preview section reflects
  that the preview is active, not pending activation.
- **Style-drift gate now checks VALUES, not just names** (`check-styles.mjs`):
  the CI laws pass compares each Figma style's snapshot value (font size /
  line-height / letter-spacing / shadow geometry + colour / gradient stops)
  against the matching `tokens.json` composite — both live in the repo, no
  Figma needed. Previously only the name↔token 1:1 mapping was checked, so a
  composite value change could leave the baseline silently stale with CI green
  (the PARITY-2 hole). The `--live` Figma drift diff is unchanged.
- **`check-outputs.mjs` no longer fails open**: it now REQUIRES the full
  platform file set for the default build and every registered capsule (css /
  dart / ts×4), instead of silently skipping files that don't exist. A platform
  dropped from the Style Dictionary config now fails the gate instead of
  shipping a package with dangling exports.
- **Lint hex tightened to 6/8 digits** (`lint-tokens.mjs`), matching the Dart
  emitter's filter — a 3-digit shorthand hex no longer passes lint only to
  vanish from the Dart output.
- **Capsule overlay containment**: lint now fails if a capsule set carries any
  group other than the semantic surfaces (Background/Text/Icon/Border), closing
  the hole where a capsule could silently override a Tier-1 primitive in its own
  build (capsule sets deep-merge last over the whole colour domain).
- **Capsule `$theme` registration is now a hard failure**, not a warning — a
  capsule with no Tokens Studio team theme can't be previewed by designers.
- Loader glyph re-centered (#121); tintable loader, capsule-registration gate,
  SHA-pinned actions with `persist-credentials` off (#116).
- Empty `Typography` variable collection removed from the Figma file (0
  variables, picker clutter); scopes snapshot updated — 518 variables across
  6 collections.
- Stale unregistered directories under `build/capsules/` are now cleaned by the
  build (they previously shipped in any local `npm pack`).

### Security
- CI secret scoping tightened: the Cloudflare token is no longer exposed as
  job-level env to `npm ci` / build steps in the preview workflow.
- GitHub Private Vulnerability Reporting enabled and documented in SECURITY.md
  as the preferred disclosure channel (second channel next to the maintainer
  email).
- **`npm publish --ignore-scripts`** in publish-tokens.yml: publish no longer
  re-runs `prepack` (a second full build) with `NODE_AUTH_TOKEN` readable by
  every dependency lifecycle script — the same lifecycle-exposure the preview
  workflow already forbids for the Cloudflare token, now closed for the more
  powerful Nexus credential. `files:["build"]` packs the token-free build that
  ran the step before. The tag↔version assert also moved ahead of `npm ci` to
  fail before any dependency code runs.
- preview-storybook triggers now include `capsules/**`, so a capsule-registry
  change refreshes the preview instead of shipping a stale one.

## [2.5.1] — 2026-07-09

### Fixed
- P0 output fixes: valid Dart consts, inset inner shadows, fail-closed gates
  (#110).

### Changed
- Publish guards: tag-on-main only, Node 22, least-privilege CI permissions
  (#111).
- Single team registry (`capsules/capsules.config.mjs`), data-driven grid,
  Capsules Storybook story (#112).
- Toolchain: Style Dictionary 5.5, Storybook 10 + Vite 8 (#102, #107);
  CI actions bumped (Dependabot).

### Added
- Figma runbooks + plugin scripts — reproducible code→Figma write procedures
  (#113).

## [2.5.0] — 2026-07-08

### Added
- **Capsules**: per-team token packages on the shared foundation, shipped as
  `./capsules/<team>` subpaths (#93).
- `BUILD-ON-PRIMITIVES.md` — contract for teams building semantics on Novakid
  primitives (#91).
- Cloudflare Pages Storybook preview for `develop` (#90).

### Changed
- Brand slot moved into per-team overlays (Parent Area / Demo Team); the
  default build is value-identical to the pre-capsule output (#103).
- DS-health fixes: docs, publish gate, CI governance, icon cleanup (#92).

## [2.4.0] — 2026-06-17

### Added
- Full 160-icon set exported from the Figma DS, flat `icon/<cat>/<glyph>`
  naming (#87).

## [2.3.1] — 2026-06-17

### Fixed
- Declare optional `react` peer dependency; expose `./package.json` in exports
  (#84).

## [2.3.0] — 2026-06-17

### Added
- Alpha/White + Alpha/Black semantic ramps, fill + border scoped (#80).
- Darker brand-background Strong tier + `Background/Base/Inverse` (#78).
- `Radius/0` for parity with `Space/0` and `Depth/0` (#77).
- Social colours: Messenger, X, Viber, LINE, KakaoTalk (#75).
- Figma variable scopes versioned in git + CI laws gate + live-drift diff
  (#72).

### Changed
- Background tokens scoped to `FRAME_FILL` only (#79); packaging / CI gating /
  grid Wide / Storybook coverage health fixes (#67).

## [2.2.1 – 2.2.6] — 2026-06-15/16

Six patch releases in two days. In hindsight several were mislabeled under the
policy below — noted here so consumers upgrading across this range know what
moved:

- **Renames (breaking, shipped as patches)**:
  `Text/On-Neutral/Primary` → `Text/Default/Primary-Inverse` (2.2.1, #57);
  `Icon/On-Neutral` → `Icon/Default/Primary-Inverse` + added `Social/Vk`
  (2.2.2, #59).
- **New tokens (minor-worthy, shipped as patches)**: Heading Regular weights
  (2.2.3, #61); `Text/Brand-<hue>/Primary-Inverse` (2.2.4, #63);
  `Text/Brand-<hue>/Secondary` (2.2.5, #65); `Radius/050` (2px) + `Radius/150`
  (6px) (2.2.6, #68).

## [2.2.0] — 2026-06-15

### Added
- Social vendor colours, 10 brand gradients, opacity scale 0–100 (#41).
- Responsive breakpoint set (375/768/1440) aligned to the Brand-book grid, +
  `Breakpoint-Min` (#47, #49).
- Asset pipeline: icons, logos, patterns + grid CSS (#51).
- Token lint gate — makes Tokens Studio edits safe to push (#43).
- Storybook stories: gradients, social, opacity, backdrop, grid (#53).

### Changed
- **Breaking** (shipped as minor): Border restructured to SDS-style 3 tiers
  Primary/Secondary/Tertiary (#33); Text/Icon Tertiary → `Grey/400` (#39);
  Display line-height 120% → 100% (#45).

## Earlier (≤ 2.1.0)

v0.1.0 – v2.1.0 predate this changelog and had no consumers; see git history.
v2.1.0 itself contained a breaking-marked commit (`feat(tokens)!`) in a minor
release. Versions up to and including 2.5.1 were published as
`@diyoriko/nk-tokens` (initially `nk-tokens-pipeline-demo`).

## Versioning policy

Semantic versioning, from the token consumer's perspective — a published token
(CSS variable, TS path, Dart const, icon name, export subpath) is API:

- **Major** — rename or removal of a published token, `$type` change, removed
  or renamed output/export path, package rename or registry move without an
  alias.
- **Minor** — new tokens, new icons, new outputs or export subpaths, and
  **value changes to existing tokens** (the name still resolves, but what
  ships visibly changes — consumers should be able to opt in via their
  lockfile).
- **Patch** — fixes only: an emitted value that didn't match the source of
  truth, broken output shape, packaging or build fixes. No new names, no
  intentional value redesign.

The 2.2.x–2.5.x history did not consistently follow this (renames shipped in
patches, a breaking restructure in a minor). The policy is binding from 2.6.0:
every release gets a changelog entry, and renames ship in a major or not at
all — prefer additive deprecation.

No exceptions. (A paragraph here used to carve one out for a 2.6.0 `@diyoriko`
→ `@novakid` namespace move "as a minor". That release never happened — PR #120
was reverted — so the exception described a history that does not exist, and it
contradicted the Major rule two paragraphs above, which names a registry move
as breaking. Removed 2026-07-23. The real move to `@novakid/design-system` on
Nexus ships as a new package identity starting at 1.0.0.)
