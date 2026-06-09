# Phase 0 — Foundations Extract: SPACE / RADIUS / STROKE

Source: `novakid-parent-mf` (MUI v5 theme + raw `src/` usage).
Extracted 2026-06-04. Locked token grammar per Confluence "Tokens arch & naming".

> Figma name is the contract. Code = swap `/`→`-`, lowercase, prefix `--nk-`.
> No platform-leak terms in Figma names (`px`, `--`, `var()`, `theme.spacing()`).
> `size/space/<step>` numbers are STEPS, not px.

---

## 1. Theme config (the base)

From `src/theme/index.ts`:

```ts
const SPACING = 8; // px           // baseOptions.spacing = SPACING
borderRadius: SPACING              // MuiButton => 8px is the canonical button radius
```

- **MUI spacing base = 8px.** `theme.spacing(N)` = `N * 8`px. This is the multiplier grid the whole app is built on.
- **No `shape.borderRadius` override** in `baseOptions` — MUI default (4px) applies wherever a component doesn't override. Explicit radius is set per-component (`MuiButton` = `SPACING` = 8, `MuiLinearProgress` = 3).
- **No global `borderWidth`/stroke token.** Borders are written inline as `1px solid <color>` shorthand (229 occurrences) — see §5.
- Historical: `tools/changeMuiSpacing.js` migrated the codebase from a **5px base to an 8px base**. Leftover raw `5px`/`10px`/`15px`/`25px` literals are pre-migration debt that the codemod could not reach (string literals, not props) — they read as off-grid noise today.

Component padding patterns confirm the 8-grid intent (all expressed as `N * SPACING`):
`MuiButton` `1.25*S / 5*S` (10/40), `MuiDialogTitle` `3*S 3*S 2*S` (24/24/16), `MuiTab` `0.75*S 1.5*S` (6/12), `MuiTableCell` `16`.

---

## 2. Spacing frequency (px), `theme.spacing()` resolved ×8 + raw `px` literals

`theme.spacing(N)` resolved to px (usage-weighted):

| spacing(N) | = px | count |
|---|---|---|
| spacing(2) | 16 | 269 |
| spacing(1) | 8 | 147 |
| spacing(3) | 24 | 106 |
| spacing(3.125) | **25** | 75 |
| spacing(1.25) | **10** | 65 |
| spacing(2.5) | **20** | 62 |
| spacing(1.5) | 12 | 57 |
| spacing(4) | 32 | 40 |
| spacing(1.875) | **15** | 37 |
| spacing(5) | 40 | 26 |
| spacing(0.5) | 4 | 24 |
| spacing(0.625) | **5** | 18 |
| spacing(6) | 48 | 17 |
| spacing(8) | 64 | 7 |

Raw `NNpx` literals (top, all uses incl. radius/stroke/typography):

| px | count |
|---|---|
| 1px | 338 |
| 20px | 322 |
| 16px | 199 |
| 8px | 152 |
| 2px | 146 |
| 4px | 118 |
| 0px | 112 |
| 24px | 102 |
| 12px | 102 |
| 32px | 95 |
| 5px | 83 |
| 40px | 76 |
| 10px | 75 |
| 6px | 72 |
| 14px | 64 |
| 15px | 59 |
| 22px | 53 |
| 48px | 45 |
| 18px | 45 |

(`1px` is dominated by border-width, see §5; `14px`/`22px` are largely typography, out of scope here.)

---

## 3. Spacing → locked stepped scale `size/space/<step>`

Locked scale: `100=4, 200=8, 300=12, 400=16, 500=20, 600=24, 800=32, 1000=40, 1200=48, 1600=64`.

ON-SCALE — raw px that collapse cleanly (combined spacing()+raw weight):

