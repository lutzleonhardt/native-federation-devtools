import { Injectable, inject } from '@angular/core';

import { exportFilename, serializeSnapshot } from './snapshot-export';
import { FederationStore } from './store/federation-store';

/**
 * Downloads the current snapshot as a JSON file via Blob + anchor — works in
 * extension pages without extra permissions and identically in dev (fixture)
 * mode. Export always serializes the raw `SnapshotV1`, never the derived
 * model, so the exporter reads `FederationStore.state()` directly.
 */
@Injectable({ providedIn: 'root' })
export class SnapshotExportService {
  private readonly store = inject(FederationStore);

  /** True while a captured snapshot is available to export (signal-backed). */
  canExport(): boolean {
    return this.store.state().status === 'captured';
  }

  /** Serialize the current snapshot and trigger the browser download. */
  exportCurrent(): void {
    const state = this.store.state();
    if (state.status !== 'captured') {
      return;
    }
    const blob = new Blob([serializeSnapshot(state.snapshot)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportFilename(state.snapshot);
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
