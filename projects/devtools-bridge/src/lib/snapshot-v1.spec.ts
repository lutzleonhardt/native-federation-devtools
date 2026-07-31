import { describe, expect, it } from 'vitest';
import { FIXTURES, PRIMARY_FIXTURE_ID } from './fixtures';
import { SnapshotV1 } from './snapshot-v1';

const fixtureEntries = Object.entries(FIXTURES) as [string, SnapshotV1][];
const primary: SnapshotV1 = FIXTURES[PRIMARY_FIXTURE_ID];

describe('SnapshotV1 (T2-AC-01)', () => {
  it.each(fixtureEntries)('%s survives a serialize → parse round-trip', (_id, fixture) => {
    const roundTripped = JSON.parse(JSON.stringify(fixture));
    expect(roundTripped).toEqual(fixture);
  });

  it.each(fixtureEntries)('%s is versioned with schemaVersion 1', (_id, fixture) => {
    expect(fixture.schemaVersion).toBe(1);
    expect(fixture.capture.mode).toBe('passive');
  });

  it('keeps runtime outcome and import-map resolution structurally separate', () => {
    expect(Object.keys(primary.runtime!)).toEqual([
      'remotes',
      'scopedExternals',
      'sharedExternals',
      'sharedChunks',
    ]);
    expect(Object.keys(primary.importMaps!)).toEqual(['documentMaps', 'effective']);
    // The runtime layer must not absorb import-map concepts and vice versa.
    expect(primary.runtime).not.toHaveProperty('imports');
    expect(primary.runtime).not.toHaveProperty('effective');
    expect(primary.importMaps).not.toHaveProperty('remotes');
    expect(primary.importMaps).not.toHaveProperty('sharedExternals');
  });
});

describe('primary fixture derives from the frankenstein production capture (T2-AC-02)', () => {
  it('contains the host plus the mermaid and whiteboard remotes', () => {
    expect(Object.keys(primary.runtime!.remotes).sort()).toEqual([
      '__NF-HOST__',
      'mermaid',
      'whiteboard',
    ]);
    const whiteboard = primary.runtime!.remotes['whiteboard'];
    expect(whiteboard.exposes).toHaveLength(1);
    expect(whiteboard.exposes[0].moduleName.endsWith('/Bootstrap')).toBe(true);
  });

  it('contains the react 18.3.1 share example with whiteboard as sole provider', () => {
    const react = primary.runtime!.sharedExternals['__GLOBAL__']['react'];
    expect(react.versions).toHaveLength(1);
    const version = react.versions[0];
    expect(version.tag).toBe('18.3.1');
    expect(version.action).toBe('share');
    expect(version.host).toBe(false);
    expect(version.remotes).toHaveLength(1);
    expect(version.remotes[0]).toEqual({
      name: 'whiteboard',
      requiredVersion: '^18.3.1',
      strictVersion: true,
      file: 'react.QYXZqQxJ1j.js',
      cached: true,
    });
  });

  it('contains the 22-import shim map with one scope and 29 integrity entries', () => {
    const effective = primary.importMaps!.effective!;
    expect(effective.imports).toHaveLength(22);
    expect(effective.scopes).toHaveLength(1);
    expect(effective.integrityFor).toHaveLength(29);
    // Presence only — no SRI hash may leak into the fixture.
    for (const target of effective.integrityFor) {
      expect(target).not.toMatch(/^sha(256|384|512)-/);
    }
  });

  it('carries a sanitized page URL', () => {
    expect(primary.capture.pageUrl).not.toMatch(/[?#@]/);
  });
});

describe('synthetic fixtures (T2-AC-02)', () => {
  const synthetic = fixtureEntries.filter(([id]) => id !== PRIMARY_FIXTURE_ID);

  it('exist for collision, missing-channel, not-recognized, and empty-page states', () => {
    expect(synthetic.map(([id]) => id).sort()).toEqual([
      'synthetic-collision',
      'synthetic-empty-page',
      'synthetic-missing-channel',
      'synthetic-not-recognized',
    ]);
  });

  it.each(synthetic)('%s is labeled synthetic', (id, fixture) => {
    expect(id).toMatch(/^synthetic-/);
    expect(fixture.capture.pageUrl).toContain('synthetic');
    expect(fixture.capture.collectorVersion).toContain('synthetic');
  });

  it('missing-channel: runtime is null with an explicit reason, import maps partial', () => {
    const fixture = FIXTURES['synthetic-missing-channel'];
    expect(fixture.channels.nativeFederationGlobals.state).toBe('unavailable');
    expect(fixture.runtime).toBeNull();
    expect(fixture.importMaps!.documentMaps).toHaveLength(1);
    expect(fixture.importMaps!.effective).toBeNull();
  });

  it('not-recognized: channel carries a reason and no runtime is invented', () => {
    const fixture: SnapshotV1 = FIXTURES['synthetic-not-recognized'];
    const channel = fixture.channels.nativeFederationGlobals;
    expect(channel.state).toBe('not-recognized');
    expect(channel.state !== 'available' && channel.reason.length > 0).toBe(true);
    expect(fixture.runtime).toBeNull();
  });

  it('collision: two distinct remotes expose the same module key', () => {
    const fixture = FIXTURES['synthetic-collision'];
    const remotes = fixture.runtime!.remotes;
    const collidingKey = remotes['calendar'].exposes[0].moduleName;
    expect(remotes['chat'].exposes[0].moduleName).toBe(collidingKey);
    expect(remotes['calendar'].exposes[0].file).not.toBe(remotes['chat'].exposes[0].file);
  });

  it('empty-page: zero maps is an observation, not missing evidence', () => {
    const fixture = FIXTURES['synthetic-empty-page'];
    expect(fixture.channels.domImportMaps.state).toBe('available');
    expect(fixture.importMaps!.documentMaps).toHaveLength(0);
    expect(fixture.runtime).toBeNull();
  });
});
