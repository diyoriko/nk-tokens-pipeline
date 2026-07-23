# Backlog — nk-tokens-pipeline

Working backlog, derived from the **2026-07-23 multi-agent pipeline audit** (13 dimensions,
180 findings, 174 confirmed by adversarial verification, 6 refuted and dropped). The full
report, the migration plan and the completeness critique live in `reports/review-2026-07-23/`
— git-ignored, because the audit names an unpatched issue and this repository is still public.

Effort: **S** ≈ up to an hour · **M** ≈ half a day to a day · **L** ≈ several days.

---

## Decisions taken (do not relitigate)

| Decision | Value | Why |
|---|---|---|
| Package name | `@novakid/design-system` | Scope already says Novakid, so `nk-` stutters; every neighbouring corporate package (`frontend-core`, `linters`, `ts-types`) has no prefix. Components will land on the `./react` subpath, not in a second package. |
| Repository name | `design-system` on `bitbucket.org/novakidschool` | `-pipeline` is wrong — this repo *is* the design system source. Free to rename now (the Bitbucket repo holds one empty initial commit); costly later. |
| First Nexus version | `1.0.0` | New package identity on a new registry with zero consumers. `@novakid/design-system@5.0.0` would send people looking for versions 1–4 that never existed. History stays in `CHANGELOG.md` under "previously published as @diyoriko/nk-tokens". *(The audit proposed 5.0.0 — it was written before the rename decision and assumed the name stayed `nk-tokens`.)* |
| Token prefixes | `--nk-*` and `NkColors.*` stay | The prefix does real work in a global CSS namespace. Only the package name stutters. |
| Storybook host | `cdn.novakidschool.com/storybook` (bucket) | Offered by Andrey 2026-07-23; Dmitriy confirmed the build command. *(Supersedes the audit's Cloudflare Pages proposal, which was written without that thread.)* Needs: `/storybook` → `/storybook/` redirect, no-cache on `index.html`/`iframe.html`/`index.json`, cache invalidation after upload. |

**Open, needs someone else** — see `reports/review-2026-07-23/REPORT.md` §9 for the full list
with wording. Headline: publish-on-push vs tag trigger, Nexus redeploy policy, whether the
devops publish automation uses `--ignore-scripts`, who is the second admin/reviewer, and who
the first consumer is.

---

## P0 — before the move

Everything here is either a migration blocker or free-only-while-there-are-zero-consumers.

- [ ] **Write `bitbucket-pipelines.yml` ourselves and hand it to Andrey.** Mandatory steps
      *before* publish: `npm ci --ignore-scripts && npm run build && npm test && npm run test:pack`,
      plus a version-existence check that exits 0 with "nothing to publish" when the version is
      already on Nexus. — **M** — closes three blockers at once (M1/M2/M3).
      Rationale, in one line for the ticket: `build/` is git-ignored and `files: ["build"]`, so a
      publish without a preceding build ships a two-file tarball and **exits 0**. Verified: a
      `prepublishOnly` hook does *not* close this — `--ignore-scripts` skips it too. The guarantee
      has to live in the pipeline yml.
- [ ] **Atomic rename commit.** `name` → `@novakid/design-system`, `repository.url` → Bitbucket,
      `publishConfig.registry` → Nexus (or drop it and let the pipeline decide), version `1.0.0`,
      delete the self-contradicting exception paragraph in `CHANGELOG.md:335-338`, sweep every
      `@diyoriko` in `stories/`, `docs/`, `README.md`, and add a `grep` gate so it cannot come back.
      Note `docs/USAGE.md:60` — the documented Flutter onboarding path uses
      `tar -xf diyoriko-nk-tokens-*.tgz` and stops matching after the rename. — **M**
- [ ] **Re-point Tokens Studio sync to Bitbucket** and prove it with a real test Push that opens
      a PR. Update `figma/RUNBOOK.md:28-30`. Bitbucket App Passwords are off since 2026-06-09 —
      an API token is needed. — **M** — the source of truth writing past corporate git is the
      quietest failure mode in the whole pipeline.
- [ ] **Icon component: stop rendering `title` through the innerHTML sink** — render it as a real
      React child, keep the SVG body in a nested `<g>`. Correct `SECURITY.md:3-4`, which claims
      the package "ships no runtime server code and handles no user data" — `build/icons/react.js`
      is runtime code that accepts consumer strings. — **S**
- [ ] **Golden output snapshot.** Commit `tests/__snapshots__/{variables.css,nk_colors.dart,tokens.ts}`
      (or a hash manifest) and fail on drift. — **S** — the audit calls this the highest-leverage
      addition in the repo per unit of effort: today a transform change lands in a PR as *zero*
      changed output lines, because `build/` is git-ignored.
- [ ] **Exposure shutdown sequence for the GitHub repo**, in this order: private (not delete —
      reversible, and it kills the anonymous API and Pages immediately) → mirror to Bitbucket →
      verify with `git rev-list --all --count` → delete the Pages deployment → delete Actions
      artifacts → deprecate then remove the `@diyoriko` package versions → archive. Record the
      result in a ticket. — **M**
- [ ] **`.npmrc` into `.gitignore`** before the first Bitbucket push; regenerate `package-lock.json`
      against the public registry and add a lockfile check to the gate chain. — **S**
- [ ] **Storybook relocation to `cdn.novakidschool.com/storybook`** — agree the redirect and cache
      headers with Andrey, wire the upload into the pipeline, verify before the GitHub repo goes
      private. — **M**

## P1 — first month after the move

- [ ] **`scripts/check-parity.mjs`** — derive the expected symbol set from the token tree and fail
      on any token missing from CSS/TS/Dart, plus cross-platform parity. Cheaper first step: cross-check
      `tokens/scopes.snapshot.json` against `tokens.json` (~20 lines). — **M** — today deleting
      `Size/Radius/100` keeps the entire chain green.
- [ ] **One module per icon** + re-export barrel + `"./icons/react/*"` in `exports` + a size gate.
      — **M** — measured: importing six icons currently costs 54.3 kB gzip because `icons[name]` is a
      dynamic property read no bundler can split.
- [ ] **CJS variants for `icons/index` and `icons/react`** with per-condition types, then
      `attw --pack . --ignore-rules no-resolution` in CI. — **M** — `novakid-parent-mf`'s Jest config
      is node10 resolution; the first component test importing an icon fails today.
- [ ] **Derive the contrast contract from the token tree** with an explicit `EXEMPT` list, and fix
      the five shipped weak combinations. — **M** — currently a hardcoded list of 100 pairs;
      265 of 402 colour variables take part in none.
- [ ] **Harden `check-scopes`** — cross-check against `tokens.json` (mind that `Responsive` lives in
      `responsive.json`), assert the expected collection set and a non-zero minimum, ban `ALL_FILLS`.
      — **S**
- [ ] **`scripts/run-gates.mjs`** — run every gate, aggregate exit codes and stderr, print one report
      instead of one failure per CI round-trip. — **S**
- [ ] **Negative tests for the four uncovered gates**, reusing the exact mutations from the audit. — **S**
- [ ] **eslint on `scripts tests *.mjs`** — 1881 lines that *are* the pipeline currently have no
      automated quality signal at all. — **M**
- [ ] **Dependabot alerts + `npm audit --audit-level=high` in the pipeline.** — **S**
- [ ] **Fix the four false claims in the docs** (`README.md:76-77`, `CLAUDE.md:24-25`,
      `CONTRIBUTING.md:24-25`, `SECURITY.md:3-4`). — **S**

## P2 — this quarter

- [ ] **Real Dart contract** — `pubspec.yaml` + generated `lib/` consumed as a pinned git dependency
      from the same Bitbucket repo, plus `NkSpacing`/`NkRadii`/`NkTextStyles`. — **L** — mobile has
      no delivery path at all today, and that was the pipeline's original motivation.
- [ ] **Semantic layer for space/radius/elevation** — 10–15 tokens, values derived by grepping real
      literals in `novakid-parent-mf/src`. — **M** — the last architectural gap worth closing at
      Novakid's size.
- [ ] **Hue-free brand slot** — rename `Brand-Violet/*` to `Brand/*` and collapse coral→danger,
      green→success, orange→warning, blue→info. — **M** — free while there are zero consumers,
      a major version later. In demo-team, `--nk-color-background-brand-violet-primary` currently
      contains magenta.
- [ ] **rem for typography**, px for geometry; em breakpoints. — **M**
- [ ] **SVGO instead of regex SVG cleaning** in `build-assets.mjs`. — **M**
- [ ] **Name-set snapshot + gate** on removing a `--nk-*` variable without a major and a CHANGELOG
      entry — the cheap equivalent of a deprecation mechanism. — **S**
- [ ] **Storybook `addon-a11y`** + a contrast column next to the swatches. — **M**
- [ ] **Dark mode — only if the product asks.** ~273 values to author plus theme registration; the
      build does not need rewriting. — **L**

---

## Cut — decided against, do not re-add

| Thing | Where | Why |
|---|---|---|
| Duplicate `parent-area` capsule build | `build-tokens.mjs:266-281` | Byte-identical to the root build (`diff -q` across css/dart/ts). ~200 kB of tarball and two export subpaths the consumer must choose between for no reason. |
| `figma/svgo.config.mjs` | — | `svgo` is in no `package.json`, no lockfile, no script, no workflow. A dead config posing as an optimisation guarantee. Delete it or wire it up. |
| `Color.Alpha.*` re-export in CSS/TS | `tokens/tokens.json:1829-1843` | 24 tokens shipping one value under two names. Needed in Figma for scope-hiding, pointless in code. |
| Exception paragraph in the version policy | `CHANGELOG.md:335-338` | Written for the reverted PR #120, describes a release history that never happened, and contradicts `CHANGELOG.md:319-321`. |
| "Just add `prepublishOnly`" | — | Verified on npm 11.11.0 / node 22.22.0: `--ignore-scripts` skips it exactly as it skips `prepack`. |
| "Flip `outputReferences: true` while we're here" | `style-dictionary.config.mjs:33-34` | Not a one-line config change — `check-contrast.mjs` and `check-capsule-gates.mjs` read hex straight out of the built CSS. |
| Migrating with `git push --mirror` | — | Bitbucket already has a devops root commit; `--mirror` force-pushes every ref and deletes what is missing locally. |

---

## Done

- [x] **2026-07-23 — Designer guide**, generated from the tokens and published at
      [`/guide/`](https://diyoriko.github.io/nk-tokens-pipeline/guide/). Folded in and removed two
      docs that answered the same question differently (`foundations/BUILD-ON-PRIMITIVES.md` and the
      designer half of `CAPSULES.md`), plus the hand-written intents story. (#140)
- [x] **2026-07-23 — Full pipeline audit** — `reports/review-2026-07-23/`.
