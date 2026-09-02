// Generate public/og-default.jpg: 1200x630, pinescale graphite, one mint
// tile outlined, the wordmark. Placeholder default; per-xlet OG images are
// generated from their hero shots by astro:assets getImage at build time.
// Run: node scripts/make-og.mjs
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="oklch(0.145 0.006 168)"/>
  <rect x="0" y="0" width="1200" height="2" fill="oklch(0.84 0.17 152 / 0.6)"/>
  <rect x="140" y="180" width="270" height="270" fill="none" stroke="oklch(0.84 0.17 152)" stroke-width="3"/>
  <rect x="196" y="236" width="158" height="158" fill="none" stroke="oklch(0.84 0.17 152 / 0.45)" stroke-width="1.5"/>
  <text x="500" y="330" font-family="DejaVu Sans, sans-serif" font-size="130" font-weight="bold" letter-spacing="-4" fill="oklch(0.967 0.003 168)">xlets</text>
  <text x="504" y="384" font-family="DejaVu Sans Mono, monospace" font-size="26" letter-spacing="6" fill="oklch(0.705 0.007 168)">LINUX MINT CINNAMON</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile('public/og-default.jpg');
console.log('public/og-default.jpg written');
