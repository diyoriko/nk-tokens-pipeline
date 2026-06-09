export const meta = {
  name: 'color-foundations-decision',
  description: 'Decide the canonical Novakid colour-token spec: hues, ramp/step counts, REAL-vs-GEN per step, Main placement, gaps, topology fit — reconciling 2 DS libraries + semantic requirements + code usage + prior synthesis',
  phases: [
    { title: 'Analyze', detail: 'source inventory · semantic requirements · code usage · prior-work reconcile' },
    { title: 'Decide', detail: 'synthesize the authoritative per-hue spec' },
    { title: 'Verify', detail: 'adversarially check AA backing, completeness, no dropped reals' },
  ],
}

const F = '/Users/diyoriko/Documents/Novakid/design-code/foundations';
const REPO = '/Users/diyoriko/Documents/Novakid/nk-tokens-pipeline-demo';

const COMMON = `
Building the **Novakid colour-foundations decision** — the upstream spec that drives how primitive colour ramps are built. Topology = Figma SDS (collections: color-primitives, color[semantic], size, typography, effect); VALUES = Novakid (Landing DS + Brand Book + product code). This is a CORRECTNESS + COMPLETENESS decision, be concrete and adversarial.

GROUND-TRUTH FILES (Read what you need; recompute colorimetry with Bash/node):
- ${F}/primitive-palette.md   ← the REAL-ONLY inventory: every real LDS+Brand-Book swatch, legacy name → generic hue/step, measured L*, contrast vs white, AA-gap analysis. LIVE-CONFIRMED this session (LDS "🎨 Colors" page 1441-32 = 50 swatches incl. orange; Brand Book "🌈 Colours" 6-5131). THIS IS THE REAL PALETTE.
- ${F}/final-token-tree.md     ← prior "v3 FINAL master": canonical 42 real-only primitives per hue, the right-sized build set, §4 gap analysis, §5 completeness matrix (which steps REAL / brand-approved-AA-dark / no-real), §3 semantic 54 aliases, §8 surface-consumption model. The closest prior answer — reconcile with it.
- ${F}/extract-colors.md       ← REAL product usage from parent-mf CODE (SVG-filtered, code-only counts): which hexes/hues are actually load-bearing vs illustration-only (e.g. amber = 0 code use). This is the authoritative product-usage signal (Figma product files are 315MB illustration-noise, ruled out).
- ${F}/_audit/AUDIT-NUMBERS.md ← current SHIPPED build's ramps (L*/ΔE/OKLCH per step) + semantic alias resolution + AA pairs. The current state to reconcile against.
- ${REPO}/tokens/tokens.json   ← current build (Tokens Studio sets). Semantic intents live in the 'color' set: background/text/icon/border × {base, neutral, brand-{violet,lemon,magenta,blue,green,orange,coral}, success, warning, danger, info, disabled} × variants {primary, primary-hover, pressed, secondary, secondary-hover, tertiary, tertiary-hover, on-*, default, hover, focus}.

KEY FACTS confirmed this session:
- Current build = 8 solid hues (violet, lemon, magenta, blue, green, orange, coral, grey) × 10 steps (100–1000) + white/black alpha ramps. Ramps regenerated (PR #12) pinning load-bearing reals, gaps OKLCH-smooth.
- 18/43 LDS shades land verbatim in the current ramps; 25 are generated approximations (some drift: Persian Indigo Mid ΔE12, Melrose Dark 11, Periwinkle Dark 10).
- AA: all current on-* / status / brand / default / border pairs PASS (verified).
- lemon is accent-only (never text on white) BY DESIGN; amber-warmed darks.

RULES: cite hex + measured L*/contrast + code-usage count where relevant. "Need a step" must be justified by a semantic that consumes it OR real usage — no bloat. Preserve real brand shades; only generate to fill a semantic gap. Distinguish a real defect/gap from an intentional documented decision.
`;

const ANALYSIS_SCHEMA = {
  type: 'object',
  required: ['area', 'findings'],
  properties: {
    area: { type: 'string' },
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'detail', 'evidence'],
        properties: {
          key: { type: 'string', description: 'short slug' },
          detail: { type: 'string' },
          evidence: { type: 'string', description: 'hex / L* / count / file:section' },
        },
      },
    },
    data: { type: 'string', description: 'compact structured data block (e.g. per-hue real shades by step, or per-intent required steps) as text/markdown the synthesizer can use directly' },
  },
};

