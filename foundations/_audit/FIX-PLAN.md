# Fix plan — final review findings (each with options)

From `_audit/FINAL-REVIEW.md`. Per item: problem · options (pick one) · recommendation · effort · Figma round-trip (does it become a Figma var/style, or code-only?).

> Legend: **Figma**=materializes via Tokens Studio · **code-only**=lives in tokens.json for npm consumers but Figma has no equivalent (motion, z-index, opacity).

---

## GROUP A — real defects (fix before v1.0.0)

### A1. Focus ring invisible on the primary CTA  🔴 CRITICAL · Figma
`border/focus/default` = `#6D46FC` = `background/brand-violet/primary` → ring contrast 1.00 on the violet button. WCAG 2.2 SC 2.4.11 fail.
- **Opt 1 (recommended): fill-aware focus + offset.** Add `border/focus/on-fill` = `white/1000`; keep `border/focus/default` = `violet/600` (for light surfaces); add `size/stroke/focus-offset` = `2px`. Rule: focusable with a coloured fill → use on-fill ring; otherwise default. The 2px offset puts the ring on the page surface so it never sits on the same-colour fill.
- **Opt 2: always-offset single ring.** One `border/focus` = `violet/600` + mandatory `focus-offset` 2px gap (white) so even on a violet fill the gap separates ring from fill. Simpler, one token, but relies on every component honouring the offset.
- **Opt 3: high-contrast neutral ring.** `border/focus` = `grey/900` + 2px offset — works on any fill but is off-brand.
- **Rec:** Opt 1. Effort: +2 tokens. (USWDS/Material focus model.)

### A2. Brand colored text fails AA on its own secondary tint  🟠 HIGH · Figma
`text/brand-coral/primary` `#B33F3C` on `bg/brand-coral/secondary` `#FFD0C9` = **4.09 FAIL**; brand-green = **4.23 FAIL**. (Statuses already fixed via bold/light; brand-* has the identical hole.)
- **Opt 1 (recommended): unify brand-* to the bold/light model** (same as statuses). Replaces primary/secondary/tertiary for brand hues with `bold`(bright fill + dark text) + `light`(soft /100 tint + /700 colored text). Fixes A2 AND A3 AND the "brights demoted" product defect (B-level) in one move. Bigger change, most consistent system.
- **Opt 2: soften brand secondary tints to /100** + keep primary/secondary/tertiary. `bg/brand-coral/secondary → coral/100`, `green → green/100`, etc. Then `text/brand-X/primary` passes on them. Minimal, keeps current structure.
- **Opt 3: add `text/brand-{coral,green}/on-secondary`** → coral `/800` (passes on the tint), green → grey/900 (because green-secondary is vivid Lime, /800 = near-black-on-electric). Adds tokens, keeps tints.
- **Rec:** Opt 1 (unify to bold/light) — it's the structurally-clean fix and recovers the brand brights. Fallback Opt 2 if we want minimal scope. Effort: Opt1 = restructure 7 brand intents; Opt2 = ~7 ref swaps.

### A3. `brand-green-tertiary-hover` collides with green-secondary  🟠 HIGH · Figma
Both resolve to Lime `#79FD7F` → hovering a green tertiary chip = same fill as a green secondary chip (no visual delta).
- **Opt 1:** subsumed by A2-Opt1 (bold/light drops tertiary). 
- **Opt 2:** if keeping primary/secondary/tertiary — re-map green tint ladder so tertiary-hover ≠ secondary (e.g. tertiary `green/100`, tertiary-hover `green/200`=Lime, secondary a distinct soft step). But there's no soft green between 100 and Lime → needs a GEN soft step or accept.
- **Rec:** fix via A2-Opt1. Effort: free if A2-Opt1.

---

## GROUP B — missing categories (cheap, high-value; recommend for v1)

### B1. Overlay / scrim semantic  🟡 · Figma
black-alpha primitives exist but only 4/15 consumed (by shadows); entire white-alpha ramp 100% unconsumed. Every modal/drawer hardcodes rgba.
- **Opt 1 (recommended):** `background/overlay` → `black/300` (0.2, light dim for popovers/hover-sheets); `background/scrim` → `black/500` (0.7, modal backdrop). 
- **Opt 2:** single `background/scrim` → `black/400` (0.4). Minimal.
- **Opt 3:** add both + `background/overlay-light` → `white/400` (light scrim on dark media) — wires the white-alpha ramp too.
- **Rec:** Opt 1 (or Opt 3 if we want the white-alpha justified). Effort: 2–3 tokens.

### B2. Motion tokens  🟡 · code-only (Figma has no motion vars)
duration/easing = 0. Every component hardcodes timing; no `prefers-reduced-motion` baseline.
- **Opt 1 (recommended):** new `duration` group {`fast`=100ms, `base`=200ms, `slow`=300ms, `slower`=500ms} + `easing` group {`standard`=cubic-bezier(.2,0,0,1), `decelerate`=(0,0,0,1), `accelerate`=(.3,0,1,1)}. DTCG `$type: duration` / `cubicBezier`.
- **Opt 2:** minimal — 3 durations + 1 standard easing.
- **Rec:** Opt 1. Effort: ~7 tokens, new set. Note: motion lives in tokens.json for the npm package; Tokens Studio/Figma won't materialize it (no motion variables) — that's expected.

