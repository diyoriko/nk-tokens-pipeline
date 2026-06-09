# Novakid Design Tokens — Foundations (home)

Single entry point for the Novakid colour/size/type/effect **token foundations**: where the tokens live, how they're structured, the decisions behind them, and the **design ↔ code sync** process.

> Topology = Figma SDS collections · Values = Novakid (Landing DS + Brand Book + product code). Git is the source of truth.

## Layout — everything tokens lives in this repo
This folder (`foundations/`) lives **inside the token repo** `~/Documents/Novakid/nk-tokens-pipeline` (its own git → remote `github.com/diyoriko/nk-tokens-pipeline-demo`). One home for both the buildable tokens and their docs:
- `../tokens/tokens.json` — **source of truth** (Tokens Studio sets: `color-primitives`, `color`, `size`, `typography-primitives`, `typography`, `effect`).
- `../build/` — generated `--nk-*` CSS / Dart / TS (gitignored). Build: `node build-tokens.mjs` from the repo root.
- `../` Storybook token catalogue (deploys to GitHub Pages from `main`).
- `foundations/` (here) — the **docs + analysis + sync process**.

Research lives separately in `~/Documents/Novakid/design-code-research/`.

## Read first
- **`HANDOFF-2026-06-08.md`** — current state + full remaining plan + gotchas. **Start here in a new session.**
- **`COLOR-FOUNDATIONS-DECISION.md`** — the authoritative v4 colour spec: canonical hue set, per-hue ramp REAL/GEN, gaps, topology map, completeness matrix, Q1–Q5 resolutions. **Drives the ramp build.**

## Doc index
| Group | Files |
|---|---|
| **Spec / decision** | `COLOR-FOUNDATIONS-DECISION.md` (v4 authoritative) · `final-token-tree.md` (v3 master, being superseded) · `NPA-9291-foundations-spec.md` (original spec) |
| **Real inventory** | `primitive-palette.md` (real-only swatches, L*/contrast, legacy→token) · `legacy-main-anchors.md` |
| **Real usage** | `extract-colors.md` · `extract-space.md` · `extract-typography.md` · `extract-shadow.md` (parent-mf code grep, SVG-filtered) |
| **Review** | `REVIEW-BRIEF-foundations-v1.md` · `FOUNDATIONS-V1.md` (build summary + changelog) · `FOUNDATIONS-V1-REVIEW.md` (deep review report) |
| **Generated audit** | `_audit/` — `AUDIT-NUMBERS.md` (colorimetry), `analyze.mjs`, `regen-ramps.{mjs,json}`, `REGEN-RAMPS.md`, `FIGMA-SWEEP-NOTES.md`, `workflows/` (the multi-agent run scripts) |
| **Handoffs** | `HANDOFF-2026-06-08.md` (current) · `HANDOFF-2026-06-05.md` |
| **Sync outputs** | `confluence-push/` (push.py + ADF) · `confluence-token-tree.adf.json` · `tokens-studio-sandbox/` · `prep/` |

## Design ↔ code sync pipeline (git is source of truth)
```
edit tokens.json (in nk-tokens-pipeline) → push main
   ├─ deploy-storybook Action → GitHub Pages           (auto on push to main)
   ├─ git tag v1.0.0 → publish-tokens Action → npm @diyoriko/nk-tokens   (needs the TAG)
   ├─ Tokens Studio (Figma plugin): Pull main → Create Variables / Apply → Figma Variables + Text/Effect Styles
   └─ confluence-push/push.py → Confluence Token Tree 7253… (REST + Atlassian token)
   → Slack announce
```
**Direction = git → Tokens Studio → Figma.** Never hand-edit Figma variables; pull from git and apply.

## Conventions
- Reference convention: domain-less in source (`{grey.800}`, `{scale.08}`); the build preprocessor re-nests + decomposes composites + re-injects the `--nk-` prefix.
- No platform-leak terms in Figma names (`px`, `--`, `var()`).
- Step grammar: `100` palest tint → `1000` dark floor. Real brand colours pinned at their L* step; gaps OKLCH-smooth GEN.

_Note: this folder was `design-code/foundations/` before the 2026-06-08 rename to `design-code-research/foundations/`._
