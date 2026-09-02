import { expect, test, type Page } from '@playwright/test';

// Keyboard gate: no mouse anywhere in this file. Locks the critical paths:
// tab order reaches nav, toggle, tab radios, copy buttons, footer links;
// skip-link shows and jumps; focus is always visibly marked; radios arrow;
// copy buttons fire on Enter and Space and report Copied.

const XLETS = ['world-clock', 'color-timer-clock', 'workspace-grid', 'workspace-names', 'panel-profiles'];
const ROUTES = ['/', '/install/', ...XLETS.map((s) => `/xlets/${s}/`), '/404.html'];

interface Stop {
  key: string; // tag#id.class
  text: string;
  href: string;
  outline: { style: string; width: string; color: string };
}

/** Press Tab until focus wraps back to the first stop, snapshotting each. */
async function tabWalk(page: Page, max = 100): Promise<Stop[]> {
  const stops: Stop[] = [];
  const grab = (): Promise<Stop> =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) {
        return { key: 'body', text: '', href: '', outline: { style: '', width: '', color: '' } };
      }
      const cs = getComputedStyle(el);
      return {
        key: `${el.tagName.toLowerCase()}#${el.id}.${(el.getAttribute('class') ?? '')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .join('.')}`,
        text: (el.textContent ?? '').trim().slice(0, 24),
        href: el instanceof HTMLAnchorElement ? el.getAttribute('href') ?? '' : '',
        outline: { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor },
      };
    });
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const stop = await grab();
    if (stop.key === 'body') continue; // focus transits browser chrome at the wrap
    if (stops.length > 0 && stop.key === stops[0].key && stop.text === stops[0].text) break; // wrapped
    stops.push(stop);
  }
  return stops;
}

const is = (stop: Stop, frag: string) => stop.key.includes(frag) || stop.href === frag;

for (const route of ROUTES) {
  test(`keyboard: ${route} tab order covers chrome and content`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('load');
    const stops = await tabWalk(page);

    // First Tab surfaces the skip link
    expect(stops[0]?.key, `first stop was ${stops[0]?.key}`).toContain('skip-link');

    // Nav links are reached, before the theme toggle
    const nav = stops.findIndex((s) => is(s, 'site-header__link'));
    const toggle = stops.findIndex((s) => is(s, 'theme-toggle'));
    expect(nav).toBeGreaterThanOrEqual(0);
    expect(toggle).toBeGreaterThan(nav);

    // Footer is the last stop before wrap: its final link is the buttons site
    const last = stops[stops.length - 1];
    expect(last?.key.startsWith('a'), `last stop was ${last?.key}`).toBe(true);
    expect(last?.href).toContain('buttons.curbsoftware.com');

    // Focus keeps moving: a trap would freeze the walk on a handful of stops
    expect(new Set(stops.map((s) => s.key + s.text)).size).toBeGreaterThan(12);

    // Copy buttons are keyboard reachable wherever CopyBlock renders
    if (route !== '/' && route !== '/404.html') {
      expect(stops.some((s) => is(s, 'copy-block__btn'))).toBe(true);
    }
    // Install tab radios are keyboard reachable on every xlet page
    if (route.startsWith('/xlets/')) {
      expect(stops.some((s) => is(s, 'install-tabs__input'))).toBe(true);
    }
  });

  test(`keyboard: ${route} focused stops carry a visible outline`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('load');
    const stops = await tabWalk(page);
    // Sample: skip link, one nav link, theme toggle (present everywhere)
    const samples = stops.filter((s) =>
      ['skip-link', 'site-header__link', 'theme-toggle'].some((f) => is(s, f)),
    );
    expect(samples.length).toBeGreaterThanOrEqual(3);
    for (const s of samples) {
      expect(s.outline.style, `${s.key} outline style`).not.toBe('none');
      expect(s.outline.width, `${s.key} outline width`).not.toBe('0px');
    }
  });
}

test('keyboard: skip link shows on first Tab and Enter jumps to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('#main')).toBeInViewport();
});

test('keyboard: theme toggle activates with Enter and flips the theme', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('[data-theme-toggle]').focus();
  await page.keyboard.press('Enter');
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
  await expect(page.locator('[data-theme-toggle]')).toBeFocused();
});

test('keyboard: install tab radios switch with arrow keys and do not trap', async ({ page }) => {
  await page.goto('/xlets/world-clock/');
  const zip = page.locator('#install-world-clock-zip');
  const git = page.locator('#install-world-clock-git');
  await zip.focus();
  await expect(zip).toBeChecked();
  await expect(page.locator('.install-tabs__panel--zip')).toBeVisible();

  await page.keyboard.press('ArrowRight');
  await expect(git).toBeChecked();
  await expect(git).toBeFocused();
  await expect(page.locator('.install-tabs__panel--git')).toBeVisible();
  await expect(page.locator('.install-tabs__panel--zip')).toBeHidden();

  await page.keyboard.press('ArrowLeft');
  await expect(zip).toBeChecked();
  await expect(page.locator('.install-tabs__panel--zip')).toBeVisible();

  // Focus ring for the checked radio lands on its tab label
  const labelOutline = await page.evaluate(() => {
    const input = document.activeElement as HTMLElement;
    const label = input.nextElementSibling as HTMLElement;
    const cs = getComputedStyle(label);
    return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`;
  });
  expect(labelOutline).not.toBe(/^none/);
  expect(labelOutline).not.toContain('0px');

  // No trap: Tab still leaves the radio group
  await page.keyboard.press('Tab');
  const moved = await page.evaluate(() => document.activeElement?.id);
  expect(moved).not.toBe('install-world-clock-zip');
});

test('keyboard: copy button fires on Enter and Space and reports Copied', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/install/');
  const button = page.locator('[data-copy="install-flow-download"]');
  const status = page.locator('[data-copy-status]').first();
  await expect(button).toBeVisible(); // JS has unhidden it
  await button.focus();

  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Copied.');
  await expect
    .poll(() => status.textContent(), { timeout: 4000 })
    .toBe('');

  await button.focus();
  await page.keyboard.press('Space');
  await expect(status).toHaveText('Copied.');
});
