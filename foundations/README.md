# Foundations — research & decision archive

This folder is the **historical record** of how the Novakid token foundations
were designed (May–June 2026): the real-usage extracts, colorimetry audits,
decision specs, reviews, and handoffs that produced today's `tokens/tokens.json`.
It is not the place to learn the current state of the system.

## Where the current truth lives

| Need | Go to |
|---|---|
| The tokens themselves | [`../tokens/tokens.json`](../tokens/tokens.json) (source of truth) + `../tokens/responsive.json`, `../tokens/scopes.snapshot.json` |
| Build, gates, working rules | [`../CLAUDE.md`](../CLAUDE.md) + [`../CONTRIBUTING.md`](../CONTRIBUTING.md); gate scripts in [`../scripts/`](../scripts/) |
| Consuming the outputs | [`../docs/USAGE.md`](../docs/USAGE.md) + [`../README.md`](../README.md) |
| Browsing the system visually | the Storybook (`npm run storybook`; deployed from `main` via GitHub Pages) |
| Code → Figma procedures (modes, scopes, drift) | [`../figma/RUNBOOK.md`](../figma/RUNBOOK.md) |
| Release history | [`../CHANGELOG.md`](../CHANGELOG.md) |

## Still-current docs in this folder

Two docs here are living references, not archive:

- [`CAPSULES.md`](CAPSULES.md) — the per-team capsule model: shape, gates,
  add/consume checklists.
- [`BUILD-ON-PRIMITIVES.md`](BUILD-ON-PRIMITIVES.md) — the contract for teams
  building their own semantics on the Novakid primitives.

## Historical archive (frozen — read for rationale, not state)

Everything below describes the system as it was at the stamped date. Names,
branch flow, package name, and file locations have changed since; do not follow
their instructions.

| Date | Docs |
|---|---|
| 2026-06-08 | [`HANDOFF-2026-06-08.md`](HANDOFF-2026-06-08.md) — the last full-state handoff (already banner-stamped historical) |
| 2026-06-08/09 | [`COLOR-FOUNDATIONS-DECISION.md`](COLOR-FOUNDATIONS-DECISION.md) — the v4 colour decision that drove the ramp build: canonical hue set, REAL/GEN per-hue ramps, topology map |
| 2026-06-05 | [`REVIEW-BRIEF-foundations-v1.md`](REVIEW-BRIEF-foundations-v1.md) + [`FOUNDATIONS-V1-REVIEW.md`](FOUNDATIONS-V1-REVIEW.md) — the adversarial v1 review (brief + report) |
| 2026-06-04/05 | [`primitive-palette.md`](primitive-palette.md) — REAL-only primitive inventory; [`extract-colors.md`](extract-colors.md) · [`extract-space.md`](extract-space.md) · [`extract-typography.md`](extract-typography.md) · [`extract-shadow.md`](extract-shadow.md) — real-usage extracts from Novakid code and Figma |

Supporting directories:

- [`_audit/`](_audit/) — generated colorimetry and audit artifacts
  (`AUDIT-NUMBERS.md`, ramp regeneration scripts, sweep notes, the multi-agent
  workflow scripts).
- [`_archive/`](_archive/) — superseded drafts and earlier handoffs:
  `final-token-tree.md` (v3 master), `NPA-9291-foundations-spec.md` (original
  spec), `legacy-main-anchors.md`, `FOUNDATIONS-V1.md`, `HANDOFF-2026-06-05.md`,
  `confluence-token-tree.adf.json`, `prep/`, `tokens-studio-sandbox/`.
- [`confluence-push/`](confluence-push/) — the one-off Confluence token-tree
  push tooling (REST + ADF), from the same era.

## Naming conventions that still hold

These originated here and remain true in the live system:

- Reference convention: domain-less in source (`{grey.800}`, `{scale.08}`); the
  build preprocessor re-nests, decomposes composites, and injects the `--nk-`
  prefix.
- No platform-leak terms in Figma names (`px`, `--`, `var()`).
- Step grammar: `100` palest tint → `1000` dark floor; real brand colours
  pinned at their L* step, gaps OKLCH-smooth generated.

_Note: this folder was `design-code/foundations/` before the 2026-06-08 move
into this repo; broader research lives in `~/Documents/Novakid/design-code-research/`._
