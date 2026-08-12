import { TestBed } from '@angular/core/testing';
import { FIXTURES, SNAPSHOT_PROVIDER, SnapshotProvider, SnapshotV1 } from 'devtools-bridge';

import { FederationStore } from './federation-store';

/** Provider whose capture promises resolve only on explicit command. */
class ManualSnapshotProvider implements SnapshotProvider {
  readonly pending: Array<{
    resolve: (snapshot: SnapshotV1) => void;
    reject: (error: unknown) => void;
  }> = [];

  captureSnapshot(): Promise<SnapshotV1> {
    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject });
    });
  }
}

/** Flush resolved capture promises through the microtask queue. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

function setup() {
  const provider = new ManualSnapshotProvider();
  TestBed.configureTestingModule({
    providers: [{ provide: SNAPSHOT_PROVIDER, useValue: provider }],
  });
  // Injecting starts the constructor capture (pending[0]).
  return { provider, store: TestBed.inject(FederationStore) };
}

describe('FederationStore', () => {
  // T8-AC-02: model/derived are null while capturing.
  it('starts capturing with null model and derived', () => {
    const { store } = setup();
    expect(store.state().status).toBe('capturing');
    expect(store.model()).toBeNull();
    expect(store.derived()).toBeNull();
  });

  // T8-AC-02: the capture-sequence guard — an older in-flight capture
  // never overwrites a newer one.
  it('never lets an older in-flight capture overwrite a newer one', async () => {
    const { provider, store } = setup();
    void store.refresh();
    expect(provider.pending).toHaveLength(2);

    provider.pending[1].resolve(structuredClone(FIXTURES['frankenstein-live']));
    await flush();
    const state = store.state();
    expect(state.status).toBe('captured');

    provider.pending[0].resolve(structuredClone(FIXTURES['clean-skip']));
    await flush();
    expect(store.state()).toBe(state);
    expect(store.model()?.provenance.pageUrl).toContain('frankenstein-meeting-room');
  });

  // T8-AC-02: the stale-capture guard also applies to errors — a stale
  // rejection never overwrites a newer capture.
  it('ignores a stale rejection after a newer capture landed', async () => {
    const { provider, store } = setup();
    void store.refresh();

    provider.pending[1].resolve(structuredClone(FIXTURES['frankenstein-live']));
    await flush();
    provider.pending[0].reject(new Error('stale failure'));
    await flush();

    expect(store.state().status).toBe('captured');
  });

  // T8-AC-02: memoized computeds — repeated reads return the same object,
  // a new capture produces a new one.
  it('memoizes model and derived per captured snapshot', async () => {
    const { provider, store } = setup();
    provider.pending[0].resolve(structuredClone(FIXTURES['frankenstein-live']));
    await flush();

    const model = store.model();
    const derived = store.derived();
    expect(model).not.toBeNull();
    expect(store.model()).toBe(model);
    expect(store.derived()).toBe(derived);
    expect(derived?.generationBadge.generation).toBe('v4');

    void store.refresh();
    expect(store.model()).toBeNull();
    provider.pending[1].resolve(structuredClone(FIXTURES['clean-skip']));
    await flush();
    expect(store.model()).not.toBe(model);
    expect(store.derived()?.generationBadge.generation).toBe('v4.5');
  });

  // T8-AC-02: on capture error model and derived are null.
  it('nulls model and derived on capture error', async () => {
    const { provider, store } = setup();
    provider.pending[0].reject(new Error('capture failed'));
    await flush();

    const state = store.state();
    expect(state.status).toBe('error');
    expect(state.status === 'error' && state.message).toBe('capture failed');
    expect(store.model()).toBeNull();
    expect(store.derived()).toBeNull();
  });
});
