import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { ChromeSnapshotProvider, SnapshotProvider } from 'devtools-bridge';

/** Extension environment (production build): live snapshots from the inspected page. */
export const environment = {
  snapshotProviderFactory: (): SnapshotProvider => new ChromeSnapshotProvider(),
  /** No dev routes in the packaged extension. */
  extraRoutes: [] satisfies Routes,
  /** No dev shell components in the packaged extension. */
  shellExtras: [] satisfies Type<unknown>[],
};
