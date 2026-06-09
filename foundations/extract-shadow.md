# Foundations — Shadow / Effect primitives

Phase-0 extraction. Source of truth for `effect/shadow/*` tier-1 primitives in the Novakid Foundations Figma file.

Token grammar is LOCKED (Confluence "Tokens arch & naming", eng sign-off). This doc obeys it:
Figma name is the contract. Code = swap `/`→`-`, lowercase, prefix `--nk-`.
No platform-leak terms in Figma names (no `px`, no `--`, no `var()`, no `theme.spacing()`).

`effect/shadow/<tier>/...` is TIER 1: raw, 1 mode, hidden from publish, never used directly in designs.
A design consumes the **composite** via a Figma **Effect Style** that bundles the atomic primitives. Effect Styles are free in Tokens Studio, so the composite is not itself a variable — only the atoms are.

---

## 1. Why a 5-tier set, not the 24-step MUI ramp

### Sources read
- `novakid-parent-mf/src/theme/shadows.ts` — MUI `softShadows[0..24]` (alpha 0.25 on the cast layer, 0.31 hairline) and `strongShadows[0..24]` (alpha 0.50 cast, 0.70 hairline). Both are the stock MUI elevation ramp: a fixed `0 0 1px` hairline + a growing `0 {Y}px {B}px -{S}px` cast layer. 24 monotonic steps, ~1px apart — built for MUI's `elevation` prop, not for human-named design decisions.
- `claude-design-ds-landings/_research/BB_effects.json` — Brand Book "Pop up shadow": `DROP_SHADOW`, x=0, y=8, blur(radius)=36, spread=0, color black @ alpha 0.16. This is the canonical marketing/landing elevation.
- Real `boxShadow:` usage tally across `novakid-parent-mf/src` (30 distinct strings — see §3).

### The argument
The MUI 24-step ramp is an interpolation, not a vocabulary. Consecutive steps differ by ~1px of blur/offset — a difference no human picks intentionally and no reviewer can defend. Shipping 24 shadow tokens reproduces the "too granular" problem the token system exists to kill, and it leaks MUI's `elevation` mental model into a platform-neutral contract.

The real product uses a **handful** of elevations. The tally collapses cleanly into 5 used buckets plus "none": tight 1–3px hairline shadows on inputs/chips; an 8px small lift on cards/buttons; a 12–24px overlay shadow on dropdowns/popovers; a 30–36px deep shadow on modals/pop-ups (the BB pop-up lives here); and a small set of high-spread glows. Five named tiers cover every observed case and map 1:1 onto elevation intent (resting → raised → floating → overlay → modal). More tiers would be unused; fewer would force two distinct intents (e.g. dropdown vs. modal) to share one token.

So: **`effect/shadow/{xs, sm, md, lg, xl}`** — count justified by §3, not by aesthetics.

### Tier ↔ intent ↔ source mapping

| Tier | Intent (role) | Y | Blur | Spread | Color | Opacity | Anchored in |
|---|---|---|---|---|---|---|---|
| `xs` | hairline / resting (inputs, chips, dividers-as-lift) | 1 | 3 | 0 | black | 0.08 | `0 1px 3px`, `0px 1px 1px`, `0 1px 6px` cluster |
| `sm` | raised (cards, buttons, hover lift) | 3 | 8 | 0 | black | 0.12 | `0px 3px 8px` ×9 (single most-used real shadow) + `0 2px 8/10px` |
| `md` | floating (dropdown, popover, tooltip) | 5 | 16 | 0 | black | 0.14 | `0px 5px 20px`, `0px 4px 12/20px`, `0px 6px 16/17px` cluster |
| `lg` | overlay (sheets, large menus, toasts) | 8 | 24 | 0 | black | 0.16 | `0px 8px 24px` ×3 + `0 8px 32px` |
| `xl` | modal / pop-up (BB "Pop up shadow") | 8 | 36 | 0 | black | 0.16 | **BB pop-up** (x0 y8 b36 a0.16) + `0px 8px 36px` ×3 + `0px 15px 30px` |