| step | px | raw px that collapse here | combined weight (approx) |
|---|---|---|---|
| 100 | 4 | `4px`, spacing(0.5) | high (118 + 24) |
| 200 | 8 | `8px`, spacing(1) | very high (152 + 147) |
| 300 | 12 | `12px`, spacing(1.5) | high (102 + 57) |
| 400 | 16 | `16px`, spacing(2) | **dominant** (199 + 269) |
| 500 | 20 | `20px`, spacing(2.5) | **dominant** (322 + 62) |
| 600 | 24 | `24px`, spacing(3) | high (102 + 106) |
| 800 | 32 | `32px`, spacing(4) | medium-high (95 + 40) |
| 1000 | 40 | `40px`, spacing(5) | medium (76 + 26) |
| 1200 | 48 | `48px`, spacing(6) | medium (45 + 17) |
| 1600 | 64 | `64px`, spacing(8) | low-medium (7) |

OFF-SCALE — values not on the locked 4-grid scale. Each needs a rounding DECISION:

| raw px | weight | nearest steps | DECISION |
|---|---|---|---|
| **20** | 322+62 | already step 500 | ON-SCALE — keep. (Was the single most-used raw value; locked scale already provisions 500=20.) |
| **5** | 83+18 | 100(4) ↔ 200(8) | → **100 (4)**. Pre-8px-migration debt; round down to nearest grid. |
| **10** | 75+65 | 200(8) ↔ 300(12) | → **300 (12)** for layout gaps; **200 (8)** for tight insets. Default **300**. Migration leftover. |
| **15** | 59+37 | 400(16) ↔ 300(12) | → **400 (16)**. Round to 16. Migration leftover (was 24px@5-base → mis-scaled). |
| **25** | (75 via spacing(3.125)) | 600(24) | → **600 (24)**. This is `spacing(3.125)` — an artifact of the 5→8 codemod (`5*5=25`→ left as 3.125*8). Snap to 24. |
| **6** | 72 | 100(4) ↔ 200(8) | → **200 (8)** when it's a gap; many `6px` are radius/icon, not spacing. Review per-use. |
| **18** | 45 | 400(16) ↔ 500(20) | → **400 (16)** or **500 (20)** by context. Default **500**. |
| **22** | 53 | 600(24) | → **600 (24)**. (Often typography line-height — exclude those.) |
| **30** | 46 | 800(32) | → **800 (32)** for spacing. (Most `30px`/`40px` here are RADIUS — see §4.) |
| **36** | ~3 | 800(32) ↔ 1000(40) | → **800 (32)**. Rare. |
| **44** | 14 | 1000(40) ↔ 1200(48) | → **1000 (40)** or **1200 (48)** by context. Often a control HEIGHT, not spacing. |

NEW STEP CANDIDATES (not in locked scale, low evidence — do NOT add yet): `700=28` (28px appears), `900=36`, `1100=44`. Recommendation: keep the locked 10-step scale; route 28/36/44 to the nearest existing step rather than expanding the contract.

---

## 4. Radius → `size/radius/<size>`

Real `borderRadius` values from `src/` (theme.spacing resolved):

| source | px | count |
|---|---|---|
| `theme.spacing(1)` | 8 | 45 |
| `theme.spacing(2)` | 16 | 42 |
| `'50%'` | circle | 40 |
| `8` / `'8px'` | 8 | 38 + 16 |
| `theme.spacing(3.125)` | 25 | 37 |
| `16` / `'16px'` | 16 | 34 + 10 |
| `12` / `'12px'` | 12 | 23 + 7 |
| `0` | 0 | 23 |
| `30` / `'30px'` | 30 | 20 + 15 |
| `theme.spacing(1.875)` | 15 | 12 |
| `2` | 2 | 12 |
| `'40px'` | 40 | 11 |
| `theme.spacing(1.5)` | 12 | 10 |
| `'100px'` / `100` | 100 | 9 + 8 |
| `theme.spacing(3)` | 24 | 8 |
| `999` | pill | 6 |
| `'4px'` | 4 | 6 |

