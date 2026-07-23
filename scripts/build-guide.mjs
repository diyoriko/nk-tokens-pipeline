// Build the designer-facing guide (guide-dist/index.html).
//
// SCOPE — read this before adding anything. The guide answers the three questions a designer
// actually arrives with — how do I switch this on, where do I see the primitives, how do I build
// my own semantics on top of them — and only then explains the architecture that makes those
// answers make sense. It deliberately does NOT catalogue values: swatches, scales, type ramps,
// shadows and grids live in the Storybook, which is generated from the same build and shows them
// better. Every time you want to add a table of tokens here, add a link to a Storybook story.
//
// ORDER IS PART OF THE CONTENT. The practical spine (start → connect → primitives → own) comes
// FIRST; architecture follows and justifies it. Both earlier versions of this page led with
// theory, and on 2026-07-23 a designer who needed exactly these three answers could not get them
// out of it — she asked for "access to your primitives", which is not a thing that needs granting.
// That is the bug this order fixes. Do not re-bury the how-to under the explanation.
//
// What belongs here: how to enable the library, where primitives are visible and where they are
// deliberately not, the step-by-step for your own collection, how the pieces connect, how to read
// a token name, what happens when a token changes, what not to do.
//
// Counts and the legacy lookup are derived from tokens.json, the scopes snapshot and
// responsive.json, so the page cannot claim something the system does not have. The built CSS
// is only checked for existence — a precondition proving `npm run build:tokens` has run, since
// a guide generated against a stale tree would describe a system nobody is shipping.
//
// Run: node scripts/build-guide.mjs   (wired into `npm run build`)
// Output: guide-dist/index.html — deliberately NOT under build/, so it is not packed into the
// npm tarball (`files: ["build"]`) and cannot trip the output-shape gates.
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

try {
  read('build/css/variables.css');
} catch {
  console.error('✗ build/css/variables.css missing — run `npm run build:tokens` first.');
  process.exit(1);
}

// ---------------------------------------------------------------- collect
function leaves(node, path = []) {
  const out = [];
  for (const [k, v] of Object.entries(node || {})) {
    if (!v || typeof v !== 'object') continue;
    if ('$value' in v) out.push({ path: [...path, k], token: v });
    else out.push(...leaves(v, [...path, k]));
  }
  return out;
}

const primitives = leaves(tokens['Color Primitives']).map(({ path, token }) => ({
  n: path.join('/'),
  d: token.$description || '',
  hue: path[0],
}));

const semantics = [];
const seen = new Set();
for (const setName of ['Color', 'Parent Area']) {
  for (const { path, token } of leaves(tokens[setName])) {
    const n = path.join('/');
    if (seen.has(n)) continue;
    seen.add(n);
    semantics.push({ n, surface: path[0], intent: path[1], s: (scopes.Color || {})[n] || null });
  }
}

const sizes = leaves(tokens.Size).map(({ path }) => ({ group: path[0] }));
const effects = leaves(tokens.Effect).map(({ path }) => ({ group: path[0] }));
const typography = leaves(tokens.Typography).length;
const typePrims = leaves(tokens['Typography Primitives']).length;
const tiers = [...new Set(leaves(responsiveSrc).map(({ path }) => path[1]))];

const HUES = [...new Set(primitives.map((p) => p.hue))];
const BRANDS = [...new Set(semantics.filter((s) => s.intent.startsWith('Brand-')).map((s) => s.intent.slice(6)))].filter((b) =>
  HUES.includes(b)
);
const SIZE_GROUPS = [...new Set(sizes.map((s) => s.group))];
const EFFECT_GROUPS = [...new Set(effects.map((e) => e.group))];
const GRADIENTS = semantics.filter((s) => s.surface === 'Gradient').length;