Notes:
- **BB pop-up = `xl`.** Brand Book gives x0/y8/blur36/spread0/alpha0.16 verbatim → `effect/shadow/xl`. It is the load-bearing tier for landing/marketing pop-ups and the deepest product modal, so `lg` and `xl` share y=8 / alpha 0.16 and differ only in blur (24 vs 36): overlay vs. true modal. This keeps the BB value untouched while giving product a slightly tighter overlay step below it.
- **Opacity ramps 0.08 → 0.16**, not MUI's flat 0.25/0.31. The product's real shadows are lighter than stock MUI; the tally shows alpha clustering well under 0.25. Pinning to the BB 0.16 ceiling at `lg`/`xl` matches brand and avoids the heavy MUI look. (MUI `strongShadows` 0.50 is an inverted/overlay-scrim artifact, not an elevation the brand uses — not tokenized.)
- **The MUI `0 0 1px` hairline layer is dropped** from the named tiers. It is a sub-pixel anti-alias seam, not a designed shadow; carrying it would mean every tier is a 2-layer composite for no perceived benefit. If a hairline border is needed it belongs to `size/stroke/*` + `color/border/*`, not to `effect/shadow/*`.
- **`none`** (37 hits + `unset` ×2 + `none !important`) is the absence of the token, not a tier. Don't mint `effect/shadow/none`.

---

## 2. Atomic primitives per grammar

Each tier is six atomic tier-1 primitives. `offset-x`, `offset-y`, `blur`, `spread` are stepped numbers (raw, unitless in the contract — rendered as px by the consuming platform). `color` aliases the primitive tonal ramp (`color/grey/900` ≈ near-black, reused so the shadow hue rebrands with the palette). `opacity` is the alpha 0..1.

The composite (`0 {offset-y} {blur} {spread} rgba(color, opacity)`) is assembled by a **Figma Effect Style** named to match the tier (e.g. Effect Style `shadow/sm`). The Effect Style is the only thing a design lands on; the six atoms below are its inputs.

```
effect/shadow/xs/offset-x      = 0
effect/shadow/xs/offset-y      = 1
effect/shadow/xs/blur          = 3
effect/shadow/xs/spread        = 0
effect/shadow/xs/color         -> color/grey/900
effect/shadow/xs/opacity       = 0.08

effect/shadow/sm/offset-x      = 0
effect/shadow/sm/offset-y      = 3
effect/shadow/sm/blur          = 8
effect/shadow/sm/spread        = 0
effect/shadow/sm/color         -> color/grey/900
effect/shadow/sm/opacity       = 0.12

effect/shadow/md/offset-x      = 0
effect/shadow/md/offset-y      = 5
effect/shadow/md/blur          = 16
effect/shadow/md/spread        = 0
effect/shadow/md/color         -> color/grey/900
effect/shadow/md/opacity       = 0.14

effect/shadow/lg/offset-x      = 0
effect/shadow/lg/offset-y      = 8
effect/shadow/lg/blur          = 24
effect/shadow/lg/spread        = 0
effect/shadow/lg/color         -> color/grey/900
effect/shadow/lg/opacity       = 0.16

effect/shadow/xl/offset-x      = 0
effect/shadow/xl/offset-y      = 8
effect/shadow/xl/blur          = 36
effect/shadow/xl/spread        = 0
effect/shadow/xl/color         -> color/grey/900
effect/shadow/xl/opacity       = 0.16   # BB "Pop up shadow" — verbatim
```

Code emission (grammar swap `/`→`-`, lowercase, prefix `--nk-`):
`effect/shadow/xl/blur` → `--nk-effect-shadow-xl-blur: 36;`
Composite is NOT emitted as a single var — it is the Figma Effect Style; the build can optionally compose a convenience `--nk-effect-shadow-xl` string from the six atoms, but the atoms are the contract.

---

## 3. boxShadow usage tally (justification)

Raw, from `grep -rhoE 'boxShadow:[^,}]+' .../novakid-parent-mf/src | sort | uniq -c | sort -rn`:

