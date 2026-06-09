# Foundations — Colour Primitives extract (Tier 1 `color/<hue>/<step>`)

> Source for grammar: Confluence "Tokens arch & naming" (signed off by eng). **Figma name is the contract.**
> Code mapping: swap `/`→`-`, lowercase, prefix `--nk-`. e.g. `color/violet/600` → `var(--nk-color-violet-600)`.
> Inputs reconciled: `BB_fills.json` (Brand book swatches) · `parent-mf/src/theme/colors.ts` · `NPA-9290-colour-prep.md` · live grep over `parent-mf/src`.
> Date: 2026-06-04. These are **Tier 1 primitives**: raw, 1 mode, hidden from publish, never used directly in designs. Semantic aliases (Tier 2) point here.

## Method notes (read before trusting the counts)

**Usage counts have two flavours and they disagree by an order of magnitude.** Raw `grep` over `src` is dominated by **SVG illustration fills** (a single character/avatar SVG repeats a hex dozens of times). The prep doc's headline numbers (`#FFE60A`=461, `#FF5A56`=263) are raw all-file counts. The **token-relevant** signal is the **non-SVG** count (`.ts/.tsx/.css/.scss/.js/.jsx`), which reflects real styling demand.

| hex | raw (all files) | code-only (non-SVG) | comment |
|---|---|---|---|
| `#6d46fc` violet | 78 | **8** | canonical brand; low code count because brand is mostly applied via existing constants/aliases, not raw hex |
| `#4221b8` daisy bush | 407 | **48** | high — but mostly SVG; 48 real code uses still material → keep as violet/700 region |
| `#210a74` persian indigo | 103 | **32** | violet/900 |
| `#9694ff` melrose | 1000 | **18** | the 1000 is almost entirely SVG illustration noise |
| `#c76ef2` heliotrope | 102 | **1** | essentially illustration-only in code |
| `#ffe60a` lemon | 461 | **11** | canonical; raw count inflated by SVG |
| `#ff5a56` persimmon | 263 | **26** | coral canonical |
| `#2c2a33` black | 123 | **12** | grey/900 candidate (see decision) |
| `#31c838` apple | 813 | **23** | green canonical-ish; raw inflated by SVG |
| `#79fd7f` lime | 192 | **10** | |
| `#c6d2ff` periwinkle | 108 | **9** | |
| `#ff9f1b` amber | 12 | **0** | **all 12 are inside SVGs** — zero code-styling use. Reinforces: amber is illustration, not a styling token yet. |

Takeaway: brand demand is real but applied indirectly; the "big" hexes are illustration assets. I report **code-only** as the meaningful `usageCount` in the JSON, and keep the prep doc's raw figures only where the prep doc cited them (deprecation evidence).

---

## Step → lightness model

Ramp is ordered **LIGHT → DARK**, step `50` lightest … `900` darkest. Placement is by **perceived lightness (CIE L\*)**, computed from each hex. Approximate L\* band per step (tuned to anchors):

| step | target L\* band |
|---|---|
| 50 | 96–99 |
| 100 | 92–96 |
| 200 | 85–92 |
| 300 | 75–85 |
| 400 | 63–75 |
| 500 | 52–63 |
| 600 | 42–52 |
| 700 | 30–42 |
| 800 | 20–30 |
| 900 | 8–20 |

Anchors locked by decision: **violet/600 = `#6D46FC`** (L\*≈45), **lemon/400 = `#FFE60A`** (L\*≈91 — see lemon note, the step number is brand-anchored, not lightness-derived).

---

## color/violet — primary brand ramp

| step | hex | legacy name | L\* | usage (code/raw) | note |
|---|---|---|---|---|---|
| 50  | `#F7F5FF` | Magnolia | 97 | 5 / 18 | lightest tint; backgrounds, hover surfaces |
| 100 | `(generate)` | — | ~94 | — | generate between Magnolia and Melrose |
| 200 | `(generate)` | — | ~88 | — | generate |
| 300 | `#9694FF` | Melrose | 66* | 18 / 1000 | **see hue decision** — periwinkle-leaning; placed as violet/300 if kept in family. *L\* 66 sits high for a "300" because it is a desaturated periwinkle; if it stays in violet it is a light tint |
| 400 | `#C76EF2` | Heliotrope | 61* | 1 / 102 | **see hue decision** — magenta-leaning; weak fit for violet. If kept, violet/400, but flag |
| 500 | `(generate)` | — | ~53 | — | generate between violet/400 and the 600 anchor |
| 600 | `#6D46FC` | **Violet (CANONICAL)** | 45 | 8 / 78 | **ANCHOR.** Brand primary. AA 5.34:1 vs white |
| 700 | `#4221B8` | Daisy Bush (deprecated swatch, **kept as ramp step**) | 29 | 48 / 407 | **hover/pressed** darker step for violet/600. See note below |
| 800 | `(generate)` | — | ~22 | — | generate between Daisy Bush and Persian Indigo |
| 900 | `#210A74` | Persian Indigo | 14 | 32 / 103 | darkest violet |

