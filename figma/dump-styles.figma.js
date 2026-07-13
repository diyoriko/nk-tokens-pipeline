// READ-ONLY. Dump local styles (text / effect / paint) with their values from the live file.
// Output feeds `node scripts/check-styles.mjs --live <file>` (see figma/RUNBOOK.md §9).
// Run via Figma MCP (use_figma) or the desktop console.
const round = (n) => Math.round(n * 10000) / 10000;
const hex8 = (c, a) => {
  const al = a !== undefined ? a : (c.a !== undefined ? c.a : 1);
  return '#' + [c.r, c.g, c.b, al]
    .map((v) => Math.round(v * 255).toString(16).padStart(2, '0').toUpperCase())
    .join('');
};
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

const out = { text: [], effect: [], paint: [] };

for (const s of await figma.getLocalTextStylesAsync()) {
  out.text.push({
    name: s.name,
    fontFamily: s.fontName.family,
    fontStyle: s.fontName.style,
    fontSize: round(s.fontSize),
    lineHeight: s.lineHeight.unit === 'AUTO'
      ? { unit: 'AUTO' }
      : { unit: s.lineHeight.unit, value: round(s.lineHeight.value) },
    letterSpacing: { unit: s.letterSpacing.unit, value: round(s.letterSpacing.value) },
  });
}

for (const s of await figma.getLocalEffectStylesAsync()) {
  out.effect.push({
    name: s.name,
    effects: s.effects.map((e) => {
      const o = { type: e.type, radius: round(e.radius), visible: e.visible };
      // color/offset/spread exist on shadows only, not LAYER_BLUR / BACKGROUND_BLUR
      if (e.color) o.color = hex8(e.color);
      if (e.offset) o.offset = { x: round(e.offset.x), y: round(e.offset.y) };
      if (e.spread !== undefined) o.spread = round(e.spread);
      return o;
    }),
  });
}

for (const s of await figma.getLocalPaintStylesAsync()) {
  out.paint.push({
    name: s.name,
    paints: s.paints.map((p) => {
      const o = { type: p.type, opacity: round(p.opacity !== undefined ? p.opacity : 1) };
      if (p.type === 'SOLID') o.color = hex8(p.color, 1);
      if (p.gradientStops) {
        o.gradientStops = p.gradientStops.map((g) => ({ position: round(g.position), color: hex8(g.color) }));
        // the angle lives in the transform — without it angle drift is invisible
        o.gradientTransform = p.gradientTransform.map((row) => row.map(round));
      }
      return o;
    }),
  });
}

out.text.sort(byName);
out.effect.sort(byName);
out.paint.sort(byName);
// check-styles.mjs accepts { text, effect, paint } — same shape as the snapshot.
return JSON.stringify(out);
