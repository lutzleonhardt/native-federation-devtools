import { Injectable, computed, inject, signal } from '@angular/core';
import { SNAPSHOT_PROVIDER, SnapshotV1 } from 'devtools-bridge';

import { FederationModel } from './federation-model';
import { ingestSnapshot } from './ingest';

export type SnapshotState =
  | { status: 'capturing' }
  | { status: 'captured'; snapshot: SnapshotV1 }
  | { status: 'error'; message: string };

/**
 * The single store — wiring for the three-layer data path. Each layer
 * answers a different question, and the boundaries are deliberate:
 *
 *   state   — what was captured: the capture lifecycle plus the raw
 *             `SnapshotV1` exactly as collected. Evidence, never
 *             interpreted; export serializes this and nothing else.
 *   model   — what is there and what it means: `FederationModel` via
 *             `ingestSnapshot` — normalized entities (remotes, merged
 *             tag map) plus the canonical resolution pipeline: registry
 *             evidence, consumer resolutions, and the raw-free
 *             `resolutionProjection`, every canonical record carrying
 *             the provenance that produced it.
 *   vm      — how it is shown: per-view pure builders (e.g.
 *             `buildCaptureStatus`) translate the model into
 *             render-ready structures; templates consume only vm
 *             types, never store types.
 *
 * Ingest is a pure module; this service is wiring only. `model` is
 * memoized per captured snapshot.
 */
@Injectable({ providedIn: 'root' })
export class FederationStore {
  private readonly provider = inject(SNAPSHOT_PROVIDER);
  private readonly current = signal<SnapshotState>({ status: 'capturing' });
  /** Guards against an older in-flight capture overwriting a newer one. */
  private captureSeq = 0;

  readonly state = this.current.asReadonly();

  /** Normalized entity model; null while capturing and on capture error. */
  readonly model = computed<FederationModel | null>(() => {
    const state = this.current();
    return state.status === 'captured' ? ingestSnapshot(state.snapshot) : null;
  });

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
