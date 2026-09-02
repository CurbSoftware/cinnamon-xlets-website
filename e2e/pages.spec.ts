import { expect, test, type Page } from '@playwright/test';

// Route gate: status, single h1, h1 visible within a beat, nav + footer,
// no horizontal overflow (desktop and mobile projects both run this file),
// zero console errors. Same discipline as the curbsoftware-web-static suite.

const XLETS = ['world-clock', 'color-timer-clock', 'workspace-grid', 'workspace-names', 'panel-profiles'];

const ROUTES: Array<{ path: string; h1: RegExp }> = [
  // home h1 is the landed hero copy (brief 4.1)
  { path: '/', h1: /your desktop/i },
  { path: '/install/', h1: /install/i },
  ...XLETS.map((slug) => ({
    path: `/xlets/${slug}/`,
    h1: /(world clock|color timer clock|workspace grid|in panel workspace name|panel profiles)/i,
  })),
];

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

for (const route of ROUTES) {
  test(`renders ${route.path}`, async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    const res = await page.goto(route.path);
    expect(res?.status()).toBe(200);
    await page.waitForLoadState('load');

    // Document chrome
    expect(await page.title()).not.toBe('');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);

    // Single h1 carrying the route's subject
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(route.h1);

    // Nav and footer chrome present, nav links the two site surfaces
    await expect(page.locator('header[data-nav]')).toBeVisible();
    await expect(page.locator('footer#footer')).toBeAttached();
    await expect(page.locator('header[data-nav] a[href="/install/"]')).toHaveCount(1);
    await expect(page.locator('header[data-nav] a[href="/#xlets"]')).toHaveCount(1);

    // No horizontal overflow at this project's viewport
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Content visible within a beat: the reveal system must not strand the h1
    await expect
      .poll(
        async () => Number(await page.locator('h1').evaluate((el) => getComputedStyle(el).opacity)),
        { timeout: 1500 },
      )
      .toBeGreaterThan(0.5);

    expect(errors).toEqual([]);
  });
}

// Unknown routes serve the styled 404 with a real 404 status (preview and
// Cloudflare both map it to 404.html via not_found_handling).
test('unknown routes serve the styled 404 page', async ({ page }) => {
  const res = await page.goto('/no-such-tile/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText(/no tile here/i);
  await expect(page.locator('main').getByRole('link', { name: /back to the desktop/i })).toBeVisible();
});

test('the 404 file itself is fetchable', async ({ page }) => {
  const res = await page.goto('/404.html');
  expect(res?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText(/no tile here/i);
});

test('sitemap and robots exist', async ({ request }) => {
  const sm = await request.get('/sitemap-index.xml');
  expect(sm.status()).toBe(200);
  expect(await sm.text()).toContain('sitemap-0.xml');
  const s0 = await request.get('/sitemap-0.xml');
  expect(s0.status()).toBe(200);
  const xml = await s0.text();
  for (const path of ['/', '/install/', ...XLETS.map((s) => `/xlets/${s}/`)]) {
    expect(xml).toContain(path);
  }
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap:');
});

// 200% zoom / viewport squeeze. Method: 200% browser zoom on a 1280px-wide
// window reflows the page to a 640 CSS px layout viewport (deviceScaleFactor
// only sharpens rendering; layout math is driven by CSS pixels, so asserting
// at 640 is the faithful 200% reflow check). 320px is the narrow floor.
// Bars: no horizontal overflow, and header controls must not cram together.
test('no overflow or control cram at 200% zoom (640 CSS px) and 320px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'viewport is set explicitly inside the test');

  for (const width of [640, 320]) {
    await page.setViewportSize({ width, height: 640 });
    for (const route of [...ROUTES.map((r) => r.path), '/404.html']) {
      await page.goto(route);
      await page.waitForLoadState('load');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${route} @${width}px`).toBeLessThanOrEqual(1);

      const rects = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.site-header a, .site-header button')).map(
          (el) => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          },
        ),
      );
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const overlap =
            Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 1 &&
            Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1;
          expect(overlap, `header controls ${i} and ${j} overlap at ${route} @${width}px`).toBe(
            false,
          );
        }
      }
    }
  }
});
