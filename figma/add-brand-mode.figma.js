// WRITE. Add a team brand mode to the `Color` collection, seeded from Parent Area.
// Figma copies the current default-mode values into the new mode automatically;
// this script verifies the copy and reports the brand-slot variables the team's
// overlay should then re-point (via Tokens Studio pull or the variable editor).
// Written from the B2 migration session (2026-07-08) — dry-run first.
// (See figma/RUNBOOK.md §5; code-side steps in foundations/CAPSULES.md.)
const DRY_RUN = true;
const TEAM_NAME = 'Team B'; // ⬅︎ the new mode's name (= the TS set / capsule name)

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const color = cols.find((c) => c.name === 'Color');
if (!color) throw new Error('Color collection not found');
if (color.modes.some((m) => m.name === TEAM_NAME))
  throw new Error(`Mode "${TEAM_NAME}" already exists`);

// The brand slot every team overlay re-points (keep in sync with the overlay sets):
const SLOT_PREFIXES = ['Background/Brand-Violet/', 'Text/Brand-Violet/', 'Icon/Brand-Violet/', 'Border/Brand-Violet/', 'Text/Link/', 'Background/Selected/'];

if (DRY_RUN) {
  const vars = await figma.variables.getLocalVariablesAsync();
  const slot = vars.filter((v) => v.variableCollectionId === color.id && SLOT_PREFIXES.some((p) => v.name.startsWith(p)));
  return {
    dryRun: true,
    wouldAddMode: TEAM_NAME,
    existingModes: color.modes.map((m) => m.name),
    slotVariablesToRepoint: slot.map((v) => v.name),
  };
}
const modeId = color.addMode(TEAM_NAME); // throws if the plan's mode limit is reached
return { addedMode: TEAM_NAME, modeId, existingModes: color.modes.map((m) => m.name), next: 'apply the overlay values (TS pull or variable editor), then re-snapshot scopes (RUNBOOK §3)' };
