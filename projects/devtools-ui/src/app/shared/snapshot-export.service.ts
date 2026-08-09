import { Injectable, inject } from '@angular/core';

import { SnapshotStore } from './snapshot-store';
import { exportFilename, serializeSnapshot } from './snapshot-export';

/**
 * Downloads the current snapshot as a JSON file via Blob + anchor — works in
 * extension pages without extra permissions and identically in dev (fixture)
 * mode. Views never see the full snapshot through their view models, so the
 * exporter reads `SnapshotStore.state()` directly.
 */
@Injectable({ providedIn: 'root' })
export class SnapshotExportService {
  private readonly store = inject(SnapshotStore);

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
