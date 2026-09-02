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
