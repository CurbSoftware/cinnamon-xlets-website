import { expect, test } from '@playwright/test';

// Install commands derive from uuid + kind (src/lib/xlets.ts). These tests
// hardcode the five uuid expectations on purpose: if the rendered page ever
// drifts from the derivation, they fail here first. Verified against the
// monorepo READMEs (curl -fLO the release zip, unzip -o, mkdir -p the family
// dir, rm -rf the target, cp -r the files tree back in; settings in
// ~/.config/cinnamon/spices/).

const FIVE = [
  {
    slug: 'world-clock',
    uuid: 'cinnamon-world-clock-desklet@curbsoftware',
    repo: 'cinnamon-world-clock-desklet',
    family: 'desklets',
  },
  {
    slug: 'color-timer-clock',
    uuid: 'cinnamon-color-timer-clock-desklet@curbsoftware',
    repo: 'cinnamon-color-timer-clock-desklet',
    family: 'desklets',
  },
  {
    slug: 'workspace-grid',
    uuid: 'cinnamon-workspace-grid-desklet@curbsoftware',
    repo: 'cinnamon-workspace-grid-desklet',
    family: 'desklets',
  },
  {
    slug: 'workspace-names',
    uuid: 'cinnamon-workspace-names-applet@curbsoftware',
    repo: 'cinnamon-workspace-names-applet',
    family: 'applets',
  },
  {
    slug: 'panel-profiles',
    uuid: 'cinnamon-panel-profiles-applet@curbsoftware',
    repo: 'cinnamon-panel-profiles-applet',
    family: 'applets',
  },
];

const PLANS = FIVE.map((x) => ({
  ...x,
  zipUrl: `https://github.com/CurbSoftware/${x.repo}/releases/latest/download/${x.repo}.zip`,
  targetDir: `~/.local/share/cinnamon/${x.family}/${x.uuid}`,
}));

test('/install/ shows exactly five command blocks, one per xlet', async ({ page }) => {
  await page.goto('/install/');
  const index = page.locator('.install-index');
  await expect(index.locator('.copy-block')).toHaveCount(5);
  // ids unique per slug: every copy target and button pairs up 1:1
  const ids = await index.locator('.copy-block pre').evaluateAll((els) =>
    els.map((el) => el.id),
  );
  expect(new Set(ids).size).toBe(5);
});

test('the flow spells the four steps, the restart, and the settings path', async ({ page }) => {
  await page.goto('/install/');
  const flow = page.locator('.install-flow');
  for (const num of ['01', '02', '03', '04']) {
    await expect(flow.getByText(num, { exact: true })).toBeVisible();
  }
  const body = page.locator('main');
  await expect(body).toContainText('Alt');
  await expect(body).toContainText('F2');
  await expect(body).toContainText('~/.config/cinnamon/spices/');
  await expect(body).toContainText('~/.local/share/cinnamon/');
});

for (const x of PLANS) {
  test(`/install/ row ${x.slug} matches deriveInstall output`, async ({ page }) => {
    await page.goto('/install/');
    const row = page.locator(`[data-xlet-slug="${x.slug}"]`);
    await expect(row).toHaveCount(1);
    // release zip URL, target dir, and the files-tree copy path
    await expect(row).toContainText(x.zipUrl);
    await expect(row).toContainText(x.targetDir);
    await expect(row).toContainText(`rm -rf ${x.targetDir}`);
    await expect(row).toContainText(`${x.uuid}/files/${x.uuid}`);
    // links to its detail page and to its repo
    await expect(row.locator(`a[href="/xlets/${x.slug}/"]`)).toHaveCount(1);
    await expect(row.locator(`a[href="https://github.com/CurbSoftware/${x.repo}"]`)).toHaveCount(1);
  });
}

test('every copy button exists with an accessible name and a labeled target', async ({ page }) => {
  await page.goto('/install/');
  const buttons = page.locator('main [data-copy]');
  const count = await buttons.count();
  expect(count).toBeGreaterThanOrEqual(7); // five rows + two flow steps
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    await expect(button).toHaveAccessibleName(/copy/i);
    const targetId = await button.getAttribute('data-copy');
    expect(targetId).toBeTruthy();
    const target = page.locator(`#${targetId}`);
    await expect(target).toHaveCount(1);
    await expect(target).toHaveAttribute('aria-label', /.+/);
  }
});

test.describe('clipboard', () => {
  test.use({ permissions: ['clipboard-write', 'clipboard-read'] });
  test('copying from a command block reports success and copies the unwrapped commands', async ({ page }) => {
    await page.goto('/install/');
    const block = page.locator('.install-index .copy-block').first();
    await block.locator('[data-copy]').click();
    // the status line inside the SAME block, not the page's first
    await expect(block.locator('[data-copy-status]')).toHaveText(/copied/i);
    // the <wbr> break opportunities after / and @ are visual only: the
    // clipboard receives the exact unwrapped command lines
    const worldClock = PLANS[0];
    const expected = [
      `curl -fLO ${worldClock.zipUrl}`,
      `unzip -o ${worldClock.repo}.zip`,
      `mkdir -p ~/.local/share/cinnamon/${worldClock.family}`,
      `rm -rf ${worldClock.targetDir}`,
      `cp -r ${worldClock.uuid}/files/${worldClock.uuid} ${worldClock.targetDir}`,
    ].join('\n');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  });
});

test('every external GitHub link on /install/ points at CurbSoftware', async ({ page }) => {
  await page.goto('/install/');
  const hrefs = await page.locator('main a[href]').evaluateAll((els) =>
    els.map((el) => (el as HTMLAnchorElement).getAttribute('href') ?? ''),
  );
  const github = hrefs.filter((href) => href.includes('github.com'));
  expect(github.length).toBeGreaterThanOrEqual(5);
  for (const href of github) {
    expect(href.startsWith('https://github.com/CurbSoftware/')).toBe(true);
  }
  // the old personal account must not appear anywhere in the content area
  expect(hrefs.filter((href) => /RobertAlexanderH/.test(href))).toEqual([]);
});

test('the commands survive a second run', async ({ page }) => {
  await page.goto('/install/');
  const body = await page.evaluate(() => document.querySelector('main')?.textContent ?? '');
  // unzip without -o stops at an interactive overwrite prompt on the upgrade
  // run and eats the rest of the pasted block. This is the whole bug.
  expect(body).toContain('unzip -o ');
  expect(body).not.toMatch(/unzip (?!-o)/);
  // the family dir does not exist on a machine with no desklets or applets yet
  expect(body).toContain('mkdir -p ~/.local/share/cinnamon/');
});

for (const { slug, repo, family } of FIVE) {
  test(`/xlets/${slug}/ carries its derived install commands`, async ({ page }) => {
    await page.goto(`/xlets/${slug}/`);
    // textContent, not innerText: the git tab is display:none until its
    // radio is checked (CSS-only tabs), and innerText drops hidden panels
    const body = await page.evaluate(() => document.querySelector('main')?.textContent ?? '');
    expect(body).toContain(`https://github.com/CurbSoftware/${repo}/releases/latest/download/${repo}.zip`);
    expect(body).toContain(`~/.local/share/cinnamon/${family}/${repo}@curbsoftware`);
    expect(body).toContain(`git clone https://github.com/CurbSoftware/${repo}.git`);
  });
}