**Violet hover/pressed (task 3):** `#6D46FC` (violet/600) is the resting brand. The natural darker steps for interactive states:
- **hover** → `violet/700` ≈ `#4221B8` (Daisy Bush region, L\* 29). This is the same hex that is *deprecated as a named brand swatch* but **survives as a ramp step** — the deprecation is about not calling it "Daisy Bush / brand-dark" in designs, not about deleting the tone.
- **pressed** → `violet/800` (generate, between `#4221B8` and `#210A74`).
Semantic layer (Tier 2) wires these as `color/background/brand/hover` → `violet/700`, `…/pressed` → `violet/800`.

---

## color/grey — greyscale ramp

| step | hex | legacy name | L\* | usage (code/raw) | note |
|---|---|---|---|---|---|
| 50  | `#FAFAFA` | Alabaster | 98 | 1 / 2 | |
| 100 | `#F4F4F4` | Wild Sand | 96 | 3 / 7 | |
| 200 | `#E2E1E7` | Mischka | 90 | 4 / 5 | slightly violet-tinted neutral |
| 300 | `#C6C6C6` | Silver | 80 | 5 / 13 | |
| 400 | `(generate)` | — | ~63 | — | generate (gap between Silver L*80 and Jumbo L*47) |
| 500 | `#706F74` | Jumbo | 47 | 3 / 3 | mid grey |
| 600 | `(generate)` | — | ~38 | — | generate |
| 700 | `#484848` | Outer Space | 31 | 2 / 4 | |
| 800 | `#2C2A33` | Black | 18 | 12 / 123 | code's `COLOR__GREY_BLACK` / `TEXT_PRIMARY` |
| 900 | `#1A1A1A` *(recommended)* or `#2C2A33` | — | 9 / 18 | — | **DECISION below** |

**grey/900 decision (task 2): recommend `#1A1A1A`.**
- Two candidates: `#2C2A33` (from `colors.ts`, the real `TEXT_PRIMARY`, L\*≈18) and `#1A1A1A` (from the WCAG prep doc, L\*≈9).
- The prep doc already computed lemon↔`#1A1A1A` = ~13.7:1 (AAA) and uses `#1A1A1A` as the reference "grey/900" for the **load-bearing `on-lemon` constraint**. The whole near-black-on-lemon accessibility rule is anchored to `#1A1A1A`.
- **Recommendation:** make `grey/900 = #1A1A1A` (true near-black, the on-lemon anchor) and keep `#2C2A33` as **`grey/800`** (the existing brand "Black", slightly violet, where `TEXT_PRIMARY` currently lives). This gives the ramp a real darkest step *and* preserves the in-use code tone one step up. `color/text/default` → `grey/800` (`#2C2A33`, current behaviour, no regression); `on-lemon` foreground → `grey/900` (`#1A1A1A`, AAA).
- White (`#FFFFFF`) is **not** part of the grey ramp — it is its own primitive `color/white` (semantic `color/background/*/default` references it). Greyscale starts at Alabaster/50.

---

## color/lemon — secondary brand / accent ramp

