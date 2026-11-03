# Enterprise UI Design System

This document defines the visual baseline for the Wasnaker enterprise application. The goal is a calm, trustworthy and efficient B2B interface: clear hierarchy, deliberate whitespace, restrained color and predictable interaction patterns.

## Design direction

- **Character:** institutional, precise, contemporary and data-focused.
- **Layout:** neutral page canvas, white content surfaces, consistent spacing and clear separation between navigation and work areas.
- **Avoid:** decorative gradients, excessive glass effects, oversized rounded cards, ornamental shadows and color used without semantic meaning.
- **Compatibility:** preserve existing routes, module manifests, permissions, data flows, responsive behavior and light/dark theme support.

## Color tokens

| Role | Token | Value / intent |
| --- | --- | --- |
| Primary action | `--primary` | Deep corporate blue: `oklch(0.43 0.13 255)` |
| Main canvas | `--background` | Cool neutral 50 |
| Main text | `--foreground` | Neutral 950 |
| Content surface | `--card` | White in light mode |
| Subtle surface | `--muted` | Neutral 100 |
| Secondary text | `--muted-foreground` | Neutral 600 |
| Borders | `--border` | Neutral 200 |
| Input boundaries | `--input` | Neutral 500, retained for visible control boundaries |
| Navigation | `--sidebar` | Deep navy surface with high-contrast text |
| Status | `--success`, `--warning`, `--destructive`, `--info` | Reserved for semantic feedback |

Use primary blue for the main action, selected navigation, links and focus indicators. Do not use it as a decorative fill on every card. Status colors communicate state only; never rely on color alone to convey meaning.

## Typography

- Keep the existing Roboto font to avoid unnecessary font-loading and layout shifts.
- Page title: 24–30px, semibold, tight tracking.
- Section and card title: 14–16px, semibold.
- Body and form labels: 14px, regular/medium.
- Supporting metadata: 12–13px, muted.
- Numeric data: use tabular numerals for stable column alignment.
- Maintain a clear hierarchy; subtitles should support the title, not compete with it.

## Geometry and elevation

- Base radius: 8px (`--radius: 0.5rem`).
- Prefer 6–8px control and surface radii; reserve larger radii for larger containers where the existing pattern requires them.
- Use thin neutral borders to define tables and panels.
- Use the elevation tokens sparingly: level 1 for cards and tables, level 2 for floating controls, level 3 for overlays.
- Avoid stacking border + strong shadow + tinted background on the same surface.

## Component rules

| Component | Standard |
| --- | --- |
| App bar | Compact, neutral, fixed hierarchy; brand uses the application sans-serif rather than decorative monospace styling |
| Sidebar | Deep navy, high-contrast labels, restrained active state with a blue leading marker |
| Buttons | Clear primary/secondary hierarchy; compact geometry; visible keyboard focus |
| Cards | White surface, thin border, subtle elevation; consistent header/body padding |
| Tables | Prioritize scanability, alignment, row density and clear sort/filter affordances; keep horizontal overflow usable |
| Forms | Consistent field spacing, visible labels, clear validation and accessible input boundaries |
| Badges | Semantic status only; neutral by default; avoid using badges as decoration |

## Spacing and layout

Use the existing Tailwind spacing scale consistently:
- 4px: icon/text micro gap.
- 8px: compact control and row spacing.
- 12–16px: component internal padding.
- 24px: section separation.
- 32px: major page grouping.

Do not add whitespace indiscriminately. Data tables should remain information-dense while retaining enough row height for comfortable scanning and interaction.

## Interaction and accessibility

- Use short, purposeful transitions for hover, focus, active and disclosure states.
- Preserve keyboard navigation and visible focus indicators.
- Honor `prefers-reduced-motion`.
- Maintain readable contrast for text and a minimum 3:1 contrast for meaningful control boundaries and focus indicators where applicable.
- Pair semantic colors with text or icons; never communicate status by color alone.
- Keep loading, empty, error and success states visually consistent.

## Before / after direction

| Area | Before | After |
| --- | --- | --- |
| Brand accent | Violet-forward | Deep corporate blue |
| Navigation | Light surface | Deep navy with clear active state |
| Typography hierarchy | Oversized supporting text and decorative wordmark | Compact, consistent enterprise hierarchy |
| Surfaces | Similar visual weight across cards | Neutral borders and restrained elevation |
| Shape language | More rounded panels | Consistent 8px base radius |
| Motion | Component-specific transitions | Purposeful transitions with reduced-motion support |

## Implementation boundary

The design tokens and shared component styles are the source of truth. Feature modules should consume semantic tokens such as `bg-background`, `text-foreground`, `bg-primary`, `border-border` and the shared component classes. Avoid hard-coded brand colors in individual pages or module packages.

This redesign is visual-only: do not change API contracts, authorization, module registration, route behavior, localization behavior or data semantics as part of a styling change.