const ANALYSES = [
  {
    key: 'A1-source-inventory',
    prompt: `${COMMON}

## A1 — SOURCE INVENTORY & HUE CLUSTERING
From primitive-palette.md (real LDS+BB swatches) + extract-colors.md: normalize the weird/duplicate legacy names and cluster all real shades into **canonical hue families** by OKLCH hue. For each family output, by L* band: the real shades present (hex + L* + legacy name + the "Main"), which bands have NO real colour, and whether the family is its own hue or should merge (the blue-violet cluster: Persian Indigo/Daisy Bush/Melrose/Periwinkle — how many distinct hues do they really form?). Flag: is "magenta/heliotrope" its own hue? is "orange" distinct from "lemon"? is there a real "warning/amber" separate from orange? Output 'data' = per-hue table {hue → [step-band: real hex / (none)] + Main marked}.`,
  },
  {
    key: 'A2-semantic-requirements',
    prompt: `${COMMON}

## A2 — PRIMITIVE REQUIREMENTS FROM SEMANTICS
Read tokens.json 'color' set. For EACH intent, enumerate the variants it uses and what primitive STEP each needs, expressed as an L* band + a constraint (e.g. "fill that carries white text → needs ≥4.5:1 → L*≲45"; "hover → one step darker"; "secondary/tertiary tint surfaces → light, L*≳88, soft/desaturated"; "text-on-white → ≥4.5"; "border → ≥3:1"). Then collapse to: **the minimum set of steps each hue must provide** to back its intents (brand hues need: 2 tint + fill-dark + hover + text/border-dark ≈ how many steps? status hues similar; neutral/grey needs the most). Output 'data' = per-hue **minimum required steps** with the L* band + reason for each. This defines ramp length per hue (no bloat).`,
  },
  {
    key: 'A3-code-usage',
    prompt: `${COMMON}

## A3 — CODE USAGE & HUE IMPORTANCE
From extract-colors.md (code-only counts, SVG-filtered): rank hues/shades by REAL styling demand. Which hues are load-bearing (high code use) vs illustration-only (e.g. amber #FF9F1B = 0 code styling). Which specific reals are heavily used and MUST be preserved verbatim (e.g. Daisy Bush #4221B8 = 48, Persian Indigo #210A74 = 32, Apple #31C838 = 23, Persimmon #FF5A56 = 26, Black #2C2A33 = 12). Flag hues that may NOT need a full ramp (e.g. blue/lemon are light-only in brand). Output 'data' = hue importance ranking + the must-preserve real list with counts.`,
  },
  {
    key: 'A4-prior-reconcile',
    prompt: `${COMMON}

## A4 — RECONCILE PRIOR DECISIONS vs CURRENT BUILD
Read final-token-tree.md (v3 master: §2 per-hue real-only, §5 completeness matrix, §4 gaps, §7 right-sized build set) + AUDIT-NUMBERS.md (current shipped ramps). Output: (1) what the prior master DECIDED — canonical hue set, which steps real vs generated-AA-dark, the documented gaps + how resolved; (2) where the CURRENT build (8×10 generated ramps + PR#12 pins) AGREES vs DIVERGES from that master (e.g. master = 42 real-only non-contiguous; build = full 10-step generated — which generated steps are load-bearing vs grid-filler?); (3) the open gaps still unresolved (accent intent? warning hue? grey/900?). Output 'data' = a reconciliation delta table.`,
  },
];

phase('Analyze');
log('Analyzing sources, semantic requirements, code usage, and prior decisions in parallel.');

const analyses = (await parallel(
  ANALYSES.map((a) => () => agent(a.prompt, { label: a.key, phase: 'Analyze', schema: ANALYSIS_SCHEMA }))
)).filter(Boolean);

phase('Decide');
log('Synthesizing the authoritative per-hue colour-foundations decision.');

const decision = await agent(
  `${COMMON}

## DECISION SYNTHESIS — the deliverable
Below is the JSON from four analyses: A1 source inventory & hue clustering, A2 semantic requirements (min steps per hue), A3 code usage & importance, A4 prior-vs-current reconcile. Produce the **authoritative colour-foundations decision** as Markdown:

1. **Canonical hue set** — the final list of colour primitives (hues) we create, each with: why it's needed (intent + code usage), generic name, and any merge/drop calls (collapse the blue-violet cluster correctly; magenta vs violet; orange vs lemon vs a warning/amber; is every brand-* hue justified?).
2. **Per-hue ramp spec** — for each hue, a table of steps (only as many as the semantics + usage require — justify the count): for each step → **REAL** (which exact LDS/BB hex, preserved, where the Main sits) or **GEN** (generate to fill a semantic gap, with the target L*/role). Mark the Main shade and the AA-critical dark.
3. **Gaps & additions** — colours/intents the architecture needs but no real shade exists (e.g. AA-dark for blue/green; accent intent; warning hue decision; grey darkest). How to add (generate minimal vs request brand colour).
4. **Topology mapping** — how this maps onto the SDS collections + the 100–1000 step grammar; what changes vs the current shipped build (PR #12).
5. **Completeness matrix** — per-hue × step: REAL ● / GEN ✚ / not-needed —; and per-intent: which hue+steps back it (AA-confirmed).
6. **Open brand questions** — only the calls a designer must make.

Be decisive and concrete (hexes, L*, step counts). This doc drives the ramp build (task #6).

DATA:
${JSON.stringify(analyses.map((a) => ({ area: a.area, summary: a.summary, findings: a.findings, data: a.data })))}`,
  { label: 'decide', phase: 'Decide' }
);

phase('Verify');
log('Adversarially verifying the decision (AA backing, completeness, no dropped reals).');

const checks = ['aa-backing', 'completeness-no-dropped-reals', 'step-count-no-bloat'];
const verdicts = (await parallel(
  checks.map((c) => () => agent(
    `${COMMON}

## ADVERSARIAL VERIFICATION — lens: ${c}
Below is the proposed colour-foundations decision. Try to BREAK it on this lens:
- aa-backing: does EVERY semantic intent (background fill + on-text, status text-on-white + on-tint, borders, default text tiers) have a primitive step that actually clears its AA/UI threshold? Recompute contrasts. Name any intent left without an AA-valid backing step.
- completeness-no-dropped-reals: is any load-bearing REAL brand shade (high code use, or a brand Main) dropped / not representable? Is any needed intent missing a hue (info, warning, accent, neutral)?
- step-count-no-bloat: is any hue over-provisioned (steps no semantic consumes) or under-provisioned (a consumed step missing)? Check vs A2 requirements.

Report concrete problems with evidence (hex/contrast/intent), or confirm the decision holds on this lens.

DECISION:
${decision}`,
    { label: `verify:${c}`, phase: 'Verify', model: 'sonnet' }
  ))
)).filter(Boolean);

return { decision, verification: verdicts, analysisCount: analyses.length };
