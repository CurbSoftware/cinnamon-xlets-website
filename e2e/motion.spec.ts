import { expect, test } from '@playwright/test';

// Motion rules (brief section 8): [data-reveal] elements enter .reveal-in
// when scrolled into view; under reduced-motion emulation content is
// visible immediately; with JS blocked all content is visible. These test
// the contract in styles/motion.css + scripts/main.ts, not implementation
// details of the page agents.

const XLETS = ['world-clock', 'color-timer-clock', 'workspace-grid', 'workspace-names', 'panel-profiles'];
const ROUTES = ['/', '/install/', ...XLETS.map((s) => `/xlets/${s}/`)];

test.describe('reduced motion', () => {
  for (const path of ROUTES) {
    test(`all reveal content is immediately visible on ${path}`, async ({ page }) => {
      // only meaningful where the browser emulates reduced motion
      // (the reduced-motion playwright project)
      const emulated = await page.evaluate(() =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      );
      test.skip(!emulated, 'reduced motion not emulated in this project');
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();

      // no scrolling, no settling time: every reveal is forced visible
      const reveals = page.locator('[data-reveal]');
      const count = await reveals.count();
      for (let i = 0; i < count; i++) {
        const style = await reveals.nth(i).evaluate((el) => {
          const cs = getComputedStyle(el);
          return { opacity: cs.opacity, transform: cs.transform, duration: cs.transitionDuration };
        });
        expect(style.opacity).toBe('1');
        expect(style.transform).toBe('none');
        expect(style.duration === '0s' || style.duration === '').toBeTruthy();
      }
    });
  }
});

test('reveal elements get .reveal-in when scrolled into view', async ({ page }) => {
  // desktop/mobile projects: motion runs. The install page owns enough
  // below-the-fold content to prove the observer contract end to end.
  await page.goto('/install/');
  const rows = page.locator('.install-index__row');
  await expect(rows).toHaveCount(5);
  const last = rows.nth(4);
  await last.scrollIntoViewIfNeeded();
  await expect
    .poll(async () => last.evaluate((el) => el.classList.contains('reveal-in')), { timeout: 4000 })
    .toBe(true);
});

async function visibleH1Opacity(page: import('@playwright/test').Page): Promise<number> {
  return Number(await page.locator('h1').evaluate((el) => getComputedStyle(el).opacity));
}

test('content is visible with JavaScript blocked', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  // install page: headings, commands, and index rows all render server-side
  await page.goto('/install/');
  expect(await visibleH1Opacity(page)).toBe(1);
  await expect(page.locator('main').getByText(/curl -fLO/).first()).toBeVisible();
  await expect(page.locator('[data-xlet-slug]')).toHaveCount(5);
  // copy buttons stay hidden: nothing appears broken without JS
  await expect(page.locator('[data-copy]').first()).toBeHidden();

  // home: the index links survive
  await page.goto('/');
  expect(await visibleH1Opacity(page)).toBe(1);
  for (const slug of XLETS) {
    await expect(page.locator(`main a[href="/xlets/${slug}/"]`)).toHaveCount(1);
  }

  await context.close();
});

// Ticker contract (landed): the marquee loop is CSS-only, so with JS
// blocked the sr-only static line and the baked build-time times must still
// read as real HH:MM strings for every zone.
test('ticker fallback carries real times with JavaScript blocked', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.ticker')).toHaveCount(1);
  const line = page.locator('.ticker .visually-hidden');
  await expect(line).toContainText('VANCOUVER');
  await expect(line).toContainText('LONDON');
  await expect(line).toContainText('TOKYO');
  const times = await page.locator('[data-clock]').allTextContents();
  expect(times.length).toBeGreaterThanOrEqual(4);
  for (const t of times) expect(t.trim()).toMatch(/^\d{1,2}:\d{2}$/);
  await context.close();
});
