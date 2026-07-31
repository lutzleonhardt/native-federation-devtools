import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { MissingEvidence } from '../shared/honest-state/missing-evidence';
import { NotDetected } from '../shared/honest-state/not-detected';
import { SnapshotStore } from '../shared/snapshot-store';

/** One rendered entry — identity is the (remote name, expose key) pair. */
interface ExposeRow {
  remoteName: string;
  isHost: boolean;
  scopeUrl: string;
  /** null: the remote registers no exposes (rendered as an observation). */
  exposeKey: string | null;
  file: string | null;
}

const NF_HOST = '__NF-HOST__';

@Component({
  selector: 'nf-remotes-exposes',
  imports: [MissingEvidence, NotDetected],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remotes-exposes.html',
})
export class RemotesExposes {
  private readonly store = inject(SnapshotStore);

  protected readonly state = this.store.state;

  /**
   * Flattened per-(remote, expose) rows. Colliding expose keys stay separate
   * entries attributed to each remote — never merged by key alone.
   */
  protected readonly rows = computed<ExposeRow[]>(() => {
    const s = this.state();
    if (s.status !== 'captured' || !s.snapshot.runtime) {
      return [];
    }
    return Object.entries(s.snapshot.runtime.remotes).flatMap(([name, remote]): ExposeRow[] => {
      const base = { remoteName: name, isHost: name === NF_HOST, scopeUrl: remote.scopeUrl };
      return remote.exposes.length > 0
        ? remote.exposes.map((expose) => ({
            ...base,
            exposeKey: expose.moduleName,
            file: expose.file,
          }))
        : [{ ...base, exposeKey: null, file: null }];
    });
  });

  protected refresh(): void {
    void this.store.refresh();
  }
}