Distinct radius intents that emerge:
- **8px** — the workhorse (button, card, input). `borderRadius: SPACING` in theme. → `size/radius/200`.
- **16px** — large cards / sheets. → `size/radius/400`.
- **4px** — small chips / tags / the MUI default. → `size/radius/100`.
- **pill / full** — `999`, `'100px'`, `'40px'` on tall pills, `'50%'` avatars. → `size/radius/full` (=9999).
- Off-scale clutter to retire: `2`, `3` (`MuiLinearProgress`), `12`, `15`(=spacing(1.875) codemod artifact), `24`, `25`(=spacing(3.125)), `30`. Map: `2/3→100(4)`, `12→200(8)` or new, `15→200(8)`, `24/25/30→400(16)`.

### Naming: ONE convention — recommend NUMERIC (`100/200/400/full`)

The locked doc shows both numeric (`100=4,200=8,400=16,full=9999`) and names (`small/base/large/full`). Reconcile to **numeric**, because:

1. **Consistency with `size/space`** — space is already numeric-stepped (`100…1600`). A designer reads `size/radius/200` and `size/space/200` as the same scale family. `small/base/large` breaks that mental model.
2. **Insertion without churn** — code evidence shows real demand for an intermediate radius (12px sits between 8 and 16, 23+ uses). A numeric scale lets you slot `size/radius/300` later without renaming `base→?`. With names you'd have to invent `medium` and re-sort the semantic order — a breaking rename of a published primitive.
3. **No appearance lock-in** — `large` is a claim about how it looks; `400` is just a position. If a rebrand softens corners, `400` can change px value and stay correctly named (same rule that makes `color/text/default` survive a rebrand). `large` could become a lie.
4. **`full` is the one exception kept as a word** — it's a behavior (fully rounded / pill, 9999), not a step, so it stays `full` in both conventions. No conflict.

Final radius set: `size/radius/100` (4), `size/radius/200` (8, default), `size/radius/400` (16), `size/radius/full` (9999). Reserve `size/radius/300` (12) only if the 12px cluster survives design review — flagged, not built.

---

## 5. Stroke → `size/stroke/<role>`

Border-width evidence:

| width | count | source |
|---|---|---|
| `1px solid` | 229 | default border everywhere (`COLOR__GREY_MISCHKA` 116×, violet, silver, etc.) |
| `2px solid` / `borderWidth:'2px'` | 15 + 9 | focus / selected / emphasis rings |
| `2px dashed` | 8 | drop-zone / placeholder outlines |
| `3px solid` | 6 | heavy tab underline / active state |
| `5px`, `20px solid` | 2 + 1 | one-off decorative — NOT tokens |

There is **no stroke token in code** — widths are inline literals. `1px` is the overwhelming default; `2px` is the clear secondary (focus/selected/emphasis).

Proposed primitives (role-named, matching locked `size/stroke/<role>`):

| token | px | role |
|---|---|---|
| `size/stroke/default` | 1 | every resting border (229 uses) |
| `size/stroke/focus` | 2 | focus rings, selected, 2px emphasis (24 uses) |

`3px` (6 uses, active-tab) is below the bar for a primitive — round to `focus` (2) or treat as a component-tier decision in Phase 2. `2px dashed` is the same WIDTH as `focus` (the dashing is a style, not a width token) → still `size/stroke/focus`. Decorative `5px`/`20px` are excluded.

---

## 6. Decisions log (for sign-off)

- D1. `size/space` keeps the locked 10-step scale; do NOT add 28/36/44 steps — route to nearest.
- D2. `20px` (step 500) is legitimate and high-traffic — keep it, do not "round away."
- D3. Codemod artifacts `spacing(3.125)=25`, `spacing(1.875)=15`, raw `5/10/15` are 5px-base debt → snap to grid (25→24, 15→16, 5→4, 10→12).
- D4. Radius naming = **numeric** (`100/200/400/full`), `full=9999`. `300=12` reserved pending design review.
- D5. Stroke = `default(1)`, `focus(2)`. `3px`/dashed handled at component tier.
