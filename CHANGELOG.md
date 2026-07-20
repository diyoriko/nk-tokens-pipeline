# Changelog

All notable changes to the published package (`@novakid/nk-tokens`, formerly
`@diyoriko/nk-tokens`) are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows the
policy at the bottom of this file.

## [Unreleased] — 2.6.0

First release under the `@novakid` scope on the Novakid Nexus registry.
Consumers of `@diyoriko/nk-tokens` (GitHub Packages) must switch package name
and registry — token names, exports, and outputs are otherwise unchanged.

Why this rename ships as a minor and not a major (documented policy
exception): `@diyoriko/nk-tokens` has no external consumers to break — product
teams explicitly declined to install from the personal registry, and adoption
starts with this Nexus release. The old package stays frozen and installable
at 2.5.1; the version line continues at 2.6.0 in the new namespace so the
release history reads as one sequence. This is a one-time bootstrap exception;
any future rename or registry move follows the Major rule below.

### Changed
- **Package renamed** `@diyoriko/nk-tokens` → `@novakid/nk-tokens`; publish
  target moves from GitHub Packages to the Novakid Nexus npm registry
  (`nexus.novakidschool.com`) (#120). Note: tag v2.5.1 was published under the
  old name — version 2.5.1 exists on both identities with the same content.
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

One documented exception: the 2.6.0 `@diyoriko` → `@novakid` namespace and
registry move ships as a minor because the old package had zero external
consumers (adoption begins with 2.6.0) — see the 2.6.0 entry. With consumers
on Nexus, the same change would be a major.
