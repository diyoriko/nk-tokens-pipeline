export const meta = {
  name: 'foundations-v1-adversarial-review',
  description: 'Per-group adversarial review of Novakid Foundations v1 token values + architecture, grounded on precomputed colorimetry + real-usage extracts',
  phases: [
    { title: 'Review', detail: 'one deep reviewer per token group (A–F)' },
    { title: 'Verify', detail: 'adversarial skeptic per finding — try to refute' },
    { title: 'Synthesize', detail: 'merge into prioritized report + brand questions' },
  ],
}

const F = '/Users/diyoriko/Documents/Novakid/design-code/foundations';
const REPO = '/Users/diyoriko/Documents/Novakid/nk-tokens-pipeline-demo';

const COMMON = `
You are reviewing **Novakid Foundations v1** design tokens (post-PR#11). This is a CORRECTNESS + COMPLETENESS review of token VALUES and ARCHITECTURE — not a pipeline review. Be adversarial and specific.

GROUND TRUTH FILES (read what you need with Read; recompute with Bash/node if useful):
- ${F}/_audit/AUDIT-NUMBERS.md  ← DETERMINISTIC colorimetry I precomputed: every ramp's L*, ΔL*, ΔE2000(adjacent), OKLCH L/C/h, contrast-vs-white/black; full semantic alias→primitive→hex resolution; on-* AA pairs; anchor-honouring ΔE table. TRUST these numbers (verify by recompute if you doubt).
- ${F}/primitive-palette.md     ← the 42 REAL source colours (Landing DS + Brand Book), confirmed live against Figma this session. Ground truth for "real vs generated".
- ${F}/extract-colors.md / extract-space.md / extract-typography.md / extract-shadow.md ← REAL product usage extracted from parent-mf code + LDS/BB (this IS the used-but-untokenized evidence).
- ${F}/FOUNDATIONS-V1.md         ← build summary + decision log (the "why").
- ${F}/NPA-9291-foundations-spec.md ← original spec/intent.
- ${REPO}/tokens/tokens.json     ← source of truth (Tokens Studio sets: color-primitives, color, size, typography-primitives, typography, effect).
- ${REPO}/build/css/variables.css ← 453 resolved --nk-* vars (final hex/px).

LIVE FIGMA FACTS confirmed this session (you cannot call Figma; use these):
- Brand Book "Colors" canonical swatches: Violet #6D46FC, Daisy Bush #4221B8, Persian Indigo #210A74, Melrose #9694FF, Heliotrope #C76EF2, Magnolia #F7F5FF; Greyscale Black #2C2A33 / Jumbo #706F74 / Silver #C6C6C6 / Mischka #E2E1E7 / Wild Sand #F4F4F4 / Alabaster #FAFAFA / Outer Space #484848; Persimmon #FF5A56 / Chablis #FFF3F3; Lemon #FFE60A / Gin Fizz #FFF8DF; Green Snake #19AA20 / Apple #31C838 / Lime #79FD7F / White Ice #E9FBF0; Periwinkle #C6D2FF / Patterns Blue #E1F3FE.
- Landing DS real type styles (note PIXEL line-heights): H4 24/lh32 bold, Body 14/lh20 reg, Body 16/lh22 bold, Body 12/lh15 reg.

RULES: cite the exact token + concrete evidence (a contrast number, a ΔE, a real-usage count, a Figma swatch, or a line in tokens.json). Severity: critical (ships broken / fails AA on a real text pair) > high (brand-fidelity loss on a load-bearing colour, or a real high-traffic value with no token) > medium > low. Do not invent colours. "lemon is accent-only, never text on white" is by design — not a defect. Distinguish a real defect from an intentional documented decision (but you MAY still challenge a decision and put it as a brand question).
`;

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['group', 'verdict', 'findings', 'questions'],
  properties: {
    group: { type: 'string' },
    verdict: { type: 'string', enum: ['keep', 'fix', 'add', 'mixed'], description: 'overall verdict for the group' },
    verdictNote: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'severity', 'token', 'claim', 'evidence', 'fix'],
        properties: {
          id: { type: 'string', description: 'short slug e.g. success-text-on-tint' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          kind: { type: 'string', enum: ['keep', 'fix', 'add', 'cut'], description: 'keep=explicit confirmation it is correct; fix=change value/mapping; add=missing token; cut=dead weight to remove' },
          token: { type: 'string', description: 'exact token path(s) involved' },
          claim: { type: 'string' },
          evidence: { type: 'string', description: 'the hard number / count / Figma swatch / file:line' },
          fix: { type: 'string', description: 'concrete proposed change, or "none — verify only"' },
        },
      },
    },
    questions: { type: 'array', items: { type: 'string' }, description: 'brand sign-off questions this group raises' },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['id', 'status', 'note'],
  properties: {
    id: { type: 'string' },
    status: { type: 'string', enum: ['confirmed', 'refuted', 'adjusted'], description: 'confirmed=finding stands; refuted=false positive; adjusted=real but severity/detail wrong' },
    correctedSeverity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'] },
    note: { type: 'string', description: 'what you recomputed/checked and the result' },
  },
};

