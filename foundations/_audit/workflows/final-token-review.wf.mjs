export const meta = {
  name: 'final-token-review',
  description: 'Full review of the final Novakid token system: vs world best practices, product fit, primitive→semantic coverage, completeness — multi-dimension + adversarial verify',
  phases: [
    { title: 'Review', detail: 'best-practices · semantic coverage · product fit · completeness · build hygiene' },
    { title: 'Synthesize', detail: 'overall grade + prioritized gaps' },
    { title: 'Verify', detail: 'adversarially challenge the verdict' },
  ],
}

const R = '/Users/diyoriko/Documents/Novakid/nk-tokens-pipeline';
const F = R + '/foundations';

const COMMON = `
Reviewing the **FINAL Novakid design-token system** (local, post-v4 + bold/light statuses). Be rigorous, specific, and adversarial — grade honestly, no flattery.

WHAT IT IS: topology = Figma SDS collections (color-primitives, color[semantic], size, typography, effect); values = Novakid (Landing DS + Brand Book + parent-mf code). Git source of truth = tokens.json; build → 457 --nk-* CSS vars, 0 dangling.

GROUND-TRUTH FILES (Read; recompute with Bash/node; build CSS already generated):
- ${R}/tokens/tokens.json — source of truth (Tokens Studio sets).
- ${R}/build/css/variables.css — 457 resolved --nk-* vars (final hex/px).
- ${F}/_audit/AUDIT-NUMBERS.md — colorimetry (per-ramp L*/ΔE/OKLCH, alias resolution, AA pairs).
- ${F}/COLOR-FOUNDATIONS-DECISION.md — the v4 spec + §8 bold/light status model + Q1–Q5 resolutions.
- ${F}/primitive-palette.md — real brand swatches. ${F}/extract-{colors,space,typography,shadow}.md — real product/code usage.

CURRENT SHAPE (verify against the files, don't trust this blindly):
- **Colour primitives:** 8 chromatic hues × 10 steps (violet, lemon, magenta, blue, green, orange, coral, grey) + white + black/white alpha ramps (black has +4 shadow-alpha steps). Real brand colours pinned at their steps; gaps OKLCH-smooth GEN.
- **Semantic colour (~132 tokens):** background/text/icon/border × intents {base, neutral, brand(violet) + brand-{violet,magenta,coral,green,orange,blue,lemon}, success, warning, danger, info, disabled}. Brand-* use primary/secondary/tertiary + hovers + on-*. **Statuses (success/warning/danger/info) use a bold/light model:** background/{s}/{bold=bright brand fill, light=tint}; text·icon/{s}/{on-bold=grey900, on-light=/700}; border/{s}=/600. Light mode only.
- **Size:** space (0,2,4,6,8,12,16,20,24,32,40,48,64,96,160 + negative mirror), radius (4–40+full), stroke (1/2), icon (24/32/40), blur (4–36), depth.
- **Typography:** scale 01–14 (12→96), roles title-hero/title/subtitle/heading/body/caption/label + strong variants; Mikado regular/bold; line-heights 120–140%.
- **Effects:** drop-shadow 100–600 (brand-extracted, black-alpha, BB pop-up at 600). No inner-shadow.

KNOWN INTENTIONAL DECISIONS (don't relitigate as defects, but you MAY challenge): lemon accent-only (dark fg, never white text); no amber (warning=orange); blue is bimodal (Periwinkle 234° light + azure darks); generated AA-darks for success/info/warning fills/text; dark mode deferred; component tier deferred. Be adversarial but distinguish a real gap from a documented decision.
`;

const DIM_SCHEMA = {
  type: 'object',
  required: ['dimension', 'grade', 'verdict', 'strengths', 'gaps'],
  properties: {
    dimension: { type: 'string' },
    grade: { type: 'string', enum: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'] },
    verdict: { type: 'string', description: '2-4 sentence honest assessment' },
    strengths: { type: 'array', items: { type: 'string' } },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'issue', 'evidence', 'recommendation'],
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          issue: { type: 'string' },
          evidence: { type: 'string', description: 'hex/contrast/count/file:section or a named best-practice comparison' },
          recommendation: { type: 'string' },
        },
      },
    },
  },
};

