import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { SNAPSHOT_PROVIDER } from 'devtools-bridge';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash location: the panel is served from a chrome-extension:// page
    // where path-based URLs cannot be routed.
    provideRouter(routes, withHashLocation()),
    // Environment-based DI: fixtures in dev (`ng serve`), the live
    // DevTools provider in the production/extension build.
    { provide: SNAPSHOT_PROVIDER, useFactory: environment.snapshotProviderFactory },
  ],
};
