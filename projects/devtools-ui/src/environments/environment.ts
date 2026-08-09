import { FixtureSnapshotProvider, fixtureIdFromQuery, SnapshotProvider } from 'devtools-bridge';

// Read at module-evaluation time, before bootstrap: the hash-location
// router rewrites the URL during its initial navigation and drops the
// `?fixture=` search part, so a lazy read inside the provider factory
// (first run when a view injects the store) always comes up empty.
const initialFixtureId = fixtureIdFromQuery(location.search);

/**
 * Dev environment (`ng serve`, tests): fixture-backed snapshots;
 * `?fixture=<id>` previews other UI states. The production build replaces
 * this file with `environment.extension.ts` (see angular.json), which
 * also drops the fixtures from the packaged extension bundle.
 */
export const environment = {
  snapshotProviderFactory: (): SnapshotProvider => new FixtureSnapshotProvider(initialFixtureId),
};
