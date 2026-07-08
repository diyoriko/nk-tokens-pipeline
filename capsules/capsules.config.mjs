// Capsule registry — the single source for the multi-team token packaging.
//
// A "capsule" is a per-team token package built from the shared foundation
// (primitives + base semantics) PLUS that team's own semantic overlay set.
// The overlay set is a normal Token Set authored in Tokens Studio / Figma and
// living in tokens/tokens.json (so designers own it); it is layered over the
// `Color` domain at build time and overrides only the paths it defines.
//
//   slug : output dir (build/capsules/<slug>/) AND npm subpath (./capsules/<slug>)
//   name : human label (also the Tokens Studio theme name)
//   set  : the tokens.json Token Set layered over the core, or null for "core"
//          (Parent Area = the current default semantics, no overlay).
//
// Add a team:  the designer creates a Token Set in TS (e.g. "Team B"), pushes;
// add { slug:'team-b', name:'Team B', set:'Team B' } here + 'Team B' to
// lint-tokens.mjs KNOWN_SETS/SET_DOMAIN. The build then emits its own package.
//
// IMPORTANT: the default package (`.` / build/css|dart|ts) is the CORE build and
// is byte-identical regardless of capsules — capsule sets are ignored by the
// default `nk/flatten-sets` preprocessor (they are not in its SET_DOMAIN).

export const CAPSULES = [
  { slug: 'parent-area', name: 'Parent Area', set: null },
  { slug: 'demo-team', name: 'Demo Team', set: 'Demo Team' },
];
