# Novakid Primitive Colour Palette — REAL-ONLY, CLEAN 50→900 cadence (Figma Variables → Primitives collection)

> **Status:** REAL-ONLY primitive inventory on a **clean 50→900 cadence**. Every value below is a colour that physically exists in a Novakid source — the live Landing DS (LDS) colour Variables (pulled `get_variable_defs` 2026-06-04) and/or the Brand Book (BB) named swatches. **Nothing is generated.** Steps use the **standard ladder only** — `{50,100,200,300,400,500,600,700,800,900}`; **no half-steps** (no 75/150/250/350/850). Gaps in the ladder (a missing step in a hue) are expected and correct: where no real brand colour sits at a lightness band, the step is simply **absent** — never invented to fill it.
> **Naming:** generic hue + numeric step — `color/<hue>/<step>`, light→dark. Eight hues + `color/white` as its own primitive: **violet, blue, magenta, green, lemon, coral, orange, grey**. Marketing names (Persian Indigo, Daisy Bush, Heliotrope, Persimmon…) are **not** token names — they live in the legacy→token lookup (§D) so nothing is lost.
> **Merge rule:** when two or more real shades land in the same step band, **one** is kept as the canonical token and the rest are **merged** (not dropped) — they appear in §D / §E pointing at the nearest step, marked `(merged → color/<hue>/<step>)`. Canonical priority: **(1) brand anchor → (2) "Main"/most-used shade → (3) Brand-Book-named shade.**
> **Anchor:** `violet/600 = #6D46FC` (Brand Book Violet — the brand anchor; NOT in the LDS colour Variables). Held at **600** even though its L\* (45.2) sits at the top of the 500 band.
> **Date:** 2026-06-04. Companion to `final-token-tree.md` (the right-sized build set); see §G for how they differ.

---

## A. Intro — generic-hue + clean step, real-only, merge near-dups

**Generic hue + step (not marketing names).** Marketing swatch names ("Persian Indigo", "Daisy Bush", "Melrose", "Persimmon", "Heliotrope") describe *one specific shade* and don't compose into a system: Persian Indigo + Daisy Bush + Melrose + the Violet anchor + Magnolia are all the same blue-violet hue at different lightnesses, and a designer can't tell from the name which is the dark step of which ramp. Re-naming to `color/<hue>/<step>` gives one ordered ladder per perceptual hue, with `step` rising as the colour darkens. A rebrand re-shades a step in place; every consumer follows with no rename.

**Clean cadence + real-only.** This document was re-mapped from the earlier half-step inventory to a **clean 50→900 cadence**: only the ten standard steps are allowed, no 75/150/250/350/850. Every step's value is still a **real source colour** already in the palette — no new or interpolated hexes. Where the half-step doc used an in-between rung to keep two near-identical reals monotonic, those reals are now **merged** into one canonical step (§D/§E), so the cadence is clean *and* nothing real is discarded. The opposite discipline to `final-token-tree.md`, which is *right-sized* and adds **generated** intermediate steps (e.g. `green/700` success-text dark) where the semantic layer needs a colour the brand doesn't publish. Use this palette to (1) seed the Figma *Primitives* collection with values you can trust 100%, and (2) see which ramps have an accessibility gap a brand-approved dark must fill later (§F).

**How steps are assigned.** Within each hue every real colour is sorted by **measured CIE L\*** (light→dark) and dropped into its **nearest standard step band**:
`50 ≈ 95–99 · 100 ≈ 89–94 · 200 ≈ 77–87 · 300 ≈ 63–73 · 400 ≈ 53–62 · 500 ≈ 45–52 · 600 ≈ 40–45 · 700 ≈ 26–34 · 800 ≈ 17–24 · 900 ≈ 7–15`.
When two or more reals land in the same band, one is kept canonical (priority order above) and the others are merged. **Steps are non-contiguous** — a hue uses only the bands where it actually has a colour. The one fixed point is `violet/600 = #6D46FC`; every other violet step is placed around it by L\*.

**Contrast.** `vs-white` = WCAG contrast ratio of the colour against `#FFFFFF` (sRGB relative luminance). A colour is `aaTextOk` if its ratio ≥ **4.5:1** (AA normal text). For each hue §F checks whether the *darkest real step* clears that bar — if not, the hue needs a brand-approved dark before it can carry text on white.

---

## B. The eight ramps

> `[ Step | Token | Hex | Legacy name(s) → source | L* | vs-white ]`. L\* = CIE L\* (D65, sRGB). vs-white = WCAG ratio on white. **Anchor** = brand-locked. Gaps in the step column are intentional (no real colour at that band). Standard steps only.

