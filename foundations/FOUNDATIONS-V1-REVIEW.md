# Foundations v1 — adversarial correctness & completeness review (post-PR #11)

> Session 2026-06-05. Method: deterministic colorimetry (`_audit/AUDIT-NUMBERS.md`, computed not guessed) + live Figma (Brand Book + Landing DS via MCP **and** REST/PAT) + code-grep real-usage extracts + a 6-group multi-agent adversarial Workflow (66 agents, every finding skeptically re-verified). Build reviewed: `origin/main` post-#11 — **453 `--nk-*`, 0 dangling**, rebuilt locally and verified. (Note: the local working copy was stale at #8; pulled the real merged file before reviewing.)

## 1. Executive summary

The **architecture is sound and ships green**: SDS topology correctly populated (6 collections, 453 resolved vars, 0 dangling), semantic matrix resolves cleanly, violet anchor `#6D46FC` pinned exact at `violet/600` (5.34:1 vs white), `on-lemon` correctly near-black `#353538` on `#FFE60A` (9.65:1). **But the values are not yet the brand's values, and the doc oversells accessibility.** Headline risks, in order:

1. **Doc↔build divergence that overstates a11y.** `FOUNDATIONS-V1.md §F` / `primitive-palette.md §F` claim success & info text were "resolved 2026-06-05" by brand-approved darks `green/700 #0E7A1E` (5.50) and `blue/600 #1C6FB0` (5.32). In the shipped build: `green/700 = #007D0B` (5.33 — passes, but **not that hex**), `blue/600 = #3782C2` (**4.09 — fails AA text**), and the **`info` intent does not exist at all**. The §F "resolved" narrative is false against the build.
2. **No real brand mid/dark hex survives.** All generated OKLCH ramps; Daisy Bush `#4221B8` (48 code uses), Melrose `#9694FF`, Persimmon `#FF5A56`, Apple `#31C838`, Snake `#19AA20`, Black/TEXT_PRIMARY `#2C2A33`, Periwinkle `#C6D2FF` (ΔE 9.1 drift) all return **0 matches** in `variables.css`. Trustworthy as topology; **needs brand sign-off as values**.
3. **Confirmed AA failures on real text pairs** (tertiary text/icon, secondary-on-tertiary, success-on-tint).
4. **High-traffic + brand-canonical spacing 20px / 40px have no token** — and 20px is an *official Brand Book step*, not just a code value.

## 2. Per-group verdict

| Group | Verdict | Rationale |
|---|---|---|
| **A color-primitives** | **mixed** | Topology+anchors right, ramps perceptually even (ΔL*/ΔE2000 smooth, lemon amber-warm h101→77 correct), but every mid/dark is *generated* — zero real brand hexes survive. Sign-off needed. |
| **B semantic** | **fix** | Resolves; most on-* pass, but tertiary text/icon (2.90), secondary-on-tertiary (4.48), success-on-tint (4.28) FAIL AA; `info` intent missing; danger border 3.17 thin; brand-lemon secondary==primary (dupe). |
| **C size** | **fix** | Radius ok; **space drops 20px & 40px** — 20px is a Brand-Book-defined step *and* the most-used code value; v1 instead adds 2/6/96/160 that the brand spacing scale doesn't list. |
| **D typography** | **fix** | Sizes/roles good, but **line-heights are tighter than the brand** (v1 title 128%/heading 132% vs Brand Book ~135%); **caption role dropped** (real published style in BB+LDS); `body/small-strong` 14/700 missing; subtitle weight 400 unverified vs LDS bold Headings. |
| **E effects** | **fix** | Builds, but ships **raw SDS** values (color `rgba(12,12,13)`, opacity 0.1→0.4) not the brand-extracted shadows (BB "Pop up" 0.16 ceiling, color→tonal ramp); inner-shadow ×6 duplicates drop-shadow and contradicts the extract ("inset = border, don't tokenize"). |
| **F coverage** | **fix** | Real palette fully traced (0 dropped) but build replaces reals with generated; **black 200/300/400 ARE consumed by shadows (keep)**, but white-alpha 100–900 + grey/1000 + black 100/500–1000 are 0-reference (overlay/scrim/dark-mode reserve, no consumer yet). |

