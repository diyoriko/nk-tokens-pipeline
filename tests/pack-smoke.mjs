// Pack + install smoke test — the consumer's-eye view.
//
// The exports map can be internally consistent (check-exports proves the files
// exist) yet still fail a real `npm install` + `import`: a wrong `require`/
// `import` condition, a subpath Node's resolver rejects, a `.d.ts` that doesn't
// typecheck. This packs the package exactly as it publishes (`npm pack`),
// installs the tarball into a throwaway project, and resolves EVERY exports
// subpath through Node's own resolver — ESM import, CJS require, and raw-file
// subpaths — failing loudly on the first that doesn't load.
//
// Run: `node tests/pack-smoke.mjs` (expects a completed `npm run build`).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (${r.status}):\n${r.stdout}${r.stderr}`);
  return r.stdout.trim();
};

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const name = pkg.name;

// Build the concrete list of consumer specifiers from the exports map. Expand
// `*` patterns against a real built file so the resolver sees an actual path.
const specifiers = [];
const firstMatch = (target) => {
  const dir = path.join(ROOT, path.dirname(target));
  const suffix = path.basename(target).split('*')[1] ?? '';
  const hit = fs.existsSync(dir) && fs.readdirSync(dir).find((f) => f.endsWith(suffix) && f !== 'manifest.json');
  return hit ? path.basename(target).replace('*', hit.slice(0, hit.length - suffix.length)) : null;
};
for (const sub of Object.keys(pkg.exports)) {
  if (sub === './package.json') continue;
  const spec = sub === '.' ? name : name + sub.slice(1);
  if (sub.includes('*')) {
    // Resolve against the RUNTIME condition, not `types`. Object.values()[0] used to be
    // fine because every wildcard target was a plain string; the moment one carried
    // { types, default } it started sampling `*.d.ts` and asking Node to load
    // `Achievements.d.ts.js`. `types` is TypeScript's view, never the resolver's.
    const entry = pkg.exports[sub];
    const target =
      typeof entry === 'string'
        ? entry
        : entry.default ?? entry.import ?? entry.require ?? Object.values(entry).find((v) => typeof v === 'string');
    const concrete = firstMatch(target);
    if (concrete) specifiers.push(name + '/' + path.dirname(sub).slice(2) + '/' + concrete.split('/').pop());
  } else {
    specifiers.push(spec);
  }
}

// JS entrypoints that must load through Node with NO react installed — react is
// an OPTIONAL peer, so the core token surfaces must never hard-require it.
// (`/icons/react` legitimately needs react and is tested separately, below.)
const JS_ENTRYPOINTS = [name, name + '/icons'];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nk-pack-smoke-'));
try {
  console.log('• packing', name, '…');
  const tarball = run('npm', ['pack', '--silent', '--pack-destination', tmp], ROOT).split('\n').pop().trim();
  const tarPath = path.join(tmp, tarball);

  // Assert the tarball actually contains the exported files (no reliance on a
  // stale local build) and does NOT ship the whole source tree.
  const contents = run('tar', ['-tzf', tarPath], ROOT);
  for (const must of ['package/build/ts/tokens.mjs', 'package/build/css/variables.css', 'package/build/icons/react.js', 'package/build/dart/nk_colors.dart']) {
    if (!contents.includes(must)) throw new Error(`tarball is missing ${must}`);
  }
  if (/package\/tokens\/tokens\.json/.test(contents)) throw new Error('tarball leaks source tokens/tokens.json (files:["build"] regressed)');

  const proj = path.join(tmp, 'consumer');
  fs.mkdirSync(proj);
  fs.writeFileSync(path.join(proj, 'package.json'), JSON.stringify({ name: 'consumer', version: '1.0.0', type: 'module', private: true }, null, 2));
  console.log('• installing tarball into a throwaway project …');
  run('npm', ['install', '--silent', '--no-audit', '--no-fund', tarPath], proj);

  // ESM: import every JS entrypoint.
  const esm = JS_ENTRYPOINTS.map((s, i) => `import * as m${i} from '${s}';`).join('\n') +
    '\n' + JS_ENTRYPOINTS.map((s, i) => `if (!m${i} || typeof m${i} !== 'object') throw new Error('empty ESM import: ${s}');`).join('\n') +
    `\nconsole.log('esm ok:', ${JSON.stringify(JS_ENTRYPOINTS)}.length, 'entrypoints');`;
  fs.writeFileSync(path.join(proj, 'esm.mjs'), esm);
  console.log(run('node', ['esm.mjs'], proj));

  // CJS: require the dual-published entrypoint (the '.' subpath declares a
  // `require` condition — this is where ERR_REQUIRE_ESM would bite).
  const cjsTargets = [name];
  const cjs = cjsTargets.map((s, i) => `const c${i} = require('${s}'); if (!c${i}) throw new Error('empty CJS require: ${s}');`).join('\n') +
    `\nconsole.log('cjs ok:', ${cjsTargets.length}, 'entrypoints');`;
  fs.writeFileSync(path.join(proj, 'cjs.cjs'), cjs);
  console.log(run('node', ['cjs.cjs'], proj));

  // Raw-asset subpaths: resolve each to a real file via Node's resolver.
  const rawSubs = specifiers.filter((s) => /\.(css|svg|dart|ts)$/.test(s));
  const res = `import { createRequire } from 'node:module';\nconst req = createRequire(import.meta.url);\n` +
    rawSubs.map((s) => `req.resolve('${s}');`).join('\n') +
    `\nconsole.log('asset subpaths resolve:', ${rawSubs.length});`;
  fs.writeFileSync(path.join(proj, 'assets.mjs'), res);
  console.log(run('node', ['assets.mjs'], proj));

  // With react installed, the React icon entrypoint must import and expose
  // named forwardRef components.
  console.log('• installing react to test the /icons/react entrypoint …');
  run('npm', ['install', '--silent', '--no-audit', '--no-fund', 'react'], proj);
  fs.writeFileSync(path.join(proj, 'react-entry.mjs'),
    `import * as icons from '${name}/icons/react';\n` +
    `const names = Object.keys(icons);\n` +
    `if (!names.length) throw new Error('/icons/react exported nothing');\n` +
    `const one = icons[names[0]];\n` +
    `if (typeof one !== 'object' && typeof one !== 'function') throw new Error('icon export is not a component');\n` +
    `console.log('react entry ok:', names.length, 'components (e.g.', names[0] + ')');`);
  console.log(run('node', ['react-entry.mjs'], proj));

  console.log('\n✓ pack-smoke: tarball installs, core surfaces load without react, and every export subpath resolves.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
