# Build on Novakid primitives

For teams who want their own semantic tokens on top of the Novakid foundation.

You get the **primitives** (the raw scales — colour, type, size, effect). You build
**your own semantics** (role tokens for your product) by aliasing them. You never
edit or copy the primitives. The foundation stays one shared source of truth; your
layer is yours.

## What you get (the foundation)

Published in the **Novakid DS Foundations** Figma library (`aVwI61IYqufB2gWE6VbwOM`):

| Collection | What it is | Count |
|---|---|---|
| `Color Primitives` | Raw colour scales (Violet/Grey/… 100–1000, White/Black alpha) | 104 |
| `Typography Primitives` | Font sizes, weights, line-heights | 26 |
| `Size` | Space, radius, depth, breakpoints | 76 |
| `Effect` | Shadow / blur effects | 17 |
| `Responsive` | Breakpoint-driven values (Desktop/Tablet/Mobile) | 7 |

The `Color` and `Typography` collections you'll also see are **Novakid's own
semantics** — a reference example, not yours to use directly. Build your own.

## The one rule

**Reference primitives by alias. Never fork, duplicate, or hardcode a hex.**

Everything else follows from that.

## How to do it (Figma)

1. In your file: **Assets → Libraries → enable "Novakid DS Foundations".**
2. Open **Variables → New collection** (name it for your team, e.g. `Acme Semantics`).
3. Add a variable, set its value to an **alias** of a primitive — e.g.
   `Background/Primary` → alias `Color Primitives/Violet/500`.
4. Use **your** semantic on layers. Apply your `Background/Primary`, not the raw
   `Violet/500`.

> Primitives are deliberately hidden from the fill/stroke pickers (no scopes). You
> can still alias them in the Variables editor — that's the intended path. If you
> can't pick a raw primitive on a layer, that's by design: make a semantic.

## Naming your semantics

By **role and surface**, not by colour name. Mirror the Novakid pattern so it reads
the same across teams:

- `Background/<role>` → scope `FRAME_FILL`
- `Text/<role>` → scope `TEXT_FILL`
- `Icon/<role>` → scope `SHAPE_FILL`
- `Border/<role>` → scope `STROKE_COLOR`

Set the scope so each token only shows where it belongs. Don't ship `ALL_SCOPES`.

## Keep it honest

- **Contrast.** Check your own pairs: AA 4.5 for text, 3.0 for large text / UI.
- **States via alpha, not new colours.** Hover/pressed = base + `Alpha/Black/100`
  (light surfaces) or `Alpha/White/100` (dark). Don't mint per-state colours.
- **Updates come through the library.** When Novakid bumps a primitive, accept the
  Library Update — don't pin or copy values to dodge it.

## Who owns what

| | Novakid DS | Your team |
|---|---|---|
| Primitives (Color/Type/Size/Effect) | ✅ owns, versions | references only |
| Your semantic collection | — | ✅ owns |
| Applying semantics on your screens | — | ✅ |

New team = new semantic collection aliasing the same primitives. Zero changes to the
foundation. That's the whole point — it scales sideways.

## Questions

Ping the DS owner (Diyor). Don't work around a gap by forking a primitive — flag it,
and it gets fixed in the foundation for everyone.
