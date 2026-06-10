# Novakid Tokens — v2.0.0 consolidated spec

Single source of truth for the v2.0.0 build. Everything below is decided.
**Version:** 2.0.0 (major — breaking: step renumbering, hue renames, new structure. 1.0.x already on npm.)

---

## 1. Colour

### Primitives — 8 hues × /100–/1000 (smooth OKLCH)
`coral · orange · yellow · green · blue · violet · magenta · grey`
- **Scheme B:** Main pinned at `/500`; tints `/100–400`, shades `/600–1000`.
- **Smooth OKLCH:** even L\*, chroma arc (pale tints → vivid Main → controlled darks), single hue per ramp.
- **Reuse real LDS** where a step lands within ΔE (`= name`); generate smooth in-tone elsewhere (`≈ name` / gen).
- Mains: coral #FF5A56 · orange #FFA000 · yellow #FFE60A · green #79FD7F (Lime) · blue #0A58EA (gen, H262) · violet #6D46FC · magenta #C76EF2 · grey scale.
- Periwinkle folded into violet (light steps); blue = juicy true-blue (Patterns Blue = light ref).

### Semantic (re-map onto new steps)
- `background/brand-{hue}`: primary (bright) + primary-hover (lighten) + secondary(/200) + secondary-hover + tertiary(/100) + tertiary-hover. green/yellow 2-level (no tertiary). Pressed = depth.
- text/icon on bright = `hue/900`; on tint = `hue/900`; brand-as-text = `hue/700`.
- Statuses `success/warning/danger/info`: bold (bright + hue/900) + light (tint + hue/700). info 2-state.
- `background/overlay·scrim·selected` (/default), `border/selected`, `text/link` (default/visited), `feedback/{reward,progress,streak,encourage}`, `focus` (on-fill grey/900 + offset), `data-viz/1..8`.
- Contrast contract in CI.

---

## 2. Spacing / Size

### Primitives — sequential 100–1400 (was Polaris 050/150)
`0 · 100=4 · 200=8 · 300=12 · 400=16 · 500=20 · 600=24 · 700=32 · 800=40 · 900=48 · 1000=64 · 1100=80 · 1200=96 · 1300=128 · 1400=160` + negatives mirror. (Gap 64→160 filled with 80, 128. Dropped 2px/6px.)

### Semantic spacing layer (new — aliases primitives)
- `space/component/*` → small (100–800) — padding inside components.
- `space/section/*` → large (800–1400) — layout/section gaps.
- `space/negative/*` → negative.

### Other size
- radius: 4,8,12,16,20,24,32,40,full (drop 28).
- stroke: border 1 · focus-ring 2 · focus-offset 2.
- icon: small 24 · medium 32 · large 40.

---

## 3. Typography

### Primitives
- `font/family/sans` = Mikado · `font/weight/{regular 400, bold 700}` (no medium).
- `font/size`: 12,14,16,18,20,24,32,36,40,48,60 (+10 overline).
- `font/line-height`: round scale `100 110 120 130 140 150` (% = number).
- `font/letter-spacing`: none 0 · wide 0.5 · wider 1.

### Semantic styles (composite)
- **display** lg 60 · md 48 · sm 40 · xs 36 — bold · **120%**
- **heading** lg 32 · md 24 · sm 20 · xs 16 — bold · **130%**
- **body** lg 18 · md 16 · sm 14 (+ `-strong`) — reg/bold · **140%**
- **label** lg 16 · sm 14 — bold · **100%** (single-line!) · ls wide
- **caption** (+strong) 12 — reg/bold · **140%**
- **overline** 10 — bold UPPER · 150% · ls wider
- **single-line** variants (LH 100%) for chips/cells/buttons (from SDS).

MUI binding: h1→display/lg · h2→display/md · h3→display/xs · h4→heading/md · h5→heading/sm · h6/subtitle1→heading/xs · body1→body/md · body2→body/sm · button→label/lg · caption→caption · smallBold→body/sm-strong.

---

## 4. Effects

### Drop-shadow — 6 tiers, **2-layer** (ambient + key) — Material/Tailwind style
100 → 600, each = soft ambient + tight key. Elevation ladder: card→dropdown→overlay→popover→modal→dialog.

### Inner-shadow (new — fills empty Storybook story)
- `inner-shadow/100` — subtle (inputs, wells)
- `inner-shadow/200` — pressed (buttons/toggles)

### Backdrop-blur (new — code-only · CSS `backdrop-filter` · Figma Layer Blur)
- primitives: `backdrop-blur/{100=4, 200=8, 300=16, 400=24, 500=40}`
- semantic: `blur/overlay` 8 · `blur/scrim` 16 · `blur/glass` 24 · `blur/heavy` 40
- Novakid: modal scrim-frost, glassmorphism hero cards, photo overlays.

---

## 5. Code-only (unchanged)
motion (duration/easing) · z-index · opacity.

---

## Build order
1. Colour primitives (8 hues) → tokens.json.
2. Re-map colour semantics onto new steps.
3. Spacing (sequential) + semantic spacing layer.
4. Typography (primitives + semantic styles, single-line LH).
5. Effects: 2-layer drop-shadow + inner-shadow + backdrop-blur.
6. Build → AA + contrast contract + Storybook → release **v2.0.0**.
