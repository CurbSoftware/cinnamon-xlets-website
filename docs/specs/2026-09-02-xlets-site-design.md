# Xlets Site Design Spec

Date: 2026-09-02
Status: approved
Owner: CurbSoftware

## Context

Five original Cinnamon xlets (three desklets, two applets) live in the
cinnamon-monorepo with standalone publish repos under RobertAlexanderH. They
have no dedicated home on the web. The CurbSoftware company site carries short
project entries but is not a product showcase, and its GitHub links are stale.

This site is that home: `xlets.curbsoftware.com`, a static showcase with one
detail page per xlet plus a shared install page. The quality bar is the two
sibling sites: curbsoftware.com and buttons.curbsoftware.com. This spec plus
the art direction brief in `docs/brief/` are the contract.

## Stack (locked)

- Astro 7, `output: 'static'`, no adapter, `trailingSlash: 'always'`,
  directory build format, compressHTML.
- pnpm. Dependencies: astro, @astrojs/sitemap, three @fontsource-variable
  packages. Dev: wrangler, sharp, vitest, @playwright/test, typescript,
  @astrojs/check.
- Deploy: Cloudflare Workers static assets. `wrangler.jsonc`:
  `assets.directory: ./dist`, `not_found_handling: "404-page"`,
  `html_handling: "auto-trailing-slash"`, custom domain route
  `xlets.curbsoftware.com`, worker name `cinnamon-xlets-website`.
- No UI framework, no animation library, no Tailwind, no analytics scripts.

## Content source of truth

| Field | Source |
|---|---|
| version | `../cinnamon-monorepo/<uuid>/metadata.json` (vitest fails on mismatch) |
| tagline, summary, features, story | monorepo READMEs, em-dash scrubbed |
| settings showcase labels | `settings-schema.json` per xlet |
| screenshots | monorepo `<uuid>/screenshots/*.webp` via `pnpm sync:assets` |
| repo URLs | `github.com/RobertAlexanderH/<repo>` |

The five xlets:

| Slug | Kind | Version | Accent hue |
|---|---|---|---|
| world-clock | desklet | 1.1.0 | 240 (sky) |
| color-timer-clock | desklet | 1.7.0 | 75 (schedule amber) |
| workspace-grid | desklet | 1.3.1 | 152 (mint) |
| workspace-names | applet | 1.2.0 | 300 (violet) |
| panel-profiles | applet | 1.4.0 | 25 (rose) |

Derived-from credits (must appear on the detail pages): world-clock derives
from TimeAndDate@nightflame; workspace-names derives from
workspace-name@willurd.

## Routes

| Route | Purpose |
|---|---|
| `/` | Hero with live micro-desktop, timezone ticker, xlet index, editorial, install overview, spec strip, final CTA |
| `/xlets/<slug>/` | Five detail pages from the content collection |
| `/install/` | Release zip flow, git alternative, upgrade path, settings survival, per-xlet command index |
| `/404.html` | Styled 404 |

Sitemap via @astrojs/sitemap, robots.txt with Sitemap line, JSON-LD
SoftwareApplication on detail pages, OG images from the xlet hero shots via
astro:assets `getImage`.

## Anti-drift rules

1. Install commands derive from `uuid + kind` in `src/lib/xlets.ts`. Never
   store them in content files or components.
2. All URLs in `src/consts.ts`.
3. Version frontmatter must match the monorepo; enforced by vitest reading
   `../cinnamon-monorepo/<uuid>/metadata.json` when present (skip when absent,
   so the site builds standalone).
4. Body copy scanned by vitest for U+2014 and emoji: the house rules become
   a mechanical gate.

## Engineering phases

1. Foundation (serial): scaffold, configs, tokens, BaseLayout, Nav, Footer,
   ThemeToggle, consts, content model + five entries, lib/xlets + tests, sync
   script, shared ui/ and xlet/ components, stub pages, favicon, robots.
   Gate: `pnpm check` 0 errors, `pnpm test` green, build emits 8 routes +
   sitemap, no external font requests, preview serves everything,
   `wrangler deploy --dry-run` clean.
2. Parallel page build (four agents, disjoint file ownership): home;
   world-clock + color-timer-clock; workspace-grid + workspace-names +
   panel-profiles; install page + e2e specs. Gate per agent: real content
   renders, check clean, no horizontal overflow 320 to 1920 px, content
   visible with JS blocked and under reduced motion.
3. Integration (serial): reveal and parallax attributes wired, main.ts
   final, hero live clocks. Gate: full e2e green, client JS under about
   15 KB gzipped, zero console errors.
4. Critic loop: screenshot all routes (desktop 1440x900, mobile 390x844,
   light and dark), harsh critic agent scores via vision MCP, blind A/B
   against the two siblings and tailwindcss.com, findings routed to owners,
   re-shoot, repeat. SHIP = score 8+ with zero P0/P1. Max 3 rounds.
5. Hardening: Lighthouse mobile (perf 90, a11y 95, best practices 95, SEO
   95), contrast (body 7:1, large and UI 4.5:1, both themes), keyboard pass,
   200% zoom.
6. Deploy: `pnpm deploy`, attach custom domain, live checks.

## Verification (definition of done)

- `pnpm check` 0 errors; `pnpm test` green; `pnpm test:e2e` green on all
  three Playwright projects.
- Zero console errors; no horizontal overflow at any tested width; content
  visible with JS blocked and under reduced motion.
- Lighthouse mobile: perf >= 90, a11y >= 95, best practices >= 95, SEO >= 95.
- Contrast: body >= 7:1, large text and UI >= 4.5:1, both themes.
- Fonts self-hosted; every image has alt text; install commands verified
  against the monorepo READMEs.
- Critic SHIP on all routes x 2 viewports x 2 themes; blind A/B not
  systematically losing to either sibling.

## Risks

1. Spices merges are in flight. `spicesUrl` is nullable; install leads with
   the GitHub release zip until merges land.
2. workspace-names screenshots are extreme panel strips (487x85 master).
   Its hero is a full-bleed band treatment, not a boxed image.
3. Linux Mint is referenced nominatively only. No Mint logos, no Mint
   trademark green; the palette is mint-adjacent by design, not trade dress.
4. Known follow-up (other repo): curbsoftware-web-static carries five stale
   CurbSoftware/cinnamon-* GitHub links. Fix there after this ships.

## Out of scope

Starlight docs section, blog, analytics, newsletter, contact forms, client
frameworks. The READMEs on GitHub remain the deep documentation; the detail
pages carry settings showcases and install instructions.
