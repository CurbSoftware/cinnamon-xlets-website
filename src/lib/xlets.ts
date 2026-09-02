// astro:content is a virtual module: importing it eagerly would break vitest,
// which runs these pure helpers without the Astro runtime. Import it lazily
// inside the functions that need it.
import type { CollectionEntry } from 'astro:content';

export type XletEntry = CollectionEntry<'xlets'>;
export type XletKind = 'desklet' | 'applet';

export interface InstallPlan {
  zipUrl: string;
  targetDir: string;
  commands: { zip: string[]; git: string[] };
}

// uuid -> standalone publish repo under RobertAlexanderH. Kept here (not in
// consts) on purpose: install commands derive from uuid + kind, never from
// content files, so the five pages cannot drift. Shape matches the monorepo
// README manual install sections (curl -fLO the release zip, unzip, rm -rf
// the target, cp -r the files tree back in).
const REPO_BY_UUID: Record<string, string> = {
  'cinnamon-world-clock-desklet@curbsoftware': 'cinnamon-world-clock-desklet',
  'cinnamon-color-timer-clock-desklet@curbsoftware': 'cinnamon-color-timer-clock-desklet',
  'cinnamon-workspace-grid-desklet@curbsoftware': 'cinnamon-workspace-grid-desklet',
  'cinnamon-workspace-names-applet@curbsoftware': 'cinnamon-workspace-names-applet',
  'cinnamon-panel-profiles-applet@curbsoftware': 'cinnamon-panel-profiles-applet',
};

export function deriveInstall(uuid: string, kind: XletKind): InstallPlan {
  const repo = REPO_BY_UUID[uuid];
  if (!repo) throw new Error(`unknown uuid: ${uuid}`);
  const family = kind === 'desklet' ? 'desklets' : 'applets';
  const targetDir = `~/.local/share/cinnamon/${family}/${uuid}`;
  const zipUrl = `https://github.com/RobertAlexanderH/${repo}/releases/latest/download/${repo}.zip`;
  return {
    zipUrl,
    targetDir,
    commands: {
      zip: [
        `curl -fLO ${zipUrl}`,
        `unzip ${repo}.zip`,
        `rm -rf ${targetDir}`,
        `cp -r ${uuid}/files/${uuid} ${targetDir}`,
      ],
      git: [
        `git clone https://github.com/RobertAlexanderH/${repo}.git`,
        `cd ${repo}`,
        `rm -rf ${targetDir}`,
        `cp -r files/${uuid} ${targetDir}`,
      ],
    },
  };
}

export async function getXlets(): Promise<XletEntry[]> {
  const { getCollection } = await import('astro:content');
  const all = await getCollection('xlets');
  return sortByOrder(all);
}

export function sortByOrder(entries: XletEntry[]): XletEntry[] {
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}

/** prev/next neighbors in the ordered set, wrapping around at both ends */
export function nextPrevIn(entries: XletEntry[], slug: string): { prev: XletEntry; next: XletEntry } {
  const sorted = sortByOrder(entries);
  const i = sorted.findIndex((e) => e.id === slug);
  if (i === -1) throw new Error(`unknown slug: ${slug}`);
  const n = sorted.length;
  return { prev: sorted[(i - 1 + n) % n], next: sorted[(i + 1) % n] };
}

export async function nextPrev(slug: string): Promise<{ prev: XletEntry; next: XletEntry }> {
  return nextPrevIn(await getXlets(), slug);
}
