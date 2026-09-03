import { describe, expect, it } from 'vitest';
import { deriveInstall, nextPrevIn, type XletEntry } from './xlets';

const FIVE = [
  ['cinnamon-world-clock-desklet@curbsoftware', 'desklet', 'cinnamon-world-clock-desklet'],
  ['cinnamon-color-timer-clock-desklet@curbsoftware', 'desklet', 'cinnamon-color-timer-clock-desklet'],
  ['cinnamon-workspace-grid-desklet@curbsoftware', 'desklet', 'cinnamon-workspace-grid-desklet'],
  ['cinnamon-workspace-names-applet@curbsoftware', 'applet', 'cinnamon-workspace-names-applet'],
  ['cinnamon-panel-profiles-applet@curbsoftware', 'applet', 'cinnamon-panel-profiles-applet'],
] as const;

describe('deriveInstall', () => {
  for (const [uuid, kind, repo] of FIVE) {
    it(`derives the ${repo} plan`, () => {
      const plan = deriveInstall(uuid, kind);
      expect(plan.zipUrl).toBe(
        `https://github.com/CurbSoftware/${repo}/releases/latest/download/${repo}.zip`,
      );
      const family = kind === 'desklet' ? 'desklets' : 'applets';
      expect(plan.targetDir).toBe(`~/.local/share/cinnamon/${family}/${uuid}`);
      expect(plan.commands.zip[0]).toContain('curl -fLO https://github.com/CurbSoftware/');
      expect(plan.commands.zip.join('\n')).toContain(`rm -rf ${plan.targetDir}`);
      expect(plan.commands.git.join('\n')).toContain(`rm -rf ${plan.targetDir}`);
      expect(plan.commands.zip.some((c) => c.startsWith('cp -r'))).toBe(true);
      expect(plan.commands.git.some((c) => c.startsWith('cp -r'))).toBe(true);
      // both paths must survive a second run, because the second run is the
      // upgrade: a bare unzip prompts, a bare second clone aborts, and the
      // family dir is missing on a machine with no xlets installed yet
      const familyDir = plan.targetDir.slice(0, plan.targetDir.lastIndexOf('/'));
      for (const commands of [plan.commands.zip, plan.commands.git]) {
        expect(commands).toContain(`mkdir -p ${familyDir}`);
        expect(commands.indexOf(`mkdir -p ${familyDir}`)).toBeLessThan(
          commands.findIndex((c) => c.startsWith('cp -r')),
        );
      }
      expect(plan.commands.zip).toContain(`unzip -o ${repo}.zip`);
      expect(plan.commands.git[0]).toBe(
        `git clone https://github.com/CurbSoftware/${repo}.git || git -C ${repo} pull`,
      );
      // house rule: no em-dash anywhere in command strings (written as an
      // escape so the repo itself stays free of the character)
      for (const c of [...plan.commands.zip, ...plan.commands.git]) {
        expect(c).not.toContain('\u2014');
      }
    });
  }

  it('throws on an unknown uuid', () => {
    expect(() => deriveInstall('nope@curbsoftware', 'desklet')).toThrow();
  });
});

// minimal stand-ins: nextPrevIn only reads id and data.order
function stub(id: string, order: number): XletEntry {
  return { id, data: { order } } as unknown as XletEntry;
}

describe('nextPrevIn', () => {
  const entries = [
    stub('world-clock', 110),
    stub('color-timer-clock', 120),
    stub('workspace-grid', 130),
    stub('workspace-names', 140),
    stub('panel-profiles', 150),
  ];

  it('returns neighbors in order', () => {
    const { prev, next } = nextPrevIn(entries, 'workspace-grid');
    expect(prev.id).toBe('color-timer-clock');
    expect(next.id).toBe('workspace-names');
  });

  it('wraps around at both ends', () => {
    expect(nextPrevIn(entries, 'panel-profiles').next.id).toBe('world-clock');
    expect(nextPrevIn(entries, 'world-clock').prev.id).toBe('panel-profiles');
  });

  it('throws on unknown slug', () => {
    expect(() => nextPrevIn(entries, 'gone')).toThrow();
  });
});
