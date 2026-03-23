# PolitiTrack Design System

**Aesthetic**: Serious civic data journalism — ProPublica meets FiveThirtyEight meets a premium government transparency platform. Trustworthy, nonpartisan, authoritative.

## Color Palette

### Primary (Navy)
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#041534` | Headings, nav background, primary buttons |
| Primary Container | `#1B2A4A` | Card headers, accent backgrounds |
| Primary Fixed | `#D9E2FF` | Light backgrounds, hover states |
| Primary Fixed Dim | `#B7C6EE` | Secondary highlights |
| On Primary | `#FFFFFF` | Text on primary backgrounds |

### Secondary (Deep Red)
| Token | Hex | Usage |
|-------|-----|-------|
| Secondary | `#A63744` | Republican indicators, error-adjacent states |
| Secondary Container | `#FE7A85` | Active states, badges |
| Secondary Fixed | `#FFDADA` | Light red backgrounds |
| On Secondary | `#FFFFFF` | Text on secondary backgrounds |

### Tertiary (Deep Teal)
| Token | Hex | Usage |
|-------|-----|-------|
| Tertiary | `#001829` | Deep accents |
| Tertiary Container | `#002D49` | Chart backgrounds |
| Tertiary Fixed | `#CDE5FF` | Info backgrounds |

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#F8F9FA` | Page background |
| Surface | `#F8F9FA` | Card backgrounds |
| Surface Dim | `#D9DADB` | Disabled states |
| Surface Container | `#EDEEEF` | Nested containers |
| Surface Container High | `#E7E8E9` | Elevated containers |
| On Surface | `#191C1D` | Body text |
| Inverse Surface | `#2E3132` | Dark mode surface |
| Outline | `#75777F` | Borders |
| Outline Variant | `#C5C6CF` | Subtle borders |

### Status
| Token | Hex | Usage |
|-------|-----|-------|
| Error | `#BA1A1A` | Error states |
| Error Container | `#FFDAD6` | Error backgrounds |

### Party Colors
| Party | Color | Usage |
|-------|-------|-------|
| Democrat | `#1B2A4A` (navy) | Party indicators, borders |
| Republican | `#8B2332` / `#A63744` | Party indicators, borders |
| Independent | `#75777F` | Party indicators |

## Typography

### Font Families
- **Headlines**: `Epilogue` — Modern geometric sans-serif, strong editorial presence
- **Body & Labels**: `Public Sans` — US government standard, highly readable at all sizes

### Scale
| Level | Font | Weight | Size | Usage |
|-------|------|--------|------|-------|
| Display | Epilogue | 800 | 2.5rem | Hero headlines |
| H1 | Epilogue | 700 | 2rem | Page titles |
| H2 | Epilogue | 700 | 1.5rem | Section headers |
| H3 | Epilogue | 600 | 1.125rem | Card headers |
| Body | Public Sans | 400 | 1rem | Paragraph text |
| Body Small | Public Sans | 400 | 0.875rem | Secondary content |
| Label | Public Sans | 600 | 0.75rem | Stat labels, metadata |
| Caption | Public Sans | 500 | 0.625rem | Fine print, timestamps |

## Spacing & Layout

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| Default | `0.125rem` (2px) | Buttons, inputs |
| Large | `0.25rem` (4px) | Cards |
| XL | `0.5rem` (8px) | Modals |
| Full | `0.75rem` (12px) | Badges, chips |

### Grid
- **Desktop**: Asymmetric `1fr 3fr` for sidebar layouts, `1fr` for full-width
- **Breakpoint**: 768px for mobile → desktop
- **Max width**: 1200px content area
- **Gap**: `2rem` between grid items

### Shadows
- **Card**: `0 20px 40px rgba(25, 28, 29, 0.06)` — Subtle editorial elevation
- **Hover**: `0 24px 48px rgba(25, 28, 29, 0.10)` — Slight lift on interaction

## Component Patterns

### Cards
- Background: white (`#FFFFFF`)
- Border: `1px solid #C5C6CF` (outline-variant)
- Border-radius: `0.25rem`
- Shadow: editorial shadow
- No heavy borders or blocky vintage styling

### Data Focus States
- Left border: `4px solid #041534` for active/selected rows
- Background: `#F8F9FA` for hover states

### Status Badges
- Refined pill shape with `border-radius: 0.75rem`
- Solid background using semantic colors
- Small, readable text (0.75rem, weight 600)

### Navigation
- Clean horizontal nav with `#041534` background
- White text, subtle hover transitions
- No uppercase tracking on nav items

### Data Visualizations
- Donut/pie charts use party colors
- Bar charts: navy primary, red secondary
- Timeline: vertical line with dot indicators
- Chamber floor: semicircle dot map with party coloring

## Dark Mode
Not currently prioritized. The civic data journalism aesthetic works best on light backgrounds. If added later, use Inverse Surface (`#2E3132`) as the base.

## Design Sources
Generated via Stitch (Google) with Gemini 3.1 Pro. Screens:
- Home page with representative search
- Politician profile page
- Bill detail page
- Compare politicians page

Stitch Project ID: `5351571162885503412`
