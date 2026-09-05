import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'astro/zod';
import type { ImageFunction } from 'astro:content';
import { xletSchema } from './schemas';

const here = dirname(fileURLToPath(import.meta.url));
const ENTRIES_DIR = resolve(here, 'xlets');
// Sibling of this repo, wherever the pair is checked out. Hardcoding one
// person's home is how the version-drift check below went silently skipped.
// The second candidate covers the websites-folder layout where product
// repos live outside websites/.
const MONOREPO =
  process.env.CINNAMON_MONOREPO ??
  [
    resolve(here, '../../../cinnamon-monorepo'),
    resolve(here, '../../../../cinnamon/cinnamon-monorepo'),
  ].find((p) => existsSync(p));

// ponytail: strict-subset YAML parser, only what our frontmatter uses
// (quoted scalars, bare scalars, one nested block, string lists). If entries
// ever need richer YAML, swap for a real parser.
function parseFrontmatter(raw: string): Record<string, unknown> {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error('no frontmatter block');
  const out: Record<string, unknown> = {};
  const lines = fm[1].split('\n');
  const isListItem = (l: string) => /^\s*-\s/.test(l);
  let currentList: string[] | null = null;
  let currentMap: Record<string, string> | null = null;
  const scalar = (v: string): unknown => {
    const s = v.trim();
    if (s === 'null') return null;
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
    return s;
  };
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (isListItem(line)) {
      if (currentList !== null) currentList.push(String(scalar(line.trim().slice(2))));
      continue;
    }
    if (line.startsWith('  ')) {
      if (currentMap !== null) {
        const m = line.trim().match(/^(\w+):\s*(.+)$/);
        if (m) currentMap[m[1]] = String(scalar(m[2]));
      }
      continue;
    }
    currentList = null;
    currentMap = null;
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (value === '') {
      const next = lines[lines.indexOf(line) + 1] ?? '';
      if (isListItem(next)) {
        currentList = [];
        out[key] = currentList;
      } else if (next.startsWith('  ')) {
        currentMap = {};
        out[key] = currentMap;
      } else {
        out[key] = null;
      }
    } else {
      out[key] = scalar(value);
    }
  }
  return out;
}

const EMOJI_OR_EMDASH =
  /\u{2014}|[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2190}-\u{21FF}]/u;

const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith('.md'));
// stand-in for the astro:content image helper: our test only needs string
// paths, the fs existence checks below do the real validation
const image = (() => z.string()) as unknown as ImageFunction;
const schema = xletSchema({ image });

describe('xlet entries', () => {
  it('has exactly five entries', () => {
    expect(files.sort()).toEqual([
      'color-timer-clock.md',
      'panel-profiles.md',
      'workspace-grid.md',
      'workspace-names.md',
      'world-clock.md',
    ]);
  });

  for (const file of files) {
    const raw = readFileSync(resolve(ENTRIES_DIR, file), 'utf8');
    const data = parseFrontmatter(raw);

    it(`${file} parses against the schema`, () => {
      const parsed = schema.parse(data);
      expect(parsed.license).toBe('GPL-2.0-or-later');
      expect(parsed.features.length).toBeGreaterThanOrEqual(3);
    });

    it(`${file} version mirrors the monorepo metadata.json`, () => {
      const meta = resolve(MONOREPO, String(data.uuid), 'metadata.json');
      if (!existsSync(meta)) return; // site builds standalone, skip
      const version = JSON.parse(readFileSync(meta, 'utf8')).version;
      expect(data.version).toBe(version);
    });

    it(`${file} image files exist`, () => {
      for (const key of ['shot', 'configShot', 'desk'] as const) {
        const rel = data[key];
        if (!rel) continue; // desk is optional
        expect(existsSync(resolve(ENTRIES_DIR, String(rel)))).toBe(true);
      }
    });

    it(`${file} has no em-dash and no emoji in body and frontmatter`, () => {
      expect(raw).not.toMatch(EMOJI_OR_EMDASH);
    });
  }
});
