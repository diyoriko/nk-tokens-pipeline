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
  'Color Primitives': 'color',
  Color: 'color',
  Size: 'size',
  'Typography Primitives': 'typography',
  Typography: 'typography',
  Effect: 'effect',
  // code-only sets (live in tokens/code-only.json, NOT synced to Figma — no motion/z-index/opacity vars there):
  motion: 'motion',
  'z-index': 'z-index',
  opacity: 'opacity',
  'backdrop-blur': 'backdrop-blur',
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
const decomposeComposites = (node, resolveRef, inInner) => {
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
          'line-height': { $type: 'number', $value: v.lineHeight }, // e.g. "140%" — emitted verbatim
          'letter-spacing': px(bare(v.letterSpacing ?? '0')),
        };
      } else if (typeOf(child) === 'boxShadow' && v && typeof v === 'object') {
        // compose a ready-to-use CSS box-shadow string (single object or 2-layer array)
        const layers = Array.isArray(v) ? v : [v];
        const num = (x) => {
          const r = resolveRef(x);
          return String(r).endsWith('px') ? String(r) : `${parseFloat(r)}px`;
        };
        const str = layers
          .map((l) => `${inInner ? 'inset ' : ''}${num(l.x)} ${num(l.y)} ${num(l.blur)} ${num(l.spread)} ${resolveRef(l.color)}`)
          .join(', ');
        node[key] = { $type: 'shadow', $value: str };
      }
    } else {
      decomposeComposites(child, resolveRef, inInner || /inner/.test(key));
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
      const resolveRef = (val, depth = 0) => {
        const s = String(val);
        const m = /^\{([^}]+)\}$/.exec(s);
        if (!m || depth > 4) return val;
        const segs = m[1].split('.');
        const dom = rootDomain[segs[0]];
        let n = dom ? merged[dom] : undefined;
        for (const seg of segs) n = n?.[seg];
        return n && n.$value !== undefined ? resolveRef(n.$value, depth + 1) : val;
      };
      decomposeComposites(merged, resolveRef, false);
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
    // lowercase path segments so the published tree keeps the code-side casing
    // (tokens.color.background['brand-violet']) regardless of Figma-facing names.
    const path = t.path.map((seg) => String(seg).toLowerCase());
    path.forEach((seg, i) => {
      if (i === path.length - 1) node[seg] = resolved(t);
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
