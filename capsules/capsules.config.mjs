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
//   set  : the tokens.json Token Set layered over the core. Parent Area is the
//          BASE brand overlay — it holds the default (violet) brand and is
//          layered into the default build and under every other team's capsule.
//
// Add a team:  the designer creates a Token Set in TS (e.g. "Team B"), pushes;
// add { slug:'team-b', name:'Team B', set:'Team B' } here + the two npm
// subpaths to package.json "exports". lint-tokens derives its set lists from
// this registry, and check-capsule-consistency fails the build on any
// half-registered team (missing set, tokenSetOrder entry, or exports subpath).
//
// IMPORTANT: the default package (`.` / build/css|dart|ts) = core + Parent Area
// (the base brand). It is VALUE-identical to the pre-B2 output because Parent
// Area reproduces the violet brand that used to live inside the Color set. Other
// teams' overlay sets are ignored by the default build (not in DEFAULT_DOMAIN).

export const CAPSULES = [
  { slug: 'parent-area', name: 'Parent Area', set: 'Parent Area' },
  { slug: 'demo-team', name: 'Demo Team', set: 'Demo Team' },
];
