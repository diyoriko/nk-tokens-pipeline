# Figma-side runbook

Every procedure that touches the Figma file (`aVwI61IYqufB2gWE6VbwOM` — *Novakid DS
Foundations*) and can't run in CI, in one place. Until 2026-07 these lived only in
chat sessions — this directory makes them repo-owned.

**How to run the `*.figma.js` scripts:** they are Figma **Plugin API** snippets, not
Node. Run them either through the Figma MCP server (`use_figma`, code pasted verbatim)
or in the Figma desktop console (Plugins → Development → Console). They need edit
access to the file, nothing else — no REST token, works on the current (non-Enterprise)
plan. Read-only scripts are safe to run anytime; write scripts say what they mutate.

| Script | What | Status |
|---|---|---|
| `dump-scopes.figma.js` | read-only inventory: collections, modes, per-variable scopes (input for `check-scopes --live`) | **run-verified 2026-07-09** |
| `apply-scopes.figma.js` | write: set scopes on variables from a pasted snapshot | written from the patterns used to build the file — dry-run first |
| `add-brand-mode.figma.js` | write: add a team mode to the `Color` collection (copies Parent Area values) | written from the B2 migration session — dry-run first |
| `set-responsive-modes.figma.js` | write: sync the `Responsive` collection (3 modes) from `tokens/responsive.json` values | written from the collection's original build — dry-run first |

---

## 1. Designer pushed tokens in Tokens Studio (Figma → code) — routine

Nothing to do here: TS opens a PR to `develop` (`tokens/tokens.json`, DTCG), CI gates
it. **If the push added or renamed variables**, refresh the scopes snapshot (§3) after
setting scopes on the new variables (§4).

TS sync config (verified in file plugin data): provider `github`,
repo `novakidschool/novakid-design-system`, branch `develop`, path `tokens/tokens.json`,
format `dtcg`.

## 2. Code changed tokens — designer updates Figma (code → Figma)

1. Merge the PR into `develop` first (gates must pass).
2. In Tokens Studio: **Pull from GitHub** (develop) → review the diff in TS →
   **Update variables** (TS keeps variable IDs — bindings survive; renames must be
   done in the TS UI, never in raw git, or Figma gets a new variable + an orphan).
3. Styles (Text/Effect): TS **Export styles** with the repo's export settings
   (`createStylesWithVariableReferences: true`, `renameExistingStylesAndVariables:
   true`, `removeStylesAndVariablesWithoutConnection: false` — verified live).
4. New variables arrive **without scopes** → §4, then §3 to re-snapshot.

## 3. Scopes drift check / snapshot refresh