### B.1 color/violet — blue-violet brand spine (h ≈ 252)
Collapsed from five overlapping purple sources: BB Magnolia + LDS Melrose ramp + LDS Daisy Bush ramp + LDS Persian Indigo ramp + the BB Violet anchor. All placed by L\*. The LDS' own primary purple is Daisy Bush #4221B8 (→ violet/700); the **brand anchor stays BB Violet #6D46FC at violet/600**. Three same-band collisions merged (100, 500, 900) — see §D.

| Step | Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---|---:|---:|
| 50 | `color/violet/50` | `#F7F5FF` | Magnolia (BB) **+ Melrose Light (LDS) merged** | 96.9 | 1.08 |
| 100 | `color/violet/100` | `#ECE9F8` | Daisy Bush Light (LDS) **+ Persian Indigo Light merged** | 93.0 | 1.19 |
| 200 | `color/violet/200` | `#C2C1FF` | Melrose Mid (LDS) | 80.1 | 1.70 |
| 300 | `color/violet/300` | `#9694FF` | Melrose Main (LDS) = Melrose (BB) | 65.7 | 2.63 |
| 400 | `color/violet/400` | `#917ED6` | Daisy Bush Mid (LDS) | 57.8 | 3.41 |
| 500 | `color/violet/500` | `#6968B3` | Melrose Dark (LDS) **+ Persian Indigo Mid merged** | 47.2 | 4.96 |
| 600 | `color/violet/600` | `#6D46FC` | **Violet (BB anchor)** — brand; held at 600 | 45.2 | **5.34** |
| 700 | `color/violet/700` | `#4221B8` | Daisy Bush Main (LDS) = Daisy Bush (BB); LDS primary purple | 28.7 | 9.81 |
| 800 | `color/violet/800` | `#2E1781` | Daisy Bush Dark (LDS) | 19.1 | 13.50 |
| 900 | `color/violet/900` | `#210A74` | Persian Indigo Main (LDS) = Persian Indigo (BB) **+ Persian Indigo Dark #170751 merged** | 14.4 | 15.44 |

