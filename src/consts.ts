// Single source of truth for site metadata and every external URL.
// Do not hardcode URLs anywhere else. See docs/specs/2026-09-02-xlets-site-design.md.

export const SITE = {
  name: 'xlets',
  url: 'https://xlets.curbsoftware.com',
  description:
    'Five Linux Mint Cinnamon desklets and applets: world clocks, color timer schedules, workspace grid, in-panel workspace names, and panel profiles. Open source, GPL-2.0+.',
} as const;

export const LINKS = {
  org: 'https://github.com/RobertAlexanderH',
  repos: {
    'world-clock': 'https://github.com/RobertAlexanderH/cinnamon-world-clock-desklet',
    'color-timer-clock': 'https://github.com/RobertAlexanderH/cinnamon-color-timer-clock-desklet',
    'workspace-grid': 'https://github.com/RobertAlexanderH/cinnamon-workspace-grid-desklet',
    'workspace-names': 'https://github.com/RobertAlexanderH/cinnamon-workspace-names-applet',
    'panel-profiles': 'https://github.com/RobertAlexanderH/cinnamon-panel-profiles-applet',
  },
  monorepo: 'https://github.com/CurbSoftware/cinnamon-monorepo',
  curbsoftware: 'https://curbsoftware.com',
  buttons: 'https://buttons.curbsoftware.com',
} as const;

export type XletSlug = keyof typeof LINKS.repos;
