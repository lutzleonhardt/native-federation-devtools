import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { FixtureSnapshotProvider, fixtureIdFromQuery, SNAPSHOT_PROVIDER } from 'devtools-bridge';

import { routes } from './app.routes';

// Read at module-evaluation time, before bootstrap: the hash-location
// router rewrites the URL during its initial navigation and drops the
// `?fixture=` search part, so a lazy read inside the provider factory
// (first run when a view injects the store) always comes up empty.
const initialFixtureId = fixtureIdFromQuery(location.search);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash location: the panel is served from a chrome-extension:// page
    // where path-based URLs cannot be routed.
    provideRouter(routes, withHashLocation()),
    // Fixture-backed snapshots; `?fixture=<id>` previews other UI states.
    // The live provider replaces this in the packaged extension (Task 8).
    {
      provide: SNAPSHOT_PROVIDER,
      useFactory: () => new FixtureSnapshotProvider(initialFixtureId),
    },
  ],
};
