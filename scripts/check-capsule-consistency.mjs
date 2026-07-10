// Capsule registry consistency — fails the build when a capsule is registered
// in one place but not the others. A capsule touches three files:
// capsules/capsules.config.mjs (the registry), tokens/tokens.json (the overlay
// Token Set + tokenSetOrder) and package.json (the ./capsules/<slug> subpaths).
// lint-tokens derives its set lists from the registry so those can't drift —
// this gate covers the rest. Static file checks only (no build output needed);
// runs right after lint in build:tokens so a half-registered team fails in
// seconds, not after a full Style Dictionary run.
import fs from 'node:fs';
import { CAPSULES } from '../capsules/capsules.config.mjs';

const tokens = JSON.parse(fs.readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const order = tokens.$metadata?.tokenSetOrder ?? [];
const themes = tokens.$themes ?? [];

let fails = 0;
const fail = (msg) => { console.error(`  ✗ ${msg}`); fails++; };

const slugs = new Set();
for (const cap of CAPSULES) {
  if (!cap.slug || !cap.name || !cap.set) fail(`registry entry ${JSON.stringify(cap)}: slug/name/set are all required`);
  if (slugs.has(cap.slug)) fail(`registry: duplicate slug "${cap.slug}"`);
  slugs.add(cap.slug);

  if (!Object.hasOwn(tokens, cap.set)) fail(`capsule ${cap.slug}: Token Set "${cap.set}" missing from tokens/tokens.json`);
  if (!order.includes(cap.set)) fail(`capsule ${cap.slug}: "${cap.set}" missing from $metadata.tokenSetOrder`);
  for (const sub of [`./capsules/${cap.slug}`, `./capsules/${cap.slug}/css/variables.css`]) {
    if (!pkg.exports?.[sub]) fail(`capsule ${cap.slug}: package.json exports lacks "${sub}"`);
  }
  // $themes only feeds the Tokens Studio theme switcher — warn, don't fail.
  if (!themes.some((t) => t.group === 'team' && t.name === cap.name)) {
    console.warn(`  ⚠ capsule ${cap.slug}: no "team" $theme named "${cap.name}" (TS switcher won't show it)`);
  }
}

// Reverse direction: an exports subpath for an unregistered capsule would ship
// a dangling entry (nothing builds build/capsules/<slug>/) and break consumers.
for (const sub of Object.keys(pkg.exports ?? {})) {
  const m = sub.match(/^\.\/capsules\/([^/]+)/);
  if (m && !slugs.has(m[1])) fail(`package.json exports "${sub}": no capsule "${m[1]}" in capsules.config.mjs`);
}

if (fails) {
  console.error(`\n✗ Capsule consistency: ${fails} problem(s). A capsule registers in capsules/capsules.config.mjs + tokens.json (set) + package.json (exports).`);
  process.exit(1);
}
console.log(`✓ Capsule consistency: ${CAPSULES.length} capsule(s) registered coherently across config / tokens.json / exports.`);
