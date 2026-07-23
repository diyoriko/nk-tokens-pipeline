// Version-bump gate for pull requests into the release branch.
//
// WHY. On the corporate rails the Jenkins job
// (novakid-devops: devops/jenkins/pipelines/frontend/Jenkinsfile_FrontendNPMLibPublish,
// wired in devops/jenkins/dsl/MultiBranchDSL with `gitBranches: 'master'`) publishes on
// EVERY push to master and contains no version check of its own. So a merge that forgets
// the bump either overwrites an already-shipped version — a consumer with a pinned
// lockfile silently gets different bytes — or reddens the pipeline, depending on the
// Nexus deployment policy. Neither is acceptable, and neither is visible at merge time.
//
// Every @novakid library bumps by hand (their `bump` / `bump:minor` / `bump:major`
// scripts). This gate turns that convention into something enforced: a PR into the
// release branch must carry a version that is strictly greater than the one already
// there. That is the whole guarantee — no promote ritual, no second long-lived branch.
//
// Usage:  node scripts/check-version-bump.mjs <base-ref>
//   e.g.  node scripts/check-version-bump.mjs origin/master
// Exits 0 when the version is strictly greater, 1 otherwise.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseRef = process.argv[2];

if (!baseRef) {
  console.error('✗ usage: node scripts/check-version-bump.mjs <base-ref>   (e.g. origin/master)');
  process.exit(1);
}

const current = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).version;

let base;
try {
  const raw = execFileSync('git', ['show', `${baseRef}:package.json`], { cwd: ROOT, encoding: 'utf8' });
  base = JSON.parse(raw).version;
} catch {
  // A brand-new release line has no package.json yet — nothing to compare against, and
  // failing here would block the very first push. Pass, loudly.
  console.log(`✓ Version bump: no package.json on ${baseRef} yet — first publish, nothing to compare.`);
  process.exit(0);
}

// Compare release cores numerically; a prerelease (1.2.0-rc.1) sorts before its release.
const parse = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(String(v).trim());
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ?? null };
};

const a = parse(current);
const b = parse(base);

if (!a) {
  console.error(`✗ Version bump: "${current}" in package.json is not a valid semver x.y.z[-pre].`);
  process.exit(1);
}
if (!b) {
  console.error(`✗ Version bump: "${base}" on ${baseRef} is not a valid semver — cannot compare.`);
  process.exit(1);
}

const cmp = (x, y) => {
  for (const k of ['major', 'minor', 'patch']) if (x[k] !== y[k]) return x[k] - y[k];
  if (x.pre === y.pre) return 0;
  if (x.pre === null) return 1; // release > prerelease of the same core
  if (y.pre === null) return -1;
  return x.pre < y.pre ? -1 : 1;
};

const delta = cmp(a, b);

if (delta > 0) {
  console.log(`✓ Version bump: ${base} → ${current}.`);
  process.exit(0);
}

if (delta === 0) {
  console.error(
    `✗ Version bump: package.json is still ${current}, same as ${baseRef}.\n\n` +
      `  Merging this would republish an existing version. Bump it in THIS pull request:\n` +
      `    npm version patch --no-commit-hooks   # a fix to an emitted value or the packaging\n` +
      `    npm version minor --no-commit-hooks   # new tokens, or a changed token value\n` +
      `    npm version major --no-commit-hooks   # a renamed or removed token, a changed \$type\n\n` +
      `  See CHANGELOG.md for what counts as which — a token is API, and a value change is\n` +
      `  a minor because consumers must be able to opt in through their lockfile.\n`
  );
  process.exit(1);
}

console.error(
  `✗ Version bump: package.json is ${current}, which is LOWER than ${base} on ${baseRef}.\n` +
    `  This looks like a bad merge or a revert of a release commit. Versions only go up.\n`
);
process.exit(1);
