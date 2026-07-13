# nk-tokens-pipeline — working rules

Novakid design tokens. `tokens/tokens.json` is the source of truth; Style Dictionary
generates CSS / Dart / TS + grid + assets; published as `@novakid/nk-tokens` to the
Novakid Nexus npm registry (nexus.novakidschool.com, needs the `NEXUS_NPM_TOKEN` repo
secret) and as a Storybook on GitHub Pages.

## Branch flow (do not bypass)

```
feature branch ──PR──▶ develop ──promote PR (merge commit)──▶ main (prod)
```

- **`develop` is the integration branch and the repo default.** Tokens Studio syncs here;
  every PR targets `develop`. CI lints + checks contrast on the PR (`build-tokens.yml`).
- **`main` is production.** It only moves via a **promote PR from `develop`, merged with a
  MERGE commit — never squashed.** That keeps `main` and `develop` trees identical and
  `develop` never behind in content.
- **Never push or PR straight to `main`.** Never edit on `main`/`develop` directly — the
  pre-commit hook blocks it; branch first.
- `gh pr create --fill` uses the CURRENT branch — pass `--head` explicitly in any chain
  that `git checkout`s mid-way.
- The `protect-main-develop` ruleset requires **0 approvals**, but an open CodeRabbit
  **CHANGES_REQUESTED** review still blocks merge. Fix the findings and let it re-review
  (or dismiss the review with a reason) — don't try to force-merge around it.

## Build & gates

- `npm run build:tokens` = `lint-tokens.mjs` → `check-capsule-consistency.mjs` →
  `build-tokens.mjs` (default + capsules) → `check-contrast.mjs` → `check-scopes.mjs` →
  `check-outputs.mjs` → `check-capsule-gates.mjs`.
  All gates `exit 1` on failure and gate PRs (fail closed: missing/non-hex contrast values,
  invalid Dart consts, non-inset inner shadows, NaN/undefined in outputs are failures).
- `npm run build` also runs `build:grid` + `build:assets`. The PR gate also builds Storybook.
- Node 22 (`.nvmrc`; workflows read `node-version-file`) — Style Dictionary 5 needs ≥22.
- `build/` and `storybook-static/` are **git-ignored** — never commit generated output.
  `prepack` regenerates everything on publish.

## Scopes

Figma variable **scopes** (which property pickers a variable appears in) live only in Figma —
Tokens Studio doesn't export them. They're versioned in `tokens/scopes.snapshot.json` and
enforced by `scripts/check-scopes.mjs`:
- **Laws** (run in `build:tokens`, no Figma needed): primitives hidden (`scopes=[]`), semantics
  scoped to their surface (Text→`TEXT_FILL`, Icon→`SHAPE_FILL`, Border→`STROKE_COLOR`,
  Background/Social→a fill), and **no `ALL_SCOPES`** anywhere.
- **Drift** (run after a Tokens Studio re-import / scope change): dump live scopes via the
  Figma plugin/MCP, then `node scripts/check-scopes.mjs --live <dump>` to diff; `--update`
  refreshes the snapshot. CI can't fetch this on the Pro plan (REST variables API is
  Enterprise-only), so the snapshot is refreshed by hand and reviewed in the PR diff.

## Tokens Studio

- Sync target = **`develop`**, file `tokens/tokens.json`, format **W3C DTCG**.
- Edit in TS → **Push** (opens a PR to `develop`). Never hand-edit Figma variables outside
  TS — it desyncs from Git. `$description` flows into Figma; keep all token docs in
  `$description`, not typed into Figma by hand.
- Renames: rename inside the TS UI (keeps the variable ID, bindings survive). Renaming in
  git makes a new variable + an orphan.
- `lineHeight` in composites must be a percent **string** (`"140%"`) — a bare number
  becomes pixels in Figma. Opacity is stored as percent (`40`) and the build divides by 100.
- **Brand modes** on the Figma `Color` collection (`Parent Area` / `Demo Team`) are managed
  via the Plugin API (`figma/add-brand-mode.figma.js`, see `figma/RUNBOOK.md`) or Tokens
  Studio PRO Themes ONLY. The free TS "export sets to variables" flow can't write modes and
  would **duplicate** the brand vars into new collections — cancel it if offered.

## Release

- Tag `v*` on `main` → `publish-tokens.yml` publishes to Nexus **and creates the GitHub
  Release** (generated notes); push to `main` → `deploy-storybook.yml` redeploys Pages.
  Respect ≤3 releases/week.
- Guards (rulesets + workflow): `v*` tags are admin-only (`protect-release-tags`); publish
  refuses tags whose commit is not on `main`; promote PRs to `main` can only be **merge
  commits** (`main-merge-commit-only` ruleset enforces the law above).

## Figma

- File `aVwI61IYqufB2gWE6VbwOM` "Novakid DS Foundations". Pages: Foundations (showcases),
  Icons (SDS size topology), Brand Assets, Utilities.
- Gradients live as **paint styles** and shadows as **effect styles** (variables can't hold
  them) — names match the code tokens. The grid system lives as **grid styles**
  (Grid/Mobile · Tablet · Desktop · Wide · Baseline).
- `npm run export:icons` talks to the Figma REST API and needs a personal access token
  (`FIGMA_TOKEN` / `FIGMA_ACCESS_TOKEN`); the MCP OAuth session does not cover it.
