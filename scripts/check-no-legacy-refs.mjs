// Guards the rename. A package identity leaks back one copy-paste at a time: an install
// snippet in a README, an import example in a story, a comment in a generator. The
// 2026-07-23 audit found exactly that — PR #120 had renamed the package once already and
// left `@diyoriko` behind in eight files, so the "done" rename was not done.
//
// Fails the build if a retired identity appears anywhere it would mislead a reader.
//
// Deliberately NOT scanned:
//   · CHANGELOG.md          — the history is supposed to say @diyoriko; that is the record
//   · foundations/_archive, foundations/HANDOFF-*, foundations/REVIEW-BRIEF-*
//                           — frozen, banner-stamped "do not follow their instructions"
//   · .github/              — the GitHub workflows are deleted when the move lands; a
//                             half-rewritten workflow is worse than an honest stale one
//   · reports/              — git-ignored audit output
//   · generated trees       — build/, guide-dist/, storybook-static/, node_modules/

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RETIRED = [
  { pattern: '@diyoriko', why: 'the package is @novakid/design-system' },
  { pattern: 'npm.pkg.github.com', why: 'the registry is nexus.novakidschool.com' },
  { pattern: 'diyoriko/nk-tokens-pipeline', why: 'the repository is novakidschool/novakid-design-system' },
];

// Line-level exceptions: a mention that is *about* the rename rather than instructing
// anyone to use the old identity. Each needs a reason, so the next person can tell an
// intentional note from a leftover.
const ALLOW_LINES = [
  {
    match: '**Renamed 2026-07-23.** Previously `@diyoriko/nk-tokens`',
    why: 'the README note that tells a returning reader where the package went',
  },
];

const SKIP_DIR = new Set(['node_modules', '.git', 'build', 'guide-dist', 'storybook-static', 'reports', '_archive', '_audit', '.github']);
const SKIP_FILE = new Set(['CHANGELOG.md', 'package-lock.json', 'BACKLOG.md']);
const SKIP_PREFIX = ['foundations/HANDOFF-', 'foundations/REVIEW-BRIEF-'];
const TEXT = /\.(md|mjs|js|ts|json|yml|yaml|html|css|txt|example)$|^npmrc\.example$/;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    if (SKIP_DIR.has(e)) continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const hits = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (SKIP_FILE.has(rel) || SKIP_PREFIX.some((p) => rel.startsWith(p))) continue;
  if (!TEXT.test(rel.split('/').pop())) continue;
  // This file names the retired identities on purpose.
  if (rel === 'scripts/check-no-legacy-refs.mjs') continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (ALLOW_LINES.some((a) => line.includes(a.match))) return;
    for (const { pattern, why } of RETIRED) {
      if (line.includes(pattern)) hits.push({ rel, n: i + 1, pattern, why, line: line.trim().slice(0, 110) });
    }
  });
}

if (hits.length) {
  console.error(`✗ Retired identity referenced in ${hits.length} place(s):`);
  for (const h of hits) console.error(`  ✗ ${h.rel}:${h.n}  "${h.pattern}" — ${h.why}\n      ${h.line}`);
  console.error('\n  If a mention is genuinely historical, add the file to SKIP_FILE/SKIP_PREFIX in this\n  script with a one-line reason, so the exception is reviewed rather than assumed.\n');
  process.exit(1);
}

console.log('✓ No retired identity: @diyoriko / GitHub Packages / the old repo path appear nowhere that would mislead.');
