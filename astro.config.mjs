import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Locked stack per docs/specs/2026-09-02-xlets-site-design.md:
// static output, no adapter, directory format, trailing slash always.
export default defineConfig({
  site: 'https://xlets.curbsoftware.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  compressHTML: true,
  integrations: [sitemap()],
});
