// Copy product screenshots from the sibling monorepo into src/assets/xlets/
// with normalized names: shot.webp (hero), config.webp (settings window),
// desk.webp (optional full desktop; missing only for panel-profiles, that
// is fine).
// Run: pnpm sync:assets
import { cpSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Sibling of this repo, wherever the pair is checked out. The second
// candidate covers the websites-folder layout where product repos live
// outside websites/.
const MONOREPO =
  process.env.CINNAMON_MONOREPO ??
  [
    resolve(root, '../cinnamon-monorepo'),
    resolve(root, '../../cinnamon/cinnamon-monorepo'),
  ].find((p) => existsSync(p));

// slug -> monorepo xlet directory (uuid)
const XLETS = {
  'world-clock': 'cinnamon-world-clock-desklet@curbsoftware',
  'color-timer-clock': 'cinnamon-color-timer-clock-desklet@curbsoftware',
  'workspace-grid': 'cinnamon-workspace-grid-desklet@curbsoftware',
  'workspace-names': 'cinnamon-workspace-names-applet@curbsoftware',
  'panel-profiles': 'cinnamon-panel-profiles-applet@curbsoftware',
};

if (!existsSync(MONOREPO)) {
  console.error(`monorepo not found at ${MONOREPO}; nothing to sync`);
  process.exit(1);
}

for (const [slug, uuid] of Object.entries(XLETS)) {
  const srcDir = join(MONOREPO, uuid, 'screenshots');
  const outDir = join(root, 'src', 'assets', 'xlets', slug);
  if (!existsSync(srcDir)) {
    console.error(`no screenshots dir for ${slug}: ${srcDir}`);
    process.exitCode = 1;
    continue;
  }
  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(srcDir).filter((f) => f.endsWith('.webp'));
  let copied = 0;
  for (const file of files) {
    const lower = file.toLowerCase();
    let target;
    if (lower.startsWith('fulldesktop')) target = 'desk.webp';
    else if (lower.includes('config')) target = 'config.webp';
    // <slug>-desklet.webp, <slug>-applet.webp, cinnamon-workspace-names-applet.webp
    else if (/-desklet\.webp$/.test(lower) || /-applet\.webp$/.test(lower)) target = 'shot.webp';
    if (!target) continue;
    cpSync(join(srcDir, file), join(outDir, target));
    copied++;
    console.log(`${slug}: ${file} -> ${target}`);
  }
  if (!copied) console.warn(`${slug}: no screenshots matched`);
}
