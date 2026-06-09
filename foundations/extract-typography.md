# Foundations — Typography Primitives (TIER 1)

> Phase-0 extraction. Source of truth for `typography/*` Figma variables in the Foundations file.
> Token grammar locked per Confluence "Tokens arch & naming" (eng sign-off). Figma name is the contract;
> code = swap `/`→`-`, lowercase, prefix `--nk-`. No platform-leak terms in Figma names (no `px`, no `--`, no `var()`).

## Sources reconciled

| Source | Path | Role |
|---|---|---|
| Code anchor (truth) | `parent-mf/src/theme/typography.ts` | MUI variant sizes + weights |
| Theme overrides | `parent-mf/src/theme/index.ts` | checked for variant/lineHeight overrides |
| LDS (Landing) | `claude-design-ds-landings/_research/LDS_types.json` | role names + real line-height % |
| BB (Brand book) | `claude-design-ds-landings/_research/BB_types.json` | legacy brand-book text styles |

### What `index.ts` adds (overrides)

- `fontFamily` stays `Mikado, sans-serif` (typography imported unchanged from `typography.ts`).
- **No** typography-variant `lineHeight` overrides at the theme level. The only `lineHeight`
  in the file is `MuiButton.sizeSmall { lineHeight: '20px' }` — that is a **component-tier** value
  (Phase-2 `component/button/...`), NOT a typography primitive. Do not lift it into TIER 1.
- `MuiDialogTitle` hardcodes `fontWeight:700; fontSize:20` (= h5 / heading-20) — component binding, not a new primitive.
- `MuiButton.root` sets `fontWeight:400; fontSize:16` at the component level, which **conflicts** with
  the MUI `button` variant (`700`). See "MUI variant map" note below.

## Reconciliation: code MUI variants ⇄ LDS roles ⇄ BB styles

Mikado throughout (`Mikado-Bold` = 700, `Mikado-Regular` = 400). Sizes are **numbers**, not px.

| size | weight | code MUI variant | LDS role | BB style | grouped role |
|---:|---:|---|---|---|---|
| 60 | 700 | `h1` | `Heading 60` | `Headers/60 • H1` | title |
| 48 | 700 | `h2` | `Heading 48` | `Headers/48 • H2` | title |
| 36 | 700 | `h3` | `Heading 36` | `Headers/36 • H3` | title |
| 24 | 700 | `h4` | `Heading 24` / `Body 24` | `Headers/24 • H4` | heading |
| 20 | 700 | `h5` | `Heading 20` / `Body 20` | `Headers/20 • H5` | heading |
| 16 | 700 | `h6`, `subtitle1` | `Heading 16` / `Body 16 Bold` | `Body/16 • Subtitle` | heading |
| 16 | 700 | `button` | `Body 16 Bold` | `Button/16 • Button text`† | label/button |
| 16 | 400 | `body1` | `Body 16 Regular` | `Body/16 • Body type 2` | body |
| 14 | 400 | `body2` | `Body 14 Regular` | `Body/14 • Body` | body |
| 14 | 700 | `smallBoldTextStyle` | `Body 14 Bold` | `Body/14 • Body Bold` | body (bold) |
| 14 | — | `smallTextStyle` (size only) | `Body 14 Regular` | `Body/14 • Body` | body |
| 12 | 400 | `caption` | `Body 12 Regular` | `Body/12 • Description` | caption |
| 12 | 700 | — | `Body 12 Bold` | `Body/12 • Description bold` | caption (bold) |

**Extra LDS roles not in code** (provisioned for landing, no MUI variant): `Heading 40`, `Heading 32`,
`Heading 18`, `Body 24`, `Body 18`. These reuse the same atomic size/weight/line-height primitives — they
need no new weight or family token, only additional `typography/<role>/size` rows + Figma text Styles when built.

**LDS `Caption`** is a distinct micro role: size **10**, weight 400, UPPERCASE, letter-spacing 1. Not in the
code anchor. Flagged below — out of scope for the five Phase-1 role groups but documented for completeness.

†**Drift flag (button weight):** code `button` variant = **700** (matches task anchor) and is the contract.
BB `Button/16` text style records weight **400** + letter-spacing 0.5; `MuiButton.root` in `index.ts` also
sets `400`. This is legacy inconsistency. **Decision: button primitive weight = 700** (follow code anchor +
Confluence). Letter-spacing is not modeled as a TIER-1 typography primitive in this phase.

## Line-height extraction

`typography.ts` has **no** line-height. LDS carries real, consistent ratios (the strongest signal):

- **Title/Heading display ramp:** 60/48/36 → **128%**; 24/20/16 → **132%**.
- **Body ramp:** all body sizes (24/18/16/14/12) → **140%**.
- **Caption (10):** 155% (LDS) — micro role, out of the 5 groups.

BB expresses the same intent slightly differently (`INTRINSIC_%` ~100% / `PIXELS`), so LDS % is used as the
normative source. Computed px (line-height = size × ratio):

