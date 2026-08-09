import {
  CaptureMetaV1,
  ChannelStateV1,
  DocumentImportMapV1,
  EffectiveImportMapV1,
} from 'devtools-bridge';

import { SnapshotState } from './snapshot-store';

/**
 * Channel-level state for the Import Map view, which renders from the two
 * import-map channels (`domImportMaps`, `importShim`) — sibling of
 * `runtimeViewState`, not a generalization of it. Branching order:
 * `importMaps: null` means neither channel yielded data — not-detected when
 * both channels report not-recognized, otherwise missing with both channel
 * reasons (defensive missing when a channel claims available). A snapshot
 * with document maps but no effective map is `document-only`: the DOM scan
 * is evidence, the effective layer is missing with the shim's reason.
 * Data-level distinctions (zero entries vs. populated) stay in the view.
 *
 * `capture` identifies the snapshot behind the state — present on every
 * branch backed by a captured snapshot (see `runtimeViewState`).
 */
export type ImportMapViewState =
  | { kind: 'capturing'; capture: null }
  | { kind: 'error'; reason: string; capture: null }
  | { kind: 'not-detected'; reason: string; capture: CaptureMetaV1 }
  | { kind: 'missing'; reason: string; capture: CaptureMetaV1 }
  | {
      kind: 'document-only';
      documentMaps: DocumentImportMapV1[];
      /** Why the effective layer is missing (shim channel reason). */
      reason: string;
      capture: CaptureMetaV1;
    }
  | {
      kind: 'ready';
      capture: CaptureMetaV1;
      effective: EffectiveImportMapV1;
    };

function channelReason(label: string, channel: ChannelStateV1): string {
  return channel.state === 'available'
    ? `${label}: channel reports available but no import-map projection was captured — inconsistent snapshot`
    : `${label}: ${channel.reason}`;
}

export function importMapViewState(state: SnapshotState): ImportMapViewState {
  if (state.status === 'capturing') {
    return { kind: 'capturing', capture: null };
  }
  if (state.status === 'error') {
    return { kind: 'error', reason: `Snapshot capture failed: ${state.message}`, capture: null };
  }
  const { snapshot } = state;
  const { domImportMaps, importShim } = snapshot.channels;
  if (!snapshot.importMaps) {
    if (domImportMaps.state === 'not-recognized' && importShim.state === 'not-recognized') {
      return {
        kind: 'not-detected',
        reason: `Document maps: ${domImportMaps.reason} · Import shim: ${importShim.reason}`,
        capture: snapshot.capture,
      };
    }
    return {
      kind: 'missing',
      reason: `${channelReason('Document maps', domImportMaps)} · ${channelReason('Import shim', importShim)}`,
      capture: snapshot.capture,
    };
  }
  const { documentMaps, effective } = snapshot.importMaps;
  if (!effective) {
    return {
      kind: 'document-only',
      documentMaps,
      reason:
        importShim.state === 'available'
          ? 'Import shim channel reports available but no effective map was captured — inconsistent snapshot.'
          : importShim.reason,
      capture: snapshot.capture,
    };
  }
  return { kind: 'ready', capture: snapshot.capture, effective };
}
