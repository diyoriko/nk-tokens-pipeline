// Shared helpers for the token catalogue stories.

// Flatten a nested token object into [{ path:[...], value }] leaves.
export function leaves(obj, path = []) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') out.push(...leaves(v, [...path, k]));
    else out.push({ path: [...path, k], value: v });
  }
  return out;
}

// Token path -> CSS custom property name (the one rule: join with '-', prefix --nk-).
export const cssVar = (path) => `--nk-${path.join('-')}`;

// --nk-typography-family-sans is defined (bare `Mikado`), so a CSS var FALLBACK
// (the part after the comma) never applies — it only fires when the var is unset.
// Put the fallback stack OUTSIDE the var() so it substitutes to
// `Mikado, system-ui, sans-serif`: viewers without the commercial Mikado webfont
// installed still get a sane sans, not the browser default serif. (Mikado is
// licensed + git-ignored, so the published Storybook can't ship it — see the
// note in Typography.stories.js.)
export const FONT = 'var(--nk-typography-family-sans), system-ui, sans-serif';
export const MUTED = 'var(--nk-color-text-default-secondary, #636363)';
export const BORDER = 'var(--nk-color-border-default-primary, #d7d7d7)'; // quiet hairline tier
