// Exports-contract gate. check-outputs asserts the token build emitted its
// required file set; this one asserts the PACKAGE contract: every subpath in
// package.json "exports" must resolve to a real, non-empty file after a full
// `npm run build` — so a config regression can never publish a package whose
// exports point at nothing (consumers would hit ERR_MODULE_NOT_FOUND at
// resolve time, long after CI went green). Runs LAST in `npm run build`
// (after build:assets — icon/logo/pattern targets don't exist before it).
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const violations = [];
let checked = 0;

// Expand one exports target. Strings and condition objects both end up here;
// './package.json' is the package itself, always present.
const targetsOf = (v) => (typeof v === 'string' ? [v] : Object.values(v ?? {}).flatMap(targetsOf));

for (const [sub, val] of Object.entries(pkg.exports ?? {})) {
  for (const target of targetsOf(val)) {
    checked++;
    if (target.includes('*')) {
      // Pattern subpath: the directory must exist and contain at least one
      // file the pattern can match (an empty dir = every consumer import 404s).
      const dir = path.join(root, path.dirname(target));
      const suffix = path.basename(target).split('*')[1] ?? '';
      const hits = fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((f) => f.endsWith(suffix) && f !== 'manifest.json')
        : [];
      if (!hits.length) violations.push(`${sub} → ${target}: no files match the pattern`);
    } else {
      const fp = path.join(root, target);
      if (!fs.existsSync(fp)) violations.push(`${sub} → ${target}: file missing`);
      else if (!fs.statSync(fp).size) violations.push(`${sub} → ${target}: file is empty`);
    }
  }
}

// The icon surfaces must not be structurally-valid-but-hollow: an empty
// assets/icons would still emit index.js/react.js, just with zero icons.
const iconsIndex = path.join(root, 'build/icons/index.js');
if (fs.existsSync(iconsIndex)) {
  const m = fs.readFileSync(iconsIndex, 'utf8').match(/export const iconNames = (\[[^\]]*\])/);
  const names = m ? JSON.parse(m[1]) : [];
  if (!names.length) violations.push('build/icons/index.js: iconNames is empty — assets/icons produced zero icons');
  const react = fs.readFileSync(path.join(root, 'build/icons/react.js'), 'utf8');
  const compCount = (react.match(/export const /g) ?? []).length;
  if (compCount !== names.length) violations.push(`build/icons/react.js: ${compCount} components ≠ ${names.length} icons in the manifest`);
}

if (violations.length) {
  console.error(`✗ Exports contract: ${violations.length} violation(s):`);
  violations.forEach((v) => console.error('  ✗ ' + v));
  process.exit(1);
}
console.log(`✓ Exports contract: ${checked} export targets resolve to real non-empty files; icon index/react in sync.`);
