# Novakid Typography System (v2.0.0)

Reconciled from **Brand Book** (dev-ready) + **Landing DS** + **parent-mf code** (MUI variants).
Mikado · 2 weights (regular/bold, no medium). Line-heights on a clean round scale.

## Tier 1 — Primitives

### font/family
| token | value |
|---|---|
| `font/family/sans` | Mikado |

### font/weight
| token | value |
|---|---|
| `font/weight/regular` | 400 |
| `font/weight/bold` | 700 |

### font/size  (by value — clearest for type; +landing extras)
| token | px | source |
|---|---|---|
| `font/size/12` | 12 | caption / description |
| `font/size/14` | 14 | body sm |
| `font/size/16` | 16 | body md / heading sm / label / button |
| `font/size/18` | 18 | body lg (LDS) |
| `font/size/20` | 20 | heading md (h5) |
| `font/size/24` | 24 | heading lg (h4) |
| `font/size/32` | 32 | *(landing extra)* |
| `font/size/36` | 36 | display sm (h3) |
| `font/size/40` | 40 | *(landing extra)* |
| `font/size/48` | 48 | display md (h2) |
| `font/size/60` | 60 | display lg (h1) |
| `font/size/10` | 10 | overline *(optional)* |

### font/line-height  (round scale — number = %)
| token | value |
|---|---|
| `font/line-height/100` | 100% |
| `font/line-height/110` | 110% |
| `font/line-height/120` | 120% |
| `font/line-height/130` | 130% |
| `font/line-height/140` | 140% |
| `font/line-height/150` | 150% |

### font/letter-spacing
| token | value |
|---|---|
| `font/letter-spacing/none` | 0 |
| `font/letter-spacing/wide` | 0.5px |
| `font/letter-spacing/wider` | 1px |

---

## Tier 2 — Semantic text styles (composite)

Each = `{ family: Mikado, size, weight, line-height, letter-spacing }`.
*LH values = proposed (tune in tester).*

| role | size | weight | line-height | letter-spacing | use |
|---|---|---|---|---|---|
| **display/lg** | 60 | bold | 120% | none | hero / marketing H1 |
| **display/md** | 48 | bold | 120% | none | H2 |
| **display/sm** | 40 | bold | 120% | none | *(landing)* |
| **display/xs** | 36 | bold | 120% | none | H3 |
| **heading/lg** | 32 | bold | 130% | none | *(landing)* |
| **heading/md** | 24 | bold | 130% | none | section H4 |
| **heading/sm** | 20 | bold | 130% | none | H5 |
| **heading/xs** | 16 | bold | 130% | none | H6 / subtitle |
| **body/lg** | 18 | regular | 140% | none | lead paragraph |
| **body/md** | 16 | regular | 140% | none | default body |
| **body/sm** | 14 | regular | 140% | none | secondary body |
| **body/lg-strong** | 18 | bold | 140% | none | emphasised lead |
| **body/md-strong** | 16 | bold | 140% | none | emphasised body |
| **body/sm-strong** | 14 | bold | 140% | none | emphasised secondary |
| **label/lg** | 16 | bold | 140% | wide (0.5) | buttons / labels |
| **label/sm** | 14 | bold | 140% | wide (0.5) | small buttons |
| **caption** | 12 | regular | 150% | none | fine print / description |
| **caption-strong** | 12 | bold | 150% | none | emphasised caption |
| **overline** *(opt.)* | 10 | bold | 150% | wider (1) · UPPERCASE | micro labels (LDS) |

*Landing extras (optional, add when needed): `display/xl` 48→ or 40, `heading/xl` 32.*

---

## Code binding (parent-mf MUI → semantic role)

| MUI variant | semantic role |
|---|---|
| `h1` | display/lg |
| `h2` | display/md |
| `h3` | display/xs |
| `h4` | heading/md |
| `h5` | heading/sm |
| `h6`, `subtitle1` | heading/xs |
| `body1` | body/md |
| `body2` | body/sm |
| `button` | label/lg |
| `caption` | caption |
| `smallBoldTextStyle` | body/sm-strong |

---

## What improved vs v1.x
- Fixed the muddled hierarchy (was: `subtitle` 28–40 **larger** than `heading` 16–24). Now a clean top-down ramp `display > heading > body > label/caption` (Material-aligned).
- Line-heights on a clean round scale (100–150%), tokenised (was hardcoded 120/130/132/140/125%).
- Single source of truth reconciled across BB + LDS + code.
- 2 weights only (medium dropped — not used).
