# Security policy

This repo publishes the `@novakid/design-system` design-token package (CSS / Dart / TS
outputs + SVG assets).

**It does ship runtime code.** `build/icons/react.js` is a React component module that
accepts consumer-supplied props, and a consuming app will pass user-derived strings into
them — a teacher's name, a child's name — through the documented `title` ("Accessible
name") prop. Treat it as an attack surface when reviewing changes to
`scripts/build-assets.mjs`, which generates it. In particular: **never interpolate a prop
into the `dangerouslySetInnerHTML` payload.** SVG `<title>` is an HTML integration point in
the fragment-parsing algorithm, so a string placed there is parsed as HTML; the `title`
prop is therefore rendered as a React child, and only the generated icon body — trusted,
produced by our own build — uses the innerHTML path.

The package handles no user data of its own and contains no server code.

## Reporting a vulnerability

Do **not** open a public issue or PR for a suspected vulnerability or a leaked
credential. Use either private channel:

1. **GitHub Private Vulnerability Reporting** (preferred): *Security → Report a
   vulnerability* on this repo — creates a private advisory only the maintainer sees.
2. **Email** the maintainer privately at **diyorbek.khakimov@novakidschool.com**.

Include the affected version/tag and a minimal reproduction. Expect an acknowledgement
within a few business days.

The repo currently lives under a personal account; a transfer to the Novakid GitHub
organisation is planned.

## Secrets

- CI uses only the default `GITHUB_TOKEN` — the publish job authenticates to GitHub
  Packages with it (`packages: write`), so no external registry secret is stored.
  Third-party actions with credential access are SHA-pinned. (A future migration to
  the Novakid Nexus registry will add a `NEXUS_NPM_TOKEN` repo secret; not configured
  yet.)
- Never commit a Figma PAT or any token. `npm run export:icons` reads `FIGMA_TOKEN` from
  the environment at runtime only — it is never stored in the repo.
