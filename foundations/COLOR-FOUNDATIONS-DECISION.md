The computed numbers confirm the analyses (one minor correction: orange/300 #FFA000 is L*73.8 / 2.04 vs white — a tint/accent, not a text shade; warning text correctly routes darker). All anchor AA claims hold. Now producing the decision.

---

# Novakid Colour-Foundations Decision (v4 — authoritative)

**Scope:** the upstream spec that drives how primitive colour ramps are built. Topology = Figma SDS collections (`color-primitives`, `color` semantic, `size`, `typography`, `effect`); VALUES = real Novakid palette (LDS + Brand Book + product code). This doc reconciles `final-token-tree.md` (v3 master, real-only/42-primitive) against the shipped build (`tokens.json`, 8×10 + PR #12 pins) and ends the divergence in favour of an explicit v4. All hex/L*/contrast figures recomputed this session.

---

## 0. Headline decisions (the reconciliation calls)

The v3 master and the shipped build are not the same artifact. Five binary calls resolve the conflict:

| # | Conflict | v3 master | Shipped build | **Decision (v4)** |
|---|---|---|---|---|
| D-1 | Primitive topology | 42 real-only, non-contiguous | 80 solid (8×10) + alpha | **Adopt the contiguous 8×10 ladder.** Real-only-with-gaps is colorimetrically honest but Figma/Tokens-Studio consumers need a predictable step grammar. Keep the build's topology; treat reals as **pinned anchors**, gaps as **GEN-to-fill-semantic**. |
| D-2 | "No generated tier" | LOCKED | 56/80 generated | **Drop the no-gen lock.** GEN is allowed *only* to fill a semantic gap or interpolate between two pinned reals — never to invent an unconsumed hue/step. |
| D-3 | Step numbering | real lands at its L\* band | shifted to contiguous 100–1000 | **Adopt 100–1000.** The v3 docs' 50–900 names are stale; every doc reference is one band light. Re-version docs, do not roll back the build. |
| D-4 | grey TEXT_PRIMARY slot | grey/800 #2C2A33; grey/900 #1A1A1A dropped | grey/900 #2C2A33; grey/1000 #100F14 new | **TEXT_PRIMARY = grey/900 #2C2A33.** #1A1A1A stays purged (never real). grey/1000 #100F14 is dark-mode headroom, zero current consumers — keep but mark GEN-headroom. |
| D-5 | lemon-as-text | FORBIDDEN by design | `text.brand-lemon` → lemon/700 #7E6209 (5.77:1, GEN) | **Document the rule change, don't revert.** The accent-fill rule (lemon fill never carries white; fg = grey/900) still holds. A *separate darkened-olive text token* (lemon/700) is a legitimate, AA-passing text shade — it is NOT the yellow accent. Rename intent to avoid implying the accent is text (see Open Question Q3). |

Net: the build is a **superset that achieves the master's accessibility intent via a fuller grammar**. v4 = contiguous ramps + real-pinned anchors + per-hue brand intents. The master docs are re-versioned to match, not the build rolled back.

---

## 1. Canonical hue set

**8 chromatic hues + white**, plus build-only alpha ramps (`black`, `white`). Every hue is colorimetrically distinct and semantically justified. No merges or drops beyond what v3 already settled — A1's OKLCH recompute confirms the clustering.

| Hue | Generic name | OKLCH H | Why it exists (intent + code usage) | Verdict |
|---|---|---|---|---|
| **violet** | `violet` | 278–295 (one family) | Brand spine. ~106 code uses across the ramp (Daisy Bush #4221B8 = 48, Persian Indigo #210A74 = 32, Melrose #9694FF = 18, anchor #6D46FC = 8). Backs `brand-violet` + the generic `brand` intent. | **Keep — full 10-step ramp.** Only hue dense enough to fill all steps with reals. |
| **blue** | `blue` | bimodal: 234 / 273 / 248 | `info` + `brand-blue`. ~15 code uses (Periwinkle #C6D2FF = 9, Patterns Blue #E1F3FE = 6). Light-only in brand. | **Keep — right-sized.** ⚠️ Flag: ramp is **not hue-monotonic** (see §3 / Q1). |
| **magenta** | `magenta` | 313–315 | `brand-magenta` (landing/accent). Clean ~18–30° gap above violet. Code usage = 1 (illustration). | **Keep as own hue — thin ramp.** Distinct, but density gated to semantic consumers only. |
| **green** | `green` | 143–159 | `success` + `brand-green`. ~37 code uses (Apple #31C838 = 23, Lime #79FD7F = 10, Snake #19AA20 = 4). | **Keep — right-sized + 1 GEN AA-dark.** |
| **lemon** | `lemon` | 94–103 | Accent/background anchor (#FFE60A = 11 uses). **Accent-only by design** — even the anchor is 1.27:1 on white. | **Keep — accent ramp, no white-text fill.** Distinct from orange (~30° gap). |
| **coral** | `coral` | 17–25 | `danger` + `brand-coral`. 26 code uses (Persimmon #FF5A56). Real dark passes AA. | **Keep — right-sized.** Named "coral" to stay distinct from the `danger` *intent*. |
| **orange** | `orange` | 57–74 | `warning` + `brand-orange`. Real LDS ramp. **This is the warning hue** — distinct from lemon. | **Keep — right-sized.** |
| **grey** | `grey` | ~295 (dark)/achromatic (light) | Neutral workhorse — text, surface, border, disabled. ~27 code uses. Dark greys carry a faint violet tint (on-brand). | **Keep — 8 chromatic steps + white.** |
| **white** | `white` | — | The universal `on-*` foreground (23 consumers) + `base` surface. | **Keep — own primitive.** |

### Merge / drop / no-build calls (decisive)

- **Blue-violet "spine" → ONE `violet` hue.** Persian Indigo, Daisy Bush, Melrose, BB Violet anchor, Magnolia all land at OKLCH H 278–295 (~17° spread). They differ in L\* and chroma, not hue. Collapse is **colorimetrically correct** — generic step ordering fixes the "which dark of which marketing ramp" ambiguity. ✅
- **Periwinkle → `blue`, NOT `violet`.** H 264–274 is perceptibly separate from violet (278–295). Correct that it is not folded into violet. ✅ (But see the bimodal-blue flag, §3.)
- **`magenta` stays its own hue.** H 313–315, clean gap from both violet (295) and coral (25). Folding into violet would be wrong. ✅
- **`orange` ≠ `lemon`.** ~30° hue gap. Orange is not a dark/warm lemon. Warning intent = orange. ✅
- **AMBER: DO NOT BUILD.** The amber cluster (FFD000 H92 … FF9800 H64) does **not form a coherent distinct hue** — it straddles orange's warm end (FF9F1B H66 ≈ Orange Main H68) and lemon's cool end (FFD000 H92). **Code-styling usage = 0** (all 12 occurrences inside SVG illustrations). It is illustration noise. **Warning = Orange.** Never fold amber into lemon. ✅
- **`brand-*` per-hue intents — all 7 justified?** Yes for violet/coral/green/orange/blue (real code consumers + status twins). `brand-magenta` and `brand-lemon` are landing/accent-only (1 and 11 uses) — justified as *intents* but their ramps are thin. No `brand-*` intent should be dropped, but none earns a full 10-step ramp except violet.

---

## 2. Per-hue ramp spec

Step count is justified by **the semantic minimum** (A2: distinct steps the intent layer consumes) **+ real anchors that must be preserved**. Marking: **REAL** = exact LDS/BB hex, pinned ΔE≈0. **GEN** = generated to fill a semantic gap (target L\*/role given). **🔒 MAIN** = brand anchor. **★ AA-dark** = the step that carries white text / passes AA-text. Ladder = **100–1000**.

Semantic floor per hue (A2): grey 8+white · coral/green/orange/blue 6 · violet/magenta/lemon 5. Steps with **zero** semantic consumers are marked *headroom* and are optional grid-fill (kept for OKLCH-smooth interpolation + dark mode).

### violet — brand spine (10 steps; the only full ramp)

| Step | Hex | L\* | vs-white | REAL/GEN | Role |
|---|---|---|---|---|---|
| 100 | #ECE9F8 | 93.0 | 1.13 | REAL (DaisyBush-Light + PI-Light merged) | brand bg-tertiary |
| 200 | #C2C1FF | 80.1 | — | REAL (Melrose-Mid) | brand bg-secondary |
| 300 | #9694FF | 65.7 | 2.63 | REAL (Melrose-Main = BB Melrose) | brand bg-secondary-hover |
| 400 | #917ED6 | 57.8 | — | REAL (DaisyBush-Mid) | *headroom* |
| 500 | #6968B3 | 47.2 | — | GEN (Melrose-Dark + PI-Mid merged; ΔE11/12 drift, tolerated — no high-use real here) | *headroom* |
| 600 | #6D46FC | 45.2 | **5.34** | REAL 🔒 **MAIN/ANCHOR** ★ (BB Violet) | brand bg-PRIMARY (white text ✓), border/brand, border/focus |
| 700 | #4221B8 | 28.7 | 9.81 | REAL ★ (DaisyBush-Main, 48 uses) | brand bg-primary-hover/pressed, text/icon brand-primary |
| 800 | #2E1781 | 19.1 | 13.5 | **REAL** (DaisyBush-Dark) — *build ships GEN #311695 ΔE3; pin the real* | *headroom* |
| 900 | #210A74 | 14.4 | 15.44 | REAL (PersianIndigo-Main, 32 uses) | *headroom / darkest brand* |
| 1000 | #0A0235 | — | — | GEN-headroom | dark-mode only |

Violet AA-clears at 600, so fill=600 / pressed=700; **needs no separate 800-fill**. Semantic floor = {100,200,300,600,700}. **Fix:** pin violet/800 to real #2E1781 (build drift defect, §3).

### blue — info + brand-blue (6 steps; bimodal)

| Step | Hex | L\* | vs-white | REAL/GEN | Role |
|---|---|---|---|---|---|
| 100 | #E1F3FE | 94.9 | 1.14 | REAL (Patterns Blue, H234, 6 uses) | bg-tertiary, info-tertiary |
| 200 | #C6D2FF | 84.6 | 1.49 | REAL 🔒 **MAIN** (Periwinkle-Main, H273, 9 uses) | bg-secondary |
| 300 | #A2B8ED | 74.9 | 1.98 | GEN (tint, L\*~75) | bg-secondary-hover |
| 600 | #1C6FB0 | 45.3 | 5.32 | GEN ★ **brand-approved AA-dark** (H248, not in source) | border/brand-blue, border/info |
| 700 | #135588 | 34.8 | 7.83 | GEN ★ | bg-PRIMARY (white text ✓), text/icon info & brand-blue |
| 800 | #0A395E | 23.0 | 11.93 | GEN | bg-primary-hover/pressed |

Real reference shades not used as fill: Periwinkle-Light #F9FBFF (50/100 band), Periwinkle-Dark #8B93B3 (L\*61, fails AA-text — that's why 600 is generated). Semantic floor = {100,200,300,600,700,800}.

### magenta — brand-magenta accent (5 steps)

| Step | Hex | L\* | vs-white | REAL/GEN | Role |
|---|---|---|---|---|---|
| 100 | #FFE4FF | 93.4 | 1.18 | GEN (tint) | brand bg-tertiary |
| 200 | #F3C0FF | 84.0 | 1.52 | GEN (tint) | brand bg-secondary |
| 300 | #E296FF | 73.0 | 2.09 | GEN (tint) | brand bg-secondary-hover |
| 400 | #C76EF2 | 61.4 | — | REAL 🔒 **MAIN** (BB Heliotrope) | *accent anchor* |
| 600 | #8B4DA9 | 43.7 | **5.63** | REAL ★ | brand bg-PRIMARY (white text ✓), border/brand |
| 700 | #6B3A82 | 33.5 | 8.23 | GEN ★ | brand bg-primary-hover, text/icon brand-magenta |

⚠️ The build places magenta's **MAIN at the real #C76EF2 (step 400)** but the *semantic anchor* (fill/border) is the darker 600. A2 floor for a brand twin is {100,200,300,600,700}. The real #C76EF2 (400) is preserved as the accent/landing colour — keep it pinned even though only ~1 code consumer; it is the brand's magenta. Steps 100/200/300 are GEN tints (no real magenta light exists; only #F9F1FE at the 50 band and #DFABF7 at 200).

### green — success + brand-green (6 steps)

| Step | Hex | L\* | vs-white | REAL/GEN | Role |
|---|---|---|---|---|---|
| 100 | #C1FFC1 | 94.6 | 1.14 | GEN (tint) | bg-tertiary, success-secondary |
| 200 | #79FD7F | 89.8 | 1.30 | REAL 🔒 (Lime/Green-Main, 10 uses) | brand-green bg-secondary |
| 300 | #58E25D | 80.3 | 1.69 | GEN (tint) — *real Apple #31C838 (L\*71, 23 uses) sits between 300–400; pin it* | bg-secondary-hover |
| 400 | #19AA20 | 60.8 | — | REAL (Snake, 4 uses) | *headroom* |
| 600 | #129220 | 52.7 | 4.07 | GEN | border/brand-green, border/success |
| 700 | #0E7A1E | 44.4 | 5.50 | GEN ★ **brand-approved AA-dark** (not in source) | bg-PRIMARY (white text ✓), text/icon brand-green & icon-success |
| 800 | #075412 | 30.5 | 9.19 | GEN ★ | bg-primary-hover/pressed, text.success-primary |

⚠️ **Apple #31C838 (23 code uses — green's most-used real) is NOT pinned at a step.** It is the #2-ranked single real in the whole product. v3 placed it at green/300; the build's 300 is GEN #58E25D. **Fix:** pin Apple #31C838 to green/300 (or 350) — see §3 defect list. Real green darks max at L\*61 (fail AA-text) → green/700 GEN is correctly brand-approved.

### lemon — accent only, dark-fg (5 steps; gates inverted)

| Step | Hex | L\* | vs-white | REAL/GEN | Role |
|---|---|---|---|---|---|
| 100 | #FFF6B6 | 96.2 | 1.10 | GEN (tint) | brand-lemon bg-tertiary |
| 200 | #FFE60A | 90.7 | 1.27 | REAL 🔒 **MAIN/ACCENT ANCHOR** (Lemon-Main, 11 uses) | bg-PRIMARY + secondary — **fg MUST be grey/900 (11.15:1 ✓), NEVER white (1.27 ✗)** |
| 300 | #EBD01F | 83.4 | 1.55 | GEN (tint) | bg-primary-hover |
| 600 | #977A0E | 52.4 | 4.11 | GEN | border/brand-lemon |
| 700 | #7E6209 | 43.0 | 5.77 | GEN ★ | text/icon brand-lemon **on white** — a darkened OLIVE, not the yellow accent |

**Intentional, documented:** the yellow accent fill never carries white text. The real darkest lemon (#B3A107, L\*65.8, 2.62:1) **fails AA — do NOT generate to "fix" the accent.** The lemon/700 olive text shade is a *separate* token (D-5). This is the one rule the build technically extends past v3 — keep it, but name it so no one reads it as "yellow text" (Q3).

### coral — danger + brand-coral (6 steps)

| Step | Hex | L\* | vs-white | REAL/GEN | Role |
|---|---|---|---|---|---|
| 100 | #FFEAE5 | 94.2 | 1.16 | GEN (tint) | bg-tertiary, danger-secondary |
| 200 | #FF9F9D | 75.1 | — | REAL (Persimmon-Mid) | bg-secondary |
| 300 | #FFADA5 | 78.4 | 1.78 | GEN (tint) | bg-secondary-hover |
| 400 | #FF5A56 | 61.0 | — | REAL 🔒 **MAIN/ANCHOR** (Persimmon, 26 uses) | *brand-coral accent anchor* |
| 600 | #D84C49 | 52.1 | 4.16 | GEN | border/brand-coral, border/danger |
| 700 | #B33F3C | 43.5 | **5.69** | REAL ★ (Persimmon-Dark) | bg-PRIMARY (white text ✓), text/icon danger & brand-coral |
| 800 | #7D2927 | 29.6 | 9.47 | GEN ★ | bg-primary-hover/pressed |

Coral has **a real shade at both anchors** (400 fill-accent, 700 AA-dark) — no AA generation needed at the dark end. Semantic floor = {100,200,300,600,700,800}; build also pins the real #FF5A56 at 400.

### orange — warning + brand-orange (6 steps)

| Step | Hex | L\* | vs-white | REAL/GEN | Role |
|---|---|---|---|---|---|
| 100 | #FFEDC4 | 94.2 | 1.16 | GEN (tint) | bg-tertiary, warning-tertiary |
| 200 | #FFD693 | 87.7 | 1.37 | REAL (Orange-Mid #FFC471 band) / GEN tint | bg-secondary, warning-secondary |
| 300 | #FFBB59 | 80.5 | 1.68 | GEN (tint) — *real Orange-Main #FFA000 (L\*73.8) sits at 300–400; pin it* | bg-secondary-hover |
| 600 | #B36007 | 49.5 | **4.57** | REAL (Orange-Dark) — thin AA | border/brand-orange, border/warning |
| 700 | #8A4904 | 38.2 | 6.92 | GEN ★ | bg-PRIMARY (white text ✓), text/icon warning & brand-orange |
| 800 | #5F3002 | 25.4 | 10.99 | GEN ★ | bg-primary-hover/pressed |

Orange-Main #FFA000 (L\*73.8, 2.04:1) is a **tint/accent**, not a text shade — warning *text* correctly routes to the darker GEN 700 (6.92:1). The real Orange-Dark #B36007 (4.57:1, thin) is preserved at 600 for borders. **Fix:** pin Orange-Main #FFA000 to its step (300/350).

### grey — neutral workhorse (8 chromatic + white)

| Step | Hex | L\* | vs-white | REAL/GEN | Role |
|---|---|---|---|---|---|
| white | #FFFFFF | 100 | — | OWN PRIMITIVE | base surface + universal `on-*` fg (23 consumers) |
| 100 | #FAFAFA | 98.3 | 1.04 | REAL (Alabaster + WildSand) | base/secondary surface |
| 200 | #E2E1E7 | 89.8 | 1.30 | REAL (Mischka) | tertiary surface, disabled bg/border |
| 300 | #C6C6C6 | 79.9 | 1.71 | REAL (Silver) | tertiary-hover, border/default *(1.71 <3:1 — INTENTIONAL decorative, §3)* |
| 400 | #AAA8A7 | 69.0 | 2.37 | GEN | text/icon disabled, border/default-hover *(intentional)* |
| 500 | #706F74 | 47.1 | 4.98 | REAL (Jumbo) | *(headroom in build; A2 maps Jumbo to the 600 role)* |
| 600 | #706F74 | 47.1 | 4.98 | REAL (Jumbo) ★-thin | text/icon default-tertiary (hint/placeholder) |
| 700 | #484848 | 30.6 | 9.15 | REAL (OuterSpace) ★ | neutral bg-primary fill, text/icon default-secondary |
| 800 | #2C2A33 | 17.6 | 14.13 | — | *(neutral pressed)* |
| 900 | #2C2A33 | 17.6 | 14.13 | REAL 🔒 **TEXT_PRIMARY** (Black) ★ + on-lemon fg | text/icon default-primary |
| 1000 | #100F14 | — | — | GEN-headroom | dark-mode only |

⚠️ The build has **Jumbo #706F74 appearing at both 500 and 600**, and #2C2A33 at both 800 and 900 (D-4 renumber artifact). The semantic layer references {100,200,300,400,600,700,800,900}. Resolve the duplicate step hexes in the build (§3). #1A1A1A stays dropped.

### Anchor / Main summary

`violet/600 #6D46FC` (brand) · `lemon/200 #FFE60A` (accent, dark-fg) · `coral/400 #FF5A56` · `orange/300 #FFA000` · `magenta/400 #C76EF2` · `green/200 #79FD7F` · `blue/200 #C6D2FF` · `grey/900 #2C2A33` (text).

---

## 3. Gaps & additions

### A. Real defects to fix in the build (load-bearing, not intentional)

| Defect | Current | Fix | Justification |
|---|---|---|---|
| **Apple #31C838 not pinned** | green/300 = GEN #58E25D | Pin Apple #31C838 (L\*71) at green/300 | 23 code uses — green's #1 real, #2 overall. Must be verbatim. |
| **Orange-Main #FFA000 not pinned** | orange/300 = GEN #FFBB59 | Pin #FFA000 (L\*73.8) at orange/300 | Real LDS warning/brand-orange main. |
| **violet/800 drift** | GEN #311695 (ΔE3) | Pin real Daisy Bush Dark #2E1781 | A real brand shade exists at that step; honour it. |
| **grey duplicate hexes** | #706F74 at 500&600; #2C2A33 at 800&900 | One hex per step; map Jumbo→600, OuterSpace→700, Black→900; regen 500/800 as true interpolants | Duplicate steps break the ladder grammar (D-4 renumber leftover). |

### B. Intentional gaps — do NOT generate to fill

| Gap | Why it's intentional |
|---|---|
| **lemon has no AA-text-from-yellow** | Accent-only by design; fg is always grey/900. The olive lemon/700 text token is the sanctioned escape hatch, not a fix to the yellow. |
| **grey/300 border 1.71:1, grey/400 2.37:1 fail 3:1** | Decorative dividers/disabled — outside WCAG 1.4.11's interactive-boundary scope. Status/brand borders (all 600) pass 3:1. |
| **text.default.tertiary on bg.tertiary = 3.83** | Hint/placeholder text; passes on white (4.98). Documented decorative exemption. |
| **magenta light steps GEN** | No real magenta tints exist below #DFABF7; 1 code use doesn't justify sourcing brand colours. |

### C. Architecture needs a colour but no real exists → minimal GEN (already brand-approved 2026-06-05)

| Need | Solution | Real maxes at |
|---|---|---|
| **success text AA** | GEN green/700 #0E7A1E (5.50:1) ✅ | green real L\*61 (fails) |
| **info text AA** | GEN blue/600 #1C6FB0 (5.32:1) ✅ | Periwinkle-Dark L\*61 (fails) |
| **info fill AA** | GEN blue/700 #135588 (7.83:1) ✅ | — |
| **warning fill AA** | GEN orange/700 #8A4904 (6.92:1) ✅ | Orange-Dark 4.57 thin |

These four are the *only* sanctioned generated chromatic darks. **danger** is backed by a **real** shade (coral/700 #B33F3C, 5.69:1) — no GEN needed.

### D. The amber / warning-hue decision (settled)

**No amber ramp. Warning = real Orange.** Amber is 0-code-use illustration noise and not a coherent hue (straddles orange↔lemon). Do not provision even the name as a ramp.

### E. Open architectural gap (not yet resolved)

- **`accent` intent** — v3's one declared open gap. The build has no `accent` surface/intent and consumes lemon as `brand-lemon` instead. If lemon's compliant home is "accent" (landing decorative), v4 should either (a) add an `accent` intent → lemon/200, or (b) formally sanction `brand-lemon` as that home. Designer call (Q2).

---

## 4. Topology mapping (SDS collections + 100–1000 grammar)

### `color-primitives` collection
- **8 hue ramps × 10 steps (100–1000)** + `white` (own primitive) + `black`/`white` alpha ramps (build extra, kept for overlays/scrims).
- Step grammar: **100 = palest tint → 1000 = dark-mode floor.** Tints 100–300 (L\* 78–96), mids 400–500, fill/border anchors 600–700 (L\* ~38–53), pressed 800 (L\* ~25–31), deep darks 900–1000 (headroom).
- Each step is **REAL-pinned** where a brand colour lands (24 pins → 28 after §3 fixes) or **GEN** to fill a semantic gap / interpolate. No unconsumed GEN hue.

### `color` (semantic) collection — Tier 2
`color/{background|text|icon|border}/{intent}/{variant}` →
- **intents:** `base`, `neutral`, `brand`(→violet) + 7 `brand-{violet,magenta,coral,green,orange,blue,lemon}`, `success`, `warning`, `danger`, `info`, `disabled` + 7 `on-brand-{hue}` + `on-*`.
- **variants:** `primary, primary-hover, pressed, secondary, secondary-hover, tertiary, tertiary-hover, default, hover, focus, on-*`.
- 148 aliases (build), all resolving to `color-primitives`.

### `size` / `typography` / `effect`
- Unchanged by this decision. **Note:** the `effect` shadow colour repoints grey/900→grey/900 #2C2A33 (was grey/800 in v3 naming — same hex, renumbered slot per D-4). Verify shadow tokens reference the renumbered slot.

### Changes vs current shipped build (PR #12)
1. Pin Apple #31C838 (green/300), Orange-Main #FFA000 (orange/300), Daisy Bush Dark #2E1781 (violet/800) — §3.A.
2. De-duplicate grey 500/600 and 800/900 hexes.
3. Re-version v3 docs to v4 (contiguous ladder + per-hue brand intents + lemon-olive-text rule). Master docs currently describe a 42/54 system the build no longer ships.
4. Decide `accent` intent (Q2) and rename `text.brand-lemon` (Q3).

---

## 5. Completeness matrix

### Per-hue × step (● REAL-pinned · ✚ GEN-to-fill · ◦ GEN-headroom · — not-needed)

| Hue | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 |
|---|---|---|---|---|---|---|---|---|---|---|
| violet | ● | ● | ● | ● | ✚ | ●🔒 | ● | ●* | ● | ◦ |
| blue | ● | ●🔒 | ✚ | — | — | ✚★ | ✚★ | ✚ | — | ◦ |
| magenta | ✚ | ✚ | ✚ | ●🔒 | — | ●★ | ✚★ | — | — | ◦ |
| green | ✚ | ●🔒 | ●* | ● | — | ✚ | ✚★ | ✚★ | — | ◦ |
| lemon | ✚ | ●🔒 | ✚ | — | — | ✚ | ✚★ | — | — | ◦ |
| coral | ✚ | ● | ✚ | ●🔒 | — | ✚ | ●★ | ✚★ | — | ◦ |
| orange | ✚ | ● | ●* | — | — | ●★-thin | ✚★ | ✚★ | — | ◦ |
| grey | ● | ● | ● | ✚ | ● | ● | ● | ● | ●🔒 | ◦ |
| white | — | — | — | — | — | — | — | — | — | ●(self) |

`*` = pin to be applied per §3.A (currently GEN-drift). `★` = white-text-bearing / AA-text dark. `🔒` = MAIN.

### Per-intent → backing hue+step (AA-confirmed, recomputed)

| Intent | Fill (white text) | Hover/pressed | Text/icon on white | Border (≥3:1) | AA |
|---|---|---|---|---|---|
| brand / brand-violet | violet/600 #6D46FC (5.34) | violet/700 (9.81) | violet/700 (9.81) | violet/600 (5.34) | ✅ |
| brand-magenta | magenta/600 #8B4DA9 (5.63) | magenta/700 (8.23) | magenta/700 (8.23) | magenta/600 (5.63) | ✅ |
| success / brand-green | green/700 #0E7A1E (5.50) | green/800 (9.19) | success→green/800 (9.19) | green/600 (4.07) | ✅ |
| warning / brand-orange | orange/700 #8A4904 (6.92) | orange/800 (10.99) | orange/700 (6.92) | orange/600 (4.57) | ✅ |
| danger / brand-coral | coral/700 #B33F3C (5.69) | coral/800 (9.47) | coral/700 (5.69) | coral/600 (4.16) | ✅ |
| info / brand-blue | blue/700 #135588 (7.83) | blue/800 (11.93) | blue/700 (7.83) | blue/600 (5.32) | ✅ |
| brand-lemon | lemon/200 #FFE60A (fg=grey/900 11.15) | lemon/300 (fg dark) | lemon/700 #7E6209 (5.77) | lemon/600 (4.11) | ✅ |
| neutral / default | grey/700 #484848 (9.15) | grey/800 (14.13) | grey/900 (14.13), secondary 700 (9.15), tertiary 600 (4.98) | grey/300 1.71 *(decorative-exempt)* | ✅\* |
| on-\* | white #FFFFFF on all fills above | — | — | — | ✅ |

\* neutral border is the one documented sub-3:1 exemption (decorative). All informational/interactive pairs pass.

---

## 6. Open brand questions (designer calls only)

- **Q1 — Bimodal blue.** `blue/100` (Patterns Blue, true-blue H234) and `blue/200` (Periwinkle, blue-violet H273) are **39° apart** — the ramp is not hue-monotonic. v3 locked this (LDS files Periwinkle under blue). *Accept the bimodal blue as documented, or re-home Periwinkle and pick one anchor hue for `blue`?* (Recommendation: accept — both are real, both are consumed, and the GEN darks 600/700 at H248 sit between them.)
- **Q2 — `accent` intent.** Lemon's only v3-compliant home was a gated `accent` intent that the build never built. *Add a first-class `accent` intent (→lemon/200) for landing decorative use, or formally sanction `brand-lemon` as lemon's home?*
- **Q3 — lemon-as-text naming.** The build ships `text.brand-lemon.primary` → lemon/700 olive #7E6209. It's AA-valid and is NOT the yellow accent, but the name implies "lemon text." *Rename (e.g. `text.brand-lemon` → an olive `accent-text` token) so no one mistakes it for white-bearing yellow?*
- **Q4 — `brand-magenta` density.** Magenta = 1 code use (illustration/landing). *Keep the 5-step brand twin, or demote magenta to a thin accent (100/400/600) and free the GEN tints?*
- **Q5 — Real-shade pins (sign-off).** §3.A proposes pinning Apple #31C838 (green/300), Orange-Main #FFA000 (orange/300), Daisy Bush Dark #2E1781 (violet/800) verbatim, displacing GEN approximations. *Confirm these reals are the brand-correct anchors at those L\* bands.*

---

**Files referenced (absolute):**
- `/Users/diyoriko/Documents/Novakid/nk-tokens-pipeline/foundations/primitive-palette.md`
- `/Users/diyoriko/Documents/Novakid/nk-tokens-pipeline/foundations/final-token-tree.md`
- `/Users/diyoriko/Documents/Novakid/nk-tokens-pipeline/foundations/extract-colors.md`
- `/Users/diyoriko/Documents/Novakid/nk-tokens-pipeline/foundations/_audit/AUDIT-NUMBERS.md`
- `/Users/diyoriko/Documents/Novakid/nk-tokens-pipeline/tokens/tokens.json`

This doc drives the ramp build (task #6). The four headline build deltas (§3.A pins + grey de-dup + doc re-version + accent/lemon-text naming) are the concrete work items.

---

## 7. Brand-question resolutions (recommended — confirm/override)

| Q | Choice | Rationale |
|---|---|---|
| **Q1 — bimodal blue** | **Accept as-is** | The hue wobble (Patterns Blue H234 → Periwinkle H273) lives only in the light tints 100/200 where hue is barely perceptible; both are REAL + code-consumed; the functional darks 600/700 (info) are consistent azure. Re-homing Periwinkle would misname a 9-use real light-blue. Document the wobble. |
| **Q2 — accent intent** | **Keep `brand-lemon`; defer `accent` to component phase** | A first-class `accent` intent is cleaner long-term but is a component-stage modelling call. `brand-lemon` works now and lemon's accent-only constraint is documented. Reversible later. |
| **Q3 — rename text.brand-lemon** | **Keep the name; document it = olive** | `text.brand-X.primary` = the AA-dark of hue X is the consistent pattern across all brand hues; lemon's AA-dark just happens to be olive #7E6209. Renaming breaks symmetry. Add a one-line doc note. |
| **Q4 — magenta density** | **Keep `brand-magenta` intent; ramp right-sized (5 steps)** | Heliotrope is a real Brand-Book hue, used on landing; keep the symmetric brand twin but don't generate steps nothing consumes (already right-sized). |
| **Q5 — pin the 3 reals** | **YES — pin them** | Apple #31C838 (green/300, 23 uses), Orange-Main #FFA000 (orange/300), Daisy Bush Dark #2E1781 (violet/800) are real brand colours with usage; preserving them verbatim is the core principle. |

All five are low-risk "preserve + defer the modelling calls to component phase" defaults. Override any before task #6.

**Net implementation scope (task #6) — CORRECTED after verifying §3.A against the actual build (2026-06-08):**
> ⚠️ §3.A was partly wrong — analysis agents misread the build. Verified reality:
> - **Apple #31C838 ALREADY pinned at green/400** (L*-correct); green/300 is a soft GEN tint (correct for a tint surface). Do NOT move it to 300.
> - **Orange-Main #FFA000 ALREADY pinned at orange/400.** Do NOT move.
> - **No grey duplicate steps** — ramp 100–1000 all-distinct; the repeated hex counts were grey/900 + semantic aliases resolving to it.
> - **Only real delta applied: Daisy Bush Dark #2E1781 pinned at violet/800** (was GEN #311695). violet 700/800/900 now = three real brand purples (#4221B8 / #2E1781 / #210A74), monotonic. (Held local-uncommitted per "verify-locally-first".)

Remaining for v4 close-out:
1. ~~Pin 3 reals~~ → only violet/800 was a real gap; **applied locally**. Apple/Orange already correct.
2. ~~Grey de-dup~~ → not needed.
3. **Task #13 (status text on secondary-HOVER tint)** — resting tint passes (4.9–5.2); only hover (one step darker) fails danger/warning/info. **Resolution = usage rule, not a token change:** status TINT surfaces pair with NEUTRAL text (grey/900, passes everywhere); status-COLOURED text (text.{status}.primary) is for white / resting-light. Optionally add `text.{status}.on-tint` → /800 later.
4. Re-version the v3 master docs → v4 (this doc is the spec). NOTE: the `design-code/` folder was renamed to **`design-code-research/`** on 2026-06-08 — update path references in HANDOFF + memory.
5. No new hues, no amber, no accent intent, no renames (Q1–Q4 = keep).
---

## 8. Status colour model — `bold` + `light` (decided 2026-06-08, implemented locally)

success / warning / danger / info each expose **two first-class surface treatments** (replaces the old primary/secondary/tertiary status variants):

| Token | success | warning | danger | info |
|---|---|---|---|---|
| `background/{s}/bold` (bright brand fill) | green/400 `#31C838` Apple | orange/400 `#FFA000` | coral/500 `#FF5A56` Persimmon | blue/200 `#C6D2FF` Periwinkle |
| `text·icon/{s}/on-bold` (dark) | grey/900 — AA 6.36 | 6.92 | 4.61 | 9.46 |
| `background/{s}/light` (tint) | green/100 | orange/100 | coral/100 | blue/100 |
| `text·icon/{s}/on-light` (colored) | green/700 — AA 4.80 | orange/700 5.98 | coral/700 4.92 | blue/700 6.88 |
| `border/{s}` | green/600 | orange/600 | coral/600 | blue/600 |

- **bold** = bright brand colour + dark text (V1, the Novakid-playful treatment). **light** = tint surface + colored dark text/icon (V2, banners/alerts). All AA pass; icon-on-light uses `/700` (≥3:1).
- **info exception:** no bright brand blue exists → info/bold = Periwinkle (light chip + dark text).
- **Dropped:** the old dark-fill + white-text status treatment. If a solid dark status button is needed later, add a `strong` layer (e.g. `background/info/strong` = blue/700 + white).
- **Hover states not yet defined** (bright-fill + dark-text darkening reduces contrast; status banners rarely hover — decide at component stage).