> Violet is the only hue dense enough to populate all ten standard steps. Three half-step rungs from the prior doc were retired by merging: **150** (Persian Indigo Light → 100), **350** (Daisy Bush Mid promoted to the now-clean **400**), **850** (Persian Indigo Main becomes the canonical **900**, absorbing the even-darker Persian Indigo Dark #170751). **Darkest real step #210A74 = 15.44:1 → AA text OK** (the merged #170751 = 17.71:1 is also real and preserved in §D).

### B.2 color/blue — Periwinkle ramp + Patterns Blue (h ≈ 203–228)
Periwinkle (h≈227, blue-violet) folded with Patterns Blue (h≈203). Sorted by L\*. Two same-band collisions merged (50, 100).

| Step | Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---|---:|---:|
| 50 | `color/blue/50` | `#F9FBFF` | Periwinkle Light (LDS) **+ Periwinkle MidLight merged** | 98.6 | 1.04 |
| 100 | `color/blue/100` | `#E1F3FE` | Patterns Blue (LDS + BB) **+ Periwinkle Mid merged** | 94.9 | 1.14 |
| 200 | `color/blue/200` | `#C6D2FF` | Periwinkle Main (LDS) = Periwinkle (BB) | 84.6 | 1.49 |
| 400 | `color/blue/400` | `#8B93B3` | Periwinkle Dark (LDS) | 61.3 | 3.03 |
| 600 | `color/blue/600` | `#1C6FB0` | **brand-approved AA dark (2026-06-05), not in source files** — darkest | — | **5.32** |

> Half-steps 75 (Periwinkle MidLight → 50) and 150 (Periwinkle Mid → 100) retired by merge. Periwinkle Dark sits at **400** by L\* (61.3). Darkest *real-source* step #8B93B3 = 3.03:1 fails AA text — the long-standing info-text gap. **Resolved 2026-06-05:** `blue/600 #1C6FB0` (5.32:1 vs white) was added as a **brand-approved AA dark** (not in the LDS Variables / Brand Book source files) and now backs `color/text/info/default` and `color/background/info/secondary` live in the build (see §F).

### B.3 color/magenta — Heliotrope ramp (h ≈ 280)
Landing magenta accent. Kept as its own hue. No collisions; placed by L\* on the clean ladder.

| Step | Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---|---:|---:|
| 50 | `color/magenta/50` | `#F9F1FE` | Heliotrope Light (LDS) | 96.1 | 1.10 |
| 200 | `color/magenta/200` | `#DFABF7` | Heliotrope Mid (LDS) | 77.0 | 1.86 |
| 400 | `color/magenta/400` | `#C76EF2` | Heliotrope Main (LDS) = Heliotrope (BB) | 61.4 | 3.03 |
| 600 | `color/magenta/600` | `#8B4DA9` | Heliotrope Dark (LDS) — darkest | 43.7 | 5.63 |

> Heliotrope Main moves to **400** (L\*61.4, was 300 in the half-step doc). **Darkest real step #8B4DA9 = 5.63:1 → AA text OK.**

### B.4 color/green — green family (h ≈ 117–143)
Most-populated light end: LDS Green ramp (Light/Mid/Main + three darks) + four BB swatches (White Ice, Light Green, Mint, plus BB names Lime/Apple/Snake that equal LDS hexes). The light band collapses hard — six near-identical light greens fall into just **50** and **100**.

| Step | Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---|---:|---:|
| 50 | `color/green/50` | `#E9FBF0` | White Ice (BB) **+ Green Light (LDS) merged** | 97.1 | 1.08 |
| 100 | `color/green/100` | `#79FD7F` | Green Main (LDS) = Lime (BB) **+ Light Green, Green Mid, Mint merged** | 89.8 | 1.30 |
| 300 | `color/green/300` | `#31C838` | Green Dark1 (LDS) = Apple (BB) **+ Green "Dark" #55B159 merged** | 71.0 | 2.22 |
| 400 | `color/green/400` | `#19AA20` | Green Dark2 (LDS) = Snake (BB) | 60.8 | 3.08 |
| 700 | `color/green/700` | `#0E7A1E` | **brand-approved AA dark (2026-06-05), not in source files** — darkest | — | **5.50** |

> **Heavy light-end merge (real, not invented):** four reals share the 89–94 band — canonical is the most-used **Green Main #79FD7F** (= BB Lime); Light Green, Green Mid and the pastel Mint all merge into `green/100`. At 50, BB-named **White Ice** is canonical (Green Light merges in). Green Dark1/Apple is canonical at **300** (Green "Dark" #55B159 merges in by L\*). Half-steps 75/150/250 retired. Darkest *real-source* step #19AA20 = 3.08:1 fails AA text — the long-standing success-text gap. **Resolved 2026-06-05:** `green/700 #0E7A1E` (5.50:1 vs white) was added as a **brand-approved AA dark** (not in the LDS Variables / Brand Book source files) and now backs `color/text/success/default` and `color/background/success/secondary` live in the build (see §F).

### B.5 color/lemon — yellow accent (h ≈ 47–55)
**Load-bearing caveat:** lemon never carries text on white — even the brand anchor is 1.27:1. Background/accent only; foreground always a dark grey. Two same-band collisions merged (50, 100).

| Step | Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---|---:|---:|
| 50 | `color/lemon/50` | `#FFF8DF` | Gin Fizz (BB) **+ Lemon Light (LDS) merged** | 97.5 | 1.06 |
| 100 | `color/lemon/100` | `#FFE60A` | **Lemon Main (LDS + BB)** — accent anchor **+ Lemon Mid merged** | 90.7 | 1.27 |
| 300 | `color/lemon/300` | `#B3A107` | Lemon Dark (LDS) — darkest | 65.8 | 2.62 |

> On the clean cadence the off-white pair collapses: Gin Fizz (BB-named) is canonical at **50** and the marginally lighter Lemon Light #FFFDE7 (L\*98.9) merges in. The accent **anchor Lemon Main** lands at **100** by L\* (90.7) and is canonical there, absorbing Lemon Mid #FFF171. Lemon Dark sits at **300**. **Darkest real step #B3A107 = 2.62:1 → FAILS AA text (gap, see §F — though lemon is accent-only by design).**

### B.6 color/coral — Persimmon / red family (h ≈ 0–4)
Danger family. Persimmon Dark passes AA, so coral can back danger text with a real colour. One same-band collision merged (50).

| Step | Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---|---:|---:|
| 50 | `color/coral/50` | `#FFF3F3` | Chablis (BB) **+ Persimmon Light (LDS) merged** | 96.8 | 1.08 |
| 200 | `color/coral/200` | `#FF9F9D` | Persimmon Mid (LDS) | 75.1 | 1.96 |
| 400 | `color/coral/400` | `#FF5A56` | **Persimmon Main (LDS + BB)** — anchor | 61.0 | 3.07 |
| 600 | `color/coral/600` | `#B33F3C` | Persimmon Dark (LDS) — darkest | 43.5 | 5.69 |

> Chablis (BB-named) is canonical at **50**; Persimmon Light #FFEFEE (L\*95.6) merges in. Persimmon Mid moves to **200** by L\* (75.1). **Darkest real step #B33F3C = 5.69:1 → AA text OK.**

### B.7 color/orange — orange / warning family (h ≈ 30–38)
Warning intent. Orange Dark passes AA → real warning text. No collisions; placed on the clean ladder.

| Step | Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---|---:|---:|
| 50 | `color/orange/50` | `#FFF3E7` | Orange Light (LDS) | 96.5 | 1.09 |
| 200 | `color/orange/200` | `#FFC471` | Orange Mid (LDS) | 82.9 | 1.57 |
| 300 | `color/orange/300` | `#FFA000` | Orange Main (LDS) — anchor | 73.8 | 2.04 |
| 500 | `color/orange/500` | `#B36007` | Orange Dark (LDS) — darkest | 49.5 | 4.57 |

> Orange Dark sits at **500** by L\* (49.5, was labelled 600 in the half-step doc). **Darkest real step #B36007 = 4.57:1 → AA text OK** (clears 4.5:1 by a thin margin).

### B.8 color/grey — neutral greyscale
The LDS/BB greyscale (both sources agree on every hex). White is its own primitive (§C), so grey starts at Alabaster. One same-band collision merged (50).

| Step | Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---|---:|---:|
| 50 | `color/grey/50` | `#FAFAFA` | Alabaster (LDS + BB) **+ Wild Sand merged** | 98.3 | 1.04 |
| 100 | `color/grey/100` | `#E2E1E7` | Mischka (LDS + BB) | 89.8 | 1.30 |
| 200 | `color/grey/200` | `#C6C6C6` | Silver (LDS + BB) | 79.9 | 1.71 |
| 500 | `color/grey/500` | `#706F74` | Jumbo (LDS + BB) | 47.1 | 4.98 |
| 700 | `color/grey/700` | `#484848` | Outer Space (LDS + BB) | 30.6 | 9.15 |
| 800 | `color/grey/800` | `#2C2A33` | Black (LDS + BB) — darkest; = TEXT_PRIMARY | 17.6 | 14.13 |

> On the clean cadence Alabaster and Wild Sand (#F4F4F4, L\*96.2) both land in the 95–99 band: Alabaster is canonical at **50**, Wild Sand merges in. Mischka reflows to **100** (L\*89.8) and Silver to **200** (L\*79.9). **Darkest real step #2C2A33 = 14.13:1 → AA text OK.** The build tree adds a generated `grey/900 = #1A1A1A` (on-lemon AAA anchor) — *not real*, so absent here.

---

## C. color/white

| Token | Hex | Legacy name(s) → source | L* | vs-white |
|---|---|---|---:|---:|
| `color/white` | `#FFFFFF` | White (LDS + BB) | 100.0 | 1.00 |

> Its own primitive — deliberately **not** `grey/0` — because white is a structural surface, not a tint of the neutral ramp.

---

## D. Legacy → token lookup (alphabetical by legacy name)

Every marketing / source name in the inputs maps here. Source key: BB = Brand Book, LDS = Landing DS colour Variables. Merged reals point at their canonical step and are marked `(merged → …)`.

| Legacy name (source) | Token | Hex |
|---|---|---|
| Alabaster (LDS + BB) | `color/grey/50` | `#FAFAFA` |
| Apple (BB) | `color/green/300` | `#31C838` |
| Black (LDS + BB) | `color/grey/800` | `#2C2A33` |
| Chablis (BB) | `color/coral/50` | `#FFF3F3` |
| Daisy Bush (BB) | `color/violet/700` | `#4221B8` |
| Daisy Bush Dark (LDS) | `color/violet/800` | `#2E1781` |
| Daisy Bush Light (LDS) | `color/violet/100` | `#ECE9F8` |
| Daisy Bush Main (LDS) | `color/violet/700` | `#4221B8` |
| Daisy Bush Mid (LDS) | `color/violet/400` | `#917ED6` |
| Gin Fizz (BB) | `color/lemon/50` | `#FFF8DF` |
| Green Dark1 (LDS) | `color/green/300` | `#31C838` |
| Green Dark2 (LDS) | `color/green/400` | `#19AA20` |
| Green "Dark" (LDS) | `color/green/300` *(merged → green/300)* | `#55B159` *(canonical #31C838)* |
| Green Light (LDS) | `color/green/50` *(merged → green/50)* | `#F2FFF2` *(canonical #E9FBF0)* |
| Green Main (LDS) | `color/green/100` | `#79FD7F` |
| Green Mid (LDS) | `color/green/100` *(merged → green/100)* | `#B1FEB5` *(canonical #79FD7F)* |
| Heliotrope (BB) | `color/magenta/400` | `#C76EF2` |
| Heliotrope Dark (LDS) | `color/magenta/600` | `#8B4DA9` |
| Heliotrope Light (LDS) | `color/magenta/50` | `#F9F1FE` |
| Heliotrope Main (LDS) | `color/magenta/400` | `#C76EF2` |
| Heliotrope Mid (LDS) | `color/magenta/200` | `#DFABF7` |
| Jumbo (LDS + BB) | `color/grey/500` | `#706F74` |
| Lemon (BB) | `color/lemon/100` | `#FFE60A` |
| Lemon Dark (LDS) | `color/lemon/300` | `#B3A107` |
| Lemon Light (LDS) | `color/lemon/50` *(merged → lemon/50)* | `#FFFDE7` *(canonical #FFF8DF)* |
| Lemon Main (LDS) | `color/lemon/100` | `#FFE60A` |
| Lemon Mid (LDS) | `color/lemon/100` *(merged → lemon/100)* | `#FFF171` *(canonical #FFE60A)* |
| Light Green (BB) | `color/green/100` *(merged → green/100)* | `#DBF4DA` *(canonical #79FD7F)* |
| Lime (BB) | `color/green/100` | `#79FD7F` |
| Magnolia (BB) | `color/violet/50` | `#F7F5FF` |
| Melrose (BB) | `color/violet/300` | `#9694FF` |
| Melrose Dark (LDS) | `color/violet/500` | `#6968B3` |
| Melrose Light (LDS) | `color/violet/50` *(merged → violet/50)* | `#F5F4FF` *(canonical #F7F5FF)* |
| Melrose Main (LDS) | `color/violet/300` | `#9694FF` |
| Melrose Mid (LDS) | `color/violet/200` | `#C2C1FF` |
| Mint (BB) | `color/green/100` *(merged → green/100)* | `#BEEABC` *(canonical #79FD7F)* |
| Mischka (LDS + BB) | `color/grey/100` | `#E2E1E7` |
| Orange Dark (LDS) | `color/orange/500` | `#B36007` |
| Orange Light (LDS) | `color/orange/50` | `#FFF3E7` |
| Orange Main (LDS) | `color/orange/300` | `#FFA000` |
| Orange Mid (LDS) | `color/orange/200` | `#FFC471` |
| Outer Space (LDS + BB) | `color/grey/700` | `#484848` |
| Patterns Blue (LDS + BB) | `color/blue/100` | `#E1F3FE` |
| Periwinkle (BB) | `color/blue/200` | `#C6D2FF` |
| Periwinkle Dark (LDS) | `color/blue/400` | `#8B93B3` |
| Periwinkle Light (LDS) | `color/blue/50` | `#F9FBFF` |
| Periwinkle Main (LDS) | `color/blue/200` | `#C6D2FF` |
| Periwinkle Mid (LDS) | `color/blue/100` *(merged → blue/100)* | `#DEE5FF` *(canonical #E1F3FE)* |
| Periwinkle MidLight (LDS) | `color/blue/50` *(merged → blue/50)* | `#F2F5FF` *(canonical #F9FBFF)* |
| Persian Indigo (BB) | `color/violet/900` | `#210A74` |
| Persian Indigo Dark (LDS) | `color/violet/900` *(merged → violet/900)* | `#170751` *(canonical #210A74)* |
| Persian Indigo Light (LDS) | `color/violet/100` *(merged → violet/100)* | `#E9E7F1` *(canonical #ECE9F8)* |
| Persian Indigo Main (LDS) | `color/violet/900` | `#210A74` |
| Persian Indigo Mid (LDS) | `color/violet/500` *(merged → violet/500)* | `#7E71AE` *(canonical #6968B3)* |
| Persimmon (BB) | `color/coral/400` | `#FF5A56` |
| Persimmon Dark (LDS) | `color/coral/600` | `#B33F3C` |
| Persimmon Light (LDS) | `color/coral/50` *(merged → coral/50)* | `#FFEFEE` *(canonical #FFF3F3)* |
| Persimmon Main (LDS) | `color/coral/400` | `#FF5A56` |
| Persimmon Mid (LDS) | `color/coral/200` | `#FF9F9D` |
| Silver (LDS + BB) | `color/grey/200` | `#C6C6C6` |
| Snake (BB) | `color/green/400` | `#19AA20` |
| Violet (BB) | `color/violet/600` | `#6D46FC` |
| White (LDS + BB) | `color/white` | `#FFFFFF` |
| White Ice (BB) | `color/green/50` | `#E9FBF0` |
| Wild Sand (LDS + BB) | `color/grey/50` *(merged → grey/50)* | `#F4F4F4` *(canonical #FAFAFA)* |

> Brand-book swatches whose hex equals an LDS ramp step are listed under both names (e.g. **Snake = Green Dark2 = #19AA20 → green/400**; **Apple = Green Dark1 → green/300**; **Lime = Green Main → green/100**; **Periwinkle (BB) = Periwinkle Main → blue/200**). These are not separate primitives — one token, two legacy names. Rows marked `(merged → …)` are real near-dups deduped into the canonical step on the clean cadence; the canonical hex is shown in parentheses.

---

## E. Coverage matrix — every source colour → token (nothing dropped)

> One row per **input value** (Landing DS + Brand Book). Status: **TOKEN** = becomes its own primitive step · **MERGED** = real near-dup deduped into a canonical step on the clean cadence · **ALIAS** = a BB name that equals an LDS hex already tokenised (same primitive, second legacy name).

### Landing DS named ramps
| Source colour | Hex | → Token | Status |
|---|---|---|---|
| Persian Indigo Light | #E9E7F1 | `color/violet/100` | **MERGED** → Daisy Bush Light #ECE9F8 |
| Persian Indigo Mid | #7E71AE | `color/violet/500` | **MERGED** → Melrose Dark #6968B3 |
| Persian Indigo Main | #210A74 | `color/violet/900` | TOKEN |
| Persian Indigo Dark | #170751 | `color/violet/900` | **MERGED** → Persian Indigo Main #210A74 |
| Daisy Bush Light | #ECE9F8 | `color/violet/100` | TOKEN |
| Daisy Bush Mid | #917ED6 | `color/violet/400` | TOKEN |
| Daisy Bush Main | #4221B8 | `color/violet/700` | TOKEN |
| Daisy Bush Dark | #2E1781 | `color/violet/800` | TOKEN |
| Melrose Light | #F5F4FF | `color/violet/50` | **MERGED** → Magnolia #F7F5FF |
| Melrose Mid | #C2C1FF | `color/violet/200` | TOKEN |
| Melrose Main | #9694FF | `color/violet/300` | TOKEN |
| Melrose Dark | #6968B3 | `color/violet/500` | TOKEN |
| Periwinkle Light | #F9FBFF | `color/blue/50` | TOKEN |
| Periwinkle MidLight | #F2F5FF | `color/blue/50` | **MERGED** → Periwinkle Light #F9FBFF |
| Periwinkle Mid | #DEE5FF | `color/blue/100` | **MERGED** → Patterns Blue #E1F3FE |
| Periwinkle Main | #C6D2FF | `color/blue/200` | TOKEN |
| Periwinkle Dark | #8B93B3 | `color/blue/400` | TOKEN |
| Heliotrope Light | #F9F1FE | `color/magenta/50` | TOKEN |
| Heliotrope Mid | #DFABF7 | `color/magenta/200` | TOKEN |
| Heliotrope Main | #C76EF2 | `color/magenta/400` | TOKEN |
| Heliotrope Dark | #8B4DA9 | `color/magenta/600` | TOKEN |
| Lemon Light | #FFFDE7 | `color/lemon/50` | **MERGED** → Gin Fizz #FFF8DF |
| Lemon Mid | #FFF171 | `color/lemon/100` | **MERGED** → Lemon Main #FFE60A |
| Lemon Main | #FFE60A | `color/lemon/100` | TOKEN (accent anchor) |
| Lemon Dark | #B3A107 | `color/lemon/300` | TOKEN |
| Persimmon Light | #FFEFEE | `color/coral/50` | **MERGED** → Chablis #FFF3F3 |
| Persimmon Mid | #FF9F9D | `color/coral/200` | TOKEN |
| Persimmon Main | #FF5A56 | `color/coral/400` | TOKEN |
| Persimmon Dark | #B33F3C | `color/coral/600` | TOKEN |
| Green Light | #F2FFF2 | `color/green/50` | **MERGED** → White Ice #E9FBF0 |
| Green Mid | #B1FEB5 | `color/green/100` | **MERGED** → Green Main #79FD7F |
| Green Main | #79FD7F | `color/green/100` | TOKEN |
| Green Dark1 | #31C838 | `color/green/300` | TOKEN |
| Green "Dark" | #55B159 | `color/green/300` | **MERGED** → Green Dark1 #31C838 |
| Green Dark2 | #19AA20 | `color/green/400` | TOKEN |
| Orange Light | #FFF3E7 | `color/orange/50` | TOKEN |
| Orange Mid | #FFC471 | `color/orange/200` | TOKEN |
| Orange Main | #FFA000 | `color/orange/300` | TOKEN |
| Orange Dark | #B36007 | `color/orange/500` | TOKEN |
| White | #FFFFFF | `color/white` | TOKEN |
| Alabaster | #FAFAFA | `color/grey/50` | TOKEN |
| Wild Sand | #F4F4F4 | `color/grey/50` | **MERGED** → Alabaster #FAFAFA |
| Mischka | #E2E1E7 | `color/grey/100` | TOKEN |
| Silver | #C6C6C6 | `color/grey/200` | TOKEN |
| Jumbo | #706F74 | `color/grey/500` | TOKEN |
| Outer Space | #484848 | `color/grey/700` | TOKEN |
| Black | #2C2A33 | `color/grey/800` | TOKEN |
| Patterns Blue | #E1F3FE | `color/blue/100` | TOKEN |
| Magnolia (LDS dup of BB) | #F7F5FF | `color/violet/50` | TOKEN (absorbs Melrose Light) |

### Brand Book added/confirmed swatches
| Source colour | Hex | → Token | Status |
|---|---|---|---|
| Violet (brand anchor) | #6D46FC | `color/violet/600` | TOKEN (anchor; NOT in LDS) |
| Daisy Bush | #4221B8 | `color/violet/700` | ALIAS of Daisy Bush Main |
| Persian Indigo | #210A74 | `color/violet/900` | ALIAS of Persian Indigo Main |
| Melrose | #9694FF | `color/violet/300` | ALIAS of Melrose Main |
| Heliotrope | #C76EF2 | `color/magenta/400` | ALIAS of Heliotrope Main |
| Magnolia | #F7F5FF | `color/violet/50` | TOKEN |
| Black | #2C2A33 | `color/grey/800` | ALIAS (same hex as LDS) |
| Outer Space | #484848 | `color/grey/700` | ALIAS |
| Jumbo | #706F74 | `color/grey/500` | ALIAS |
| Silver | #C6C6C6 | `color/grey/200` | ALIAS |
| Mischka | #E2E1E7 | `color/grey/100` | ALIAS |
| Wild Sand | #F4F4F4 | `color/grey/50` | ALIAS of Alabaster (merged near-dup) |
| Alabaster | #FAFAFA | `color/grey/50` | ALIAS |
| White | #FFFFFF | `color/white` | ALIAS |
| Persimmon | #FF5A56 | `color/coral/400` | ALIAS of Persimmon Main |
| Chablis | #FFF3F3 | `color/coral/50` | TOKEN |
| Lemon | #FFE60A | `color/lemon/100` | ALIAS of Lemon Main |
| Gin Fizz | #FFF8DF | `color/lemon/50` | TOKEN |
| Snake | #19AA20 | `color/green/400` | ALIAS of Green Dark2 |
| Apple | #31C838 | `color/green/300` | ALIAS of Green Dark1 |
| Lime | #79FD7F | `color/green/100` | ALIAS of Green Main |
| White Ice | #E9FBF0 | `color/green/50` | TOKEN |
| Light Green | #DBF4DA | `color/green/100` | **MERGED** → Green Main #79FD7F |
| Mint | #BEEABC | `color/green/100` | **MERGED** → Green Main #79FD7F |
| Mid (green) | #B1FEB5 | `color/green/100` | ALIAS of Green Mid (merged near-dup) |
| Periwinkle | #C6D2FF | `color/blue/200` | ALIAS of Periwinkle Main |
| Patterns Blue | #E1F3FE | `color/blue/100` | ALIAS (same hex as LDS) |

> **Persian Indigo (BB) hex note:** the BB "Persian Indigo #210A74" equals the **LDS Persian Indigo *Main***. On the clean cadence both Persian Indigo Main (#210A74, L\*14.4) and Persian Indigo Dark (#170751, L\*8.4) fall in the 900 band (7–15); the BB-named **#210A74 is canonical** at `violet/900` and the darker #170751 is **merged** into it. Both hexes are real and both are preserved in §D — nothing is dropped; #170751 just no longer occupies its own (half-step) rung.
>
> **Coverage result:** **every source value is represented.** Fifteen near-dup MERGES on the clean cadence (one carried over: Melrose Light → Magnolia; 14 new), all marked above and in §D with their canonical step. All BB↔LDS hex-identical pairs are ALIASes (one primitive, two legacy names), not duplicates. **Zero source colours dropped.**

---

## F. AA-dark gaps — hues whose *darkest real step* fails AA text on white (≥4.5:1)

For each hue, the contrast of its darkest real colour vs white:

| Hue | Darkest real step | Hex | vs-white | AA text (≥4.5)? |
|---|---|---|---:|:---:|
| violet | `violet/900` | `#210A74` | 15.44 | ✅ |
| grey | `grey/800` | `#2C2A33` | 14.13 | ✅ |
| coral | `coral/600` | `#B33F3C` | 5.69 | ✅ |
| magenta | `magenta/600` | `#8B4DA9` | 5.63 | ✅ |
| orange | `orange/500` | `#B36007` | 4.57 | ✅ (thin) |
| **blue** | `blue/600` | `#1C6FB0` | **5.32** | ✅ **(resolved 2026-06-05, brand-approved dark)** |
| **green** | `green/700` | `#0E7A1E` | **5.50** | ✅ **(resolved 2026-06-05, brand-approved dark)** |
| **lemon** | `lemon/300` | `#B3A107` | **2.62** | ❌ **GAP** (accent-only by design) |

**Success & info resolved — one gap remains.** The two consequential gaps (success text and info text) were closed on **2026-06-05** when the brand approved two AA-dark primitives — `green/700 #0E7A1E` (5.50:1) and `blue/600 #1C6FB0` (5.32:1). Both are now real primitives in `tokens.json` and back the previously-gated success/info roles live (`color/text/success/default`, `color/background/success/secondary`, `color/text/info/default`, `color/background/info/secondary`). These two darks are **brand-approved additions, not in the original LDS Variables / Brand Book source files** — they extend the green/blue dark ends with the minimum needed to clear AA.

The only remaining gap is **lemon** — darkest real Lemon Dark #B3A107 is 2.62:1. Lemon is **accent-only by brand design** (foreground is always dark grey), so this "gap" is expected, not a defect — flagged for completeness. (Do NOT fill it with an invented colour.)

> Passing hues confirm: violet, grey, coral, magenta, orange can all back text on white from a real primitive, and blue/green now do so via the 2026-06-05 brand-approved darks. Orange clears the bar by only 0.07 — usable but worth a designer's eye for body copy. Note: violet's darkest real step is now the merged-canonical **#210A74 (15.44:1)**; the even-darker #170751 (17.71:1) remains available as a merged real if a deeper AA anchor is ever wanted.

---

## G. How this differs from the right-sized token tree

`final-token-tree.md` is the **build set** the Figma NPA-9291 build types in; this file is the **real-only primitive inventory on a clean 50→900 cadence**. They now share the same *step grammar* (standard steps only) and the violet/600 anchor but still diverge on contents:

| | This palette (real-only, clean cadence) | The tree (right-sized build) |
|---|---|---|
| **Contents** | Only colours that physically exist in LDS Variables / BB | Real anchors **+ ~20 generated** intermediate/dark steps |
| **Step ladder** | Clean 50→900, standard steps only; near-dups **merged**, not given half-steps; gaps where no real colour sits | Clean 50→900 cadence; gaps **filled by generation**; ramps trimmed to what semantics consume |
| **Hue 5 name** | `magenta` (generic) | `heliotrope` (kept the marketing name as the token) |
| **Heliotrope→hue** | placed at magenta 50/200/400/600 by L\* | placed at heliotrope 50/200/400/600 |
| **green dark** | stops at real `green/400 #19AA20` (3.08:1, fails AA) | adds generated `green/700 #0E7A1E` (5.50:1) for success text |
| **grey dark** | stops at real `grey/800 #2C2A33` | adds generated `grey/900 #1A1A1A` (on-lemon AAA) |
| **violet mids** | keeps real Daisy Bush Mid at clean `violet/400`; Persian Indigo Mid **merged** into `violet/500` | collapses the mid band, generates one `violet/400 #8170CC` |
| **Purpose** | seed the Primitives collection with 100%-trusted values; expose accessibility gaps | the lean, semantically-consumed set the build actually ships |

**Relationship:** the right-sized tree is a **superset-by-generation** of this real base. Everything here is real and should be entered into Figma verbatim; the tree's *additional* generated steps are clearly marked GEN in that document and must be brand-approved before they're treated as canonical. Where a hue here is flagged a §F gap, the tree's same-hue dark step is a generated guess filling exactly that gap — a useful cross-reference for which generated colours are load-bearing.

---

### Primitive count

**40 real primitives** (real-source only): color/white (1) + violet (10) + blue (4) + magenta (4) + green (4) + lemon (3) + coral (4) + orange (4) + grey (6). On the clean cadence **15 real near-dups are merged** (1 carried over from the half-step doc — Melrose Light → Magnolia — + 14 new same-band collisions), and all BB↔LDS hex-identical pairs counted once. Down from 54 in the half-step inventory: −8 half-step rungs retired (75/150/250/350/850 bands) and the remaining same-band collisions deduped. No real colour dropped — every merged hex is preserved in §D/§E.

**+2 brand-approved AA darks (2026-06-05), not in source files** → **42 colour primitives in the build set:** `green/700 #0E7A1E` (5.50:1 vs white) and `blue/600 #1C6FB0` (5.32:1 vs white). These extend the green/blue dark ends to clear AA for status text and were added to `tokens.json` to ungate success/info (§F). They are *not* in the LDS Variables / Brand Book and so are excluded from the 40 real-source count above.
