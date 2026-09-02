import { expect, test } from '@playwright/test';

// Images load (naturalWidth > 0) and carry alt text everywhere they appear.
// Broken-src collection waits on img.decode() so in-flight loads are not
// false failures.

const XLETS = [
  { slug: 'world-clock', name: 'World Clock' },
  { slug: 'color-timer-clock', name: 'Color Timer Clock' },
  { slug: 'workspace-grid', name: 'Workspace Grid' },
  { slug: 'workspace-names', name: 'In Panel Workspace Name' },
  { slug: 'panel-profiles', name: 'Panel Profiles' },
];

/** srcs of every img that finished loading without producing pixels.
 *  complete && naturalWidth === 0 means a real fetch failure; off-screen
 *  lazy images that simply have not fetched yet are not broken. decode()
 *  is deliberately avoided: it never resolves for lazy off-screen imgs. */
async function brokenImages(page: import('@playwright/test').Page): Promise<string[]> {
  await page.evaluate(() => {
    // give lazy images one pass through the page
    window.scrollTo(0, document.body.scrollHeight);
  });
  return page.evaluate(() =>
    [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.getAttribute('src') ?? img.currentSrc),
  );
}

for (const slug of XLETS.map((x) => x.slug)) {
  test(`images load on /xlets/${slug}/`, async ({ page }) => {
    await page.goto(`/xlets/${slug}/`);
    const images = page.locator('main img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt', /.+/);
    }
    expect(await brokenImages(page)).toEqual([]);
  });
}

// Detail pages show their hero shot: exactly one hero image (framed inside
// the hero, or the full-bleed band variant on workspace-names), loaded,
// alt naming the xlet.
for (const { slug, name } of XLETS) {
  test(`hero shot renders on /xlets/${slug}/`, async ({ page }) => {
    await page.goto(`/xlets/${slug}/`);
    const hero = page.locator('.xlet-hero img, .xlet-bandhero img');
    await expect(hero).toHaveCount(1);
    await expect(hero.first()).toHaveAttribute('alt', new RegExp(name, 'i'));
    expect(await brokenImages(page)).toEqual([]);
  });
}

// Anywhere else images appear, they must load and be labeled.
for (const path of ['/', '/install/', '/404.html']) {
  test(`every image on ${path} loads with alt text`, async ({ page }) => {
    await page.goto(path);
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt', /.+/);
    }
    expect(await brokenImages(page)).toEqual([]);
  });
}

// Home must link all five detail pages and show one screenshot sliver per
// index row (the home agent's index has landed).
test('home links all five xlet pages', async ({ page }) => {
  await page.goto('/');
  for (const { slug } of XLETS) {
    await expect(page.locator(`main a[href="/xlets/${slug}/"]`)).toHaveCount(1);
  }
});

test('home index rows show five images', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main img')).toHaveCount(5);
  expect(await brokenImages(page)).toEqual([]);
});
