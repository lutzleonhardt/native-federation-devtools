import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { FixtureSnapshotProvider, fixtureIdFromQuery, SNAPSHOT_PROVIDER } from 'devtools-bridge';

import { routes } from './app.routes';

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
      useFactory: () => new FixtureSnapshotProvider(fixtureIdFromQuery(location.search)),
    },
  ],
};
