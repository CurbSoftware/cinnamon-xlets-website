// Capture screenshots of every route for the critic loop.
// Usage:
//   node scripts/shoot.mjs                      # shoot local preview on :4399
//   node scripts/shoot.mjs --base http://localhost:4321
//   node scripts/shoot.mjs --refs               # shoot reference sites instead
//   node scripts/shoot.mjs --routes /,/install/ # shoot only some routes
// Output: shots/{theme}/{viewport}/{slug}.png  and shots/refs/{site}.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ROUTES = [
  ['home', '/'],
  ['world-clock', '/xlets/world-clock/'],
  ['color-timer-clock', '/xlets/color-timer-clock/'],
  ['workspace-grid', '/xlets/workspace-grid/'],
  ['workspace-names', '/xlets/workspace-names/'],
  ['panel-profiles', '/xlets/panel-profiles/'],
  ['install', '/install/'],
  ['404', '/404.html'],
];

const VIEWPORTS = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
];

const THEMES = ['dark', 'light'];

const REFS = [
  ['buttons', 'https://buttons.curbsoftware.com/'],
  ['curbsoftware', 'https://curbsoftware.com/'],
  ['tailwindcss', 'https://tailwindcss.com/'],
];

const args = process.argv.slice(2);
const refsMode = args.includes('--refs');
const baseIdx = args.indexOf('--base');
const base = refsMode ? '' : baseIdx >= 0 ? args[baseIdx + 1] : 'http://localhost:4399';
const routesIdx = args.indexOf('--routes');
const only = routesIdx >= 0 ? new Set(args[routesIdx + 1].split(',')) : null;
// Filename nonce per run: downstream image caches key on paths, so two runs
// of the same route must never share a filename (critic round 2 finding).
const NONCE = Date.now().toString(36);

mkdirSync(resolve(root, 'shots'), { recursive: true });

const browser = await chromium.launch();

async function shoot(url, out, viewport, theme) {
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 2, // crisp for the vision critic
  });
  try {
    // Reduced motion makes every reveal instant, so a fullPage capture
    // cannot clip below-fold content at opacity 0 (critic round 2 P0:
    // hollow screenshots). Belt and braces: force .reveal-in too.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(
      (t) => {
        try { localStorage.setItem('xlets-theme', t); } catch {}
      },
      theme
    );
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('reveal-in'));
    });
    await page.waitForTimeout(900); // fonts and layout settle
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter(
        (el) => getComputedStyle(el).opacity === '0'
      ).length
    );
    if (hidden > 0) {
      console.error(`HOLLOW ${url}: ${hidden} reveal elements still at opacity 0`);
      process.exitCode = 1;
    }
    await page.screenshot({ path: out, fullPage: true });
    console.log(`shot ${out}`);
  } catch (err) {
    console.error(`FAIL ${url}: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await page.close();
  }
}

if (refsMode) {
  mkdirSync(resolve(root, 'shots/refs'), { recursive: true });
  for (const [name, url] of REFS) {
    for (const [vpName, viewport] of VIEWPORTS) {
      await shoot(url, resolve(root, `shots/refs/${name}-${vpName}-${NONCE}.png`), viewport, 'dark');
    }
  }
} else {
  for (const theme of THEMES) {
    for (const [vpName, viewport] of VIEWPORTS) {
      const dir = resolve(root, `shots/${theme}/${vpName}`);
      mkdirSync(dir, { recursive: true });
      for (const [slug, path] of ROUTES) {
        if (only && !only.has(slug)) continue;
        await shoot(base + path, resolve(dir, `${slug}-${NONCE}.png`), viewport, theme);
      }
    }
  }
}

await browser.close();
