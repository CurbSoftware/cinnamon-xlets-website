# xlets

Marketing site for five Linux Mint Cinnamon desklets and applets by
RobertAlexanderH / CurbSoftware. Static Astro site deployed to Cloudflare
Workers static assets at `xlets.curbsoftware.com`.

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

## Deploy

`pnpm deploy` builds and runs `wrangler deploy` against the config in
`wrangler.jsonc`: static assets from `dist/`, custom domain
`xlets.curbsoftware.com`, `not_found_handling: "404-page"`.

## Docs

- `CLAUDE.md`: working conventions, house writing rules.
- `docs/specs/2026-09-02-xlets-site-design.md`: the engineering contract.
- `docs/brief/2026-09-02-art-direction.txt`: the design contract. Read it
  before touching section CSS.

The five xlets live in the sibling monorepo `../cinnamon-monorepo`; this site
never edits them. Screenshots come over via `pnpm sync:assets`, versions are
mirrored in content frontmatter and verified by vitest when the monorepo is
present.