const GROUPS = [
  {
    key: 'A-color-primitives',
    prompt: `${COMMON}

## GROUP A — COLOUR PRIMITIVES (10 ramps × 10 steps = 100, + white/black alpha).
Render a verdict keep/fix/add and findings on:
1. **Count** — are 100 right? Any hue with NO ramp the brand uses? Any ramp/step NEVER referenced by semantics (dead weight)? (LEAD to verify: white alpha 100–900 = 0 semantic refs; grey/1000 = 0 refs; black alpha mostly unused — see AUDIT-NUMBERS + grep tokens.json.)
2. **Generated-step evenness** — per ramp check L* monotonic, ΔL*/ΔE2000 even, OKLCH chroma curve sane, in-gamut. (LEADS: violet 500→600 ΔE=17.5 gap then 600→700 ΔE=4.9 near-dupe — the pinned anchor distorts spacing; lemon 100→200 ΔE=15.9 jump from pale tint to pinned pure yellow.)
3. **Anchors honoured** — do real brand Mains land near the right generated step? Did smoothing drift any LOAD-BEARING real colour? (LEADS from anchor table: Daisy Bush #4221B8 — LDS *primary purple*, 48 code uses — nearest gen is violet/800 ΔE2.7, i.e. it is NOT violet/700 #6042DC anymore; Periwinkle #C6D2FF → blue/200 ΔE 9.1 = hue identity shifted azure; Lime #79FD7F → green/300 ΔE 6.3 = vivid brand green muted; TEXT_PRIMARY #2C2A33 → no exact step, text uses grey/900 #353538.)
4. **lemon** — amber-warming in darks correct? (LEAD: OKLCH h rotates 101→77 as it darkens = gold not olive ✓.) light→pin transition.
5. **black/white alpha** opacities (5/10/20/40/70/80/85/90/95/100) sensible for overlays+shadows, and ARE they consumed?
Be exhaustive per ramp. Verdict + findings + brand questions.`,
  },
  {
    key: 'B-semantic-color',
    prompt: `${COMMON}

## GROUP B — SEMANTIC COLOUR (137 tokens: background/text/icon/border × intents). THE MOST IMPORTANT GROUP.
Use the semantic alias table + on-* AA tables in AUDIT-NUMBERS.md. Render verdict + findings on:
1. **Intent set** — present: base, neutral, brand-{violet,magenta,coral,green,orange,blue,lemon}, success, warning, danger, disabled. (LEADS: there is NO semantic \`info\` status — blue exists only as brand-blue, yet FOUNDATIONS-V1/§F references nonexistent color/text/info/* — doc↔build mismatch. NO overlay/scrim despite alpha primitives. NO selected/focus-bg surface. Are all 7 brand-* hues actually needed/used?)
2. **6-variant matrix** (primary/hover/secondary/.../tertiary) — right for every intent or overkill for some? Note primary STEP is inconsistent across brand hues: violet/magenta/coral primary=600 but green/orange/blue primary=700 (AA-driven) — is that defensible or confusing?
3. **Cell-by-cell mapping sensibility** — is each variant a sensible step? hover one notch darker? secondary/tertiary distinguishable? (e.g. brand-lemon secondary==primary==#FFE60A — secondary is identical to primary, a likely bug.)
4. **AA across ALL on-* and text-on-surface pairs** (not samples). CONFIRMED FAILS to verify+expand: success text #007D0B on success-secondary tint #BBF5B7 = 4.28 FAIL; text.default.secondary #66656A on bg.base.tertiary #E3E2E5 = 4.48 FAIL; text/icon.default.tertiary #98979D = 2.90 FAIL on white; on-brand-magenta (white on #A550CD)=4.54 and on-brand-coral (white on #D93B3B)=4.53 razor-thin; danger border #FC5754=3.17 only just clears UI 3:1. Check EVERY on-* pair and every text×bg combination that can co-occur.
5. **text/border/icon completeness** — right steps? on-* coverage? (icon/text default.tertiary fails; disabled exempt but note.)
6. **Dark-readiness** — would these re-alias cleanly into a dark mode, or did any mapping bake in a light-only assumption (e.g. base.primary=white hardcoded, shadows neutral-only)?
Verdict + findings (cell-level) + brand questions.`,
  },
  {
    key: 'C-size',
    prompt: `${COMMON}

## GROUP C — SIZE (space / radius / stroke / icon / blur / depth).
Cross-check tokens.json + variables.css against extract-space.md (REAL parent-mf usage). Verdict + findings:
1. **space** — v1 ladder: 0,2,4,6,8,12,16,24,32,48,64,96,160 (+negative mirror). (LEADS: extract-space.md proves 20px = the SINGLE most-used raw spacing value, 322+62 uses, and 40px 76+26 uses — but v1 has NO space-500(20) and NO space-1000(40). v1 adopted the SDS ladder and dropped Novakid's real high-traffic steps. Verify counts. Also: is the full negative mirror (12 steps) justified or bloat? Is 6px(150)/2px(050) real?)
2. **radius** — v1 has 10 steps (4,8,12,16,20,24,28,32,40,full). extract-space.md found only ~5 real radii (4,8,12,16,full). Are 20/24/28/32/40 radius used anywhere → over-provisioned bloat?
3. **stroke** (1/2), **icon** (24/32/40), **blur** (4–32), **depth** (13 steps incl negatives) — right counts/values for the product, or SDS bloat? icon smallest=24 — is there no 16px/20px icon need?
Verdict + findings + questions.`,
  },
  {
    key: 'D-typography',
    prompt: `${COMMON}

## GROUP D — TYPOGRAPHY (scale 01–14; roles title-hero/title/subtitle/heading/body/label).
Cross-check tokens.json + variables.css against extract-typography.md (real MUI/LDS/BB) + the live LDS type styles. Verdict + findings:
1. **scale 14 steps** (12,14,16,18,20,24,28,32,36,40,48,60,72,96) — any product size missing/unused? (display 72/96 real? 28/32/40 real?)
2. **Roles** — title-hero(96), title(36/48/60 bold), subtitle(28/32/40 REGULAR), heading(16/20/24 bold), body(14/16/18 +strong), label(16 bold 0.5ls). (LEADS: extract-typography.md ships a \`caption\` role (12px, MUI \`caption\` variant, real usage) — v1 DROPPED caption (scale-01 exists but no caption role). subtitle is REGULAR weight 28–40 but LDS had Heading 32/40 as BOLD — is regular-weight subtitle intended? Missing overline/link/code roles?)
3. **line-height** — v1 uses % (hero120/title128/subtitle130/heading132/body+label140). Real LDS uses PIXEL lh: 14→20 (143%), 16→22 (137.5%), H4 24→32 (133%). v1 body 140% gives 14→19.6 and 16→22.4 — small drift vs real 20/22. Material or fine?
4. **weights** — Mikado only regular/bold (italics/thin not invented) ✓. label letter-spacing 0.5 ✓ — any other role need ls?
Verdict + findings + questions.`,
  },
  {
    key: 'E-effects',
    prompt: `${COMMON}

## GROUP E — EFFECTS (drop-shadow 100–600 + inner-shadow 100–600).
Cross-check tokens.json + variables.css against extract-shadow.md (real parent-mf boxShadow tally + BB). Verdict + findings:
1. **drop-shadow tiers** — v1 has 6 (100–600) with SDS values incl negative spread; alphas 0.1→0.4. (LEADS: extract-shadow.md justified exactly 5 tiers from real usage with brand-matched alphas 0.08→0.16, and the canonical BB "Pop up shadow" = x0 y8 blur36 spread0 alpha0.16 appears VERBATIM in product code ×3. v1's drop-shadow-600 = y32 blur32 spread-8 alpha0.4 — the BB pop-up value is LOST, and 0.4 alpha is heavier than the brand's documented 0.16 ceiling. Verify.)
2. **inner-shadow 100–600** — extract-shadow.md explicitly says inset shadows are accent-border tricks (~3-4 uses) that belong to stroke/border, NOT effect/shadow, and should NOT be tokenized. v1 invented 6 inner-shadow tiers with values IDENTICAL to drop-shadow. Dead weight / wrong?
3. **Missing** — colored brand glows (violet/lemon focus glows, real in code), focus-ring as effect, background-blur/glass?
Verdict + findings + questions.`,
  },
  {
    key: 'F-figma-coverage',
    prompt: `${COMMON}

## GROUP F — COVERAGE SWEEP (real usage ↔ tokens, both directions). Synthesize the cross-cutting coverage matrix from the extract docs (which ARE the real product/LDS/BB usage) + the live Figma facts + AUDIT-NUMBERS. Verdict + findings:
1. **Used-but-untokenized** — real values appearing in designs/code with NO matching token (gaps to ADD). Pull from extract-colors/space/typography/shadow real-usage tallies. (e.g. 20px/40px spacing; caption 12px type; BB pop-up shadow; real Daisy Bush #4221B8 hover purple; real Periwinkle/Lime hues; amber/warning cluster from illustrations.)
2. **Tokenized-but-unused** — tokens nothing real consumes (candidates to CUT). (white alpha ramp, grey/1000, inner-shadow tiers, surplus radius steps, unused brand-* hues.)
3. Cross-reference: which generated steps are LOAD-BEARING (consumed by a semantic) vs purely filling the 10-step grid? Flag generated steps that back a semantic and so MUST get brand sign-off (e.g. green/700 #007D0B success, blue/700 #276AA2 info-as-brand, the violet hover/pressed steps).
Produce a compact coverage verdict + the add/cut lists with evidence.`,
  },
];

