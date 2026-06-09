#!/usr/bin/env python3
"""
Publish the full Token-Tree ADF (with colour swatches) to the Confluence page.

Why this exists: the ADF doc (foundations/confluence-token-tree.adf.json, ~288 KB,
58 colour-swatch cells) is too large to push through the inline-only MCP tool. This
pushes it via the Confluence Cloud REST v2 API straight from the file — no size limit,
no transcription. Your API token stays on your machine.

Run (token NOT stored anywhere):
    ATLASSIAN_API_TOKEN=xxxxx python3 foundations/confluence-push/push.py

Create a token at: https://id.atlassian.com/manage-profile/security/api-tokens
"""
import os, sys, json, base64, urllib.request, urllib.error

BASE     = "https://novakidschool.atlassian.net/wiki/api/v2"
PAGE_ID  = "7245791234"
EMAIL    = "diyorbek.khakimov@novakidschool.com"
TITLE    = "Token Tree — FINAL (Foundations · NPA-9291-ready)"
ADF_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "confluence-token-tree.adf.json")
MSG      = "Full token reference: Variables-style tables + colour swatches (ADF, via REST)"

token = os.environ.get("ATLASSIAN_API_TOKEN")
if not token:
    sys.exit("ERROR: set ATLASSIAN_API_TOKEN (id.atlassian.com → Security → API tokens).")

hdr = {
    "Authorization": "Basic " + base64.b64encode(f"{EMAIL}:{token}".encode()).decode(),
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# validate the ADF parses before touching the live page
adf = json.load(open(ADF_FILE, encoding="utf-8"))
assert adf.get("type") == "doc", "ADF root is not a doc node"

# current version → next
req = urllib.request.Request(f"{BASE}/pages/{PAGE_ID}", headers=hdr)
cur = json.load(urllib.request.urlopen(req))
next_ver = cur["version"]["number"] + 1
print(f"Current version {cur['version']['number']} → pushing v{next_ver} ({len(json.dumps(adf))} chars ADF)")

payload = {
    "id": PAGE_ID,
    "status": "current",
    "title": TITLE,
    "body": {"representation": "atlas_doc_format", "value": json.dumps(adf, ensure_ascii=False)},
    "version": {"number": next_ver, "message": MSG},
}
req = urllib.request.Request(f"{BASE}/pages/{PAGE_ID}",
                            data=json.dumps(payload).encode("utf-8"),
                            headers=hdr, method="PUT")
try:
    resp = json.load(urllib.request.urlopen(req))
    print("OK — published v%s → https://novakidschool.atlassian.net/wiki%s"
          % (resp["version"]["number"], resp["_links"]["webui"]))
except urllib.error.HTTPError as e:
    sys.exit("FAILED %s\n%s" % (e.code, e.read().decode()[:1500]))