| step | hex | legacy name | L\* | usage (code/raw) | note |
|---|---|---|---|---|---|
| 50  | `#FFF8DF` | Gin Fizz | 98 | 7 / 8 | pale "lemon chiffon"; prep flags it could be neutral — keep as lemon/50 tint |
| 100 | `(generate)` | — | ~95 | — | generate (`#FFEB91` region, see deprecation) |
| 200 | `(generate)` | — | ~93 | — | generate (`#FFE873` region) |
| 300 | `(generate)` | — | ~92 | — | generate (`#FFE357` ×22 region — **confirm with brand** it's a tint, not a dupe of 400) |
| 400 | `#FFE60A` | **Lemon (CANONICAL)** | 91 | 11 / 461 | **ANCHOR.** Step is brand-anchored, not lightness-derived (pure lemon is intrinsically light, L\*≈91) |
| 500 | `(generate)` | — | — | — | a darker, more saturated lemon if a deeper accent is ever needed |
| 600–900 | `(generate, optional)` | — | — | — | lemon has no dark family in the brand; likely **not built**. Dark foregrounds on lemon come from `grey/900`, not from a dark lemon |

**LEMON CONSTRAINT (WCAG, load-bearing — carry into Tier 2):** lemon fails on white (1.27:1). Lemon is **background/accent only, paired with a DARK foreground**. `color/text/*/on-lemon` and `color/icon/*/on-lemon` **MUST be near-black (`grey/900` = `#1A1A1A`), never white.** A lemon button gets a near-black label. Bake into the `on-lemon` semantic tokens.

---

## color/coral — red/coral ramp (Persimmon family)

> Named **coral** (role), not "red", to keep it distinct from the `danger` *intent* and from the amber/warning hue. Persimmon is the brand's warm coral accent.

| step | hex | legacy name | L\* | usage (code/raw) | note |
|---|---|---|---|---|---|
| 50  | `#FFF3F3` | Chablis | 97 | 2 / 2 | palest coral wash |
| 100 | `(generate)` | — | ~92 | — | generate |
| 200 | `(generate)` | — | ~85 | — | generate |
| 300 | `(generate)` | — | ~75 | — | generate |
| 400 | `#FF5A56` | Persimmon | 61 | 26 / 263 | coral anchor (no formal canonical step decided — placed by L\*) |
| 500 | `(generate)` | — | — | — | generate; darker coral for hover/pressed + AA text-on-white (Persimmon at L*61 likely fails AA as text) |
| 600–900 | `(generate)` | — | — | — | generate dark coral steps for `danger` intent if coral backs it |

---

## color/green — green ramp (success family)

| step | hex | legacy name | L\* | usage (code/raw) | note |
|---|---|---|---|---|---|
| 50  | `#E9FBF0` | White Ice | 97 | 6 / 16 | |
| 100 | `#DBF4DA` | Light Green | 94 | 1 / 1 | |
| 200 | `#B1FEB5` / `#BEEABC` | Mid / Mint | 93 / 89 | 1 / 1 ; 1 / 1 | **two very close legacy tones** (Mid L*93, Mint L*89). Recommend Mid `#B1FEB5` as 200, Mint `#BEEABC` as 250-ish → fold to **one**; keep Mid, deprecate Mint into 200 |
| 300 | `#79FD7F` | Lime | 90* | 10 / 192 | *high L\* but very saturated; sits as a light-mid green |
| 400 | `(generate)` | — | ~80 | — | generate (gap between Lime L*90 and Apple L*71) |
| 500 | `#31C838` | Apple | 71 | 23 / 813 | primary green / success candidate |
| 600 | `#19AA20` | Snake | 61 | 4 / 13 | darker green; hover/pressed for Apple |
| 700–900 | `(generate)` | — | — | — | generate dark greens for AA text-on-white success (Apple/Snake at L*71/61 fail AA as small text on white) |

---

## color/blue — blue ramp (info family, light only today)

> All three legacy blues are **light backdrops**; there is no dark blue in the brand. Blue is currently a backdrop/info accent. Dark steps `(generate)` if blue ever backs an `info` intent that needs text contrast.

| step | hex | legacy name | L\* | usage (code/raw) | note |
|---|---|---|---|---|---|
| 50  | `#E1F3FE` | Patterns Blue | 95 | 6 / 23 | |
| 100 | `#CAE5F5` | Light Blue Backdrop | 90 | 1 / 1 | course-catalog banner bubbles |
| 200 | `#C6D2FF` | Periwinkle | 85 | 9 / 108 | **see hue decision** — periwinkle is blue-violet (HSL h≈227); could live in violet/blue boundary. Placed in blue as a light periwinkle |
| 300–900 | `(generate)` | — | — | — | generate; no brand dark blue exists |

---

## color/amber — warning ramp (SEPARATE from lemon)

> **Not lemon.** The amber/gold cluster (HSL hue ~34–49, orange-leaning) is a candidate **`warning`** intent ramp, kept distinct from lemon (hue ~54, pure yellow). **None of these are confirmed brand tokens** — all amber uses are inside SVG illustrations (code-only count = 0). Provisioned but flagged for a brand decision before building.

| step | hex | source | L\* | usage (code/raw) | note |
|---|---|---|---|---|---|
| 200 | `#FFD000` | prep cluster | 85 | 0 / 1 | |
| 300 | `#FFCC3E` / `#FFB450` | prep cluster | 84 / 79 | 0 / 2 each | |
| 400 | `#FF9F1B` | prep cluster (most-used amber) | 74 | **0** / 12 | the "primary" amber if a warning ramp is built |
| 500 | `#FF9800` | prep cluster | 72 | 0 / 2 | material-orange; likely a stray |
| others | `#FFBE00`,`#FFBC00` | prep cluster | — | 0 / 1 each | near-dupes of FFD000 region |
| 50/100/600–900 | `(generate)` | — | — | — | generate if warning ramp is approved |

---

## Decisions flagged for the designer (task 4)

1. **Heliotrope `#C76EF2`** — own magenta hue **or** `violet/400`? It is magenta-leaning (HSL h≈280 vs violet h≈253) and has **1 code use** (illustration-only otherwise). *Recommendation:* do **not** force into the violet ramp as a styling step; either give it its own `color/magenta/*` hue (if it earns semantic use) or treat it as illustration-only and leave it out of Tier 1. Provisionally parked at violet/400 with a flag.
2. **Melrose `#9694FF`** — periwinkle in `violet` **or** `blue`? HSL h≈241 (true violet-blue boundary), 18 code uses. *Recommendation:* keep in **violet** as `violet/300` (it reads as a light violet tint in product), not blue. Flag for confirmation.
3. **Periwinkle `#C6D2FF`** — `blue/200` **or** `violet` boundary? h≈227 (more blue than Melrose), 9 code uses. *Recommendation:* keep in **blue/200**.
4. **Amber cluster as `warning`** — build a `color/amber` ramp, or drop (all illustration, 0 code-styling use)? *Recommendation:* **provision the name, do not build rows yet**; confirm with brand whether `warning` is a real semantic need. Never fold into lemon.
5. **grey/900** — `#1A1A1A` (recommended, on-lemon anchor) vs `#2C2A33` (in-code). See grey section. *Recommendation:* `#1A1A1A` as 900, `#2C2A33` as 800.
6. **Green Mid `#B1FEB5` vs Mint `#BEEABC`** — near-duplicate light greens. *Recommendation:* keep **Mid** as `green/200`, deprecate Mint into it.
7. **Lemon `#FFE357` (×22)** — distinct lighter yellow or dupe of canonical? *Recommendation:* treat as `lemon/300` tint pending brand confirmation (per prep doc).
8. **`#FFF8DF` Gin Fizz** — `lemon/50` or neutral? Prep flags it. *Recommendation:* `lemon/50`.

---

## Deprecation map (task 5) — retired hex → canonical step

| retired hex | code uses (prep) | → maps to | note |
|---|---|---|---|
| `#4221B8` Daisy Bush | 48 (407 raw) | `color/violet/700` | retired as a **named brand swatch / brand-dark**; tone survives as the violet hover step. Name by role: `color/background/brand/hover`, not "Daisy Bush" |
| `#FFE606` | 4 | `color/lemon/400` | near-identical; almost certainly a typo of `#FFE60A` |
| `#FFE357` | 22 | `color/lemon/300` *(confirm)* | biggest real yellow dupe; provisional lighter tint pending brand confirm |
| `#FFE873` | 8 | `color/lemon/200` | lighter |
| `#FFEB91` | 5 | `color/lemon/100` | light |
| `#FFE255` | 2 | `color/lemon/400` | |
| `#FFF8DF` Gin Fizz | 8 | `color/lemon/50` *(or neutral)* | very pale; flagged |
| `#BEEABC` Mint | 1 | `color/green/200` | folds into Mid `#B1FEB5` |

**Amber cluster is NOT a deprecation into lemon** (`#FF9F1B`, `#FFCC3E`, `#FFB450`, `#FF9800`, `#FFD000`, `#FFBE00`, `#FFBC00`) — separate `warning`/`amber` decision, see §amber.

---

## Collection topology reminder (for the Figma file)

- Tier 1 primitives above → **1 mode, hidden from publish**, in the dedicated **Foundations** file.
- Tier 2 Semantic colour (`color/{surface}/{intent}/{variant}`) aliases these primitives; modes light + (dark?).
- `Semantic/Landing`, `Semantic/Games`, `Semantic/Mobile` = provisioned skeleton (names locked, rows later).
- Never put `px`, `--`, `var()`, or `theme.spacing()` in a Figma name.
- Phase-2 `component/{component}/{property}/{variant}/{state}` aliases Semantic — documented, not built now.
