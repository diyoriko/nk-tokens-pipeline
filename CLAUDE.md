# nk-tokens-pipeline — working rules

Novakid design tokens. `tokens/tokens.json` is the source of truth; Style Dictionary
generates CSS / Dart / TS + grid + assets; published as `@diyoriko/nk-tokens` to GitHub
Packages and as a Storybook on GitHub Pages.

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

## Build & gates

- `npm run build:tokens` = `lint-tokens.mjs` → `build-tokens.mjs` → `check-contrast.mjs` →
  `check-scopes.mjs`. All gates `exit 1` on failure and gate PRs.
- `npm run build` also runs `build:grid` + `build:assets`.
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

## Release

- Tag `v*` on `main` → `publish-tokens.yml` publishes to npm; push to `main` →
  `deploy-storybook.yml` redeploys Pages. Respect ≤3 releases/week.

## Figma

- File `aVwI61IYqufB2gWE6VbwOM` "Novakid DS Foundations". Pages: Foundations (showcases),
  Icons (SDS size topology), Brand Assets, Utilities.
- Gradients live as **paint styles** and shadows as **effect styles** (variables can't hold
  them) — names match the code tokens. The grid system lives as **grid styles**
  (Grid/Mobile · Tablet · Desktop · Wide · Baseline).
