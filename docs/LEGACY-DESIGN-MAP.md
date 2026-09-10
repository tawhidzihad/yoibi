# YOIBI Legacy Design Map

This document captures the design tokens, typography, colors, patterns, and assets inspected directly from `legacy/original-yoibi/`.

## Brand & Colors
- Primary Accent: Cyan `#06b6d4` (Tailwind `cyan-500`, hover `cyan-600`, dark `cyan-700`)
- Secondary Accent: Cyan glow `#22d3ee` (Tailwind `cyan-400`, `cyan-300`)
- Social Feedback Accents:
  - Like / Heart: Pink `#f472b6` (`text-pink-400`)
  - Repost / Retweet: Emerald/Green `#4ade80` (`text-green-400`)
- Dark / Light System Palette (OKLCH):
  - Background: `oklch(1 0 0)` (pure white light mode) / dark theme support
  - Foreground: `oklch(0.145 0 0)` (near-black text)
  - Card: `oklch(1 0 0)`
  - Card Foreground: `oklch(0.145 0 0)`
  - Popover: `oklch(1 0 0)`
  - Popover Foreground: `oklch(0.145 0 0)`
  - Primary: `oklch(0.205 0 0)`
  - Primary Foreground: `oklch(0.985 0 0)`
  - Secondary: `oklch(0.97 0 0)`
  - Secondary Foreground: `oklch(0.205 0 0)`
  - Muted: `oklch(0.97 0 0)`
  - Muted Foreground: `oklch(0.556 0 0)`
  - Accent: `oklch(0.97 0 0)`
  - Accent Foreground: `oklch(0.205 0 0)`
  - Destructive: `oklch(0.577 0.245 27.325)`
  - Border: `oklch(0.922 0 0)`
  - Input: `oklch(0.922 0 0)`
  - Ring: `oklch(0.708 0 0)`
- Radii:
  - Base Radius: `0.625rem` (10px)
  - `radius-sm`: `calc(var(--radius) * 0.6)`
  - `radius-md`: `calc(var(--radius) * 0.8)`
  - `radius-lg`: `var(--radius)`
  - `radius-xl`: `calc(var(--radius) * 1.4)`
  - `radius-2xl`: `calc(var(--radius) * 1.8)`
  - `radius-3xl`: `calc(var(--radius) * 2.2)`
  - `radius-4xl`: `calc(var(--radius) * 2.6)`
- Custom Animations:
  - `aurora`: 8s ease-in-out infinite alternate
  - `marquee`: linear infinite horizontal ticker
  - `marquee-vertical`: linear infinite vertical ticker
  - `shimmer-slide`: ease-in-out infinite alternate
  - `spin-around`: linear infinite 360 rotation
  - `border-beam`: linear infinite offset-distance
  - `ripple`: 2s ease infinite
  - `blink-cursor`: 1.2s step-end infinite

## Typography
- Font family: `Geist Variable`, sans-serif (via `@fontsource-variable/geist`)
- Fallback: `system-ui, -apple-system, sans-serif`
- Weights:
  - Normal: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700
- Heading scale:
  - Hero Display: `text-5xl sm:text-7xl font-bold tracking-tight`
  - Section Headings (H2): `text-3xl sm:text-4xl font-bold`
  - Card Headings (H3): `text-lg font-semibold`
  - Subheadings: `text-xl sm:text-2xl font-medium`
- Body scale:
  - Lead: `text-base leading-relaxed`
  - Standard Body: `text-sm leading-relaxed`
  - Meta/Subtext: `text-xs text-muted-foreground`

## Layout & Responsive Geometry
- Max Container Width: `max-w-6xl` (`1152px`) centered with `px-4`
- Desktop Grid Layout: `grid-cols-[220px_1fr_260px]` with `gap-6`
  - Left Column (220px): Sticky sidebar containing brand header, navigation menu, "New Post" button
  - Center Column (1fr): Main feed/content area (`pb-24 pt-6 lg:pb-6`)
  - Right Column (260px): Sticky sidebar containing current user card (stats: posts, followers, following) and profile navigation
- Mobile Layout (< 1024px):
  - Sticky header: `h-14` with Yoibi logo and title
  - Bottom Floating Dock: `Dock` component with interactive magnified icons centered at `bottom-4`

## UI Patterns
- Buttons:
  - Primary Action: `bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold`
  - Shimmer Button: Radial animated border shimmer for high-converting CTAs (`ShimmerButton`)
  - Secondary: `border border-border/50 bg-secondary/50 text-foreground rounded-xl px-4 py-2 text-sm`
  - Destructive: `bg-destructive text-white`
- Cards:
  - `MagicCard`: Subtle border glow with cursor-tracking radial cyan gradient (`#06b6d410`)
  - Threaded Post Card: Border-connected conversation threads with vertical connector lines (`left-[39px] w-0.5 bg-border`)
- Inputs & Forms:
  - Text Input: `rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500`
  - Textarea: `resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm`
  - Color Picker: Embedded `<input type="color">` for personalized profile accents
  - Checkbox: Custom rounded checkbox with cyan checkmark
- Video Player:
  - Pure custom HTML5 implementation with hover control overlay, custom scrub bar, play/pause, time/duration counter, volume slider/mute, and fullscreen
- Modals:
  - Custom accessible backdrop blur overlay with centered dialog (`ShareModal`, etc.)
- Media Gallery:
  - `ImageCarousel` multi-image grid + `ImageLightbox` full-screen modal viewer
- Loading State:
  - Reusable YOIBI loading indicator with pulsating/spinning cyan glyph

## Assets
- Logo: Custom SVG feather/wing mark (viewBox `0 0 512 512`, cyan `#06b6d4`)
- Favicon: `public/favicon.svg` (cyan `#06b6d4` logo mark)
- Icons: Lucide React icons + `public/icons.svg` SVG symbols sprite (Bluesky, Discord, GitHub, X)

## Legacy References Inspected
- `.agents/skills/feature-sliced-design/SKILL.md`: Architecture guidelines for `app`, `features`, `shared`, `lib`
- `.agents/skills/landing-page-design/SKILL.md`: Conversion patterns, above-the-fold layout, social proof
- `.github/workflows/deploy.yml`: Vite build and GitHub Pages deployment workflow

## Migration Notes
- Keep: Complete visual styling, brand colors (cyan accents), tokens, fonts (Geist), animations, custom video player, 3-column layout geometry, mobile dock, landing copy and sections.
- Replace: Vite build system with Next.js App Router, React Router with Next.js navigation, plain `useState` form handling with React Hook Form, global mock data with feature-owned mock data.
- Remove:
  - TypeScript types and `.tsx` extensions (convert to clean JavaScript `.js`)
  - Obsolete signup fields: completely remove `favoriteColor`, color picker, positive message textarea, theme toggle buttons, language selector, and country selector from signup
  - Client-only mock storage (replaced by Better Auth and documented backend API clients)


