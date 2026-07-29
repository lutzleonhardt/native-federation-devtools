import { InjectionToken } from '@angular/core';
import { SnapshotV1 } from './snapshot-v1';

/** Source of federation snapshots — fixture-backed in dev, live in the extension (Task 8). */
export interface SnapshotProvider {
  captureSnapshot(): Promise<SnapshotV1>;
}

export const SNAPSHOT_PROVIDER = new InjectionToken<SnapshotProvider>('nf.snapshot-provider');
