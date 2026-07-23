// Build the designer-facing guide (build/guide/index.html).
//
// The guide is GENERATED from the same sources as every other output — tokens.json,
// the scopes snapshot, responsive.json and the built CSS — so it cannot drift from
// the system it documents. Adding a token adds a row here; nothing is hand-maintained.
//
// Run: node scripts/build-guide.mjs   (wired into `npm run build`)
// Output: guide-dist/index.html — deliberately NOT under build/, so the 190 kB page is not
// packed into the npm tarball (`files: ["build"]`) and cannot trip the output-shape gates.
// Publish: deploy-storybook.yml copies guide-dist into the Pages artifact as /guide.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const pkg = json('package.json');
const tokens = json('tokens/tokens.json');
const scopes = json('tokens/scopes.snapshot.json');
const responsiveSrc = json('tokens/responsive.json');

let css;
try {
  css = read('build/css/variables.css');
} catch {
  console.error('✗ build/css/variables.css missing — run `npm run build:tokens` first.');
  process.exit(1);
}

// ---------------------------------------------------------------- collect
const cssMap = new Map();
for (const line of css.split('\n')) {
  const m = line.match(/^\s*(--nk-[a-z0-9-]+):\s*([^;]+);(?:\s*\/\*\*\s*(.*?)\s*\*\/)?/);
  if (m) cssMap.set(m[1], m[2].trim());
}

const kebab = (s) => String(s).trim().replace(/\s+/g, '-').toLowerCase();

function leaves(node, path = []) {
  const out = [];
  for (const [k, v] of Object.entries(node || {})) {
    if (!v || typeof v !== 'object') continue;
    if ('$value' in v) out.push({ path: [...path, k], token: v });
    else out.push(...leaves(v, [...path, k]));
  }
  return out;
}

const SET_PREFIX = {
  'Color Primitives': ['color'],
  Color: ['color'],
  Size: ['size'],
  Effect: ['effect'],
  Typography: ['typography'],
  'Parent Area': ['color'],
};

function findCss(setName, path) {
  const tail = path.map(kebab).join('-');
  for (const p of SET_PREFIX[setName] || []) {
    const cand = `--nk-${p}-${tail}`;
    if (cssMap.has(cand)) return cand;
  }
  const hits = [...cssMap.keys()].filter((v) => v.endsWith(`-${tail}`));
  return hits.length === 1 ? hits[0] : null;
}

const scopeOf = (coll, name) => (scopes[coll] || {})[name] || null;

const primitives = leaves(tokens['Color Primitives']).map(({ path, token }) => ({
  n: path.join('/'),
  c: findCss('Color Primitives', path),
  v: (cssMap.get(findCss('Color Primitives', path)) || token.$value || '').toLowerCase(),
  d: token.$description || '',
  hue: path[0],
  step: path[1],
  k: 'primitive',
}));

const semantics = [];
const seen = new Set();
for (const setName of ['Color', 'Parent Area']) {
  for (const { path, token } of leaves(tokens[setName])) {
    const n = path.join('/');
    if (seen.has(n)) continue;
    seen.add(n);
    const c = findCss(setName, path);
    semantics.push({
      n,
      c,
      v: (cssMap.get(c) || '').toLowerCase(),
      r: typeof token.$value === 'string' && token.$value.startsWith('{') ? token.$value.slice(1, -1).replace(/\./g, '/') : '',
      d: token.$description || '',
      surface: path[0],
      intent: path[1],
      s: scopeOf('Color', n),
      k: 'semantic',
    });
  }
}

const sizes = leaves(tokens.Size).map(({ path, token }) => {
  const c = findCss('Size', path);
  return { n: path.join('/'), c, v: cssMap.get(c) || String(token.$value), d: token.$description || '', group: path[0], s: scopeOf('Size', path.join('/')), k: 'size' };
});

const effects = leaves(tokens.Effect).map(({ path, token }) => {
  const c = findCss('Effect', path);
  return { n: path.join('/'), c, v: cssMap.get(c) || String(token.$value), d: token.$description || '', group: path[0], k: 'effect' };
});

const typography = leaves(tokens.Typography).map(({ path, token }) => ({
  n: path.join('/'),
  d: token.$description || '',
  group: path[0],
  v: token.$value,
  k: 'type',
}));

