# Security policy

This repo publishes the `@diyoriko/nk-tokens` design-token package (CSS / Dart / TS
outputs + SVG assets). It ships no runtime server code and handles no user data.

## Reporting a vulnerability

Email the maintainer (Diyor) privately — do **not** open a public issue or PR for a
suspected vulnerability or a leaked credential. Include the affected version/tag and a
minimal reproduction. Expect an acknowledgement within a few business days.

## Secrets

- CI uses the default `GITHUB_TOKEN` (publish job: `packages: write`) and, for the
  optional Storybook preview, the `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` repo
  secrets. Third-party actions with credential access are SHA-pinned.
- Never commit a Figma PAT or any token. `npm run export:icons` reads `FIGMA_TOKEN` from
  the environment at runtime only — it is never stored in the repo.
