import { FIXTURES, FixtureId, PRIMARY_FIXTURE_ID } from './fixtures';
import { SnapshotProvider } from './snapshot-provider';
import { SnapshotV1 } from './snapshot-v1';

/** Dev-mode provider serving checked-in fixture snapshots. */
export class FixtureSnapshotProvider implements SnapshotProvider {
  constructor(private readonly fixtureId: FixtureId = PRIMARY_FIXTURE_ID) {}

  captureSnapshot(): Promise<SnapshotV1> {
    return Promise.resolve(structuredClone(FIXTURES[this.fixtureId]));
  }
}

/**
 * Resolve a fixture id from a query string (`?fixture=<id>`), so dev mode
 * can preview UI states, e.g. `localhost:4200/?fixture=synthetic-empty-page`.
 * Returns undefined for absent or unknown ids (falls back to the primary).
 */
export function fixtureIdFromQuery(search: string): FixtureId | undefined {
  const raw = new URLSearchParams(search).get('fixture');
  return raw !== null && raw in FIXTURES ? (raw as FixtureId) : undefined;
}