const DIMS = [
  {
    key: 'R1-best-practices',
    prompt: `${COMMON}

## R1 — vs WORLD BEST PRACTICES
Benchmark our system against the leading design-token / palette systems: **Material 3, Radix Colors, Tailwind, US Web Design System (USWDS), IBM Carbon, Atlassian, Apple HIG, Adobe Spectrum, Figma SDS, W3C DTCG**. (You may WebSearch/WebFetch for current specifics if useful.) Judge: ramp design (perceptual evenness, step count, OKLCH vs HSL, accessible-pair design à la Radix), the 3-tier structure (primitive→semantic→component), naming conventions, AA/APCA stance, alpha/overlay handling, scale design (space/type/radius/elevation). Where do we meet / exceed / fall short of best practice? Cite the specific system we're compared to.`,
  },
  {
    key: 'R2-semantic-coverage',
    prompt: `${COMMON}

## R2 — PRIMITIVE → SEMANTIC COVERAGE (cell-by-cell)
THE key question: do the primitives cover EVERY semantic the architecture needs? Go cell by cell over background/text/icon/border × every intent × every variant (incl. the bold/light status model + on-* + brand primary/secondary/tertiary + hovers + disabled + focus). For each: does it resolve to an existing primitive step that PASSES its AA/UI threshold? Recompute contrasts. Flag: (a) any semantic that cannot be built from current primitives (missing step/hue), (b) any intent/variant the architecture needs but isn't defined (focus ring colour? selected? overlay/scrim? placeholder? link? visited? data-viz/chart series? skeleton? on-disabled?), (c) over-provisioned primitives no semantic consumes. Produce a coverage verdict.`,
  },
  {
    key: 'R3-product-fit',
    prompt: `${COMMON}

## R3 — NOVAKID PRODUCT FIT
Novakid = online English school for KIDS — playful, bright, friendly brand. Surfaces: parent area (web app: account, dashboard, subscription, schedule, referral), classroom (web + games), landing pages, mobile, emails. Judge whether the token system actually SERVES these: does the palette keep Novakid's bright/playful identity (real Lime/coral/violet/lemon pinned) while staying accessible? Is the bold/light status model right for a kids product? Are there product needs unmet — gamification/reward colours, achievement/streak states, age-tier theming, illustration-adjacent accents, marketing-vs-app tonal needs, emotional/celebratory states? Use extract-colors.md (real code usage). Honest fit verdict.`,
  },
  {
    key: 'R4-completeness',
    prompt: `${COMMON}

## R4 — COMPLETENESS & FORWARD-READINESS
What does a production-grade DS need that we don't yet have? Assess: **dark mode** readiness (would semantics re-alias cleanly? any light-only assumption baked in — e.g. base.primary=white, shadows neutral-only, alpha ramps as the dark-mode bridge?), **focus/keyboard** (focus-ring colour+offset tokens?), **state coverage** (hover/pressed/selected/disabled/loading/error across intents), **overlay/scrim/backdrop** (we have black/white alpha primitives — are they wired to semantics?), **data-viz/categorical** palette, **component tier** (deferred — is the semantic layer component-ready?), **motion/duration/easing** tokens (absent?), **z-index/elevation semantics**, **border-radius semantics**. What's missing for v1 to be truly production-usable vs a foundation?`,
  },
  {
    key: 'R5-build-hygiene',
    prompt: `${COMMON}

## R5 — ARCHITECTURE / BUILD / DTCG HYGIENE
Audit the technical soundness: W3C DTCG conformance ($type/$value, composite typography/boxShadow), the build preprocessor (nk/flatten-sets re-nest + decompose + ref-rewrite — any edge case that could break?), Tokens-Studio round-trip compatibility (domain-less refs, set→collection mapping), naming consistency (any inconsistent token paths — e.g. brand-* primary/secondary/tertiary vs status bold/light asymmetry — is that defensible?), 0-dangling claim, dart 0xAARRGGBB alpha correctness, no double-px, the alpha-ramp step naming (black 160/220/240/260 half-steps), versioning (package.json 0.1.0). Flag anything that would bite at scale or in the Figma sync.`,
  },
];

phase('Review');
log(`Reviewing the final token system across ${DIMS.length} dimensions.`);

const reviews = (await parallel(
  DIMS.map((d) => () => agent(d.prompt, { label: d.key, phase: 'Review', schema: DIM_SCHEMA }))
)).filter(Boolean);

phase('Synthesize');
log('Synthesizing the overall verdict + prioritized gaps.');

const report = await agent(
  `${COMMON}

## SYNTHESIS — the final review deliverable
Below is the JSON from 5 dimension reviews (best-practices, semantic-coverage, product-fit, completeness, build-hygiene). Produce the review as Markdown:

1. **Overall verdict + grade** — how good is this token system, honestly? One paragraph + an overall letter grade. Is it best-practice-aligned, product-fit for Novakid, and does the primitive layer cover the semantic architecture?
2. **Per-dimension scorecard** — table: dimension · grade · one-line verdict.
3. **What we did well** — the genuine strengths (real-pinned brand colours, AA discipline, bold/light status model, SDS topology, etc.).
4. **Prioritized gaps** — critical → low. Each: severity · issue · evidence · recommendation. Dedup across dimensions. Separate "must fix for v1" from "next phase (component/dark mode)".
5. **Coverage answer** — direct: do our primitives cover all needed semantic layers? Yes/no/mostly, with the specific gaps.
6. **Top 5 recommendations** — the highest-leverage next moves.

Be concrete (hexes, contrasts, named best-practice comparisons). No flattery; grade like a senior DS architect reviewing for production.

DATA:
${JSON.stringify(reviews)}`,
  { label: 'synthesize', phase: 'Synthesize' }
);

phase('Verify');
log('Adversarially challenging the verdict.');

const challenge = await agent(
  `${COMMON}

## ADVERSARIAL CHALLENGE
Below is the synthesized review. Challenge it hard: (a) is any GAP it claims actually already covered (re-check the tokens/build)? (b) is any GRADE too generous or too harsh? (c) is any "strength" unearned? (d) did it MISS a real problem (recompute a few AA pairs, check a claimed coverage)? (e) is the overall grade defensible? Report concrete corrections with evidence, or confirm the review holds.

REVIEW:
${report}`,
  { label: 'challenge', phase: 'Verify', model: 'sonnet' }
);

return { report, challenge, dimensionCount: reviews.length, grades: reviews.map((r) => ({ d: r.dimension, g: r.grade })) };