const responsive = leaves(responsiveSrc).map(({ path, token }) => ({
  n: path.join('/').replace(/^responsive\//, ''),
  v: String(token.$value),
  d: token.$description || '',
  tier: path[1],
  k: 'responsive',
}));

// resolve typography composite refs (Family/Weight/Size come from Typography Primitives)
const typePrim = {};
for (const { path, token } of leaves(tokens['Typography Primitives'])) typePrim[path.join('.')] = token.$value;
const deref = (val) => (typeof val === 'string' && val.startsWith('{') ? typePrim[val.slice(1, -1)] ?? val : val);

// ---------------------------------------------------------------- helpers
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const HUES = [...new Set(primitives.map((p) => p.hue))];
const SURFACES = [...new Set(semantics.map((s) => s.surface))];
const BRANDS = [...new Set(semantics.filter((s) => s.intent.startsWith('Brand-')).map((s) => s.intent.replace('Brand-', '')))].filter(
  (b) => primitives.some((p) => p.hue === b)
);
const SIZE_GROUPS = [...new Set(sizes.map((s) => s.group))];
const TIERS = [...new Set(responsive.map((r) => r.tier))];

const legacyCount = primitives.filter((p) => p.d).length;

// contrast (WCAG 2.x relative luminance) — used to pick readable swatch labels
function lum(hex) {
  const h = hex.replace('#', '').slice(0, 6);
  if (h.length < 6) return 1;
  const ch = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const onDark = (hex) => lum(hex) < 0.45;

// ---------------------------------------------------------------- fragments
function rampRow(hue) {
  const steps = primitives.filter((p) => p.hue === hue);
  return `<div class="ramp">
  <div class="ramp-name">${esc(hue)}<span>${steps.length}</span></div>
  <div class="ramp-steps">
    ${steps
      .map(
        (s) => `<div class="chip" style="background:${esc(s.v)};color:${onDark(s.v) ? '#fff' : '#0b0b0f'}" title="${esc(s.n)} · ${esc(s.v)}${s.d ? ' · ' + esc(s.d) : ''}">
      <span class="chip-step">${esc(s.step)}</span><span class="chip-hex">${esc(s.v.replace('#', ''))}</span></div>`
      )
      .join('')}
  </div>
</div>`;
}

function pairTable(brand) {
  const bg = semantics.filter((s) => s.surface === 'Background' && s.intent === `Brand-${brand}`);
  return `<table class="t">
  <thead><tr><th>Фон</th><th>Текст на нём</th><th>Иконка на нём</th></tr></thead>
  <tbody>
  ${bg
    .filter((b) => !b.n.endsWith('-Hover'))
    .map((b) => {
      const variant = b.n.split('/').pop();
      const on = `Text/Brand-${brand}/On-${variant}`;
      const onIcon = `Icon/Brand-${brand}/On-${variant}`;
      const t = semantics.find((s) => s.n === on);
      const i = semantics.find((s) => s.n === onIcon);
      return `<tr>
      <td><span class="sw" style="background:${esc(b.v)}"></span><code>${esc(b.n)}</code></td>
      <td>${t ? `<span class="sw" style="background:${esc(t.v)}"></span><code>${esc(t.n)}</code>` : '<span class="muted">—</span>'}</td>
      <td>${i ? `<span class="sw" style="background:${esc(i.v)}"></span><code>${esc(i.n)}</code>` : '<span class="muted">—</span>'}</td>
    </tr>`;
    })
    .join('')}
  </tbody></table>`;
}

function sizeTable(group) {
  const rows = sizes.filter((s) => s.group === group);
  return `<table class="t">
  <thead><tr><th>Токен</th><th>Значение</th><th>CSS</th><th>Для чего</th></tr></thead>
  <tbody>${rows
    .map(
      (r) => `<tr><td><code>${esc(r.n)}</code></td><td class="num">${esc(r.v)}</td><td><code class="dim">${esc(r.c || '—')}</code></td><td>${esc(r.d)}</td></tr>`
    )
    .join('')}</tbody></table>`;
}

const typeRows = typography
  .map((t) => {
    const v = t.v || {};
    const size = deref(v.fontSize);
    const weight = deref(v.fontWeight);
    const lh = v.lineHeight;
    const ls = v.letterSpacing;
    return `<tr>
    <td><code>${esc(t.n)}</code></td>
    <td class="num">${esc(size ?? '—')}</td>
    <td class="num">${esc(weight ?? '—')}</td>
    <td class="num">${esc(lh ?? '—')}</td>
    <td class="num">${esc(ls ?? '—')}</td>
    <td>${esc(t.d)}</td>
  </tr>`;
  })
  .join('');

const respRows = TIERS.map((tier) => {
  const g = Object.fromEntries(responsive.filter((r) => r.tier === tier).map((r) => [r.n.split('/').pop(), r.v]));
  return `<tr>
    <td><strong>${esc(tier)}</strong></td>
    <td class="num">${esc(g['Breakpoint-Min'] ?? '—')}</td>
    <td class="num">${esc(g['Device-Width'] ?? '—')}</td>
    <td class="num">${esc(g['Columns'] ?? '—')}</td>
    <td class="num">${esc(g['Gutter'] ?? '—')}</td>
    <td class="num">${esc(g['Margin'] ?? '—')}</td>
  </tr>`;
}).join('');

const ALL = [...primitives, ...semantics, ...sizes, ...effects, ...typography.map((t) => ({ ...t, v: '' })), ...responsive];

const DATA = ALL.map((t) => ({
  n: t.n,
  c: t.c || '',
  v: typeof t.v === 'string' ? t.v : '',
  d: t.d || '',
  k: t.k,
  r: t.r || '',
  s: Array.isArray(t.s) ? t.s.join(' ') : '',
}));

// ---------------------------------------------------------------- page
const stamp = new Date().toISOString().slice(0, 10);

const SECTIONS = [
  ['start', 'С чего начать'],
  ['connect', 'Подключить библиотеку'],
  ['map', 'Что где лежит'],
  ['primitives', 'Примитивы'],
  ['naming', 'Как читать имя токена'],
  ['pairs', 'Правило пары'],
  ['brands', 'Семь брендов'],
  ['status', 'Статусы и служебные'],
  ['sizes', 'Размеры'],
  ['type', 'Типографика'],
  ['effects', 'Тени, стекло, градиенты'],
  ['grid', 'Сетка и адаптив'],
  ['own', 'Свои токены для своей поверхности'],
  ['legacy', 'Старые имена'],
  ['dont', 'Чего делать нельзя'],
  ['request', 'Как попросить новый токен'],
  ['browser', 'Поиск по всем токенам'],
];

const html = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Novakid DS — гайд для дизайнеров</title>
<meta name="description" content="Как пользоваться токенами Novakid Design System в Figma: примитивы, семантика, размеры, типографика, сетка, капсулы.">
<style>
:root{
  --violet:#6d46fc; --violet-600:#572bd7; --violet-100:#f7f5ff; --violet-200:#cfcffd;
  --ink:#170751; --body:#3b3a52; --dim:#6f6d85; --line:#e6e4f0;
  --bg:#ffffff; --panel:#faf9ff; --code-bg:#f4f2fd;
  --ok:#0a7c42; --warn:#8a5a00; --bad:#b3261e;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --maxw:1180px;
}
@media (prefers-color-scheme:dark){
  :root{ --ink:#f2f0ff; --body:#c9c6dd; --dim:#8d8aa6; --line:#2a2740;
    --bg:#0d0b18; --panel:#141127; --code-bg:#1b1733; --violet-100:#1b1733; --violet-200:#2e2559; }
}
:root[data-theme="dark"]{ --ink:#f2f0ff; --body:#c9c6dd; --dim:#8d8aa6; --line:#2a2740;
  --bg:#0d0b18; --panel:#141127; --code-bg:#1b1733; --violet-100:#1b1733; --violet-200:#2e2559; }
:root[data-theme="light"]{ --ink:#170751; --body:#3b3a52; --dim:#6f6d85; --line:#e6e4f0;
  --bg:#ffffff; --panel:#faf9ff; --code-bg:#f4f2fd; --violet-100:#f7f5ff; --violet-200:#cfcffd; }

*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:24px}
body{margin:0;background:var(--bg);color:var(--body);font:16px/1.65 var(--sans);-webkit-font-smoothing:antialiased}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px}
a{color:var(--violet);text-decoration:none} a:hover{text-decoration:underline}
code{font:13px/1.5 var(--mono);background:var(--code-bg);padding:2px 6px;border-radius:5px;color:var(--ink);white-space:nowrap}
code.dim{color:var(--dim);background:transparent;padding:0}
h1,h2,h3{color:var(--ink);line-height:1.2;margin:0}
h2{font-size:28px;letter-spacing:-.02em;margin:0 0 6px}
h3{font-size:19px;margin:32px 0 10px}
p{margin:0 0 14px} ul,ol{margin:0 0 14px;padding-left:22px} li{margin:4px 0}
.muted{color:var(--dim)}
.lede{font-size:18px;color:var(--body)}

header.top{background:linear-gradient(150deg,#6d46fc 0%,#420eae 55%,#2e1781 100%);color:#fff;padding:56px 0 44px}
header.top h1{color:#fff;font-size:clamp(30px,4.4vw,46px);letter-spacing:-.03em;margin-bottom:12px}
header.top p{color:#e4dcff;max-width:62ch;font-size:18px;margin-bottom:0}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.badge{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);color:#fff;
  border-radius:999px;padding:5px 12px;font-size:13px;font-variant-numeric:tabular-nums}

.layout{display:grid;grid-template-columns:236px 1fr;gap:44px;align-items:start;padding:40px 0 80px}
@media (max-width:900px){ .layout{grid-template-columns:1fr;gap:0} nav.toc{position:static;margin-bottom:28px} }
nav.toc{position:sticky;top:20px;font-size:14px}
nav.toc ol{list-style:none;padding:0;margin:0;counter-reset:s}
nav.toc li{margin:0}
nav.toc a{display:block;padding:6px 10px;border-radius:7px;color:var(--body);border-left:2px solid transparent}
nav.toc a:hover{background:var(--panel);text-decoration:none;color:var(--ink)}
nav.toc a.on{background:var(--violet-100);color:var(--violet);border-left-color:var(--violet);font-weight:600}

section{padding:36px 0;border-top:1px solid var(--line)}
section:first-of-type{border-top:0;padding-top:0}
.eyebrow{font:600 12px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--violet);margin-bottom:10px}

.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:20px 0}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.card b{color:var(--ink);display:block;margin-bottom:4px;font-size:15px}
.card span{font-size:14px;color:var(--dim)}

.note{border-left:3px solid var(--violet);background:var(--violet-100);padding:14px 18px;border-radius:0 10px 10px 0;margin:18px 0}
.note.warn{border-left-color:#e8a33d;background:rgba(232,163,61,.10)}
.note.bad{border-left-color:#e05c52;background:rgba(224,92,82,.10)}
.note p:last-child{margin-bottom:0}
.note b{color:var(--ink)}

table.t{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;display:block;overflow-x:auto;white-space:nowrap}
table.t thead th{text-align:left;font:600 12px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;
  color:var(--dim);padding:0 14px 8px 0;border-bottom:1px solid var(--line)}
table.t td{padding:8px 14px 8px 0;border-bottom:1px solid var(--line);vertical-align:top;white-space:normal}
table.t td.num{font:13px/1.5 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink);white-space:nowrap}
table.t tbody tr:last-child td{border-bottom:0}
.sw{display:inline-block;width:14px;height:14px;border-radius:4px;margin-right:7px;vertical-align:-2px;
  border:1px solid rgba(128,128,150,.35)}

.ramp{margin:0 0 10px}
.ramp-name{font:600 13px/1 var(--mono);color:var(--ink);margin-bottom:5px;display:flex;gap:8px;align-items:center}
.ramp-name span{color:var(--dim);font-weight:400}
.ramp-steps{display:flex;gap:3px;flex-wrap:wrap}
.chip{flex:1 1 62px;min-width:56px;height:56px;border-radius:7px;display:flex;flex-direction:column;
  justify-content:flex-end;padding:6px 7px;font:11px/1.25 var(--mono);cursor:default}
.chip-step{font-weight:700}
.chip-hex{opacity:.72;font-size:10px}

.anat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px;margin:18px 0;overflow-x:auto}
.anat .line{font:600 clamp(14px,2.2vw,19px)/1.5 var(--mono);color:var(--ink);white-space:nowrap}
.anat .line i{font-style:normal;padding:2px 5px;border-radius:5px}
.anat .s1{background:rgba(109,70,252,.16);color:var(--violet)}
.anat .s2{background:rgba(10,88,234,.14);color:#0a58ea}
.anat .s3{background:rgba(10,124,66,.14);color:#0a7c42}
.anat dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:16px 0 0;font-size:14px}
.anat dt{font:600 13px/1.6 var(--mono)} .anat dd{margin:0;color:var(--body)}

.do-dont{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}
@media (max-width:700px){ .do-dont{grid-template-columns:1fr} }
.dd{border-radius:12px;padding:16px 18px;border:1px solid var(--line)}
.dd.y{background:rgba(10,124,66,.07);border-color:rgba(10,124,66,.28)}
.dd.n{background:rgba(179,38,30,.07);border-color:rgba(179,38,30,.28)}
.dd b{display:block;margin-bottom:8px;color:var(--ink)}
.dd ul{margin:0;padding-left:20px} .dd li{margin:5px 0;font-size:14px}

.search{position:sticky;top:0;background:var(--bg);padding:14px 0;z-index:5;border-bottom:1px solid var(--line)}
.search input{width:100%;padding:12px 15px;font:15px/1.4 var(--sans);border:1px solid var(--line);
  border-radius:10px;background:var(--panel);color:var(--ink)}
.search input:focus{outline:2px solid var(--violet);outline-offset:1px;border-color:transparent}
.filters{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.filters button{font:13px/1 var(--sans);padding:7px 12px;border-radius:999px;border:1px solid var(--line);
  background:var(--panel);color:var(--body);cursor:pointer}
.filters button[aria-pressed="true"]{background:var(--violet);border-color:var(--violet);color:#fff}
#count{font:13px/1 var(--mono);color:var(--dim);margin:12px 0}
#results{display:grid;gap:0}
.row{display:grid;grid-template-columns:20px minmax(200px,1.1fr) minmax(150px,1fr) minmax(90px,auto) 1.3fr;
  gap:12px;align-items:start;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}
@media (max-width:860px){ .row{grid-template-columns:20px 1fr;gap:6px} .row .hide-s{display:none} }
.row .nm{font:600 13px/1.5 var(--mono);color:var(--ink);word-break:break-all}
.row .cs{font:12px/1.5 var(--mono);color:var(--dim);word-break:break-all}
.row .vl{font:12px/1.5 var(--mono);color:var(--body);white-space:nowrap}
.row .ds{color:var(--dim);font-size:13px}
mark{background:rgba(109,70,252,.24);color:inherit;border-radius:3px;padding:0 1px}

footer{border-top:1px solid var(--line);padding:28px 0 60px;font-size:14px;color:var(--dim)}
.theme-toggle{position:fixed;right:16px;bottom:16px;z-index:20;width:42px;height:42px;border-radius:50%;
  border:1px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer;font-size:17px}
</style>

<header class="top">
  <div class="wrap">
    <h1>Novakid Design System — гайд для дизайнеров</h1>
    <p>Как устроены токены, где что лежит и как ими пользоваться в Figma, ничего не сломав.
       Страница собирается из самих токенов, поэтому всегда совпадает с системой.</p>
    <div class="badges">
      <span class="badge">${primitives.length} примитивов</span>
      <span class="badge">${semantics.length} семантических</span>
      <span class="badge">${sizes.length} размеров</span>
      <span class="badge">${typography.length} ролей текста</span>
      <span class="badge">${effects.length} эффектов</span>
      <span class="badge">v${esc(pkg.version)} · ${stamp}</span>
    </div>
  </div>
</header>

<div class="wrap layout">
<nav class="toc" aria-label="Содержание"><ol>
${SECTIONS.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('\n')}
</ol></nav>

<main>

<section id="start">
  <div class="eyebrow">Коротко</div>
  <h2>С чего начать</h2>
  <p class="lede">Если читать некогда — вот всё, что нужно знать в первый день.</p>
  <div class="cards">
    <div class="card"><b>1. Подключи библиотеку</b><span>Novakid DS Foundations. После этого токены появятся в пикерах Figma.</span></div>
    <div class="card"><b>2. Бери семантику</b><span>${semantics.length} готовых токенов вида <code>Background/Brand-Violet/Primary</code>. Это то, чем красят.</span></div>
    <div class="card"><b>3. Примитивы не трогай</b><span>${primitives.length} шагов рамп скрыты из пикеров намеренно. Они сырьё, а не краска.</span></div>
    <div class="card"><b>4. Нет нужного токена — напиши</b><span>Это не тупик, а сигнал, что в системе дырка. Чинится добавлением токена, а не хексом.</span></div>
  </div>
  <div class="note">
    <p><b>Главное правило.</b> Если тебе понадобился примитив на канвасе или хекс руками — значит не хватает
    семантического токена. Правильная реакция: попросить добавить токен, а не обойти систему.
    Один раз обошли — и через полгода систему уже никто не узнаёт.</p>
  </div>
</section>

<section id="connect">
  <div class="eyebrow">Шаг 1</div>
  <h2>Подключить библиотеку</h2>
  <ol>
    <li>Открой свой файл в Figma.</li>
    <li>Панель <b>Assets</b> → иконка книжки (<b>Libraries</b>).</li>
    <li>Найди <b>Novakid DS Foundations</b> → <b>Enable</b>.</li>
    <li>Проверь: выдели любой фрейм → Fill → иконка переменных. Должны появиться группы
        <code>Background</code>, <code>Text</code>, <code>Icon</code>, <code>Border</code>.</li>
  </ol>
  <p>Вместе с переменными подключаются <b>стили</b> — текстовые, эффекты (тени), заливки (градиенты) и сетки.
     Они лежат отдельно от переменных, потому что переменные Figma физически не умеют хранить
     градиент, тень и сетку.</p>
  <div class="note warn">
    <p><b>Если пикер пустой или токенов меньше, чем ожидал</b> — это, скорее всего, скоупы, а не баг.
    Токены <code>Text/*</code> показываются только в заливке текста, <code>Border/*</code> — только в обводке,
    <code>Icon/*</code> — только на векторных фигурах. Так и задумано, см.
    <a href="#naming">Как читать имя токена</a>.</p>
  </div>
</section>

<section id="map">
  <div class="eyebrow">Карта</div>
  <h2>Что где лежит</h2>
  <p>Система живёт в одном файле — <b>Novakid DS Foundations</b>. Внутри шесть коллекций переменных
     плюс стили.</p>
  <table class="t">
    <thead><tr><th>Коллекция</th><th>Сколько</th><th>Что это</th><th>Видно в пикерах</th></tr></thead>
    <tbody>
      <tr><td><code>Color</code></td><td class="num">288</td><td>Семантика цвета — то, чем красят</td><td>да</td></tr>
      <tr><td><code>Color Primitives</code></td><td class="num">104</td><td>Сырые рампы, 10 оттенков × 10 шагов</td><td><b>нет, намеренно</b></td></tr>
      <tr><td><code>Size</code></td><td class="num">68</td><td>Отступы, радиусы, обводки, размеры иконок, блюр, глубина, фокус</td><td>да</td></tr>
      <tr><td><code>Typography Primitives</code></td><td class="num">26</td><td>Семейство, вес, кегль, интерлиньяж, трекинг</td><td><b>нет, намеренно</b></td></tr>
      <tr><td><code>Effect</code></td><td class="num">17</td><td>Числовые параметры эффектов и прозрачности</td><td>да</td></tr>
      <tr><td><code>Responsive</code></td><td class="num">7</td><td>Брейкпоинты и параметры сетки</td><td>частично</td></tr>
    </tbody>
  </table>
  <h3>Что живёт стилями, а не переменными</h3>
  <table class="t">
    <thead><tr><th>Что</th><th>Тип в Figma</th><th>Почему не переменная</th></tr></thead>
    <tbody>
      <tr><td>Градиенты (${semantics.filter((s) => s.surface === 'Gradient').length} шт.)</td><td>Paint styles</td><td>Переменная Figma хранит один цвет, не градиент</td></tr>
      <tr><td>Тени и стекло</td><td>Effect styles</td><td>Переменная не хранит эффект целиком</td></tr>
      <tr><td>Текстовые стили (${typography.length} ролей)</td><td>Text styles</td><td>Роль — это связка из пяти параметров</td></tr>
      <tr><td>Сетки (${TIERS.length} тира + Baseline)</td><td>Grid styles</td><td>Переменная не хранит сетку</td></tr>
    </tbody>
  </table>
</section>

<section id="primitives">
  <div class="eyebrow">Слой 1</div>
  <h2>Примитивы</h2>
  <p>Это сырьё: ${HUES.length} рамп, у каждой шаги от 100 (самый светлый) до 1000 (самый тёмный).
     Шаг <b>500</b> в брендовых рампах — основной цвет.</p>
  ${HUES.map(rampRow).join('\n')}
  <h3>Почему их не видно в пикерах</h3>
  <p>У всех ${primitives.length} примитивов цвета и всех 26 типографических примитивов
     в Figma выставлены пустые скоупы — они физически не появляются в выпадашках свойств.
     Это закон системы, его проверяет автоматика на каждом изменении.</p>
  <p>Причина простая: если красить фреймы напрямую в <code>Violet/500</code>, то смена бренда
     превращается в ручной обход всех макетов. Семантика — это слой, который позволяет
     поменять цвет в одном месте.</p>
  <h3>Где их всё-таки посмотреть</h3>
  <ul>
    <li><b>Панель Variables</b> в файле DS Foundations → коллекция <code>Color Primitives</code>.
        Скоупы прячут переменные только из пикеров свойств; в редакторе переменных видно всё.</li>
    <li><b>На этой странице</b> — рампы выше и <a href="#browser">поиск по всем токенам</a>.</li>
    <li><b>Storybook</b> — раздел Tokens → Colors.</li>
  </ul>
</section>

<section id="naming">
  <div class="eyebrow">Слой 2</div>
  <h2>Как читать имя токена</h2>
  <p>Имя семантического токена состоит из трёх частей и читается слева направо:</p>
  <div class="anat">
    <div class="line"><i class="s1">Background</i> / <i class="s2">Brand-Violet</i> / <i class="s3">Primary</i></div>
    <dl>
      <dt class="s1">Поверхность</dt><dd>что именно красим: фон, текст, иконку или обводку</dd>
      <dt class="s2">Назначение</dt><dd>какую роль играет: бренд, статус, нейтраль, служебное</dd>
      <dt class="s3">Вариант</dt><dd>насколько сильно: Primary / Secondary / Tertiary / Strong, состояния</dd>
    </dl>
  </div>
  <h3>Поверхности</h3>
  <table class="t">
    <thead><tr><th>Префикс</th><th>Сколько</th><th>Где применяется</th><th>Виден в пикере</th></tr></thead>
    <tbody>
    ${SURFACES.map((s) => {
      const list = semantics.filter((x) => x.surface === s);
      const sc = [...new Set(list.flatMap((x) => x.s || []))];
      const where = { Background: 'Заливка фрейма', Text: 'Заливка текста', Icon: 'Заливка векторной фигуры', Border: 'Обводка', 'Data-Viz': 'Графики: заливка и обводка', Social: 'Логотипы соцсетей', Alpha: 'Полупрозрачные наложения', Gradient: 'Градиенты (paint styles)' }[s] || '—';
      return `<tr><td><code>${esc(s)}</code></td><td class="num">${list.length}</td><td>${esc(where)}</td><td>${sc.length ? esc(sc.join(', ')) : '<span class="muted">стиль, не переменная</span>'}</td></tr>`;
    }).join('')}
    </tbody>
  </table>
  <h3>Варианты</h3>
  <table class="t">
    <thead><tr><th>Вариант</th><th>Что значит</th></tr></thead>
    <tbody>
      <tr><td><code>Primary</code></td><td>Основной, самый заметный. Начинай с него.</td></tr>
      <tr><td><code>Secondary</code></td><td>Приглушённый — вторичные блоки, подложки.</td></tr>
      <tr><td><code>Tertiary</code></td><td>Самый тихий — едва заметные подложки.</td></tr>
      <tr><td><code>Strong</code></td><td>Усиленный акцент — там, где Primary не хватает.</td></tr>
      <tr><td><code>*-Hover</code></td><td>Состояние наведения. Никогда не подбирай его на глаз.</td></tr>
      <tr><td><code>On-*</code></td><td>Контент <b>поверх</b> одноимённого фона. См. <a href="#pairs">правило пары</a>.</td></tr>
      <tr><td><code>*-Inverse</code></td><td>Для инвертированных поверхностей (тёмный фон).</td></tr>
    </tbody>
  </table>
</section>

<section id="pairs">
  <div class="eyebrow">Важное</div>
  <h2>Правило пары</h2>
  <p class="lede">Каждому фону соответствует токен <code>On-*</code> для текста и иконки на нём.
     Это единственный способ гарантировать читаемость.</p>
  <div class="do-dont">
    <div class="dd y"><b>Правильно</b><ul>
      <li>Фон <code>Background/Brand-Violet/Primary</code></li>
      <li>Текст <code>Text/Brand-Violet/On-Primary</code></li>
      <li>Иконка <code>Icon/Brand-Violet/On-Primary</code></li>
    </ul></div>
    <div class="dd n"><b>Неправильно</b><ul>
      <li>Фон <code>Background/Brand-Violet/Primary</code></li>
      <li>Текст <code>Text/Default/Primary</code> — «вроде читается»</li>
      <li>Итог: контраст никем не проверен и сломается при смене бренда</li>
    </ul></div>
  </div>
  <h3>Пары для основного бренда</h3>
  ${pairTable('Violet')}

  <h3>Насколько этому можно доверять</h3>
  <p>Честно, без приукрашивания — по итогам аудита пайплайна от 2026-07-23.</p>
  <p>Автоматическая проверка контраста существует и падает на регрессии, но она покрывает
     <b>список из 100 пар</b>, а не все сочетания. Из ${semantics.filter((s) => s.c && s.c.startsWith('--nk-color')).length}
     цветовых переменных в проверке участвует меньше половины. Каждый передний план сверяется
     только с белым и с той единственной поверхностью, по которой он назван.</p>
  <p>Практический вывод: <b>пары <code>On-*</code> проверены, произвольные сочетания — нет.</b>
     Если ставишь текст на поверхность, которая не названа в его имени, проверь контраст сам.</p>
  <div class="note warn">
    <p><b>Известные слабые сочетания в текущей версии.</b> Посчитано по WCAG 2.x на собранных
    значениях. Ни одно из них не ломает продукт, но автоматика их не видит, так что знать стоит:</p>
    <table class="t" style="margin-top:10px">
      <thead><tr><th>Сочетание</th><th>Контраст</th><th>Нужно</th></tr></thead>
      <tbody>
        <tr><td><code>Border/Focus/Default</code> на <code>Background/Base/Inverse</code></td><td class="num">2.26:1</td><td class="num">3.0</td></tr>
        <tr><td><code>Text/Default/Secondary</code> на <code>Background/Base/Tertiary</code></td><td class="num">4.17:1</td><td class="num">4.5</td></tr>
        <tr><td><code>Text/Default/Secondary</code> на <code>Background/Base/Secondary-Hover</code></td><td class="num">4.17:1</td><td class="num">4.5</td></tr>
        <tr><td><code>Border/Default/Secondary</code> на <code>Background/Base/Tertiary</code></td><td class="num">2.78:1</td><td class="num">3.0</td></tr>
        <tr><td><code>Border/Focus/On-Fill</code> на <code>Background/Brand-Blue/Primary</code></td><td class="num">2.98:1</td><td class="num">3.0</td></tr>
      </tbody>
    </table>
    <p>Первую строку стоит запомнить: кольцо фокуса на тёмной секции почти не видно, а это уже
    не эстетика, а навигация с клавиатуры. Делаешь тёмный блок — проверь, виден ли фокус.</p>
    <p>Про вторую и третью полезно знать, что <code>Background/Base/Secondary-Hover</code> и
    <code>Background/Base/Tertiary</code> — это одно и то же значение, то есть речь про обычную
    карточку на ховере. Если текст там важен, возьми <code>Text/Default/Primary</code>.</p>
    <p>В планах контракт контраста будет выводиться из дерева токенов, а не поддерживаться
    списком — тогда такие сочетания начнут ловиться сами.</p>
  </div>
</section>

<section id="brands">
  <div class="eyebrow">Палитра</div>
  <h2>Семь брендов</h2>
  <p>В семантике живут ${BRANDS.length} брендовых семейств, каждое с полным набором
     Background / Text / Icon / Border и состояниями. Основной — <b>Violet</b>.
     Остальные доступны всем и не требуют никаких разрешений.</p>
  <table class="t">
    <thead><tr><th>Семейство</th><th>Primary</th><th>Всего токенов</th><th>Для чего обычно</th></tr></thead>
    <tbody>
    ${BRANDS.map((b) => {
      const p = semantics.find((s) => s.n === `Background/Brand-${b}/Primary`);
      const cnt = semantics.filter((s) => s.intent === `Brand-${b}`).length;
      const use = { Violet: 'Основной бренд — CTA, акценты, ссылки', Magenta: 'Второй бренд — промо, акции', Coral: 'Тёплый акцент — вовлечение, игровые блоки', Green: 'Прогресс, достижения', Orange: 'Внимание без тревоги', Blue: 'Информация, спокойные акценты', Yellow: 'Награды, звёзды, подсветка' }[b] || '';
      return `<tr><td><span class="sw" style="background:${esc(p ? p.v : '#ccc')}"></span><b>${esc(b)}</b></td>
        <td><code>${esc(p ? p.v : '—')}</code></td><td class="num">${cnt}</td><td>${esc(use)}</td></tr>`;
    }).join('')}
    </tbody>
  </table>
  <div class="note">
    <p><b>Это важно для вопроса «а можно мне свои цвета».</b> Если нужен просто другой акцент —
    он уже есть. Бери <code>Brand-Coral</code> или <code>Brand-Green</code> и работай:
    ни капсула, ни новые токены, ни чьё-то согласование не нужны. См. <a href="#own">свои токены</a>.</p>
  </div>
</section>

<section id="status">
  <div class="eyebrow">Палитра</div>
  <h2>Статусы и служебные</h2>
  <table class="t">
    <thead><tr><th>Назначение</th><th>Когда</th><th>Пример токена</th></tr></thead>
    <tbody>
      <tr><td><code>Success</code></td><td>Получилось, оплачено, урок засчитан</td><td><code>Background/Success/Light</code></td></tr>
      <tr><td><code>Warning</code></td><td>Требует внимания, но не ошибка</td><td><code>Background/Warning/Light</code></td></tr>
      <tr><td><code>Danger</code></td><td>Ошибка, отмена, необратимое действие</td><td><code>Background/Danger/Bold</code></td></tr>
      <tr><td><code>Info</code></td><td>Нейтральная подсказка</td><td><code>Background/Info/Light</code></td></tr>
      <tr><td><code>Disabled</code></td><td>Недоступно. Не делай это опасити на глаз</td><td><code>Text/Disabled/Primary</code></td></tr>
      <tr><td><code>Selected</code></td><td>Выбранный элемент списка, таба</td><td><code>Border/Selected/Default</code></td></tr>
      <tr><td><code>Focus</code></td><td>Кольцо фокуса с клавиатуры. Не убирай его</td><td><code>Border/Focus/Default</code></td></tr>
      <tr><td><code>Link</code></td><td>Ссылки в тексте, включая посещённые</td><td><code>Text/Link/Default</code></td></tr>
      <tr><td><code>Overlay</code> / <code>Scrim</code> / <code>Frosted</code></td><td>Подложки модалок и стекло</td><td><code>Background/Scrim/Default</code></td></tr>
      <tr><td><code>Alpha</code></td><td>Полупрозрачные утилиты поверх любого фона</td><td><code>Alpha/Black/200</code></td></tr>
      <tr><td><code>Data-Viz</code></td><td>Серии в графиках, ${semantics.filter((s) => s.surface === 'Data-Viz').length} цветов по порядку</td><td><code>Data-Viz/1</code></td></tr>
      <tr><td><code>Social</code></td><td>Фирменные цвета соцсетей, менять нельзя</td><td><code>Social/Telegram</code></td></tr>
    </tbody>
  </table>
</section>

<section id="sizes">
  <div class="eyebrow">Не только цвет</div>
  <h2>Размеры</h2>
  <p>Числа в имени — это не пиксели. Шкала построена так, что <b>имя = px × 25</b>:
     <code>Space/400</code> — это 16px. Так шкалу можно уплотнять, не переименовывая всё подряд.</p>
  ${SIZE_GROUPS.map((g) => `<h3>${esc(g)}</h3>${sizeTable(g)}`).join('\n')}
</section>

<section id="type">
  <div class="eyebrow">Не только цвет</div>
  <h2>Типографика</h2>
  <p>${typography.length} ролей. Роль — это готовая связка кегля, веса, интерлиньяжа и трекинга;
     подключается текстовым стилем, а не набором переменных.</p>
  <table class="t">
    <thead><tr><th>Роль</th><th>Кегль</th><th>Вес</th><th>Интерлиньяж</th><th>Трекинг</th><th>Для чего</th></tr></thead>
    <tbody>${typeRows}</tbody>
  </table>
  <div class="note warn">
    <p><b>Шрифт Mikado</b> — фирменный, лицензионный. В пакет он не входит и на этой странице не показан:
    здесь системный шрифт. В Figma он подключается через библиотеку, в вебе — отдельно.</p>
  </div>
</section>

<section id="effects">
  <div class="eyebrow">Не только цвет</div>
  <h2>Тени, стекло, градиенты</h2>
  <h3>Тени и стекло</h3>
  <table class="t">
    <thead><tr><th>Токен</th><th>Значение</th><th>Для чего</th></tr></thead>
    <tbody>${effects
      .filter((e) => e.group !== 'Opacity')
      .map((e) => `<tr><td><code>${esc(e.n)}</code></td><td class="num">${esc(String(e.v).slice(0, 60))}</td><td>${esc(e.d)}</td></tr>`)
      .join('')}</tbody>
  </table>
  <h3>Прозрачность</h3>
  <p>Отдельная шкала. <code>Opacity/Disabled</code> и <code>Opacity/Muted</code> — именованные,
     используй их вместо подбора процента на глаз.</p>
  <h3>Градиенты</h3>
  <table class="t">
    <thead><tr><th>Стиль</th><th>Для чего</th></tr></thead>
    <tbody>${semantics
      .filter((s) => s.surface === 'Gradient')
      .map((s) => `<tr><td><span class="sw" style="background:${esc(s.v)}"></span><code>${esc(s.n)}</code></td><td>${esc(s.d)}</td></tr>`)
      .join('')}</tbody>
  </table>
</section>

<section id="grid">
  <div class="eyebrow">Не только цвет</div>
  <h2>Сетка и адаптив</h2>
  <table class="t">
    <thead><tr><th>Тир</th><th>От, px</th><th>Ширина макета</th><th>Колонок</th><th>Гаттер</th><th>Поля</th></tr></thead>
    <tbody>${respRows}</tbody>
  </table>
  <p>В Figma тиры представлены grid-стилями <code>Grid/Mobile</code>, <code>Grid/Tablet</code>,
     <code>Grid/Desktop</code> и <code>Grid/Baseline</code>. Тир <b>Wide</b> (от 1920px) существует
     только в коде — в Figma для него есть grid-стиль, но отдельного режима переменных нет.</p>
</section>

<section id="own">
  <div class="eyebrow">Частый вопрос</div>
  <h2>Свои токены для своей поверхности</h2>
  <p class="lede">«Дай доступ к примитивам, я соберу свою семантику» — самый частый запрос.
     Ответов четыре, и они сильно разные по цене. Пройди по дереву сверху вниз и остановись
     на первом, который подходит.</p>

  <h3>Путь 1. Нужен другой акцентный цвет — ничего делать не надо</h3>
  <p>В системе уже ${BRANDS.length} брендовых семейств с полным набором поверхностей и состояний.
     Берёшь <code>Brand-Coral</code>, <code>Brand-Green</code> или любое другое и работаешь.
     Ноль согласований, ноль новых сущностей, контраст уже проверен.</p>
  <p><b>Это закрывает большинство запросов.</b> Прежде чем идти дальше, проверь, точно ли не подходит.</p>

  <h3>Путь 2. Не хватает конкретного токена — запрос на токен</h3>
  <p>Нужен фон или обводка, которых нет ни в одном варианте. Это дырка в общей системе,
     а не повод заводить свой слой. См. <a href="#request">как попросить</a>.
     Токен добавляется в foundation и приезжает всем сразу.</p>

  <h3>Путь 3. Нужна своя семантика только в Figma — своя коллекция</h3>
  <p>Твоя поверхность живёт своими ролями, и тебе нужно это <b>в макетах</b>: отдельного кода,
     который тянул бы твои токены из пакета, нет. Тогда ты заводишь <b>свою коллекцию переменных</b>
     и алиасишь в неё примитивы. Foundation не трогается вообще, лимит режимов не расходуется,
     владеешь ей ты.</p>
  <ol>
    <li>В своём файле: <b>Assets → Libraries → включить Novakid DS Foundations</b>.</li>
    <li><b>Variables → New collection</b>, назвать по команде или поверхности.</li>
    <li>Создать переменную и задать значение <b>алиасом</b> примитива:
        <code>Background/Primary</code> → <code>Color Primitives/Violet/500</code>.</li>
    <li>На слоях применять <b>свою</b> семантику, а не сырой примитив.</li>
  </ol>
  <div class="note">
    <p><b>Да, примитивы можно алиасить, хотя их не видно в пикерах.</b> Скоупы прячут их только
    из выпадашек свойств на канвасе. В редакторе переменных при выборе алиаса они доступны —
    это и есть задуманный путь. Если не получается ткнуть примитив прямо в слой — так и должно быть,
    заведи семантический токен.</p>
  </div>
  <h4 style="margin:22px 0 8px;color:var(--ink);font-size:16px">Как называть свои токены</h4>
  <p>По роли и поверхности, а не по цвету — тогда система читается одинаково у всех команд.
     И обязательно выставь скоуп, чтобы токен показывался только там, где уместен:</p>
  <table class="t">
    <thead><tr><th>Имя</th><th>Скоуп</th></tr></thead>
    <tbody>
      <tr><td><code>Background/&lt;роль&gt;</code></td><td><code>FRAME_FILL</code></td></tr>
      <tr><td><code>Text/&lt;роль&gt;</code></td><td><code>TEXT_FILL</code></td></tr>
      <tr><td><code>Icon/&lt;роль&gt;</code></td><td><code>SHAPE_FILL</code></td></tr>
      <tr><td><code>Border/&lt;роль&gt;</code></td><td><code>STROKE_COLOR</code></td></tr>
    </tbody>
  </table>
  <p><code>ALL_SCOPES</code> не ставь никогда — токен, который лезет во все пикеры, обесценивает
     остальные.</p>
  <h4 style="margin:22px 0 8px;color:var(--ink);font-size:16px">Три правила, чтобы свой слой не сгнил</h4>
  <ul>
    <li><b>Контраст свой проверяешь сам.</b> Автоматика проверяет пары foundation, а не твои.
        Ориентир: AA 4.5 для основного текста, 3.0 для крупного текста и элементов интерфейса.</li>
    <li><b>Состояния делай альфой, а не новыми цветами.</b> Hover и pressed — это база плюс
        <code>Alpha/Black/100</code> на светлом или <code>Alpha/White/100</code> на тёмном.
        Плодить по цвету на каждое состояние — путь в неподдерживаемое.</li>
    <li><b>Обновления принимай.</b> Когда foundation двигает примитив, прими Library Update.
        Не пинить и не копировать значения, чтобы «не поехало» — иначе через квартал у тебя
        своя система, которая ни с чем не сходится.</li>
  </ul>

  <h3>Путь 4. Ребренд, который должен доехать до кода — капсула</h3>
  <p>Поверхность живёт в другом основном цвете, <b>и её фронтенд должен получить эти токены
     из пакета</b>. Только тогда нужна капсула.</p>
  <p>Капсула — это <b>режим (mode)</b> на коллекции <code>Color</code>, который перепривязывает
     ровно один слот, примерно 25 токенов:</p>
  <ul>
    <li><code>Background/Brand-Violet/*</code> · <code>Text/Brand-Violet/*</code></li>
    <li><code>Icon/Brand-Violet/*</code> · <code>Border/Brand-Violet/*</code></li>
    <li><code>Text/Link/*</code> · <code>Background/Selected/*</code></li>
  </ul>
  <p>Всё остальное — размеры, типографика, эффекты, статусы, нейтрали — остаётся общим.
     Капсула отвечает ровно на один вопрос: <b>какой у поверхности основной цвет</b>.
     Взамен она даёт то, чего не даёт своя коллекция: сборку в npm-пакет и автоматическую
     проверку контраста.</p>
  <table class="t">
    <thead><tr><th>Шаг</th><th>Кто делает</th></tr></thead>
    <tbody>
      <tr><td>Подключить библиотеку у себя</td><td>дизайнер поверхности</td></tr>
      <tr><td>Добавить режим в коллекцию <code>Color</code></td><td><b>владелец DS</b> — это запись в общий файл</td></tr>
      <tr><td>Завести набор токенов и тему в Tokens Studio</td><td>дизайнер</td></tr>
      <tr><td>Зарегистрировать капсулу в коде и в пакете</td><td><b>владелец DS</b></td></tr>
    </tbody>
  </table>
  <div class="note warn">
    <p><b>Ограничение, о котором надо знать заранее.</b> Figma лимитирует количество режимов
    на коллекцию в зависимости от тарифа, и два режима уже заняты. Своя коллекция (путь 3)
    лимит не расходует, капсула — расходует. Поэтому «капсула на каждую команду» упирается
    в потолок быстрее, чем кажется: сначала проверь, хватает ли пути 3.</p>
  </div>

  <h3>Коротко: чем пути 3 и 4 отличаются</h3>
  <table class="t">
    <thead><tr><th></th><th>Своя коллекция</th><th>Капсула</th></tr></thead>
    <tbody>
      <tr><td>Где живёт</td><td>твой Figma-файл</td><td>общий foundation + <code>tokens.json</code></td></tr>
      <tr><td>Кто владеет</td><td>ты</td><td>DS вместе с тобой</td></tr>
      <tr><td>Едет в код (npm)</td><td>нет</td><td>да, отдельным подпутём пакета</td></tr>
      <tr><td>Контраст проверяет автоматика</td><td>нет, сама</td><td>да</td></tr>
      <tr><td>Расходует лимит режимов Figma</td><td>нет</td><td>да</td></tr>
      <tr><td>Цена запуска</td><td>полчаса</td><td>согласование + работа владельца DS</td></tr>
    </tbody>
  </table>

  <div class="note bad">
    <p><b>Чего нельзя ни в одном из путей</b> — копировать примитивы к себе или вбивать их hex.
    Ссылайся алиасом. Скопированный примитив не получит обновление, разъедется с системой
    на первом же изменении, и никто этого не заметит, пока не станет поздно.</p>
  </div>
  <div class="note">
    <p><b>Владение.</b> Примитивы, общая семантика, размеры, типографика и эффекты — за DS:
    он их версионирует и обновляет. Твоя коллекция и применение токенов на твоих экранах — за тобой.
    Новая команда = новая коллекция на тех же примитивах, foundation не меняется.
    Ровно поэтому система масштабируется вбок.</p>
  </div>
</section>

<section id="legacy">
  <div class="eyebrow">Миграция</div>
  <h2>Старые имена</h2>
  <p>Если помнишь цвет по старому названию из лендинговой системы — оно записано в описании
     примитива. Заполнено у <b>${legacyCount} из ${primitives.length}</b>.</p>
  <table class="t">
    <thead><tr><th>Обозначение</th><th>Что значит</th></tr></thead>
    <tbody>
      <tr><td><code>=</code></td><td>Точное совпадение со старым цветом</td></tr>
      <tr><td><code>≈</code></td><td><b>Похожий, но не тот же.</b> Расхождение бывает заметным глазу — не считай их взаимозаменяемыми</td></tr>
      <tr><td>Пусто</td><td>Сгенерированный шаг рампы, у которого нет предка в старой системе</td></tr>
    </tbody>
  </table>
  <p>Искать по старому названию удобнее всего в <a href="#browser">поиске</a> — он ищет и по описаниям.
     Введи, например, <code>Daisy Bush</code> или <code>Heliotrope</code>.</p>
</section>

<section id="dont">
  <div class="eyebrow">Дисциплина</div>
  <h2>Чего делать нельзя</h2>
  <div class="do-dont">
    <div class="dd n"><b>Никогда</b><ul>
      <li>Вбивать hex руками, даже «временно»</li>
      <li>Отвязывать (detach) переменную, чтобы «чуть подправить»</li>
      <li>Копировать примитивы или семантику к себе в файл</li>
      <li>Править описания переменных руками в Figma — их перезапишет следующая синхронизация</li>
      <li>Подбирать hover, disabled и прозрачность на глаз</li>
      <li>Переименовывать токены в обход Tokens Studio — связи в макетах порвутся</li>
    </ul></div>
    <div class="dd y"><b>Вместо этого</b><ul>
      <li>Ищи подходящий семантический токен — их ${semantics.length}</li>
      <li>Не нашёл — <a href="#request">попроси добавить</a>, это нормальный ход</li>
      <li>Нужен другой акцент — возьми одно из ${BRANDS.length} брендовых семейств</li>
      <li>Нужен ребренд поверхности целиком — обсуди <a href="#own">капсулу</a></li>
      <li>Описания и имена меняются в Tokens Studio, оттуда доезжают в Figma</li>
    </ul></div>
  </div>
</section>

<section id="request">
  <div class="eyebrow">Процесс</div>
  <h2>Как попросить новый токен</h2>
  <p>Напиши владельцу системы и опиши <b>задачу</b>, а не готовое решение. Не «добавь
     <code>#F0EAFF</code>», а «нужен фон для подсветки выбранной строки в таблице».
     Половина запросов закрывается существующим токеном, который просто не нашёлся.</p>
  <p>Что помогает ответить быстро:</p>
  <ul>
    <li>Ссылка на макет с местом применения</li>
    <li>Что именно красим: фон, текст, иконку, обводку</li>
    <li>На чём это лежит — какой под ним фон</li>
    <li>Есть ли состояния: hover, disabled, выбранное</li>
    <li>Разово это или паттерн, который повторится</li>
  </ul>
  <p>Дальше токен добавляется в систему, проходит автоматическую проверку контраста и приезжает
     всем сразу — и в Figma, и в код. Отдельно «для себя» ничего делать не нужно.</p>
</section>

<section id="browser">
  <div class="eyebrow">Справочник</div>
  <h2>Поиск по всем токенам</h2>
  <p>Ищет по имени, CSS-переменной, значению и описанию — включая старые названия.
     Всего ${DATA.length} записей.</p>
  <div class="search">
    <input id="q" type="search" placeholder="violet, hover, danger, Daisy Bush, radius, 16px…" autocomplete="off" aria-label="Поиск по токенам">
    <div class="filters" id="filters">
      <button data-k="" aria-pressed="true">Все</button>
      <button data-k="semantic" aria-pressed="false">Семантика</button>
      <button data-k="primitive" aria-pressed="false">Примитивы</button>
      <button data-k="size" aria-pressed="false">Размеры</button>
      <button data-k="effect" aria-pressed="false">Эффекты</button>
      <button data-k="type" aria-pressed="false">Типографика</button>
      <button data-k="responsive" aria-pressed="false">Адаптив</button>
    </div>
  </div>
  <div id="count"></div>
  <div id="results"></div>
</section>

</main>
</div>

<footer><div class="wrap">
  <p>Собрано из <code>tokens.json</code> версии <b>${esc(pkg.version)}</b>, ${stamp}.
     Страница генерируется вместе с токенами — если тут чего-то нет, значит этого нет и в системе.</p>
  <p>Вопросы и запросы на токены — владельцу дизайн-системы.</p>
</div></footer>

<button class="theme-toggle" id="tt" title="Светлая / тёмная тема" aria-label="Переключить тему">◐</button>

<script id="tokens-data" type="application/json">${JSON.stringify(DATA).replace(/</g, '\\u003c')}</script>
<script>
(function(){
  var DATA = JSON.parse(document.getElementById('tokens-data').textContent);
  var q = document.getElementById('q');
  var results = document.getElementById('results');
  var count = document.getElementById('count');
  var kind = '';

  var KIND_LABEL = { semantic:'сем.', primitive:'прим.', size:'разм.', effect:'эфф.', type:'тип.', responsive:'адапт.' };

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function hl(s, term){
    if(!term) return esc(s);
    var i = s.toLowerCase().indexOf(term);
    if(i < 0) return esc(s);
    return esc(s.slice(0,i)) + '<mark>' + esc(s.slice(i,i+term.length)) + '</mark>' + esc(s.slice(i+term.length));
  }
  function swatch(v){
    if(!v) return '';
    if(/^#|^rgba?\\(|^linear-gradient/.test(v)) return '<span class="sw" style="background:' + esc(v) + '"></span>';
    return '';
  }

  function render(){
    var term = q.value.trim().toLowerCase();
    var out = [];
    var n = 0;
    for(var i=0;i<DATA.length;i++){
      var t = DATA[i];
      if(kind && t.k !== kind) continue;
      if(term){
        var hay = (t.n + ' ' + t.c + ' ' + t.v + ' ' + t.d + ' ' + t.r).toLowerCase();
        if(hay.indexOf(term) < 0) continue;
      }
      n++;
      if(n > 400) continue;
      out.push(
        '<div class="row">' +
          '<div>' + swatch(t.v) + '</div>' +
          '<div class="nm">' + hl(t.n, term) + '</div>' +
          '<div class="cs hide-s">' + (t.c ? hl(t.c, term) : '<span class="muted">стиль</span>') + '</div>' +
          '<div class="vl hide-s">' + (t.v ? hl(t.v.length > 34 ? t.v.slice(0,34) + '…' : t.v, term) : '') + '</div>' +
          '<div class="ds hide-s">' + (t.d ? hl(t.d, term) : '') +
            (t.r ? ' <code class="dim">→ ' + esc(t.r) + '</code>' : '') + '</div>' +
        '</div>'
      );
    }
    count.textContent = n === 0 ? 'ничего не нашлось' :
      ('найдено: ' + n + (n > 400 ? ' — показаны первые 400, уточни запрос' : ''));
    results.innerHTML = out.join('');
  }

  q.addEventListener('input', render);
  document.getElementById('filters').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    kind = b.getAttribute('data-k');
    var all = this.querySelectorAll('button');
    for(var i=0;i<all.length;i++) all[i].setAttribute('aria-pressed', all[i] === b ? 'true' : 'false');
    render();
  });
  render();

  // TOC highlight
  var links = [].slice.call(document.querySelectorAll('nav.toc a'));
  var secs = links.map(function(a){ return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-10% 0px -80% 0px' });
    secs.forEach(function(s){ io.observe(s); });
  }

  // theme
  var tt = document.getElementById('tt');
  var saved = null;
  try { saved = localStorage.getItem('nk-guide-theme'); } catch(e){}
  if(saved) document.documentElement.setAttribute('data-theme', saved);
  tt.addEventListener('click', function(){
    var cur = document.documentElement.getAttribute('data-theme');
    var isDark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    var next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('nk-guide-theme', next); } catch(e){}
  });
})();
</script>
`;

mkdirSync(resolve(ROOT, 'guide-dist'), { recursive: true });
writeFileSync(resolve(ROOT, 'guide-dist/index.html'), html);

console.log(
  `✓ Designer guide: guide-dist/index.html (${(html.length / 1024).toFixed(0)} kB) — ` +
    `${primitives.length} primitives, ${semantics.length} semantics, ${sizes.length} sizes, ` +
    `${typography.length} type roles, ${effects.length} effects, ${responsive.length} responsive`
);
