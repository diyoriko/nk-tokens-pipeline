# Contributing

`tokens/tokens.json` is the source of truth. Style Dictionary generates the
CSS / Dart / TS outputs, grid, and assets; everything ships as
`@novakid/nk-tokens` on the Novakid Nexus registry. This doc is the distilled
process — [`CLAUDE.md`](CLAUDE.md) holds the full working rules, and
[`docs/USAGE.md`](docs/USAGE.md) covers consuming the outputs.

## Prerequisites

- **Node 22** (`.nvmrc`; Style Dictionary 5 needs ≥22 — Node 20 will install
  fine and then fail the build).
- `npm ci`, then `npm run build` to verify a clean baseline.
- `build/` and `storybook-static/` are git-ignored generated output — never
  commit them. `prepack` regenerates everything on publish.

## Branch flow

```
feature branch ──PR──▶ develop ──promote PR (merge commit)──▶ main (prod)
```

- Every PR targets `develop` (the repo default). Never push or PR straight to
  `main`, and never commit on `main`/`develop` directly — branch first.
- `main` only moves via a promote PR from `develop`, merged with a **merge
  commit, never squashed** — this keeps the two trees identical (enforced by
  the `main-merge-commit-only` ruleset).
- An open CodeRabbit CHANGES_REQUESTED review blocks merge even with 0
  required approvals — fix the findings or dismiss with a reason.

## Build and gates

`npm run build:tokens` runs the full gate chain, in order:

```
lint → capsule-consistency → build (tokens + capsules) → grid → contrast → scopes → styles → outputs → capsule-gates
```

Every gate exits 1 on failure and gates PRs (`build-tokens.yml` is a required
check). The chain is **fail-closed** by design — missing or non-hex contrast
values, invalid Dart consts, non-inset inner shadows, NaN/undefined in any
output are failures. Never weaken a gate to get a PR through; fix the input.
Grid CSS is built before the output gates so it is validated like every other
output.

## Editing tokens (Tokens Studio rules)

- **Edit in Tokens Studio, not in git and not in Figma.** TS syncs to
  `develop` (`tokens/tokens.json`, W3C DTCG format); Push opens a PR. Direction
  is git → Tokens Studio → Figma — never hand-edit Figma variables.
- **Renames happen inside the TS UI** — that keeps the variable ID and
  bindings survive. Renaming in git creates a new variable plus an orphan.
- `lineHeight` in composites must be a percent **string** (`"140%"`); a bare
  number becomes pixels in Figma. Opacity is stored as percent (`40`) and the
  build divides by 100.
- Keep token documentation in `$description` — it flows into Figma.
- Brand modes on the Figma `Color` collection are managed via the Plugin API
  (`figma/RUNBOOK.md`) or TS PRO Themes only — the free "export sets to
  variables" flow duplicates collections; cancel it if offered.

## Requesting a token or a change

Open an issue (or a PR to `develop` if you can express the change in
`tokens/tokens.json` DTCG format). For a new per-team capsule, follow the
checklist in [`foundations/CAPSULES.md`](foundations/CAPSULES.md).

## Release

1. Bump `version` in `package.json` on a feature branch, update
   [`CHANGELOG.md`](CHANGELOG.md) (move Unreleased into a dated section), PR to
   `develop`.
2. Promote `develop` → `main` (merge-commit PR).
3. Tag `v*` on the merge commit — tags are **admin-only**
   (`protect-release-tags` ruleset). `publish-tokens.yml` refuses tags whose
   commit is not on `main` and tags that don't match `package.json` version.
4. The workflow publishes to Nexus and creates the GitHub Release; a push to
   `main` also redeploys the Storybook Pages.

Respect **≤3 releases per week**. Versioning rules (what is major vs minor vs
patch for token consumers) are in [`CHANGELOG.md`](CHANGELOG.md#versioning-policy).
