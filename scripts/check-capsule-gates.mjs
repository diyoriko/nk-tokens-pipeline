// Per-capsule gate runner — runs the contrast contract against each capsule's
// resolved palette (build/capsules/<slug>/css/variables.css), so a capsule
// override that breaks an on-*/text/border pair fails the build. Runs LAST in
// build:tokens, after the whole-file lint/contrast/scopes, so a capsule failure
// never masks a default regression.
//
// Tier 2 of the gates. Tier 1 (lint-tokens, check-contrast no-arg, check-scopes)
// is unchanged and runs first.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { CAPSULES } from '../capsules/capsules.config.mjs';

let fails = 0;
for (const cap of CAPSULES) {
  const css = `build/capsules/${cap.slug}/css/variables.css`;
  if (!fs.existsSync(css)) {
    console.error(`  ✗ capsule ${cap.slug}: ${css} missing — run build first`);
    fails++;
    continue;
  }
  try {
    execFileSync('node', ['scripts/check-contrast.mjs', css], { stdio: ['ignore', 'ignore', 'inherit'] });
    console.log(`  ✓ capsule ${cap.slug}: contrast contract passes`);
  } catch {
    console.error(`  ✗ capsule ${cap.slug}: contrast contract FAILED (${css})`);
    fails++;
  }
}

if (fails) {
  console.error(`\n✗ Capsule gates: ${fails} capsule(s) failed.`);
  process.exit(1);
}
console.log(`✓ Capsule gates: all ${CAPSULES.length} capsule(s) pass the contrast contract.`);
