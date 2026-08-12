import { Injectable, computed, inject, signal } from '@angular/core';
import { SNAPSHOT_PROVIDER, SnapshotV1 } from 'devtools-bridge';

import { DerivedFederation } from './derived-model';
import { deriveFederation } from './derivations';
import { FederationModel } from './federation-model';
import { ingestSnapshot } from './ingest';

export type SnapshotState =
  | { status: 'capturing' }
  | { status: 'captured'; snapshot: SnapshotV1 }
  | { status: 'error'; message: string };

/**
 * The single V2 store — wiring for the four-layer data path. Each layer
 * answers a different question, and the boundaries are deliberate:
 *
 *   state   — what was captured: the capture lifecycle plus the raw
 *             `SnapshotV1` exactly as collected. Evidence, never
 *             interpreted; export serializes this and nothing else.
 *   model   — what is there: `FederationModel` via `ingestSnapshot` —
 *             normalized entities and joins (rows, remotes, chunk
 *             groups, merged tag map), no judgement beyond
 *             normalization.
 *   derived — what it means: `DerivedFederation` via
 *             `deriveFederation` — interpreted knowledge (providers,
 *             resolution arrows, chunk attribution, badges), every
 *             field tagged with the rule that produced it.
 *   vm      — how it is shown: per-view pure builders (e.g.
 *             `buildCaptureStatus`) translate model/derived into
 *             render-ready structures; templates consume only vm
 *             types, never store types.
 *
 * Ingest and derivations are pure modules; this service is wiring
 * only. `model`/`derived` are memoized per captured snapshot.
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

  /** Derived federation knowledge; null while capturing and on capture error. */
  readonly derived = computed<DerivedFederation | null>(() => {
    const model = this.model();
    return model === null ? null : deriveFederation(model);
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
