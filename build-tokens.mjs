// Build runner for the Novakid token pipeline demo.
// Registers the two custom output formats, then builds all platforms from
// style-dictionary.config.mjs. Run via `npm run build:tokens`.
//
// Pipeline position:  tokens/tokens.json  ->  Style Dictionary  ->  build/{css,dart,ts}
// tokens.json is the file Tokens Studio pushes from Figma; this step is Phase 1
// (code side). Outputs are GENERATED, never hand-edited.

import StyleDictionary from 'style-dictionary';
import config from './style-dictionary.config.mjs';

const resolved = (t) => t.$value ?? t.value; // SD v4 puts the resolved value on $value (DTCG)
const typeOf = (t) => t.$type ?? t.type;

// ---- Flatten the domain token sets --------------------------------------
// tokens.json mirrors the Figma SDS topology: one Tokens Studio set per Figma
// Variable collection — `color-primitives`, `color`, `size`,
// `typography-primitives`, `typography`, `effect`. In-plugin, references are
// written WITHOUT the domain prefix (`{grey.800}`, `{scale.08}`) because Tokens
// Studio strips the SET NAME from the token path (just like Figma names a var
// `Grey/800` inside the `Color Primitives` collection, not `Color/Grey/800`).
//
// Style Dictionary resolves references by literal path and names CSS vars from
// that path. So before SD runs we (1) re-nest each set under its DOMAIN group,
// (2) DECOMPOSE the composite `typography`/`boxShadow` tokens into the flat
// sub-tokens the code side wants (the composites exist in source only so Tokens
// Studio can build Figma Text + Effect Styles), and (3) re-inject the domain
// prefix into every reference (`{grey.800}` -> `{color.grey.800}`). Output
// names (`--nk-color-grey-800`, `--nk-typography-title-xl-font-size`) and
// resolved values are identical to a hand-decomposed single-tree source.
const SET_DOMAIN = {
  'color-primitives': 'color',
  color: 'color',
  size: 'size',
  'typography-primitives': 'typography',
  typography: 'typography',
  effect: 'effect',
  // code-only sets (live in tokens/code-only.json, NOT synced to Figma — no motion/z-index/opacity vars there):
  motion: 'motion',
  'z-index': 'z-index',
  opacity: 'opacity',
};

const isGroup = (v) => v && typeof v === 'object' && v.$value === undefined;
const deepMerge = (a, b) => {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    out[k] = isGroup(out[k]) && isGroup(b[k]) ? deepMerge(out[k], b[k]) : b[k];
  }
  return out;
};

// Decompose composite `typography` / `boxShadow` tokens (Figma Text/Effect Style
// shapes) into flat sub-tokens SD can resolve and emit as individual CSS vars.
const px = (v) => ({ $type: 'dimension', $value: v }); // bare number/ref -> px on output
const bare = (v) => parseFloat(v); // strip any unit from a source string like "0.5px"
const decomposeComposites = (node) => {
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;
    const child = node[key];
    if (child && typeof child === 'object' && '$value' in child) {
      const v = child.$value;
      if (typeOf(child) === 'typography' && v && typeof v === 'object') {
        node[key] = {
          'font-family': { $type: 'fontFamily', $value: v.fontFamily },
          'font-weight': { $type: 'fontWeight', $value: v.fontWeight },
          'font-size': { $type: 'dimension', $value: v.fontSize },
          'line-height': { $type: 'number', $value: v.lineHeight }, // e.g. "128%" — emitted verbatim
          'letter-spacing': px(bare(v.letterSpacing ?? '0')),
        };
      } else if (typeOf(child) === 'boxShadow' && v && typeof v === 'object') {
        node[key] = {
          'offset-x': px(typeof v.x === 'string' && v.x.includes('{') ? v.x : bare(v.x)),
          'offset-y': px(typeof v.y === 'string' && v.y.includes('{') ? v.y : bare(v.y)),
          blur: px(typeof v.blur === 'string' && v.blur.includes('{') ? v.blur : bare(v.blur)),
          spread: px(typeof v.spread === 'string' && v.spread.includes('{') ? v.spread : bare(v.spread)),
          color: { $type: 'color', $value: v.color },
        };
      }
    } else {
      decomposeComposites(child);
    }
  }
};

// Re-inject the domain prefix into every `{ref}`.
const rewriteRefs = (node, rootDomain) => {
  if (!node || typeof node !== 'object') return;
  const fix = (str) =>
    String(str).replace(/\{([^}]+)\}/g, (m, ref) => {
      const dom = rootDomain[ref.split('.')[0]];
      return dom ? `{${dom}.${ref}}` : m;
    });
  if (node.$value !== undefined && typeof node.$value !== 'object') node.$value = fix(node.$value);
  for (const k of Object.keys(node)) if (!k.startsWith('$')) rewriteRefs(node[k], rootDomain);
};

