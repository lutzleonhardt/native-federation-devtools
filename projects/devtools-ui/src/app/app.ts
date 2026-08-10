import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SnapshotExportService } from './shared/snapshot-export.service';
import { SnapshotStore } from './shared/snapshot-store';

@Component({
  selector: 'nf-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly exporter = inject(SnapshotExportService);
  private readonly store = inject(SnapshotStore);

  protected readonly capturing = computed(() => this.store.state().status === 'capturing');

  /**
   * Capture identity of the current snapshot. Read from the store directly,
   * not through a view-state helper: the shell is channel-agnostic — which
   * page was captured when is evidence even when nothing was detected.
   */
  protected readonly capture = computed(() => {
    const state = this.store.state();
    return state.status === 'captured' ? state.snapshot.capture : null;
  });

  protected refresh(): void {
    void this.store.refresh();
  }
}
