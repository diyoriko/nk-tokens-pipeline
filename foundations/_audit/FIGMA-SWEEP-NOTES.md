# Figma sweep — what's reachable (session 2026-06-05)

## Access
- Auth: Diyor (diyorbek.khakimov@novakidschool.com), Novakid Pro/expert seat. Figma MCP responds for explicit file+node keys.
- **MCP is desktop-bound and cannot enumerate a project's files.** `get_metadata` with no nodeId returns only the *currently-open* file's pages (Landing DS → only "🖌️ Cover"; Brand Book → only "🚀 Identity"), not the whole file and not project 50498235's file list. There is no list-files API in this MCP.

## Confirmed live (ground truth for COLOUR)
- **Brand Book `LM3oAa06YP1rqpYzgrHQKX` / node 6:5352 "Colors"** — canonical swatches (names+hex) pulled and match `primitive-palette.md` 1:1: Violet #6D46FC, Daisy Bush #4221B8, Persian Indigo #210A74, Melrose #9694FF, Heliotrope #C76EF2, Magnolia #F7F5FF, Greyscale (Black #2C2A33, Jumbo #706F74, Silver #C6C6C6, Mischka #E2E1E7, Wild Sand #F4F4F4, Alabaster #FAFAFA, Outer Space #484848, White), Persimmon #FF5A56, Chablis #FFF3F3, Lemon #FFE60A, Gin Fizz #FFF8DF, Snake #19AA20, Apple #31C838, Lime #79FD7F, White Ice #E9FBF0, Periwinkle #C6D2FF, Patterns Blue #E1F3FE.
- **Landing DS `pQEYDZPSXAotX3NlssYmOI` / node 4753:217** — real colour Variables (same set as BB) + sample text styles with **PIXEL** line-heights: H4 24/lh32 bold, Body 14/lh20 reg, Body 16/lh22 bold, Body 12/lh15 reg.

## Negative result (important)
- `search_design_system` restricted to **Parent Area team library** (`lk-15be5…`) and broad: returns **components only** — `variables: []`, `styles: []` for colour AND for spacing/size/shadow across the whole accessible space.
- ⇒ **There is no published Figma variable source for size / typography / effects anywhere in the Novakid space.** Those values live only in product code (`parent-mf`), which is exactly what `extract-space.md / extract-typography.md / extract-shadow.md` captured. So the code-grep extracts ARE the authoritative "real usage" for groups C/D/E — no Figma gap there.

## PAT / REST API sweep (personal token figd_…, read-only)
The personal PAT (account diyor.khakimov@gmail.com) **cannot** list project 50498235 (403 — not a member of the Novakid org) and **cannot** read Variables (`file_variables:read` scope missing). But it **can fully read the shared DS files** via REST (more complete than desktop MCP, which only returns the open file's near-viewport). Hard evidence pulled:

### Brand Book — full page list (REST sees all; desktop MCP showed only "Identity")
🚀 Identity · 🌈 Colours (frame 6:5352) · **🅰 Typography (frame 59:402)** · **📐 Grids → Spacing (frame 6:5027)** · 🏈 Objects · 😀 Emojis · 👩‍🎤 Characters · Favicons · Labels · Patterns.

### Brand Book **Spacing** scale (frame 6:5027) — the brand's OWN canonical grid
Labels verbatim: **4px(.5) · 8px(1) · 12px(1.5) · 16px(2) · 20px(2.5) · 24px(3) · 32px(4) · 48px(6) · 64px(8)** (8px base).
- ⇒ **20px is an OFFICIAL brand spacing step.** Foundations v1 has NO space-500 (20px) — it contradicts the Brand Book's published grid, not just code usage. HIGH/near-critical.
- v1 ADDED 2px / 6px / 96px / 160px — **none are in the Brand Book spacing scale** (they came from SDS). 40px (heavy in code) is also not a BB spacing step (BB jumps 32→48).

### Brand Book **Typography** (frame 59:402) real published styles
H1 60/700 lh80.8 (**135%**) · H2 48/700 lh64.7 (135%) · H3 36/700 lh48.5 (135%) · H5 20/700 lh26.9 (135%) · Button text 16/700 ls0.5 lh21.6 (135%) · Body 14 reg/bold lh19.6 (140%) · **Description(caption) 12/400 lh15 (125%)** + Description bold 12/700.
- ⇒ Brand heading line-height ≈ **134–135%**; Foundations v1 uses **128% (title) / 132% (heading)** — tighter than the brand. Body ≈135–140% (v1 140% ok). 
- ⇒ **Caption 12px (125% lh) is a real published style in BOTH Brand Book and Landing DS** → v1 dropping the caption role is a confirmed gap.

### Landing DS — 26 published styles (REST `/styles`)
TEXT: Heading 60/48/40/36/32/24/20/18/16 · Body 24/20/18/16/14/12 (Regular+Bold) · **Caption** · **Caption | LC**. (+ GRID styles Desktop/Tablet/Mobile DS 2025.)
- ⇒ LDS publishes **Heading 40/32** (BOLD). Foundations v1 renamed 28/32/40 to **subtitle** and changed weight to **REGULAR** — divergence from the published bold Headings (brand question).
- ⇒ LDS publishes **Body 24 regular** — no matching v1 role (v1 heading-large 24 is bold; subtitle starts at 28). Minor gap.
- ⇒ LDS **Caption / Caption|LC** confirm the dropped-caption gap.

## Still need from user to go deeper on PRODUCT-SCREEN usage
To sweep used-but-untokenized values in actual product screens (Web app / Games / Mobile / Parent-area screens), paste the **file keys or node URLs** of those files — the MCP can then pull per-node `get_variable_defs` / `get_design_context`. Project-level enumeration is not possible via MCP.
