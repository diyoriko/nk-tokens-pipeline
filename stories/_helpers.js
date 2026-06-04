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

// "#1A1A1A" + 0.16 -> "rgba(26,26,26,0.16)"
export function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const FONT = 'var(--nk-typography-font-family-main, Inter, system-ui, sans-serif)';
export const MUTED = 'var(--nk-color-text-default-secondary, #5c5b61)';
export const BORDER = 'var(--nk-color-border-default-default, #e2e1e7)';