### B3. Brand-bold fills (recover the brights)  🟡 · Figma — *merges with A2-Opt1*
`brand-{green,coral,orange,blue,magenta}-primary` resolve dark/muted (/600–700); the signature brights only reachable via status `bold`. Kid-facing CTA from the brand intent = corporate-dark.
- **Opt 1 (recommended):** A2-Opt1 (bold/light for brand-*) gives every brand hue a `bold` bright fill. Same change.
- **Opt 2:** keep structure, add `background/brand-{hue}/bold` alongside primary. Additive.
- **Rec:** do via A2-Opt1.

### B4. `info/strong` (solid high-emphasis info)  🟢 · Figma
info/bold = Periwinkle (1.49 vs white) is a weak emphasis. No solid info option.
- **Opt 1:** add `background/info/strong` → `blue/700` `#135588` + `text/info/on-strong` → white (7.83). 
- **Rec:** Opt 1. Effort: 2 tokens. (Could generalize a `strong` layer for all statuses later.)

### B5. Drop-shadow degeneracy (400/500/600)  🟢 · Figma
All three share offset-y 8px + alpha 0.16, differ only in blur (24/32/36) → elevation hierarchy lost above 300.
- **Opt 1 (recommended):** re-grade — step offset-y AND alpha at upper tiers (e.g. 400: y8/b24/0.16, 500: y12/b32/0.18, 600: y16/b40/0.20). Keeps 6 tiers, restores hierarchy.
- **Opt 2:** collapse to 4 meaningful tiers (xs/sm/md/lg).
- **Rec:** Opt 1 (needs new blur/depth steps) or Opt 2 (simpler). Effort: small. Note: changes the BB-pop-up tier — brand glance.

### B6. README drift + TS DX  🟢 · docs
README mentions inner-shadow (build has 0); dot-access example `tokens.color.background.brand.default` breaks on hyphenated keys (`brand-violet`, `on-bold`).
- **Opt 1:** fix README (remove inner-shadow, show bracket access for hyphenated keys). 
- **Rec:** Opt 1. Effort: doc edit.

---

## GROUP C — bigger / needs brand input (recommend: scaffold/defer with docs)

### C1. Dark mode  · Figma (modes)
`$themes: []`; `on-*` hard-pinned to white → naive dark re-alias breaks foregrounds.
- **Opt 1 (recommended now): scaffold only.** Add a mode dimension + route `on-*`/`background/base` through re-aliasable semantics so dark becomes additive later. Don't author dark values yet.
- **Opt 2: full dark mode now** — author a complete dark alias set (every semantic re-pointed for dark). Large; needs design.
- **Rec:** Opt 1 now, Opt 2 as its own track.

### C2. Interactive states — selected / active / pressed  · Figma
Only `hover` exists; statuses have none.
- **Opt 1 (recommended):** add `pressed` (one step darker) + `selected` (tint + ring) across the intents that need them. 
- **Opt 2:** minimal — add `selected` only (most-missed).
- **Rec:** Opt 1, scoped to interactive intents (base/neutral/brand).

### C3. Gamification / reward vocabulary  · Figma — *needs brand colours*
For a kids product (stars/streaks/progress) there's no reward/gold/progress/streak/celebratory token, and no gentle "try-again" distinct from `danger`.
- **Opt 1:** define semantic roles now mapped to existing primitives — `feedback/reward` → lemon or a gold, `feedback/progress-track` → grey/200, `feedback/progress-fill` → green or violet, `feedback/streak` → orange, `feedback/encourage` (soft, not danger) → orange/blue tint. 
- **Opt 2:** request a dedicated **gold** brand colour (real reward gold ≠ lemon) + design the reward system properly.
- **Rec:** Opt 1 as a starter (no new primitives) + flag Opt 2 for brand. Needs your product call.

### C4. z-index / opacity tokens  · code-only
No stacking/opacity scale → invented per component.
- **Opt 1 (recommended):** `z-index` {base 0, dropdown 1000, sticky 1100, overlay 1200, modal 1300, toast 1400} + `opacity` {disabled 0.4, muted 0.6}. code-only.
- **Rec:** Opt 1. Effort: ~8 tokens.

### C5. Contrast contract in CI  · build
`AUDIT-NUMBERS.md` is out-of-band → can drift.
- **Opt 1 (recommended):** build-time assertion (node post-build / SD action) that every `on-*` clears its threshold; fail CI on regression. Radix-grade enforcement.
- **Rec:** Opt 1. Effort: ~40-line script + CI wire.

### C6. link / data-viz / misc  · Figma
No link/visited; no categorical palette (the 8 brand /500 are a ready set); no skeleton, no semantic radius roles.
- **Opt 1:** add `text/link` (violet/700) + `text/link-visited` (magenta/700); `data-viz/{1..8}` → the 8 brand /500; `background/skeleton` → grey/200.
- **Rec:** add link + data-viz now (cheap, uses existing primitives); defer skeleton/radius-roles.

---

## Cross-cutting note
A2-Opt1 (unify brand-* to bold/light) is the single highest-leverage choice — it resolves A2, A3, B3 together and makes brand + status consistent. Everything else is additive.
