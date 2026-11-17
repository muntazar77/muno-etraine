---
name: frontend-design
description: >
  Premium editorial educational platform UI/UX system for Muno eTrainer, grounded in
  design/references/dashboard-reference.png and design/references/exam-reference.png.
  Enforces semantic CSS variables, generous whitespace, asymmetric editorial composition,
  deep navy hero panels, restrained pastel study cards (lavender, peach, soft lime, muted teal),
  royal indigo interactive exam selection states, and WCAG AA accessibility in both light and dark modes.
---

# Frontend Design System — Muno eTrainer

## 1. Visual North Star & Reference Alignment

All visual decisions derive from two reference compositions in `design/references/`:
1. **Dashboard Reference (`design/references/dashboard-reference.png`)**:
   - Warm alabaster/stone canvas (`--bg-canvas: #F4F3EF`) with crisp white elevated surfaces (`--bg-surface: #FFFFFF`).
   - Minimal vertical left sidebar (`248px` desktop) with an edge-aligned active pill indicator (`#212238`), clear Lucide icons, and compact responsive drawer on mobile.
   - Prominent deep navy hero panel (`--surface-navy: #212238`, `border-radius: 24px`) pairing an editorial greeting, live study headline, and crisp white pill CTA (`Continue Learning ↗`) on the left with 3–4 vertical pastel study cards (`01`, `02`, `03`, `04`) on the right.
   - Asymmetric lower grid: left column (~62%) housing 3 clean white metric cards (including an area sparkline card for accuracy trend) and category mastery list with pastel icon badges; right column (~38%) housing study activity matrix, quick-action modules, and a dark-badge recommended next study action card.
2. **Examination Reference (`design/references/exam-reference.png`)**:
   - Calm, distraction-free examination canvas (`#F7F8FA`).
   - Top horizontal metadata bar (`border-radius: 16px`, white surface, subtle border) divided by vertical hairlines into 4 segments: **Exam Type**, **Subject / Category**, **Completed (X/Y) + Teal Progress Bar (`#387B6B`)**, and a pill-shaped **Submit Exam** CTA button (`#387B6B`).
   - Two-column examination workspace:
     - **Left column (~68%)**: `Question: N` pill badge, authoritative `28px–32px` question title paired with a circular royal indigo bookmark button (`#5246D8`), full-width clickable option cards with `44px × 44px` keycap badges (`A`, `B`, `C`, `D`) that fill completely with royal indigo (`#5246D8`) and white text when selected, and a 5-button bottom navigation bar (`First`, `Back`, `X / Y` active indigo pill, `Next`, `Last`).
     - **Right column (~32%)**: Dedicated white Timer Card with a circular SVG countdown ring (`#387B6B`) and `Timer Remaining:` label, above a Navigation & Filter Card containing stacked pill toggles (`View Bookmarked`, `View Unanswered`, `Save for Revision`) and a paginated numbered question navigator grid (`< 1 2 3 4 ... >`).

## 2. Design Tokens & Color Architecture

Never scatter arbitrary hex values in components. Use CSS variables defined in `src/app/globals.css`:
- `--bg-canvas`: Warm off-white (`#F4F3EF` light / `#0E1017` dark)
- `--bg-exam-canvas`: High-clarity cool alabaster (`#F7F8FA` light / `#0F111A` dark)
- `--bg-surface`: Elevated card surface (`#FFFFFF` light / `#171926` dark)
- `--bg-surface-subtle`: Secondary muted surface (`#ECEAE4` light / `#1F2233` dark)
- `--surface-navy`: Deep editorial navy (`#212238` light / `#1C1E33` dark)
- `--pastel-lavender`: `#BFAOFF` / `#C4B2FF` (text `#1D1B38`)
- `--pastel-peach`: `#F9E2BD` (text `#2B2118`)
- `--pastel-lime`: `#E8FA5A` (text `#1E240B`)
- `--pastel-teal`: `#D2EFE9` (text `#13362E`)
- `--accent-indigo`: `#5246D8` (Exam option active fill, bookmark badge, active question counter)
- `--accent-teal`: `#387B6B` (Exam timer ring, progress bar, Submit Exam CTA, accuracy indicators)
- `--border-subtle`: `#E4E3DD` light / `#282C40` dark

## 3. Rules & Anti-Patterns

- **No generic AI gradients or glassmorphism**: Rely on flat, tactile surfaces, crisp `1px` borders, subtle ambient shadows, and intentional color blocking.
- **No emojis as UI icons**: Use `lucide-react` icons with consistent `1.75px` stroke width.
- **No fabricated user metrics**: When local progress is empty, render calm, encouraging empty states with direct action links.
- **Native Accessibility**: Use native `<dialog>` with `.showModal()` for confirmation modals, `:focus-visible` outlines, semantic landmarks (`<aside>`, `<header>`, `<main>`, `<nav>`), and `<meta name="color-scheme" content="light dark">`.
