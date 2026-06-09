# Publish the full Token-Tree doc (with colour swatches)

The full token reference — Variables-style tables + a **colour swatch per token** (table-cell
background = the exact hex) — is built and verified at
`foundations/confluence-token-tree.adf.json` (ADF, ~288 KB, 58 swatch cells, 147 token rows).

It's too big for the inline-only Confluence MCP tool, so publish it via the REST API straight
from the file. **Your API token stays local — it's read from an env var, never written down.**

## Steps
1. Create an Atlassian API token: https://id.atlassian.com/manage-profile/security/api-tokens
2. From the repo root, run:
   ```bash
   ATLASSIAN_API_TOKEN='paste-token-here' python3 foundations/confluence-push/push.py
   ```
3. It prints `OK — published vN → <url>`. Open the page — every colour token now shows a real swatch.

Target page: **Token Tree — FINAL** · `7245791234` · UD space (top-level, sibling of Discovery).
The script auto-reads the current version and bumps it; it only replaces the body (title/parent unchanged).

## If you'd rather not use a token
Tell me and I'll produce a **slimmer** version (drop the Note column / compact tables) small
enough to push through the normal tool — keeps the swatches, trims the detail.
