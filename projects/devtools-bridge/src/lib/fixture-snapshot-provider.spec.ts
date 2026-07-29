import { describe, expect, it } from 'vitest';
import { FixtureSnapshotProvider, fixtureIdFromQuery } from './fixture-snapshot-provider';
import { FIXTURES, PRIMARY_FIXTURE_ID } from './fixtures';

describe('FixtureSnapshotProvider', () => {
  it('serves the primary fixture by default', async () => {
    const snapshot = await new FixtureSnapshotProvider().captureSnapshot();
    expect(snapshot).toEqual(FIXTURES[PRIMARY_FIXTURE_ID]);
  });

  it('serves the requested fixture', async () => {
    const snapshot = await new FixtureSnapshotProvider('synthetic-empty-page').captureSnapshot();
    expect(snapshot).toEqual(FIXTURES['synthetic-empty-page']);
  });

  it('returns a copy — consumers cannot mutate the registry', async () => {
    const provider = new FixtureSnapshotProvider();
    const first = await provider.captureSnapshot();
    first.capture.pageUrl = 'mutated';
    const second = await provider.captureSnapshot();
    expect(second.capture.pageUrl).not.toBe('mutated');
  });
});

describe('fixtureIdFromQuery', () => {
  it('resolves a known fixture id', () => {
    expect(fixtureIdFromQuery('?fixture=synthetic-empty-page')).toBe('synthetic-empty-page');
  });

  it('resolves alongside other params', () => {
    expect(fixtureIdFromQuery('?theme=dark&fixture=frankenstein-production')).toBe(
      'frankenstein-production',
    );
  });

  it('returns undefined for unknown or absent ids', () => {
    expect(fixtureIdFromQuery('?fixture=nope')).toBeUndefined();
    expect(fixtureIdFromQuery('?theme=dark')).toBeUndefined();
    expect(fixtureIdFromQuery('')).toBeUndefined();
  });
});
