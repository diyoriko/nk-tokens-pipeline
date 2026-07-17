# Security policy

This repo publishes the `@novakid/nk-tokens` design-token package (CSS / Dart / TS
outputs + SVG assets). It ships no runtime server code and handles no user data.

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

- CI uses the default `GITHUB_TOKEN`, the `NEXUS_NPM_TOKEN` repo secret (publish job:
  npm publish to nexus.novakidschool.com) and, for the optional Storybook preview, the
  `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` repo secrets. Third-party actions
  with credential access are SHA-pinned.
- Never commit a Figma PAT or any token. `npm run export:icons` reads `FIGMA_TOKEN` from
  the environment at runtime only — it is never stored in the repo.
