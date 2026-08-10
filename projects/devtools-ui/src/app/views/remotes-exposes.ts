import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NF_HOST } from 'devtools-bridge';

import { MissingEvidence } from '../shared/honest-state/missing-evidence';
import { NotDetected } from '../shared/honest-state/not-detected';
import { runtimeViewState } from '../shared/runtime-view-state';
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

@Component({
  selector: 'nf-remotes-exposes',
  imports: [MissingEvidence, NotDetected],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remotes-exposes.html',
})
export class RemotesExposes {
  private readonly store = inject(SnapshotStore);

  protected readonly vm = computed(() => runtimeViewState(this.store.state()));

  /**
   * Flattened per-(remote, expose) rows. Colliding expose keys stay separate
   * entries attributed to each remote — never merged by key alone.
   */
  protected readonly rows = computed<ExposeRow[]>(() => {
    const vm = this.vm();
    if (vm.kind !== 'ready') {
      return [];
    }
    return Object.entries(vm.runtime.remotes).flatMap(([name, remote]): ExposeRow[] => {
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
}
