// Pull every icon out of the Figma "Icons" page as a clean SVG into assets/icons/.
// This is the bulk refresh: the Figma REST images endpoint exports each component
// node on its own (no section chrome), so the SVGs come out clean — build-assets.mjs
// then normalises colour to currentColor.
//
//   FIGMA_TOKEN=figd_... npm run export:icons
//
// Env:
//   FIGMA_TOKEN  (required) a Figma personal access token with file read scope
//   FILE_KEY     (default aVwI61IYqufB2gWE6VbwOM — Novakid DS Foundations)
//   ICON_PAGE    (default "Icons")
//   ICON_SECTION (default "24" — the master 24px container; one SVG per concept)
//
// The 6 size containers in Figma are a designer convenience; in code an icon is one
// vector sized via CSS, so we export the 24px masters only. The container may be a
// SECTION or a FRAME (Figma converts SECTIONs to FRAMEs when they're dragged).
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = process.env.FILE_KEY || 'aVwI61IYqufB2gWE6VbwOM';
const PAGE = process.env.ICON_PAGE || 'Icons';
const SECTION = process.env.ICON_SECTION || '24';
if (!TOKEN) { console.error('Set FIGMA_TOKEN (a fresh token — never the leaked one).'); process.exit(1); }

const api = (p) => fetch('https://api.figma.com/v1' + p, { headers: { 'X-Figma-Token': TOKEN } }).then((r) => {
  if (!r.ok) throw new Error(`Figma API ${r.status} on ${p}`);
  return r.json();
});

const outDir = new URL('../assets/icons/', import.meta.url).pathname;
fs.mkdirSync(outDir, { recursive: true });

// 1. find the Icons page, then the "24" section, then its component children
const file = await api(`/files/${FILE_KEY}?depth=3`);
const page = file.document.children.find((p) => p.name === PAGE);
if (!page) throw new Error(`page "${PAGE}" not found`);
const section = page.children.find((n) => n.name === SECTION && (n.type === 'SECTION' || n.type === 'FRAME'));
if (!section) throw new Error(`container "${SECTION}" (SECTION or FRAME) not found on page ${PAGE}`);
const comps = (section.children || []).filter((n) => n.type === 'COMPONENT');
if (!comps.length) throw new Error(`no COMPONENT children in container "${SECTION}"`);

// 2. batch-export as SVG (chunk to keep URLs short)
const byId = {};
for (const c of comps) byId[c.id] = c.name.replace(/^icon\//, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
const ids = Object.keys(byId);
const chunks = [];
for (let i = 0; i < ids.length; i += 60) chunks.push(ids.slice(i, i + 60));

let n = 0;
for (const chunk of chunks) {
  const res = await api(`/images/${FILE_KEY}?ids=${chunk.join(',')}&format=svg`);
  for (const [id, url] of Object.entries(res.images)) {
    if (!url) continue;
    const svg = await fetch(url).then((r) => r.text());
    fs.writeFileSync(path.join(outDir, byId[id] + '.svg'), svg);
    n++;
  }
}
console.log(`✓ Exported ${n}/${ids.length} icons to assets/icons/. Now run: npm run build:assets`);