// Legacy lookup — the one reference the Storybook cannot give you.
const legacy = primitives
  .map((p) => {
    const m = p.d.match(/^([=≈~])\s*(.+?)\s*\((LDS|BB)\)/);
    return m ? { old: m[2], exact: m[1] === '=', n: p.n } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.old.localeCompare(b.old));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SB = (id) => `../?path=/story/${id}`;
const stamp = new Date().toISOString().slice(0, 10);

const SECTIONS = [
  ['start', 'С чего начать'],
  ['connect', 'Подключить библиотеку'],
  ['primitives', 'Где увидеть примитивы'],
  ['own', 'Своя семантика'],
  ['flow', 'Как это устроено'],
  ['layers', 'Три слоя'],
  ['where', 'Где что лежит'],
  ['naming', 'Язык системы'],
  ['change', 'Как система меняется'],
  ['rules', 'Чего нельзя и как просить'],
  ['legacy', 'Старые имена'],
];

// ---------------------------------------------------------------- page
const html = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Novakid DS — подключить и пользоваться</title>
<meta name="description" content="Как подключить дизайн-систему Novakid в Figma, где увидеть примитивы и как собрать на них свою семантику. Плюс архитектура: слои, язык токенов и как система меняется.">
<style>
:root{--violet:#6d46fc;--ink:#170751;--body:#3b3a52;--dim:#6f6d85;--line:#e6e4f0;
 --bg:#fff;--panel:#faf9ff;--code:#f4f2fd;--tint:#f7f5ff;
 --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
 --sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
@media (prefers-color-scheme:dark){:root{--ink:#f2f0ff;--body:#c9c6dd;--dim:#8d8aa6;--line:#2a2740;--bg:#0d0b18;--panel:#141127;--code:#1b1733;--tint:#1b1733}}
:root[data-theme=dark]{--ink:#f2f0ff;--body:#c9c6dd;--dim:#8d8aa6;--line:#2a2740;--bg:#0d0b18;--panel:#141127;--code:#1b1733;--tint:#1b1733}
:root[data-theme=light]{--ink:#170751;--body:#3b3a52;--dim:#6f6d85;--line:#e6e4f0;--bg:#fff;--panel:#faf9ff;--code:#f4f2fd;--tint:#f7f5ff}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:20px}
body{margin:0;background:var(--bg);color:var(--body);font:16px/1.65 var(--sans);-webkit-font-smoothing:antialiased}
.wrap{max-width:1020px;margin:0 auto;padding:0 24px}
a{color:var(--violet)}
code{font:13px/1.5 var(--mono);background:var(--code);padding:2px 6px;border-radius:5px;color:var(--ink)}
h1,h2,h3,h4{color:var(--ink);line-height:1.22;margin:0}
h2{font-size:27px;letter-spacing:-.02em;margin:0 0 8px}
h3{font-size:18px;margin:30px 0 8px}
h4{font-size:16px;margin:0 0 6px}
p{margin:0 0 14px}ul,ol{margin:0 0 14px;padding-left:22px}li{margin:5px 0}
.lede{font-size:18px}
header.top{background:linear-gradient(150deg,#6d46fc,#420eae 55%,#2e1781);color:#fff;padding:52px 0 40px}
header.top h1{color:#fff;font-size:clamp(28px,4.2vw,42px);letter-spacing:-.03em;margin-bottom:12px}
header.top p{color:#e4dcff;max-width:60ch;font-size:17px;margin:0}
header.top a{color:#fff}
.layout{display:grid;grid-template-columns:200px 1fr;gap:44px;align-items:start;padding:38px 0 70px}
@media (max-width:880px){.layout{grid-template-columns:1fr;gap:0}nav.toc{position:static;margin-bottom:26px}}
nav.toc{position:sticky;top:18px;font-size:14px}
nav.toc ol{list-style:none;padding:0;margin:0}
nav.toc a{display:block;padding:6px 10px;border-radius:7px;color:var(--body);text-decoration:none;border-left:2px solid transparent}
nav.toc a:hover{background:var(--panel);color:var(--ink)}
nav.toc a.on{background:var(--tint);color:var(--violet);border-left-color:var(--violet);font-weight:600}
section{padding:34px 0;border-top:1px solid var(--line)}
section:first-of-type{border-top:0;padding-top:0}
.eyebrow{font:600 12px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--violet);margin-bottom:9px}
table.t{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;display:block;overflow-x:auto}
table.t th{text-align:left;font:600 12px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--dim);padding:0 14px 8px 0;border-bottom:1px solid var(--line);white-space:nowrap}
table.t td{padding:9px 14px 9px 0;border-bottom:1px solid var(--line);vertical-align:top}
table.t tr:last-child td{border-bottom:0}
.note{border-left:3px solid var(--violet);background:var(--tint);padding:14px 18px;border-radius:0 10px 10px 0;margin:18px 0}
.note.warn{border-left-color:#e8a33d;background:rgba(232,163,61,.10)}
.note p:last-child{margin-bottom:0}.note b{color:var(--ink)}
pre.flow{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px;overflow-x:auto;font:13px/1.6 var(--mono);color:var(--ink);margin:18px 0}
.anat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px;margin:18px 0;overflow-x:auto}
.anat .line{font:600 clamp(14px,2.3vw,20px)/1.5 var(--mono);color:var(--ink);white-space:nowrap}
.anat i{font-style:normal;padding:2px 6px;border-radius:5px}
.s1{background:rgba(109,70,252,.16);color:var(--violet)}
.s2{background:rgba(10,88,234,.15);color:#0a58ea}
.s3{background:rgba(10,124,66,.15);color:#0a7c42}
.anat dl{display:grid;grid-template-columns:auto 1fr;gap:7px 14px;margin:16px 0 0;font-size:14px}
.anat dt{font:600 13px/1.6 var(--mono)}.anat dd{margin:0}
.dd2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}
@media (max-width:700px){.dd2{grid-template-columns:1fr}}
.dd{border-radius:12px;padding:16px 18px;border:1px solid var(--line)}
.dd.y{background:rgba(10,124,66,.07);border-color:rgba(10,124,66,.28)}
.dd.n{background:rgba(179,38,30,.07);border-color:rgba(179,38,30,.28)}
.dd b{display:block;margin-bottom:8px;color:var(--ink)}
.dd ul{margin:0;padding-left:19px}.dd li{margin:5px 0;font-size:14px}
.path{border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:12px;background:var(--panel)}
.path p:last-child{margin-bottom:0}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin:20px 0}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px;display:flex;flex-direction:column}
.card b{color:var(--ink);display:block;margin-bottom:6px;font-size:15px}
.card span{font-size:14px;color:var(--dim);flex:1}
.card a{font-size:14px;margin-top:10px}
ol.steps{counter-reset:st;list-style:none;padding:0;margin:18px 0}
ol.steps>li{counter-increment:st;position:relative;padding:0 0 16px 40px;margin:0;border-left:1px solid var(--line);margin-left:13px}
ol.steps>li:last-child{border-left-color:transparent;padding-bottom:0}
ol.steps>li::before{content:counter(st);position:absolute;left:-13px;top:-2px;width:26px;height:26px;border-radius:50%;
 background:var(--violet);color:#fff;font:600 13px/26px var(--mono);text-align:center}
ol.steps>li b{color:var(--ink)}
ol.steps>li p{margin:4px 0 0;font-size:14px}
ol.steps ul{margin:6px 0 0;font-size:14px}
.tag{display:inline-block;font:600 11px/1 var(--mono);letter-spacing:.05em;text-transform:uppercase;padding:4px 8px;border-radius:999px;background:var(--tint);color:var(--violet);margin-bottom:8px}
#lq{width:100%;padding:11px 14px;font:15px/1.4 var(--sans);border:1px solid var(--line);border-radius:9px;background:var(--panel);color:var(--ink)}
#lq:focus{outline:2px solid var(--violet);outline-offset:1px}
#lres{margin-top:12px;font-size:14px}
#lres .r{display:grid;grid-template-columns:minmax(130px,1fr) 26px minmax(130px,1fr);gap:10px;padding:7px 0;border-bottom:1px solid var(--line);align-items:baseline}
#lres .o{font-weight:600;color:var(--ink)}#lres .a{color:var(--dim);text-align:center}
#lres .t{font:13px/1.5 var(--mono);color:var(--violet)}
footer{border-top:1px solid var(--line);padding:26px 0 56px;font-size:14px;color:var(--dim)}
.tt{position:fixed;right:16px;bottom:16px;width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer;font-size:16px}
</style>

<header class="top"><div class="wrap">
  <h1>Дизайн-система Novakid: как подключить и как ей пользоваться</h1>
  <p>Сначала три шага: подключить, найти примитивы, собрать свою семантику. Потом — как система
     устроена. Значения — свотчи, шкалы, тени, сетки — в <a href="../">Storybook</a>.</p>
</div></header>

<div class="wrap layout">
<nav class="toc"><ol>
${SECTIONS.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('\n')}
</ol></nav>
<main>

<section id="start">
  <div class="eyebrow">Коротко</div>
  <h2>С чего начать</h2>
  <table class="t">
    <thead><tr><th>Вопрос</th><th>Ответ в одну строку</th><th></th></tr></thead>
    <tbody>
      <tr><td>Как подключить?</td>
          <td>Assets → Libraries → <b>Novakid DS Foundations</b> → Enable. В каждом файле отдельно.</td>
          <td><a href="#connect">шаг 1</a></td></tr>
      <tr><td>Где примитивы?</td>
          <td>В пикере на слое их нет намеренно. Они в пикере алиасов — доступ уже есть.</td>
          <td><a href="#primitives">шаг 2</a></td></tr>
      <tr><td>Можно свою семантику?</td>
          <td>Да, спрашивать не нужно. Своя коллекция с алиасами на примитивы, полчаса.</td>
          <td><a href="#own">шаг 3</a></td></tr>
    </tbody>
  </table>
</section>

<section id="connect">
  <div class="eyebrow">Шаг 1</div>
  <h2>Подключить библиотеку</h2>
  <ol class="steps">
    <li><b>Открой свой файл</b> — библиотека включается пофайлово, не на аккаунт.</li>
    <li><b>Assets → иконка книжки (Libraries)</b></li>
    <li><b>Novakid DS Foundations → Enable</b></li>
    <li><b>Проверь:</b> фрейм → Fill → иконка переменных →
        <code>Background</code> <code>Text</code> <code>Icon</code> <code>Border</code></li>
  </ol>
  <p>Вместе с переменными приедут текстовые стили, тени, градиенты, сетки и иконки.</p>
  <table class="t">
    <thead><tr><th>Симптом</th><th>Что это</th><th>Что делать</th></tr></thead>
    <tbody>
      <tr><td>Библиотеки нет в списке</td><td>нет доступа к проекту</td><td>написать владельцу системы</td></tr>
      <tr><td>Токенов меньше, чем ждал</td><td>скоупы: <code>Text/*</code> только в тексте, <code>Border/*</code> только в обводке</td><td>выделить слой нужного типа</td></tr>
      <tr><td>Пикер пустой совсем</td><td>библиотека не включена в этом файле</td><td>вернуться к шагу 3</td></tr>
      <tr><td>Предложили Library Update</td><td>система сдвинула значение</td><td>принимать — иначе макеты разъедутся с продом</td></tr>
    </tbody>
  </table>
</section>

<section id="primitives">
  <div class="eyebrow">Шаг 2</div>
  <h2>Где увидеть примитивы</h2>
  <p class="lede">${primitives.length} шагов ${HUES.length} рамп. В пикере цвета на слое их нет —
     у них пустые скоупы, это закон системы. Доступ тут ни при чём: он уже есть.</p>
  <table class="t">
    <thead><tr><th>Что нужно</th><th>Где</th><th>Требуется</th></tr></thead>
    <tbody>
      <tr><td>Посмотреть рампы и значения</td>
          <td><a href="${SB('tokens-colors--primitives')}">Storybook → Tokens → Colors</a></td>
          <td>ничего</td></tr>
      <tr><td>Полистать коллекцию в Figma</td>
          <td>файл DS Foundations → <b>Variables</b> → <code>Color Primitives</code></td>
          <td>доступ к файлу</td></tr>
      <tr><td><b>Взять примитив в свою переменную</b></td>
          <td>свой файл → <b>Variables</b> → своя переменная → значение → <b>алиас</b> →
              <b>Libraries</b> → <code>Color Primitives</code></td>
          <td>включённая библиотека</td></tr>
    </tbody>
  </table>
  <div class="note">
    <p>Третья строка — обычно искомая. В пикере алиасов библиотека отдаёт все
    ${primitives.length} примитивов: скоупы прячут их только на канвасе. Панель Variables при этом
    показывает лишь <b>твои</b> коллекции — библиотечные там не листаются, так устроена Figma.</p>
  </div>
  <p>Примитив на слое означает, что не хватает семантического токена —
     <a href="#rules">повод попросить его добавить</a>, а не обойти.</p>
</section>

<section id="own">
  <div class="eyebrow">Шаг 3</div>
  <h2>Своя семантика</h2>
  <p class="lede">Законный сценарий, разрешения не нужно. Сначала проверь два более дешёвых
     варианта — половина запросов закрывается ими.</p>
  <table class="t">
    <thead><tr><th>Если задача</th><th>Ответ</th><th>Цена</th></tr></thead>
    <tbody>
      <tr><td>«нужен другой акцентный цвет»</td>
          <td>взять готовое семейство: ${esc(BRANDS.join(', '))}</td><td>ноль</td></tr>
      <tr><td>«не хватает одной роли»</td>
          <td><a href="#rules">попросить токен</a> — приедет всем</td><td>запрос</td></tr>
      <tr><td>«у поверхности свои роли, нужны в Figma»</td>
          <td>своя коллекция — рецепт ниже</td><td>полчаса</td></tr>
      <tr><td>«свои роли, и фронт должен получить их из пакета»</td>
          <td><a href="#capsule">капсула</a></td><td>согласование</td></tr>
    </tbody>
  </table>

  <h3>Рецепт: своя коллекция</h3>
  <ol class="steps">
    <li><b>Включи библиотеку</b> — без неё в алиасах пусто (<a href="#connect">шаг 1</a>).</li>
    <li><b>Variables → + → New collection</b>, назови по поверхности, не «Colors».</li>
    <li><b>Выпиши роли до создания переменных.</b> Минимум:
        <code>Background/Primary</code> <code>Background/Secondary</code> <code>Text/Primary</code>
        <code>Text/Secondary</code> <code>Text/On-Primary</code> <code>Icon/Primary</code>
        <code>Border/Default</code>
        <p>По роли, не по цвету: <code>Background/Primary</code>, не <code>Background/Violet</code>.</p></li>
    <li><b>Значение = алиас примитива, не хекс.</b> Значение → алиас → Libraries →
        <code>Color Primitives</code>.</li>
    <li><b>Сузь скоупы</b> — по умолчанию стоит <code>All scopes</code>:
        <code>Background</code> → Frame fill · <code>Text</code> → Text fill ·
        <code>Icon</code> → Shape fill · <code>Border</code> → Stroke</li>
    <li><b>Состояния — альфой:</b> <code>Alpha/Black/100</code> на светлом,
        <code>Alpha/White/100</code> на тёмном. Не новым цветом.</li>
    <li><b>Проверь контраст сам</b> — автоматика твою коллекцию не видит. 4.5:1 текст, 3.0:1 крупный
        текст, иконки и обводки.</li>
    <li><b>Publish</b>, если коллекцией будут пользоваться вне этого файла.</li>
  </ol>
  <div class="dd2">
    <div class="dd n"><b>Слой сгниёт, если</b><ul>
      <li>хекс вместо алиаса — обновления не доедут</li>
      <li>остался <code>All scopes</code> — пикеры превратятся в свалку</li>
      <li>не принимать Library Update — разъедется с системой</li>
    </ul></div>
    <div class="dd y"><b>Слой доживёт, если</b><ul>
      <li>каждое значение — алиас</li>
      <li>скоуп сужен по поверхности</li>
      <li>имена на языке системы (<a href="#naming">какой он</a>)</li>
    </ul></div>
  </div>

  <h3 id="capsule">Капсула — когда своей коллекции мало</h3>
  <p>Нужна, только если <b>фронтенд поверхности должен получить токены из npm-пакета</b>.
     Это режим на коллекции <code>Color</code>: перепривязывает ~25 токенов (бренд-цвет, ссылки,
     выделение), остальное общее. Заводит владелец системы. Пример —
     <a href="${SB('tokens-capsules--team-capsules')}">Tokens → Capsules</a>.</p>
  <table class="t">
    <thead><tr><th></th><th>Своя коллекция</th><th>Капсула</th></tr></thead>
    <tbody>
      <tr><td>Живёт</td><td>твой файл</td><td>общий foundation</td></tr>
      <tr><td>Владеет</td><td>ты</td><td>DS вместе с тобой</td></tr>
      <tr><td>Едет в код</td><td>нет</td><td>да</td></tr>
      <tr><td>Контраст проверяет CI</td><td>нет</td><td>да</td></tr>
      <tr><td>Тратит лимит режимов Figma</td><td>нет</td><td>да</td></tr>
      <tr><td>Запуск</td><td>полчаса</td><td>согласование</td></tr>
    </tbody>
  </table>
  <div class="note warn">
    <p>Режимов на коллекцию Figma даёт ограниченное число, два уже заняты. «Капсула на команду»
    упирается в потолок быстрее, чем кажется — сначала проверь, хватает ли своей коллекции.</p>
  </div>
</section>

<section id="flow">
  <div class="eyebrow">Архитектура</div>
  <h2>Как это устроено</h2>
  <p class="lede">Главное, что стоит понять: <b>Figma и код — не две системы, а одна.</b>
     У них общий источник, и он не в Figma.</p>
  <pre class="flow">   Figma «Novakid DS Foundations»       &lt;- здесь дизайнер видит и применяет
            ↕  Tokens Studio               &lt;- плагин, двусторонний мост
   tokens.json  в git-репозитории         &lt;- ИСТОЧНИК ИСТИНЫ
            ↓  сборка + автопроверки
   npm-пакет                              &lt;- CSS-переменные, TS, Dart, иконки
            ↓
   продукты: веб, мобилка, лендинги</pre>
  <p>Отсюда следуют три вещи, которые объясняют почти все остальные правила:</p>
  <ul>
    <li><b>Правка токена — это изменение в коде.</b> Она едет через git и проходит проверки,
        а не «поменял в Figma и всё».</li>
    <li><b>Значения нельзя править прямо в Figma</b> — следующая синхронизация их перезапишет.
        Только через Tokens Studio.</li>
    <li><b>Одно изменение приезжает всем сразу</b> — и в макеты, и в вёрстку. Поэтому чинить
        надо в системе, а не у себя.</li>
  </ul>
</section>

<section id="layers">
  <div class="eyebrow">Архитектура</div>
  <h2>Три слоя</h2>
  <p>Слой определяет, чем можно пользоваться, а чем нет.</p>
  <table class="t">
    <thead><tr><th>Слой</th><th>Что это</th><th>Сколько</th><th>Брать в макет?</th></tr></thead>
    <tbody>
      <tr><td><b>Примитивы</b></td><td>Сырые шкалы: ${HUES.length} цветовых рамп, кегли, веса, интерлиньяж</td>
          <td>${primitives.length} цвета + ${typePrims} типографики</td><td><b>Нет.</b> Скрыты намеренно</td></tr>
      <tr><td><b>Семантика</b></td><td>Роли: чем красить фон, текст, иконку, обводку</td>
          <td>${semantics.length} цвета, ${sizes.length} размеров, ${effects.length} эффектов, ${typography} ролей текста</td>
          <td><b>Да.</b> Это рабочий слой</td></tr>
      <tr><td><b>Компоненты</b></td><td>Кнопки, поля, карточки</td><td>—</td><td>Пока нет, отдельный этап</td></tr>
    </tbody>
  </table>
  <p>Примитивы спрятаны намеренно: покрасил фрейм в <code>Violet/500</code> — и смена бренда стала
     ручным обходом макетов. Семантика меняет цвет в одном месте. Отсюда пустые скоупы у всех
     ${primitives.length} примитивов, и это <a href="#primitives">не мешает алиасить их</a>.</p>
</section>

<section id="where">
  <div class="eyebrow">Навигация</div>
  <h2>Где что лежит</h2>
  <p>Всё в файле <b>Novakid DS Foundations</b>. Переменная умеет режимы и алиасы, стиль — нет;
     отсюда деление.</p>
  <table class="t">
    <thead><tr><th>Коллекция переменных</th><th>Что внутри</th><th>Значения смотреть</th></tr></thead>
    <tbody>
      <tr><td><code>Color</code></td><td>Семантика цвета</td><td><a href="${SB('tokens-colors--semantic')}">Tokens → Colors</a></td></tr>
      <tr><td><code>Color Primitives</code></td><td>Рампы, скрыты из пикеров</td><td><a href="${SB('tokens-colors--primitives')}">Tokens → Colors</a></td></tr>
      <tr><td><code>Size</code></td><td>${esc(SIZE_GROUPS.join(', '))}</td><td><a href="${SB('tokens-sizing--space')}">Tokens → Sizing</a></td></tr>
      <tr><td><code>Typography Primitives</code></td><td>Кегль, вес, интерлиньяж, трекинг</td><td><a href="${SB('tokens-typography--primitives')}">Tokens → Typography</a></td></tr>
      <tr><td><code>Effect</code></td><td>${esc(EFFECT_GROUPS.join(', '))}</td><td><a href="${SB('tokens-effects--opacity')}">Tokens → Effects</a></td></tr>
      <tr><td><code>Responsive</code></td><td>Брейкпоинты и параметры сетки</td><td><a href="${SB('tokens-grid--responsive')}">Tokens → Grid</a></td></tr>
    </tbody>
  </table>
  <table class="t">
    <thead><tr><th>Живёт стилем, не переменной</th><th>Тип</th><th>Смотреть</th></tr></thead>
    <tbody>
      <tr><td>Градиенты (${GRADIENTS})</td><td>Paint styles</td><td><a href="${SB('tokens-brand--gradients')}">Tokens → Brand</a></td></tr>
      <tr><td>Тени и стекло</td><td>Effect styles</td><td><a href="${SB('tokens-shadow--drop-shadow')}">Tokens → Shadow</a></td></tr>
      <tr><td>Текстовые роли (${typography})</td><td>Text styles</td><td><a href="${SB('tokens-typography--semantic')}">Tokens → Typography</a></td></tr>
      <tr><td>Сетки (${tiers.length} тира + baseline)</td><td>Grid styles</td><td><a href="${SB('tokens-grid--layout-model')}">Tokens → Grid</a></td></tr>
      <tr><td>Иконки (160)</td><td>Компоненты</td><td><a href="${SB('assets-icons--library')}">Assets → Icons</a></td></tr>
    </tbody>
  </table>
</section>

<section id="naming">
  <div class="eyebrow">Язык</div>
  <h2>Язык системы</h2>
  <p>Имя токена — адрес, а не подпись. Разобрался один раз — дальше угадываешь, не листая список.</p>
  <div class="anat">
    <div class="line"><i class="s1">Background</i> / <i class="s2">Brand-Violet</i> / <i class="s3">Primary</i></div>
    <dl>
      <dt class="s1">Поверхность</dt><dd>что красим: <code>Background</code> <code>Text</code>
        <code>Icon</code> <code>Border</code> — каждая видна только в своём пикере</dd>
      <dt class="s2">Назначение</dt><dd>бренд, статус, нейтраль. Плюс служебные:
        <code>Alpha</code> <code>Data-Viz</code> <code>Social</code> <code>Gradient</code></dd>
      <dt class="s3">Вариант</dt><dd><code>Primary</code> → <code>Secondary</code> →
        <code>Tertiary</code> от заметного к тихому · <code>Strong</code> усиленный ·
        <code>*-Hover</code> наведение · <code>*-Inverse</code> на тёмном</dd>
    </dl>
  </div>
  <h3>Правило пары</h3>
  <p><code>On-*</code> — контент поверх одноимённого фона. Берётся всегда в паре:</p>
  <div class="dd2">
    <div class="dd y"><b>Так</b><ul>
      <li>фон <code>Background/Brand-Violet/Primary</code></li>
      <li>текст <code>Text/Brand-Violet/On-Primary</code></li>
      <li>иконка <code>Icon/Brand-Violet/On-Primary</code></li>
    </ul></div>
    <div class="dd n"><b>Не так</b><ul>
      <li>тот же фон</li>
      <li>текст <code>Text/Default/Primary</code> — «вроде читается»</li>
      <li>контраст не проверен, поедет при смене бренда</li>
    </ul></div>
  </div>
  <div class="note warn">
    <p>Проверены <b>пары <code>On-*</code></b>, список из 100 сочетаний — не все. Ставишь текст
    на поверхность, не названную в его имени, — проверь сам. Известное: фокус
    <code>Border/Focus/Default</code> на <code>Background/Base/Inverse</code> даёт 2.26:1 при норме
    3.0 — на тёмной секции проверь, виден ли фокус с клавиатуры.</p>
  </div>
</section>

<section id="change">
  <div class="eyebrow">Коллаборация</div>
  <h2>Как система меняется</h2>
  <pre class="flow">1. правка в Tokens Studio     дизайнер
2. Push -> открывается PR      автоматически
3. проверки                    линт · контраст · скоупы · стили · форма вывода
4. ревью и мерж                владелец системы
5. релиз пакета                версия уезжает в продукты</pre>
  <p>Шаг 3 — то, чем система отличается от папки со свотчами: сломан контраст пары, ссылка на
     несуществующий токен или форма вывода — сборка падает, правка не доезжает.</p>
  <p><b>Проверки не ловят:</b> сочетания вне списка пар (включая твои из своей коллекции) ·
     уместность решения · то, что живёт только в Figma — скоупы сверяются вручную.</p>
</section>

<section id="rules">
  <div class="eyebrow">Правила</div>
  <h2>Чего нельзя и как просить</h2>
  <div class="dd2">
    <div class="dd n"><b>Никогда</b><ul>
      <li>вбивать hex руками, даже временно</li>
      <li>отвязывать (detach) переменную, чтобы «чуть подправить»</li>
      <li>копировать примитивы или семантику к себе — ссылайся алиасом</li>
      <li>править значения и описания переменных прямо в Figma</li>
      <li>подбирать hover, disabled и прозрачность на глаз</li>
    </ul></div>
    <div class="dd y"><b>Вместо этого</b><ul>
      <li>искать подходящую роль — их ${semantics.length}</li>
      <li>не нашлось — просить добавить, это нормальный ход</li>
      <li>нужен другой акцент — взять одно из ${BRANDS.length} брендовых семейств</li>
      <li>нужен свой слой — <a href="#own">своя коллекция или капсула</a></li>
      <li>менять токены через Tokens Studio</li>
    </ul></div>
  </div>
  <h3>Как просить новый токен</h3>
  <p>Опиши <b>задачу</b>, а не решение. Не «добавь <code>#F0EAFF</code>», а «нужен фон для подсветки
     выбранной строки в таблице». Половина запросов закрывается токеном, который не нашёлся.</p>
  <p><b>Приложи:</b> ссылку на макет · что красим · на чём лежит · есть ли состояния · разовое
     или паттерн.</p>
</section>

<section id="legacy">
  <div class="eyebrow">Миграция</div>
  <h2>Старые имена</h2>
  <p>Во что превратился цвет из старой лендинговой системы. Заполнено для ${legacy.length} цветов.</p>
  <input id="lq" type="search" placeholder="Daisy Bush, Heliotrope, Melrose…" autocomplete="off" aria-label="Поиск по старому имени">
  <div id="lres"></div>
  <div class="note warn">
    <p><code>=</code> точное совпадение · <code>≈</code> похожий, <b>не тот же</b> — расхождение
    бывает заметным глазу, не сверяй по нему макеты один в один.</p>
  </div>
</section>

</main></div>

<footer><div class="wrap">
  <p>Собрано из токенов версии <b>${esc(pkg.version)}</b>, ${stamp}. Значения — в
     <a href="../">Storybook</a>. Вопросы и запросы на токены — владельцу дизайн-системы.</p>
</div></footer>
<button class="tt" id="tt" title="Светлая / тёмная тема" aria-label="Переключить тему">◐</button>

<script id="legacy-data" type="application/json">${JSON.stringify(legacy).replace(/</g, '\\u003c')}</script>
<script>
(function(){
  var L = JSON.parse(document.getElementById('legacy-data').textContent);
  var q = document.getElementById('lq'), out = document.getElementById('lres');
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function render(){
    var t = q.value.trim().toLowerCase(), rows = [], n = 0;
    for (var i=0;i<L.length;i++){
      var x = L[i];
      if (t && (x.old + ' ' + x.n).toLowerCase().indexOf(t) < 0) continue;
      n++; if (n > 60) continue;
      rows.push('<div class="r"><span class="o">' + esc(x.old) + '</span><span class="a">' +
        (x.exact ? '=' : '≈') + '</span><span class="t">' + esc(x.n) + '</span></div>');
    }
    out.innerHTML = rows.length ? rows.join('') : '<p style="color:var(--dim)">ничего не нашлось</p>';
  }
  q.addEventListener('input', render); render();
  var links = [].slice.call(document.querySelectorAll('nav.toc a'));
  var secs = links.map(function(a){ return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(!e.isIntersecting) return;
        links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-10% 0px -80% 0px' });
    secs.forEach(function(s){ io.observe(s); });
  }
  var tt = document.getElementById('tt'), saved = null;
  try { saved = localStorage.getItem('nk-guide-theme'); } catch(e){}
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  tt.addEventListener('click', function(){
    var cur = document.documentElement.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('nk-guide-theme', next); } catch(e){}
  });
})();
</script>
`;

mkdirSync(resolve(ROOT, 'guide-dist'), { recursive: true });
writeFileSync(resolve(ROOT, 'guide-dist/index.html'), html);

console.log(
  `✓ Designer guide: guide-dist/index.html (${(html.length / 1024).toFixed(0)} kB, ${SECTIONS.length} sections, ` +
    `${legacy.length} legacy names) — how-to first, then architecture; values live in the Storybook.`
);
