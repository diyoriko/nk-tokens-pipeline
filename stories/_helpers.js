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

export const FONT = 'var(--nk-typography-family-sans, Mikado, system-ui, sans-serif)';
export const MUTED = 'var(--nk-color-text-default-secondary, #66656a)';
export const BORDER = 'var(--nk-color-border-default-default, #cfcfd3)';
