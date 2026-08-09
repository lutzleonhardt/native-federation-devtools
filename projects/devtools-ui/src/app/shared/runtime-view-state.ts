import { CaptureMetaV1, RuntimeRepositoriesV1 } from 'devtools-bridge';

import { SnapshotState } from './snapshot-store';

/**
 * Channel-level state for views that render from the runtime projection
 * (`nativeFederationGlobals`). Encodes the honest-state branching order once:
 * not-recognized → not-detected, unavailable → missing, a null runtime
 * despite an available channel → defensive missing. Data-level distinctions
 * (zero entries vs. populated) stay in each view — they depend on what the
 * view renders and remain real observations, not missing evidence.
 *
 * `capture` identifies the snapshot behind the state — present on every
 * branch backed by a captured snapshot, including not-detected and missing:
 * which page was captured when is evidence even when nothing was found.
 * Views render entirely from this state; the store stays behind it.
 */
export type RuntimeViewState =
  | { kind: 'capturing'; capture: null }
  | { kind: 'error'; reason: string; capture: null }
  | { kind: 'not-detected'; reason: string; capture: CaptureMetaV1 }
  | { kind: 'missing'; reason: string; capture: CaptureMetaV1 }
  | {
      kind: 'ready';
      capture: CaptureMetaV1;
      runtime: RuntimeRepositoriesV1;
    };

export function runtimeViewState(state: SnapshotState): RuntimeViewState {
  if (state.status === 'capturing') {
    return { kind: 'capturing', capture: null };
  }
  if (state.status === 'error') {
    return { kind: 'error', reason: `Snapshot capture failed: ${state.message}`, capture: null };
  }
  const { snapshot } = state;
  const channel = snapshot.channels.nativeFederationGlobals;
  if (channel.state === 'not-recognized') {
    return { kind: 'not-detected', reason: channel.reason, capture: snapshot.capture };
  }
  if (channel.state === 'unavailable') {
    return { kind: 'missing', reason: channel.reason, capture: snapshot.capture };
  }
  if (!snapshot.runtime) {
    return {
      kind: 'missing',
      reason:
        'Channel reports available but no runtime projection was captured — inconsistent snapshot.',
      capture: snapshot.capture,
    };
  }
  return { kind: 'ready', capture: snapshot.capture, runtime: snapshot.runtime };
}
