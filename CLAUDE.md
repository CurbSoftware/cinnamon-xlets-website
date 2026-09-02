# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---
Do NOT use em-dashes nor emojis unless explicitly instructed to do so, ever.  Do not use "\u2014" symbol anywhere, change and code or text copy found during tasks to remove them.
Write all user facing text in a human-friendly way. Humanize writing by:
- using natural working voice: direct, clear, slightly informal. 
- cutting any sentence that doesn't add new information. 
- using short punchy sentences, rhetorical fragments, and analogies.
- avoiding overly promotional words like 'game-changing' or 'unlock.'
- including personal anecdotes where appropriate.
---

## What this is

Marketing site for five Linux Mint Cinnamon desklets and applets (xlets) by
RobertAlexanderH / CurbSoftware. Static Astro 7 site deployed to Cloudflare
Workers static assets on `xlets.curbsoftware.com`.

The xlets live in the sibling monorepo `/home/user/projects/cinnamon-monorepo`.
Each also has a standalone publish repo under `github.com/RobertAlexanderH/`.
This site never edits those; it only reads screenshots from the monorepo via
the sync script and mirrors versions in content frontmatter.

## Commands

```bash
pnpm dev          # astro dev server
pnpm build        # build to dist/
pnpm preview      # preview the production build
pnpm check        # astro check (type errors)
pnpm test         # vitest unit tests
pnpm test:e2e     # playwright e2e (desktop, mobile, reduced-motion)
pnpm sync:assets  # copy screenshots from ../cinnamon-monorepo into src/assets
pnpm shoot        # build + preview + capture shots/ for the critic loop
pnpm deploy       # build + wrangler deploy
```

## Architecture

- `src/pages/`: `index.astro`, `xlets/[slug].astro` (five detail pages from
  content), `install.astro`, `404.astro`. `trailingSlash: 'always'`; internal
  links end with `/`.
- Content: `src/content/xlets/<slug>.md` collection, zod schema in
  `src/content/schemas.ts`. Body copy comes from the monorepo READMEs, never
  from the old curbsoftware site (its copy contains em-dashes).
- Install commands are NEVER stored in content. `src/lib/xlets.ts`
  `deriveInstall(uuid, kind)` derives the zip URL, install target, and upgrade
  path for every page so the five pages cannot drift.
- All external URLs live in `src/consts.ts`. Do not hardcode URLs elsewhere.
- Design tokens: `src/styles/tokens.css` holds the pinescale + mint palette as
  raw OKLCH triplets consumed as `oklch(var(--…))`. Never scatter raw color
  values in components. `--radius: 0` everywhere; square corners are the brand.
- Motion: vanilla IntersectionObserver only. `data-reveal` on elements,
  `data-parallax="N"` for hero depth, wired in `src/scripts/main.ts`. No
  animation libraries. Everything must be visible with JS blocked and under
  `prefers-reduced-motion: reduce`.
- Fonts: `@fontsource-variable/*` packages (Bricolage Grotesque, Hanken
  Grotesk, Spline Sans Mono). No Google Fonts requests ever.
- Theme: light and dark via `data-theme` on `<html>`, inline script in
  `BaseLayout.astro` (single source; Starlight bridge does not apply here).

## Conventions

- When a new xlet version is published in the monorepo, bump `version` in its
  `src/content/xlets/<slug>.md` in the same change. The vitest suite fails if
  the sibling monorepo is present and versions disagree.
- Screenshots are committed under `src/assets/xlets/<slug>/` with normalized
  names: `shot.webp` (hero), `config.webp` (settings window),
  `desk.webp` (optional full desktop).
- e2e specs in `e2e/`: `pages.spec.ts` (routes, single h1, nav/footer, no
  overflow, zero console errors), `shots.spec.ts` (images load, alt text),
  `install.spec.ts` (correct uuid paths, RobertAlexanderH links, copy button),
  `motion.spec.ts` (reduced-motion and JS-blocked visibility).
- Docs: engineering specs in `docs/specs/`, art direction in `docs/brief/`.
  The brief is the design contract; read it before touching section CSS.
