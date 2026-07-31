
import { Injectable, inject, signal } from '@angular/core';
import { SNAPSHOT_PROVIDER, SnapshotV1 } from 'devtools-bridge';

export type SnapshotState =
  | { status: 'capturing' }
  | { status: 'captured'; snapshot: SnapshotV1 }
  | { status: 'error'; message: string };

/**
 * Shared snapshot state over the injected `SnapshotProvider`. Views render
 * from `state` and trigger manual refreshes; they never talk to a concrete
 * provider, so the live provider (Task 8) swaps in via DI unnoticed.
 */
@Injectable({ providedIn: 'root' })
export class SnapshotStore {
  private readonly provider = inject(SNAPSHOT_PROVIDER);
  private readonly current = signal<SnapshotState>({ status: 'capturing' });
  /** Guards against an older in-flight capture overwriting a newer one. */
  private captureSeq = 0;

  readonly state = this.current.asReadonly();

  constructor() {
    void this.refresh();
  }

  /** Re-invoke `captureSnapshot()` through the provider. */
  async refresh(): Promise<void> {
    const seq = ++this.captureSeq;
    this.current.set({ status: 'capturing' });
    try {
      const snapshot = await this.provider.captureSnapshot();
      if (seq === this.captureSeq) {
        this.current.set({ status: 'captured', snapshot });
      }
    } catch (error) {
      if (seq === this.captureSeq) {
        const message = error instanceof Error ? error.message : String(error);
        this.current.set({ status: 'error', message });
      }
    }
  }
}
