// Build blind A/B comparison plates from shots/.
// A plate is two full-page screenshots side by side, labeled only LEFT and RIGHT.
// The side each candidate lands on is randomized and logged to shots/plates-map.json.
// Usage: node scripts/plates.mjs dark desktop home buttons   # candidate vs ref
//        node scripts/plates.mjs --all                       # every candidate vs every ref
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REF_NAMES = ['buttons', 'curbsoftware', 'tailwindcss'];
const CANDIDATES = ['home', 'world-clock', 'color-timer-clock', 'workspace-grid', 'workspace-names', 'panel-profiles', 'install', '404'];
const VIEWPORTS = ['desktop', 'mobile'];
// Filename nonce per run: image caches key on paths, so no plate may reuse a
// name from a previous round (critic round 2 finding).
const NONCE = Date.now().toString(36);

// Candidate/ref shots carry a per-run nonce suffix; pick the newest match.
function latestWithNonce(dir, stem) {
  if (!existsSync(dir)) return null;
  const matches = readdirSync(dir)
    .filter((f) => f === `${stem}.png` || f.startsWith(`${stem}-`))
    .map((f) => ({ f, m: statSync(resolve(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return matches[0]?.f ?? null;
}

const args = process.argv.slice(2);
const mapPath = resolve(root, 'shots/plates-map.json');
const map = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, 'utf8')) : {};
mkdirSync(resolve(root, 'shots/plates'), { recursive: true });

const LABEL_H = 64; // header strip height
const GAP = 4;

async function load(path) {
  if (!existsSync(path)) return null;
  const img = sharp(path);
  const { width = 0, height = 0 } = await img.metadata();
  return { img, width, height, path };
}

async function plate(theme, viewport, candidate, ref) {
  const candDir = resolve(root, `shots/${theme}/${viewport}`);
  const candFile = latestWithNonce(candDir, candidate);
  const refFile = latestWithNonce(resolve(root, 'shots/refs'), `${ref}-${viewport}`);
  if (!candFile || !refFile) {
    console.log(`skip ${theme}-${viewport}-${candidate}-vs-${ref}: missing source`);
    return;
  }
  const a = await load(resolve(candDir, candFile));
  const b = await load(resolve(root, 'shots/refs', refFile));
  if (!a || !b) return;

  const outName = `${theme}-${viewport}-${candidate}-vs-${ref}-${NONCE}.png`;
  const outPath = resolve(root, `shots/plates/${outName}`);
  if (existsSync(outPath) && map[outName]) {
    console.log(`skip ${outName} (exists, mapping kept)`);
    return;
  }

  // Both sides scaled to a shared width, then top-cropped to the shorter
  // scaled height (hero-first comparison; long tails diverge anyway).
  const w = Math.min(a.width, b.width, 1400);
  const aH = Math.round(a.height * (w / a.width));
  const bH = Math.round(b.height * (w / b.width));
  const h = Math.min(aH, bH);

  const leftFirst = Math.random() < 0.5;
  const sides = leftFirst ? [a, b] : [b, a];
  const labels = ['LEFT', 'RIGHT'];

  const bufs = [];
  for (let i = 0; i < sides.length; i++) {
    const label = Buffer.from(
      `<svg width="${w}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#101513"/><text x="24" y="40" fill="#9fe8c6" font-family="monospace" font-size="24">${labels[i]}</text></svg>`
    );
    bufs.push(
      await sides[i].img
        .resize({ width: w, height: h, fit: 'cover', position: 'top' })
        .composite([{ input: label, top: 0, left: 0 }])
        .png()
        .toBuffer()
    );
  }

  await sharp({
    create: { width: w * 2 + GAP, height: h, channels: 3, background: '#101513' },
  })
    .composite([
      { input: bufs[0], left: 0, top: 0 },
      { input: bufs[1], left: w + GAP, top: 0 },
    ])
    .png()
    .toFile(outPath);

  map[outName] = {
    left: leftFirst ? `candidate:${candidate}` : `ref:${ref}`,
    right: leftFirst ? `ref:${ref}` : `candidate:${candidate}`,
  };
  console.log(`plate ${outName} -> left=${map[outName].left}`);
}

const all = args.includes('--all');
if (all) {
  for (const theme of ['dark', 'light']) {
    for (const viewport of VIEWPORTS) {
      for (const c of CANDIDATES) {
        for (const r of REF_NAMES) {
          await plate(theme, viewport, c, r);
        }
      }
    }
  }
} else if (args.length >= 3) {
  const [theme, viewport, candidate, ref = 'buttons'] = args;
  await plate(theme, viewport, candidate, ref);
} else {
  console.log('usage: node scripts/plates.mjs <theme> <viewport> <candidate> [ref] | --all');
}

writeFileSync(mapPath, JSON.stringify(map, null, 2));
