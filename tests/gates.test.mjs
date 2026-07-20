// Regression tests for the build gates — proving each FAILS CLOSED.
//
// The gates found their own fail-open holes only via one-off manual corruption
// experiments (2026-07-17 review). This suite encodes those experiments so a
// future edit that reopens a hole is caught in CI, not in another audit.
//
// Method: snapshot a real input file, write a corrupted variant, run the gate as
// a child process, assert a NON-ZERO exit, and restore the file in `finally`
// (so a crash mid-test cannot leave the tree dirty). A final `git diff` check in
// the CI step is the backstop. Requires a completed `npm run build` first
// (check-outputs / check-exports read build/); CI runs build before this.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (p) => path.join(ROOT, p);
const node = process.execPath;

const runGate = (script, args = []) =>
  spawnSync(node, [R(script), ...args], { cwd: ROOT, encoding: 'utf8' });

// Snapshot a file, run `mutate` on its parsed-or-raw content, exercise `fn`,
// always restore. `json:true` parses/stringifies; otherwise raw string.
function withCorruption(file, mutate, fn, { json = true } = {}) {
  const abs = R(file);
  const original = fs.readFileSync(abs);
  try {
    const next = json ? JSON.stringify(mutate(JSON.parse(original.toString()))) : mutate(original.toString());
    fs.writeFileSync(abs, next);
    return fn();
  } finally {
    fs.writeFileSync(abs, original);
  }
}

before(() => {
  assert.ok(fs.existsSync(R('build/css/variables.css')), 'run `npm run build` before the gate tests (build/ is required)');
});

test('baseline: the clean tree passes every gate', () => {
  for (const g of ['scripts/lint-tokens.mjs', 'scripts/check-outputs.mjs', 'scripts/check-styles.mjs', 'scripts/check-exports.mjs']) {
    const r = runGate(g);
    assert.equal(r.status, 0, `${g} should pass on a clean tree:\n${r.stdout}${r.stderr}`);
  }
});

test('check-outputs FAILS when a required platform output is missing', () => {
  const dart = R('build/dart/nk_colors.dart');
  const saved = fs.readFileSync(dart);
  try {
    fs.rmSync(dart);
    const r = runGate('scripts/check-outputs.mjs');
    assert.notEqual(r.status, 0, 'a missing Dart output must fail check-outputs');
    assert.match(r.stderr, /missing/i);
  } finally {
    fs.writeFileSync(dart, saved);
  }
});

test('check-styles FAILS when a snapshot VALUE drifts from tokens.json', () => {
  const r = withCorruption('tokens/styles.snapshot.json', (snap) => {
    for (const t of snap.text) if (t.name === 'Body/Lg') t.fontSize = 99;
    return snap;
  }, () => runGate('scripts/check-styles.mjs'));
  assert.notEqual(r.status, 0, 'a mutated composite value must fail the styles gate');
  assert.match(r.stderr, /fontSize 99/);
});

test('lint-tokens FAILS on a 3-digit hex the Dart emitter would drop', () => {
  const r = withCorruption('tokens/tokens.json', (t) => {
    (t['Color Primitives'].TestHue ??= {})['500'] = { $type: 'color', $value: '#fff' };
    return t;
  }, () => runGate('scripts/lint-tokens.mjs'));
  assert.notEqual(r.status, 0, '3-digit hex must fail lint');
  assert.match(r.stderr, /not a hex colour/i);
});

test('lint-tokens FAILS when a capsule set overrides a Tier-1 primitive', () => {
  const r = withCorruption('tokens/tokens.json', (t) => {
    (t['Demo Team'].Violet ??= {})['500'] = { $type: 'color', $value: '#123456', $description: 'illegal override' };
    return t;
  }, () => runGate('scripts/lint-tokens.mjs'));
  assert.notEqual(r.status, 0, 'a capsule primitive override must fail lint');
  assert.match(r.stderr, /semantic surfaces/i);
});

test('check-exports FAILS when an export target is absent', () => {
  const logoDir = R('build/logo');
  const tmp = R('build/.logo.bak');
  try {
    fs.renameSync(logoDir, tmp);
    const r = runGate('scripts/check-exports.mjs');
    assert.notEqual(r.status, 0, 'a missing ./logo/* target must fail the exports gate');
    assert.match(r.stderr, /logo/);
  } finally {
    if (fs.existsSync(tmp)) fs.renameSync(tmp, logoDir);
  }
});

test('build-assets paint gate FAILS on a non-currentColor icon', () => {
  const bad = R('assets/icons/__test-bad-paint.svg');
  try {
    fs.writeFileSync(bad, '<svg viewBox="0 0 24 24"><path fill="red" d="M0 0h24v24H0z"/></svg>');
    const r = runGate('scripts/build-assets.mjs');
    assert.notEqual(r.status, 0, 'an icon with a literal paint must fail the paint gate');
    assert.match(r.stderr, /literal paint/i);
  } finally {
    fs.rmSync(bad, { force: true });
    // rebuild so a later reader of build/ sees the clean set
    runGate('scripts/build-assets.mjs');
  }
});