```
 37  boxShadow: 'none'
  8  boxShadow: `0px 3px 8px 0px rgba(0...
  5  boxShadow: '0 2px 8px rgba(0...
  3  boxShadow: '0px 8px 36px 0px rgba(0...   <- BB pop-up value, in product too
  3  boxShadow: '0px 8px 24px rgba(0...
  2  boxShadow: 'unset'
  2  boxShadow: '0px 5px 20px rgba(0...
  2  boxShadow: '0 1px 3px rgba(0...
  1  boxShadow: theme.spacing(1) + ' 0px 0px 0px ... inset'   (inset border trick, not elevation)
  1  boxShadow: theme.shadows[5]                              (MUI ramp index — maps to sm/md)
  1  boxShadow: ...winterChallenge ternary 'none'|undefined   (none)
  1  boxShadow: `inset 3px 0px ${primary.main}`               (inset accent, not elevation)
  1  boxShadow: `inset 0 -2px ${primary.main}`                (inset underline, not elevation)
  1  boxShadow: 'rgba(50...                                   (one-off, low elevation)
  1  boxShadow: 'none !important'                             (none)
  1  boxShadow: '0px 6px 17px 0px rgba(0...
  1  boxShadow: '0px 6px 16px rgba(0...
  1  boxShadow: '0px 5px 10px 0px rgba(0...
  1  boxShadow: '0px 4px 20px rgba(0...
  1  boxShadow: '0px 4px 12px rgba(0...
  1  boxShadow: '0px 3px 8px 0px rgba(0...
  1  boxShadow: '0px 1px 1px 0px rgba(0...
  1  boxShadow: '0px 15px 30px 0px rgba(27...
  1  boxShadow: '0px 14px 30px rgba(131...                    (colored — brand glow, see below)
  1  boxShadow: '0px 0px 32px 0px rgba(66...                  (colored glow, y0)
  1  boxShadow: '0 8px 32px rgba(0...
  1  boxShadow: '0 4px 20px rgba(0...
  1  boxShadow: '0 4px 10px rgba(0...
  1  boxShadow: '0 2px 10px rgba(0...
  1  boxShadow: '0 1px 6px 0 rgba(0...
```

Bucketing (excluding the 4 inset / non-elevation tricks, which are not shadows):

| Bucket | Distinct strings → tier | Approx. hits |
|---|---|---|
| none / unset | — (absence) | ~40 |
| y1–2, blur 1–6 | `xs` | ~5 (`0 1px 3px` ×2, `0px 1px 1px`, `0 1px 6px`, `0 2px 10px`) |
| y3, blur 8 | `sm` | ~14 (`0px 3px 8px` ×9 dominant, `0 2px 8px` ×5) |
| y4–6, blur 12–20 | `md` | ~8 (`0px 5px 20px` ×2, `0px 4px 12/20px`, `0px 6px 16/17px`, `0 4px 10/20px`) |
| y8, blur 24–32 | `lg` | ~5 (`0px 8px 24px` ×3, `0 8px 32px`) |
| y8–15, blur 30–36 | `xl` | ~7 (`0px 8px 36px` ×3 = BB, `0px 15px 30px`, `theme.shadows[high]`) |

Read-out: after removing `none` and inset hacks, **the entire product collapses to exactly 5 elevation bands.** `sm` is by far the most-used real shadow (`0px 3px 8px` ×9 + `0 2px 8px` ×5 ≈ 14 hits) — confirming cards/buttons are the high-traffic elevation and validating it as a named tier. `xl` is anchored by the BB pop-up string appearing verbatim in product code (×3), proving the brand value is already the de-facto modal shadow. No band is empty; no sixth band exists. 5 tiers it is.

### Out of scope (flagged, not tokenized in this tier)
- **Colored glows** — `0px 14px 30px rgba(131,...)`, `0px 0px 32px rgba(66,...)`, `0px 15px 30px rgba(27,...)`. These tint the shadow with a brand/accent hue (violet/lemon family) rather than neutral black. They are *focus/glow effects*, not neutral elevation, and would need a separate `effect/glow/*` or a semantic effect tier whose `color` aliases `color/violet/600` etc. Deferred — out of the neutral `effect/shadow/*` ramp. Noted so they aren't forced into `xl`.
- **Inset shadows** (`inset 3px 0px`, `inset 0 -2px`, `theme.spacing(1) 0 0 0 inset`) — these are accent borders/underlines implemented via box-shadow. They belong to `size/stroke/*` + `color/border/*`, not `effect/shadow/*`.
- **MUI `strongShadows` (alpha 0.50/0.70)** — not used as elevation by the brand; an overlay-scrim artifact. Not tokenized.

---

## 4. Topology

`effect/shadow/*` lives in the **Foundations** Figma file, Primitives collection, **1 mode**, hidden from publish (tier-1, never consumed directly). The composite Effect Styles (`shadow/xs..xl`) are published. Semantic/Product collections do not redefine shadows in this phase; if dark mode needs heavier shadows later, a semantic `effect/elevation/*` alias tier can point at these primitives per-mode (provisioned, not built now — consistent with the Semantic/Landing|Games|Mobile skeleton rule).