StyleDictionary.registerPreprocessor({
  name: 'nk/flatten-sets',
  preprocessor: (d) => {
    const domainSets = Object.keys(d).filter((k) => !k.startsWith('$') && SET_DOMAIN[k]);
    if (domainSets.length) {
      const rootDomain = {};
      for (const s of domainSets)
        for (const rk of Object.keys(d[s])) if (!rk.startsWith('$')) rootDomain[rk] = SET_DOMAIN[s];
      const merged = {};
      for (const s of domainSets) {
        const dom = SET_DOMAIN[s];
        merged[dom] = deepMerge(merged[dom] ?? {}, d[s]);
      }
      decomposeComposites(merged);
      rewriteRefs(merged, rootDomain);
      return merged;
    }
    // legacy fallbacks (primitives/semantic split, or single 'global' set)
    return d.primitives || d.semantic ? deepMerge(d.primitives ?? {}, d.semantic ?? {}) : d.global ?? d;
  },
});

// ---- Dimensions: bare number in source -> px on output ------------------
StyleDictionary.registerTransform({
  name: 'nk/size-px',
  type: 'value',
  transitive: true,
  filter: (token) => typeOf(token) === 'dimension',
  // guard against double-px: a dimension aliasing another dimension (font-size->scale,
  // offset-y->depth) resolves to an already-suffixed value because the transform is transitive.
  transform: (token) => {
    const v = String(resolved(token));
    return v.endsWith('px') ? v : `${v}px`;
  },
});

// ---- Mobile: Flutter/Dart -----------------------------------------------
// Emits a NkColors class of `static const Color` fields. Handles opaque
// `#RRGGBB` and the alpha shadow ramp `#RRGGBBAA` (Flutter wants `0xAARRGGBB`).
const toDartHex = (value) => {
  const hex = String(value).replace('#', '').toUpperCase();
  if (hex.length === 8) return hex.slice(6, 8) + hex.slice(0, 6); // RRGGBBAA -> AARRGGBB
  return 'FF' + hex; // RRGGBB -> opaque
};
StyleDictionary.registerFormat({
  name: 'nk/dart-colors',
  format: ({ dictionary }) => {
    const colors = dictionary.allTokens.filter(
      (t) => typeOf(t) === 'color' && t.path[0] === 'color',
    );
    const fields = colors
      .map((t) => `  static const Color ${t.name} = Color(0x${toDartHex(resolved(t))});`)
      .join('\n');
    return `// GENERATED by Style Dictionary — do not edit by hand.
// Source: Novakid Foundations tokens.json (Tokens Studio -> Git).
import 'dart:ui';

class NkColors {
  NkColors._();

${fields}
}
`;
  },
});

// ---- JS/TS bundles: nested token tree (ts · mjs · cjs · d.ts) -----------
// One tree, four emission shapes — per dev request (NPA-9296 follow-up, Dmitriy R.):
// tokens.ts (source), tokens.mjs (ESM), tokens.cjs (CommonJS), tokens.d.ts (types).
const buildTokenTree = (dictionary) => {
  const root = {};
  for (const t of dictionary.allTokens) {
    let node = root;
    t.path.forEach((seg, i) => {
      if (i === t.path.length - 1) node[seg] = resolved(t);
      else node = node[seg] ??= {};
    });
  }
  return root;
};
const HEAD =
  '// GENERATED by Style Dictionary — do not edit by hand.\n' +
  '// Novakid token tree. Example: tokens.color.background.brand.default\n';
StyleDictionary.registerFormat({
  name: 'nk/ts-nested',
  format: ({ dictionary }) =>
    `${HEAD}export const tokens = ${JSON.stringify(buildTokenTree(dictionary), null, 2)} as const;\n\n` +
    `export type NkTokens = typeof tokens;\nexport default tokens;\n`,
});
StyleDictionary.registerFormat({
  name: 'nk/js-esm',
  format: ({ dictionary }) =>
    `${HEAD}export const tokens = ${JSON.stringify(buildTokenTree(dictionary), null, 2)};\nexport default tokens;\n`,
});
StyleDictionary.registerFormat({
  name: 'nk/js-cjs',
  format: ({ dictionary }) =>
    `${HEAD}'use strict';\nconst tokens = ${JSON.stringify(buildTokenTree(dictionary), null, 2)};\n` +
    `module.exports = tokens;\nmodule.exports.tokens = tokens;\nmodule.exports.default = tokens;\n`,
});
StyleDictionary.registerFormat({
  name: 'nk/ts-dts',
  format: ({ dictionary }) =>
    `${HEAD}export declare const tokens: ${JSON.stringify(buildTokenTree(dictionary), null, 2)};\n` +
    `export type NkTokens = typeof tokens;\ndeclare const _default: typeof tokens;\nexport default _default;\n`,
});

const sd = new StyleDictionary(config);
await sd.cleanAllPlatforms().catch(() => {});
await sd.buildAllPlatforms();
console.log('✓ Tokens built → css/variables.css · dart/nk_colors.dart · ts/{tokens.ts,.mjs,.cjs,.d.ts}');
