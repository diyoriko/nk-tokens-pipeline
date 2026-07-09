// WRITE. Sync the `Responsive` collection (modes Desktop / Tablet / Mobile) from
// tokens/responsive.json values. responsive.json is code-owned (not synced by TS),
// so after changing it in the repo, run this to keep Figma truthful.
// Written from the collection's original build — dry-run first. (RUNBOOK §6.)
const DRY_RUN = true;

// ⬇︎ paste the *resolved* values from tokens/responsive.json (numbers, no "px")
const TIERS = {
  Mobile:  { Device: 'mobile',  'Device-Width': 375,  Columns: 2,  Gutter: 16, Margin: 16,  'Root-Font-Size': 16, 'Breakpoint-Min': 0 },
  Tablet:  { Device: 'tablet',  'Device-Width': 768,  Columns: 8,  Gutter: 16, Margin: 24,  'Root-Font-Size': 16, 'Breakpoint-Min': 768 },
  Desktop: { Device: 'desktop', 'Device-Width': 1440, Columns: 12, Gutter: 16, Margin: 152, 'Root-Font-Size': 16, 'Breakpoint-Min': 1280 },
};

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const resp = cols.find((c) => c.name === 'Responsive');
if (!resp) throw new Error('Responsive collection not found');
const vars = await figma.variables.getLocalVariablesAsync();
const byName = Object.fromEntries(vars.filter((v) => v.variableCollectionId === resp.id).map((v) => [v.name, v]));

const changes = [];
for (const [tier, values] of Object.entries(TIERS)) {
  const mode = resp.modes.find((m) => m.name === tier);
  if (!mode) { changes.push(`✗ mode "${tier}" missing in Figma — add it first`); continue; }
  for (const [name, want] of Object.entries(values)) {
    const v = byName[name];
    if (!v) { changes.push(`✗ variable "${name}" missing`); continue; }
    const cur = v.valuesByMode[mode.modeId];
    if (cur === want) continue;
    changes.push(`${tier}/${name}: ${JSON.stringify(cur)} -> ${JSON.stringify(want)}`);
    if (!DRY_RUN) v.setValueForMode(mode.modeId, want);
  }
}
return { dryRun: DRY_RUN, changes: changes.length ? changes : ['nothing to change — in sync'] };
