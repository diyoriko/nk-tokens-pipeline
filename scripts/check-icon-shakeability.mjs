// Keeps the icon package tree-shakeable.
//
// The regression this exists to prevent already happened once. `build/icons/react.js` used
// to import the aggregate `icons` map and read `icons[name]` — a dynamic property access no
// bundler can split. Measured on the real tarball with esbuild and Rollup: importing SIX
// icons pulled 162.5 kB minified / 53.1 kB gzip, the entire set, while `sideEffects` in
// package.json advertised that tree-shaking worked. Nothing failed; it was found by
// measuring. After the split the same import is 5.0 kB / 2.1 kB.
//
// A bundle-size gate would need a bundler as a devDependency and would be slow. The
// structural invariant is cheaper and catches the same mistake at its source: an icon
// module must own its body as a literal and must not reach for the shared map.
//
// Run by `npm run build:assets` via build:tokens.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(ROOT, 'build/icons/react');
const BARREL = resolve(ROOT, 'build/icons/react.js');

// One icon's SVG body, plus the import line and the export. The largest today is well
// under this; the ceiling exists to catch a module that has started pulling in siblings.
const MAX_MODULE_BYTES = 12_000;

const problems = [];

let files;
try {
  files = readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== '_factory.js');
} catch {
  console.error('✗ build/icons/react/ missing — run `npm run build:assets` first.');
  process.exit(1);
}

if (files.length === 0) problems.push('build/icons/react/ contains no icon modules');

for (const f of files) {
  const src = readFileSync(join(DIR, f), 'utf8');
  const bytes = statSync(join(DIR, f)).size;

  // The failure mode, stated directly: reaching for the aggregate map re-couples every
  // icon to all the others and silently restores the 53 kB import.
  if (/from\s+'\.\.\/index\.js'|require\(['"]\.\.\/index/.test(src))
    problems.push(`${f}: imports the aggregate icons map — that is what made the barrel unshakeable`);

  if (!/from\s+'\.\/_factory\.js'/.test(src))
    problems.push(`${f}: does not import the shared factory — the a11y and escaping rules live there`);

  if (!/make\(\s*"/.test(src) && !/make\(\s*'/.test(src))
    problems.push(`${f}: does not pass its body as a literal to make()`);

  if (bytes > MAX_MODULE_BYTES)
    problems.push(`${f}: ${bytes} bytes exceeds ${MAX_MODULE_BYTES} — is it pulling in more than one icon?`);
}

// The barrel must be re-exports only. `export { X } from './react/X.js'` is shakeable;
// anything that runs at module scope, or closes over a shared value, is not.
const barrel = readFileSync(BARREL, 'utf8');
const bad = barrel
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('//') && !/^export \{ \w+ \} from '\.\/react\/\w+\.js';$/.test(l));
if (bad.length) problems.push(`icons/react.js must be re-exports only; found: ${bad.slice(0, 3).join(' | ')}`);

if (barrel.split('\n').filter((l) => l.startsWith('export {')).length !== files.length)
  problems.push(`icons/react.js re-exports do not match the ${files.length} icon modules on disk`);

if (problems.length) {
  console.error(`✗ Icon tree-shakeability: ${problems.length} problem(s):`);
  problems.forEach((p) => console.error('  ✗ ' + p));
  process.exit(1);
}

console.log(
  `✓ Icon tree-shakeability: ${files.length} standalone modules, barrel is re-exports only, no module reaches for the aggregate map.`
);