## 3. Prioritized fix list (confirmed only)

### CRITICAL — AA failures on real text/icon pairs
| Token | Problem | Fix | Evidence |
|---|---|---|---|
| `text/icon.default.tertiary` | `#98979D` on white = **2.90** — fails AA text AND 3:1 icon UI min | darken to ≥`grey/600` `#7D7C81` (4.14) or relabel decorative-only | AUDIT 300,310 |
| `text.default.secondary` on `bg.base.tertiary` | `#66656A` on `#E3E2E5` = **4.48** (<4.5) | nudge secondary darker (≤#646468) or forbid this pairing in usage docs | AUDIT 299 |
| `text.success.primary` on `bg.success.secondary` | `#007D0B` on `#BBF5B7` = **4.28** — the natural success-text-on-tint pairing | success-on-tint → `green/800 #005F06`, or darken the tint | AUDIT 286 |

### HIGH
| Token | Problem | Fix | Evidence |
|---|---|---|---|
| `color.*.info.*` (whole intent) | doc says info "resolved" via `blue/600 #1C6FB0` (5.32); build has **no info tokens** and real `blue/600 #3782C2` = **4.09 fails** | add `info` backed by a real ≥4.5 dark, or delete the §F claim | grep info=∅; 4.09 recomputed |
| §F green/blue darks | doc hexes `#0E7A1E`/`#1C6FB0` are **not in the build** (`#007D0B`/`#3782C2`) — doc/build mismatch on load-bearing colours | reconcile doc↔tokens to one set of values | build grep=0 |
| `size.space.500 (20)` + `space.1000 (40)` | **missing.** 20px = Brand Book official step (frame 6:5027) **and** most-used code value (384 uses); 40px = 102 uses; decision D2 said "keep 20, don't round" | add `space/500=20`, `space/1000=40` | BB Spacing frame; extract-space §2/3 |
| color-primitives (generated mids/darks) | brand fidelity: no real LDS/BB mid/dark hex in build; Periwinkle drifts ΔE 9.1, Lime ΔE 6.3, Daisy Bush gone | per-hue brand sign-off: pin real Mains/Darks or accept smooth gen | grep=0; ΔE table AUDIT 337-361 |

### MEDIUM
| Token | Problem | Fix | Evidence |
|---|---|---|---|
| typography line-heights | v1 title **128%** / heading **132%** are tighter than Brand Book headings **~135%** (H1 60/lh80.8, H2 48/lh64.7, H3 36/lh48.5, H5 20/lh26.9) | raise title/heading lh toward 135% or confirm the tighter values are intended | BB Typography frame 59:402 (live) |
| `typography.caption` (role) | **dropped.** Caption 12px is a real published style in Brand Book ("Description" 12/125%) AND Landing DS ("Caption", "Caption \| LC"); v1 has scale-01=12 but no caption role | add `caption` role (12/400/125%) + bold variant | BB 59:402, LDS /styles (26) |
| `effect.*shadow*` color+opacity | raw SDS (`#0C0C0D`, 0.1→0.4) vs brand-extracted (tonal-ramp colour, 0.08→0.16, BB pop-up 0.16); brand shadows are lighter; BB "Pop up shadow" (y8/b36/0.16) lost | re-point colour to tonal primitive, re-grade alpha to 0.08→0.16; restore an xl≈BB pop-up | extract-shadow §1/2 |
| `effect.inner-shadow.100–600` | invented ×6, values identical to drop-shadow; extract says inset = border trick, not a shadow tier (don't tokenize) | drop inner-shadow tiers or justify with real usage | extract-shadow §"out of scope" |
| `typography.body.small-strong` (14/700) | real LDS role `Body 14 Bold` (`smallBoldTextStyle`) has no token | add `body/small-strong` 14/700/140% | extract-typography 41,136 |
| `border.danger.default` | `coral.500 #FC5754` = **3.17** — clears 3:1 by 0.17, thinnest of any border | use `coral.600 #D93B3B` (4.53) for headroom | AUDIT 334 |
| alpha ladders (partial dead weight) | **black 200/300/400 ARE used by shadows (0.1/0.2/0.4 → 12 refs) — keep.** Unused: white-alpha 100–900 (0), black 100 + 500–1000 (0), grey/1000 (0). These are overlay/scrim/dark-mode reserve with no consumer yet. | Keep black 200/300/400. For the rest: keep as documented "reserved for overlay/scrim/dark" **or** trim until those semantics land — don't cut the shadow-bearing black steps. | grep tokens.json: black.200=4, .300=6, .400=2; white.100–900=0; black.100/500–1000=0 |

### LOW
| Token | Problem | Fix | Evidence |
|---|---|---|---|
| `orange` warning text | passes (5.89) but real Orange Dark clears AA by only 0.07 | designer eye for body copy | AUDIT 287,326 |
| `color/white` | resolves to 8-digit `#FFFFFFFF` in alias table | normalize to `#FFFFFF` unless alpha intended | AUDIT 129,205 |
| primary-step inconsistency | brand primary = 600 (violet/magenta/coral) vs 700 (green/orange/blue), AA-driven; magenta(4.54)/coral(4.53) on-white razor-thin | document the rule or normalize | AUDIT brand on-* |

## 4. Refuted / false positives (checked & dismissed)
- **violet/600 drifted** — refuted; pinned exact, 5.34. ✅
- **on-lemon fails AA** — refuted; `#353538` on `#FFE60A` = 9.65. lemon-on-white (1.27) is accent-only *by design*.
- **lemon/300 fails AA = bug** — refuted; documented accent-only, brand question not defect.
- **body/medium 16/400 missing** — refuted; present (140%).
- **white/black alpha VALUES wrong** — refuted; intentional SDS overlay/shadow practice. (But they're *unreferenced* — that completeness gap stands, see MEDIUM.)
- **status fills fail white text** — refuted; success 5.33 / warning 5.89 / danger 4.53 all pass.

## 5. Brand sign-off questions
1. **Generated ramps (the big one):** approve OKLCH-smooth mids/darks wholesale, or pin real Mains/Darks (Daisy Bush `#4221B8`, Melrose `#9694FF`, Apple `#31C838`, Snake `#19AA20`, Periwinkle `#C6D2FF` — biggest drift ΔE 9.1)?
2. **Dropped real tones:** OK that TEXT_PRIMARY `#2C2A33`, Daisy Bush, Persimmon, Heliotrope no longer exist as exact token values?
3. **Lemon amber-warming** (dark steps gold not olive, 101°→77°): brand-correct?
4. **`info` intent:** real need? If yes, which blue dark backs it (needs ≥4.5; current 4.09 fails)?
5. **Subtitle weight = 400:** confirm regular (LDS publishes 32/40 as **bold** Headings).
6. **Heading/title line-height:** brand book is ~135%; keep v1's tighter 128/132% or align to 135%?
7. **Caption role:** re-add (it's a real published BB+LDS style)?
8. **Effect shadows:** SDS-generic (current) or brand-extracted (lighter, tonal-colour, BB pop-up)?
9. **Spacing:** restore 20px/40px (brand-canonical + most-used); keep or cut 2/6/96/160px?

## 6. Figma sweep status
- **Confirmed live (color):** Brand Book swatches + Landing DS colour Variables match `primitive-palette.md` 1:1 (MCP + REST). Brand Book **Spacing** (4·8·12·16·20·24·32·48·64) and **Typography** (~135% lh, Caption 12/125%) pulled via PAT — desktop MCP couldn't list those pages.
- **No Figma variable source** for size/type/effects anywhere in the space → code (`parent-mf`) extracts are the authoritative real-usage for C/D/E.
- **Pending:** product-screen sweep (Web app / Games / Mobile / Parent-area) — blocked on a **work-account** PAT (`projects:read` + `file_variables:read`); the personal PAT 403s on org project 50498235. Once provided: enumerate project files → pull styles/variables/nodes → used-but-untokenized matrix per product surface.
