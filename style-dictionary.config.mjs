// Style Dictionary platform config for the Novakid token pipeline demo.
// Custom formats `nk/dart-colors` and `nk/ts-nested` are registered in build-tokens.mjs
// (the runner) before the build runs. DTCG ($value/$type) is auto-detected by SD v4.
//
// The ONE naming rule (Confluence "Tokens arch & naming"): Figma `/` -> `-`, lowercase,
// prefix `--nk-`. Style Dictionary's name transforms implement it per platform:
//   - CSS : name/kebab + prefix `nk`  -> `--nk-color-background-brand-default`
//   - Dart: name/camel                -> `NkColors.colorBackgroundBrandDefault`
//   - TS  : nested path               -> `tokens.color.background.brand.default`
//
// Note the deliberately trimmed CSS transform set: we do NOT use the full `css`
// transformGroup because it includes `size/rem`, which would mangle our `8px`
// dimension strings. We keep dimensions verbatim and only resolve colors.

export default {
  source: ['tokens/**/*.json'],
  preprocessors: ['nk/unwrap-global'],
  platforms: {
    // ---- Web: CSS custom properties -------------------------------------
    css: {
      transforms: ['attribute/cti', 'name/kebab', 'color/css', 'nk/size-px'],
      prefix: 'nk',
      buildPath: 'build/css/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
          // outputReferences:false -> semantic aliases resolve to the primitive hex.
          options: { outputReferences: false },
        },
      ],
    },

    // ---- Mobile: Flutter/Dart color constants ---------------------------
    dart: {
      transforms: ['attribute/cti', 'name/camel'],
      buildPath: 'build/dart/',
      files: [
        {
          destination: 'nk_colors.dart',
          format: 'nk/dart-colors',
        },
      ],
    },

    // ---- TypeScript: typed nested token tree ----------------------------
    // name/camel only to give each token a unique name (silences SD's collision
    // check); the format itself builds the tree from token.path, not token.name.
    ts: {
      transforms: ['attribute/cti', 'name/camel', 'nk/size-px'],
      buildPath: 'build/ts/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'nk/ts-nested',
        },
      ],
    },
  },
};
