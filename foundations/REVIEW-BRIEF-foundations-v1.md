# Review brief — Foundations v1 deep audit (ultra-code)

> **Goal:** a detailed, adversarial review of the **token architecture AND the token values**, group by group, cross-checked against **real usage across the Novakid Figma space**. Output: per-group verdict (keep / fix / add) + a prioritized findings list. This is a *correctness + completeness* review, not a pipeline review.

## Context the new session must load first

- **Repo (source of truth):** `~/Documents/Novakid/nk-tokens-pipeline-demo` — `tokens/tokens.json`. Open PR **#11** (`deploy/foundations-v1`), not merged.
- **Build summary + decision log:** `~/Documents/Novakid/design-code/foundations/FOUNDATIONS-V1.md` (read this first — it has every decision + why).
- **Real-source colour audit:** `~/Documents/Novakid/design-code/foundations/primitive-palette.md` (the 42 REAL colours from Landing DS + Brand Book, with L*/contrast). The ramps were *generated* from these anchors — this file is the ground truth for "what's real vs generated".
- **Other:** `final-token-tree.md`, `extract-{colors,space,typography,shadow}.md`.
- **Figma sources:** Landing DS `pQEYDZPSXAotX3NlssYmOI` · Brand Book `LM3oAa06YP1rqpYzgrHQKX` · Figma SDS `h4GZ3xT0jajzYh7mjJCWLB` (topology reference only). **Whole Novakid project to sweep:** https://www.figma.com/files/project/50498235.

## Current state (what's being reviewed)

`tokens.json` v1: **100 color-primitives** (10 ramps×10) · **137 semantic** · size (space 25 / radius 10 / stroke / icon / blur / depth) · typography (scale 01–14, roles title-hero/title/subtitle/heading/body/label) · effect (drop/inner-shadow 100–600). 453 `--nk-*` vars, 0 dangling. Colour ramps generated OKLCH-smooth, anchored on real Mains (`violet/600 #6D46FC`, `lemon #FFE60A` pinned); **generated steps pending brand sign-off**. black/white = only alpha ramps. Light mode only.

## Review dimensions (per group — be adversarial)

### A. Colour primitives — values & coverage
1. **Are 100 enough / too many?** Any hue the brand actually uses with NO ramp? Any ramp never referenced by semantics (dead weight)?
2. **Generated steps:** perceptual evenness (L* monotonic, even ΔE between steps), in-gamut (no clipping), chroma curve sane per hue. Flag any step that looks off.
3. **Anchors honoured:** do the real brand Mains land on/near the right step? (cross-check `primitive-palette.md` ΔE). Did smooth-generation drift any *load-bearing* real colour?
4. **lemon** specifically: amber hue-warming in darks correct? Light→pin transition smooth? (it was the repeated pain point).
5. **black/white alpha** opacities (5/10/20/40/70/80/85/90/95/100%) — match SDS / sensible for overlays + shadows?

### B. Semantic colour — structure & mapping (the most important)
1. **Intent set complete & correct?** base · neutral · brand-{violet,lemon,magenta,blue,green,orange,coral} · success · warning · danger · disabled. Missing any the product needs (info? selected? focus-bg? overlay/scrim?). Too many brand-* (are all 7 used)?
2. **6-variant matrix** (primary/secondary/tertiary + hovers) — right model for every intent, or overkill for some?
3. **Primitive→semantic mapping correctness — go cell by cell.** Is each variant pointing at a *sensible* primitive step? e.g. is `success/primary` the right green for a button (AA with white)? Is `brand-violet/secondary` a usable tint? Are hover steps actually one notch darker? Are tertiary/secondary distinguishable?
4. **AA across ALL on-* combinations**, not the spot-checks done so far — every `on-{intent}` × every background variant it can sit on.
5. **text/border/icon** — complete? Right steps? on-* coverage?
6. **Dark-readiness:** would these semantics re-alias cleanly into a dark mode, or did any mapping bake in a light-only assumption?

### C. Size
- space/radius/stroke/icon/blur/depth — step counts & values right for the product? Negative space full-mirror needed or bloat? Cross-check vs actual spacing/radius usage in Figma + parent-mf.

### D. Typography
- scale 14 steps — any product size missing or any unused? Roles (title-hero/title/subtitle/heading/body/label) — match product text styles? Missing roles (caption, overline, code, link)? Mikado really only 2 weights? line-heights (120/128/130/132/140) and letter-spacing vs Brand book + real text styles. Cross-check vs every text style across Novakid Figma files.

### E. Effects
- drop/inner-shadow tiers — right elevations? blur/depth/alpha values match real Figma effect styles? Missing (background-blur/glass, focus-ring as effect)?

## The big research — Figma space sweep (project 50498235)

Validate **coverage & correctness against real usage**, both directions:
- **Tokenized but unused** — tokens nothing in Figma uses (candidates to cut).
- **Used but untokenized** — colours/sizes/type/effects that appear in real designs with no matching token (gaps to add).

Method: enumerate the relevant files in the project (DS, Brand Book, Landing, product/parent-area, games, mobile), pull their variables / styles / used values (`get_variable_defs` needs a node selection in desktop Figma — prefer `get_design_context`/`get_screenshot` per node, or ask the user to export). Build a coverage matrix per group.
> ⚠️ The Figma MCP here is desktop-bound — listing *all* files in a project programmatically may not be possible; the new session should either get the file-key list from the user or work file-by-file from the known keys above + whatever the user provides.

## How to run it

This is broad (many Figma files × per-group analysis) — **use ultracode / a Workflow** (multi-agent): fan out one reviewer per token group + a Figma-sweep agent, adversarially verify findings, synthesize a prioritized report. Don't do it single-threaded.

## Deliverable

Per group: **verdict (keep / fix / add)** + concrete findings with severity, each citing the token + the evidence (Figma file/node or contrast number). End with a prioritized fix list and any brand-sign-off questions.
