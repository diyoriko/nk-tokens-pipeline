// READ-ONLY. Dump collections + modes + per-variable scopes from the live file.
// Output feeds `node scripts/check-scopes.mjs --live <file>` (see figma/RUNBOOK.md §3).
// Run via Figma MCP (use_figma) or the desktop console. Run-verified 2026-07-09.
const out = { collections: [], snapshot: {} };
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const colById = {};
for (const c of cols) {
  colById[c.id] = c.name;
  out.collections.push({
    name: c.name,
    modes: c.modes.map((m) => m.name),
    count: c.variableIds.length,
    hiddenFromPublishing: c.hiddenFromPublishing,
  });
  out.snapshot[c.name] = {}; // keep empty collections visible (e.g. Typography)
}
const vars = await figma.variables.getLocalVariablesAsync();
for (const v of vars) {
  const cn = colById[v.variableCollectionId] || 'UNKNOWN';
  (out.snapshot[cn] ||= {})[v.name] = v.scopes;
}
// check-scopes.mjs accepts { snapshot: {...} } or the bare map — return the wrapper
// so the collections inventory rides along for free.
return JSON.stringify(out);