Scopes live only in Figma (TS doesn't export them), so they're versioned in
`tokens/scopes.snapshot.json` and CI enforces the LAWS on every build. The DRIFT
check against live Figma is manual:

```sh
# 1. run figma/dump-scopes.figma.js (read-only) → save returned JSON to a file
#    OUTSIDE tokens/ (e.g. /tmp/figma-live.json — a stray JSON in tokens/ is guarded
#    against, but don't tempt it)
# 2.
node scripts/check-scopes.mjs --live /tmp/figma-live.json            # diff
node scripts/check-scopes.mjs --live /tmp/figma-live.json --update   # refresh snapshot
# 3. commit the snapshot diff via a normal PR
```

Run after: any TS push that adds variables, any manual scope change in Figma.

## 4. Set scopes on new variables

Edit the intended scopes into `tokens/scopes.snapshot.json` first (that file is the
contract), then run `apply-scopes.figma.js` with the snapshot pasted in — it sets
`variable.scopes` to match, collection by collection, and returns what changed.
Laws (enforced by CI): primitives `[]`, Text→`TEXT_FILL`, Icon→`SHAPE_FILL`,
Border→`STROKE_COLOR`, Background/Social→fill scopes, never `ALL_SCOPES`.

## 5. Add a team (brand capsule) — Figma side

Code side is [`foundations/CAPSULES.md`](../foundations/CAPSULES.md) (registry +
exports). Figma side:

1. Designer creates the team's Token Set in TS (aliases only) and pushes.
2. Run `add-brand-mode.figma.js` — adds a mode named after the team to the `Color`
   collection, seeded with Parent Area values; then the overlay values are applied
   by TS pull or by hand in Figma's variable editor (small set — the brand slot).
3. Re-snapshot scopes (§3) — mode changes don't affect scopes, but the TS push that
   created the set may have.

⚠️ Manage brand modes via this script / the plugin API, **not** via free Tokens
Studio's Token-Sets-as-collections export — that would duplicate the sets into
separate collections instead of modes.

## 6. Responsive collection (breakpoints)

`tokens/responsive.json` is code-owned (not synced by TS). If its values change,
run `set-responsive-modes.figma.js` (paste the new values) so the Figma `Responsive`
collection (modes Desktop / Tablet / Mobile) and the grid styles stay truthful.

## 7. Icons refresh (Figma → repo)

```sh
FIGMA_TOKEN=figd_… npm run export:icons   # REST export; fails on partial export/collisions
npm run build                              # normalise + rebuild bundle
```

Needs a **fresh PAT** (file-read scope only; both old PATs are dead since 2026-07-03 —
mint a new one in Figma → Settings → Personal access tokens). No-PAT alternative: the
MCP/plugin path can export components via `exportAsync` — slower, use only if REST is
unavailable.

## 8. Gradients / shadows / grid styles

Gradients live as **paint styles**, shadows as **effect styles**, the grid as **grid
styles** — Figma can't hold them as variables. Source of truth = `tokens/tokens.json`
composites; TS recreates the styles on push (§2.3). Value drift is enforced by
`scripts/check-styles.mjs` against `tokens/styles.snapshot.json` — see §9 for the
dump/refresh ritual.

## 9. Style drift check / snapshot refresh (text · effect · paint)

The check-styles script §8 asked for. Style *values* (font size/weight/line-height,
shadow x/y/blur/spread/color, gradient stops/angle) live only in Figma — TS recreates
styles on push but nothing re-checks them after a manual edit — so they're versioned
in `tokens/styles.snapshot.json` and enforced by `scripts/check-styles.mjs` (laws:
unique names, 1:1 mapping to the tokens.json composites). The DRIFT check against
live Figma is manual, same rhythm as scopes (§3):

```sh
# 1. run figma/dump-styles.figma.js (read-only) in the Figma console / MCP
#    → save the returned JSON to a file OUTSIDE tokens/ (e.g. /tmp/figma-styles.json)
# 2.
node scripts/check-styles.mjs --live /tmp/figma-styles.json            # diff
node scripts/check-styles.mjs --update /tmp/figma-styles.json          # refresh snapshot
# 3. commit the snapshot diff via a normal PR — the diff IS the review
```

Run after: **any style edit in Figma**, any TS push that touches Typography / Effect /
gradient tokens, and **before a release**. If the snapshot is missing the gate fails
with these exact steps — `--update` also bootstraps the very first snapshot.

## 6. Brand assets (logo / patterns / badges) — export from Figma

Unlike tokens (which flow through Tokens Studio), the brand assets under
`assets/{logo,patterns,badges}/` are exported **by hand** from the DS file's
**Brand Assets** page and cleaned by `scripts/build-assets.mjs` (`cleanSvgAsset`
strips Figma frame chrome + namespaces internal ids). To add/refresh one:

1. In the Figma desktop app, select the component variant (e.g. `brand/pattern`
   → `Pattern=NN`, or `brand/logo` → `Mark=Wordmark, Colour=Violet`).
2. Export as **SVG** → drop the file into the matching `assets/<group>/` dir
   with the target filename (`pattern-NN.svg`, `logo-*.svg`, `badge-*.svg`).
3. **Optimise** vector exports with SVGO (keeps `viewBox`), especially the
   halftone patterns (~57% smaller, no visible change):
   `npx svgo@3 --config figma/svgo.config.mjs -f assets/patterns` (or per file).
4. `npm run build` — `cleanSvgAsset` removes the export chrome automatically;
   verify in Storybook (`Assets/Brand`).

### Pattern set (refreshed 2026-07-20)

The `brand/pattern` component set was rebuilt from the new 15-pattern collection
(Figma frame `New Patterns`, node `547:2118`) — the previous 12-variant set
(which had an empty `Pattern=04` slot) was removed. The set now has variants
`Pattern=01`..`Pattern=15` (all 1024×613 vector), matching
`assets/patterns/pattern-01..15.svg` one-to-one in reading order. The old
`New Patterns` staging frame is kept as reference and can be deleted once the
component set is confirmed.

To add or refresh a pattern later: edit the variant in the `brand/pattern`
component set, then export → SVGO (above) → `assets/patterns/pattern-NN.svg` →
rebuild. Keep the code filenames and the Figma variant numbers in sync.