| role group | size | ratio | line-height (px) |
|---|---:|---:|---:|
| title 60 | 60 | 128% | 76.8 |
| title 48 | 48 | 128% | 61.44 |
| title 36 | 36 | 128% | 46.08 |
| heading 24 | 24 | 132% | 31.68 |
| heading 20 | 20 | 132% | 26.4 |
| heading 16 | 16 | 132% | 21.12 |
| body 16 | 16 | 140% | 22.4 |
| body 14 | 14 | 140% | 19.6 |
| label/button 16 | 16 | 140% | 22.4 (to confirm — button may want 132% to align with heading-16) |
| caption 12 | 12 | 140% | 16.8 |

> Line-heights stored as the **px number** in the primitive (`typography/<role>/line-height` = 76.8, etc.).
> Where the design intent is "tight display vs comfortable reading", that lives in the 128/132/140 ratio — not
> a separate token. `label/button` line-height marked **(to confirm)**: 22.4 if it inherits body, or 21.12 if it
> aligns to heading-16; pick one at build to avoid a third value at size 16.

## Proposed TIER-1 primitives

### Atomic weight + family (shared, 1 mode)

```
typography/font-weight/regular   = 400
typography/font-weight/bold      = 700
typography/font-family/main      = Mikado
```

### Per-role atomic bundle  `typography/<role>/{size,font-weight,line-height}`

Five groups (per task): **title** (60/48/36), **heading** (24/20/16), **body** (16/14),
**label/button** (16), **caption** (12). Each numeric role gets the three atomic rows; a Figma **text Style**
bundles them. `font-weight` rows alias the two weight primitives above.

| primitive | size | font-weight | line-height |
|---|---:|---|---:|
| `typography/title/xl`  (60) | 60 | → bold (700) | 76.8 |
| `typography/title/lg`  (48) | 48 | → bold (700) | 61.44 |
| `typography/title/md`  (36) | 36 | → bold (700) | 46.08 |
| `typography/heading/lg` (24) | 24 | → bold (700) | 31.68 |
| `typography/heading/md` (20) | 20 | → bold (700) | 26.4 |
| `typography/heading/sm` (16) | 16 | → bold (700) | 21.12 |
| `typography/body/md` (16) | 16 | → regular (400) | 22.4 |
| `typography/body/sm` (14) | 14 | → regular (400) | 19.6 |
| `typography/label/md` (16) | 16 | → bold (700) | 22.4 (to confirm) |
| `typography/caption/sm` (12) | 12 | → regular (400) | 16.8 |

Bold body variants (`Body 14 Bold` 14/700, `Body 12 Bold` 12/700) reuse `body/*` size + `line-height` and
alias `font-weight/bold` — no new size rows. Same for the not-in-code LDS sizes (40/32/18) when added later.

## MUI variant binding (for Phase-1 codegen)

So codegen can bind generated CSS vars back to MUI `theme.typography`:

| MUI variant | primitive role | css var (size) |
|---|---|---|
| `h1` | title/xl (60/700) | `var(--nk-typography-title-xl-size)` |
| `h2` | title/lg (48/700) | `var(--nk-typography-title-lg-size)` |
| `h3` | title/md (36/700) | `var(--nk-typography-title-md-size)` |
| `h4` | heading/lg (24/700) | `var(--nk-typography-heading-lg-size)` |
| `h5` | heading/md (20/700) | `var(--nk-typography-heading-md-size)` |
| `h6` | heading/sm (16/700) | `var(--nk-typography-heading-sm-size)` |
| `subtitle1` | heading/sm (16/700) | `var(--nk-typography-heading-sm-size)` |
| `body1` | body/md (16/400) | `var(--nk-typography-body-md-size)` |
| `body2` | body/sm (14/400) | `var(--nk-typography-body-sm-size)` |
| `button` | label/md (16/700) | `var(--nk-typography-label-md-size)` |
| `caption` | caption/sm (12/400) | `var(--nk-typography-caption-sm-size)` |
| `smallBoldTextStyle` | body/sm + font-weight/bold (14/700) | `var(--nk-typography-body-sm-size)` |
| `smallTextStyle` | body/sm (14/400) | `var(--nk-typography-body-sm-size)` |

Weights bind to `var(--nk-typography-font-weight-bold|regular)`; family to `var(--nk-typography-font-family-main)`.

`subtitle2` and `overline` MUI variants have no size/weight in code → no primitive. `overline` only sets
`fontWeight:400`; leave unbound.

## Open items / flags

1. **Button weight** — code/contract 700 vs BB/`MuiButton.root` 400. Resolved to **700**; fix `MuiButton.root`
   in a later code PR (out of scope here).
2. **label/md line-height** — 22.4 (body) vs 21.12 (heading-16). Pick one before building the text Style.
3. **LDS Caption 10/UPPER/ls-1** — micro role outside the 5 groups; add as `typography/caption/xs` only if the
   landing skeleton needs it. Letter-spacing/text-case are not TIER-1 typography primitives this phase.
4. **Role naming** — used `xl/lg/md/sm` size-tiers per group to stay rebrand-safe (role, not appearance) and to
   avoid baking px into the Figma name. Reconcile against the radius `small/base/large/full` naming decision so
   the Foundations file uses ONE size-naming convention across `size/*` and `typography/*`.