phase('Review');
log(`Reviewing ${GROUPS.length} token groups, then adversarially verifying every finding.`);

const reviewed = await pipeline(
  GROUPS,
  (g) => agent(g.prompt, { label: `review:${g.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
  (review, g) => {
    if (!review || !review.findings || !review.findings.length) return { review, verdicts: [] };
    // adversarially verify each finding in parallel — skeptic tries to REFUTE
    return parallel(review.findings.map((f) => () =>
      agent(
        `${COMMON}\n\n## ADVERSARIAL VERIFICATION\nA reviewer of group "${review.group}" claims this finding. Try HARD to REFUTE it. Recompute the contrast/ΔE/L* yourself (Bash+node ok), re-read the token in tokens.json/variables.css, re-check the real-usage count in the extract docs. A finding is "confirmed" only if the hard evidence holds; "refuted" if the number is wrong or it is an intentional documented design decision mislabeled as a defect; "adjusted" if real but wrong severity/detail. Default to skepticism but do not refute a number that actually checks out.\n\nFINDING ${f.id} [${f.severity}/${f.kind || '?'}]\ntoken: ${f.token}\nclaim: ${f.claim}\nevidence: ${f.evidence}\nproposed fix: ${f.fix}`,
        { label: `verify:${review.group}:${f.id}`, phase: 'Verify', schema: VERDICT_SCHEMA, model: 'sonnet' }
      ).then((v) => ({ ...f, group: review.group, verdict: v })).catch(() => ({ ...f, group: review.group, verdict: null }))
    ));
  }
);

