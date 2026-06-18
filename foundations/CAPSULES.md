# Capsules — per-team token packages

A **capsule** is a per-team token package: the shared Novakid foundation
(primitives + base semantics) plus that team's own semantic layer, built into
its own output and npm subpath. One foundation, many capsules, each independent.

This is the "scales sideways" model: a new team = a new capsule, with **zero
change** to the foundation or to any other team.

## The shape

```
Foundation (you own)            ← primitives: Color/Type/Size/Effect + base semantics
   ▲ alias            ▲ alias
Parent Area        Demo Team     ← capsules: a Token Set that overrides/extends the base
   │                  │
@nk/tokens         @nk/tokens
(default `.`)      ./capsules/demo-team
```

- **Parent Area** is the first capsule and is the current default semantics —
  no overlay. It re-emits the core under `./capsules/parent-area` so every team
  (including the original) has a stable per-capsule subpath.
- **Demo Team** is a worked example: a 2-token overlay that swaps the violet
  brand primary for magenta, proving per-capsule divergence end-to-end.

## Where each piece lives

| | Figma | Tokens Studio | Code |
|---|---|---|---|
| Foundation | primitive collections (published, scope-hidden) | sets `Color Primitives` … (status **source** in a capsule theme) | base, in every capsule |
| Capsule | the team's semantic collection (aliases primitives) | a Token Set (e.g. `Demo Team`) + a **theme** in the `team` group | overlay set in `tokens.json` |
| Package | — | the theme = the packaging unit | `build/capsules/<slug>/` → `./capsules/<slug>` |

The capsule's semantic set lives in **`tokens.json`** (so designers own it in
Tokens Studio) and appears as a **theme** under the `team` group — switch the TS
theme to "become" that capsule.

## Why the default package is safe

The default build (`@diyoriko/nk-tokens` `.` entry → `build/css|dart|ts`) is the
**core** build and is **byte-identical** no matter how many capsules exist. Its
preprocessor (`nk/flatten-sets`) only ingests the sets in its `SET_DOMAIN`;
capsule sets are unknown keys to it, so it ignores them. Capsule builds use a
separate preprocessor (`nk/flatten-sets-capsule`) that adds the one active
capsule set, deep-merged last so it wins, and write only to
`build/capsules/<slug>/` (never into `build/css|dart|ts`).

Proven on every build: the 6 canonical files are diffed against a pre-change
baseline and must be identical (see the PR's verification).

## Add a capsule (checklist)

1. **Designer (Figma/TS):** create a Token Set for the team (e.g. `Team B`),
   each token an **alias** of a primitive. Push to `develop`.
2. **Registry:** add `{ slug: 'team-b', name: 'Team B', set: 'Team B' }` to
   [`capsules/capsules.config.mjs`](../capsules/capsules.config.mjs).
3. **Lint:** add `'Team B'` to `CAPSULE_SETS` in
   [`scripts/lint-tokens.mjs`](../scripts/lint-tokens.mjs) (it joins
   `KNOWN_SETS` + `SET_DOMAIN` automatically).
4. **Exports:** add the `./capsules/team-b` block to `package.json` `exports`.
5. **(Optional) TS theme:** add a `team`-group theme to `tokens.json` `$themes`
   so it shows in the Tokens Studio theme switcher (string-aware edit only —
   never `JSON.stringify` the whole file; it reorders integer-keyed ramps).

`npm run build:tokens` then emits the capsule's package and gates its contrast.

## Consume a capsule (engineer)

```js
import tokens from '@diyoriko/nk-tokens/capsules/team-b';        // primitives + Team B semantics
// or CSS:
// @import '@diyoriko/nk-tokens/capsules/team-b/css/variables.css';
```

## Gates

Two tiers, both in `build:tokens`:

- **Tier 1 (unchanged):** `lint-tokens` (tokens.json structure, refs, `$themes`),
  `check-contrast` (the core palette), `check-scopes` (Figma laws).
- **Tier 2 (per capsule):** `check-capsule-gates` runs the contrast contract
  against each `build/capsules/<slug>/css/variables.css`, so a capsule override
  that breaks an on-*/text/border pair fails the build. Runs last, so a capsule
  failure never masks a core regression.

Set `NK_CAPSULES=0` to skip capsule builds (faster canonical-only CI).

## Notes / limits

- Capsule count drives build time linearly (each is a full Style Dictionary
  pass). Fine for a handful of teams; revisit if it grows large.
- Capsule overlays should stay under the `Color` set (the flattener maps them to
  the `color` domain; Dart only emits `color` tokens).
- The capsule registry is the source of truth for the build; the `$themes`
  entries are for Tokens Studio UX only.
