// WRITE. Set variable scopes to match a snapshot (tokens/scopes.snapshot.json).
// Edit the snapshot in the repo FIRST (it is the contract), paste it below, run.
// Only touches variables whose scopes differ; returns exactly what changed.
// Written from the patterns used to build this file — set DRY_RUN=false only
// after reviewing the dry-run output. (See figma/RUNBOOK.md §4.)
const DRY_RUN = true;

// ⬇︎ paste the content of tokens/scopes.snapshot.json here
const SNAPSHOT = { /* "Color Primitives": { "Violet/100": [] }, ... */ };

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const colById = Object.fromEntries(cols.map((c) => [c.id, c.name]));
const vars = await figma.variables.getLocalVariablesAsync();
const norm = (a) => [...a].sort().join(',');
const changed = [];
const missing = [];
for (const v of vars) {
  const colName = colById[v.variableCollectionId];
  const want = SNAPSHOT[colName]?.[v.name];
  if (want === undefined) { missing.push(`${colName}|${v.name} (not in snapshot)`); continue; }
  if (norm(v.scopes) === norm(want)) continue;
  changed.push(`${colName}|${v.name}: [${v.scopes}] -> [${want}]`);
  if (!DRY_RUN) v.scopes = want;
}
return {
  dryRun: DRY_RUN,
  wouldChange: changed.length,
  changed,
  notInSnapshot: missing.slice(0, 20),
  note: missing.length > 20 ? `+${missing.length - 20} more not in snapshot` : undefined,
};