// reviewed = array of { review, verdicts } per group
const groups = reviewed.filter(Boolean).map((r) => r.review).filter(Boolean);
const allVerified = reviewed.filter(Boolean).flatMap((r) => Array.isArray(r.verdicts) ? r.verdicts : []).filter(Boolean);

phase('Synthesize');
log(`Synthesizing ${allVerified.length} verified findings across ${groups.length} groups.`);

const payload = {
  groups: groups.map((g) => ({ group: g.group, verdict: g.verdict, verdictNote: g.verdictNote, questions: g.questions })),
  findings: allVerified.map((f) => ({
    group: f.group, id: f.id, severity: f.severity, kind: f.kind, token: f.token,
    claim: f.claim, evidence: f.evidence, fix: f.fix,
    verdict: f.verdict ? { status: f.verdict.status, correctedSeverity: f.verdict.correctedSeverity, note: f.verdict.note } : null,
  })),
};

const report = await agent(
  `${COMMON}

## SYNTHESIS — final deliverable
Below is the JSON of every group's verdict + every finding WITH its adversarial verdict. Produce the final review as Markdown:

1. **Executive summary** — overall health of Foundations v1 (architecture is sound? values trustworthy? what's the headline risk?). 3–5 sentences.
2. **Per-group verdict table** (A color-primitives, B semantic, C size, D typography, E effects, F coverage): keep / fix / add / mixed + one-line rationale.
3. **Prioritized fix list** — ONLY findings whose adversarial verdict is "confirmed" or "adjusted" (DROP refuted ones; if adjusted, use correctedSeverity). Order: critical → high → medium → low. Each row: severity · token · the problem · the fix · evidence (the hard number). Group by severity.
4. **Refuted/false-positive appendix** — list findings the skeptic refuted, one line each (so the user sees what was checked and dismissed and why).
5. **Brand sign-off questions** — deduolicated, the decisions only the brand/designer can make (generated ramp steps, dropped real colours, info intent, subtitle weight, etc.).

Be concrete and cite numbers. Do not soften confirmed AA failures. Keep it tight and skimmable.

DATA:
${JSON.stringify(payload)}`,
  { label: 'synthesize', phase: 'Synthesize' }
);

return { report, groupCount: groups.length, findingCount: allVerified.length,
  confirmed: allVerified.filter((f) => f.verdict && (f.verdict.status === 'confirmed' || f.verdict.status === 'adjusted')).length,
  refuted: allVerified.filter((f) => f.verdict && f.verdict.status === 'refuted').length };
