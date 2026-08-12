/**
 * Remotes view model — the per-remote perspective (spec 4.2): what is the
 * state of this remote? The detail is the transposed projection — all
 * packages from one participant's point of view; a package's full
 * negotiation is deliberately NOT repeated here (one click away via the
 * package link). Inputs are the store's model + derived projections plus
 * caller-owned UI state; the output is render-ready only: templates
 * consume these rows, never store types (XC-06).
 *
 * This file is the FACADE: the left list and the public surface. The
 * detail half lives beside it (`remotes-detail-vm.ts`). Views import from
 * here only.
 */
import type { TreeTableRow } from '../../shared/kit/tree-table';
import type { DerivedFederation } from '../../shared/store/derived-model';
import type { FederationModel } from '../../shared/store/federation-model';
import { RemoteDetailVm, buildRemoteDetail } from './remotes-detail-vm';

export { NEGOTIATION_LEGEND } from '../../shared/view-conventions';
export type {
  CapabilityVm,
  ExposeVm,
  RemoteChunkSectionVm,
  RemoteDepVm,
  RemoteDetailVm,
  ScopedPackageVm,
} from './remotes-detail-vm';

/** Caller-owned UI state — selection lives in the view. */
export interface RemotesUiState {
  /** Verbatim remote name, seeded from the `select` query param. */
  selectedName: string | null;
}

/** One remote of the left list, model order. */
export interface RemoteRowVm {
  kind: 'remote';
  /** Verbatim remote name — selection and select payloads match it. */
  name: string;
  host: boolean;
  /** Quiet scan tail, e.g. "1 expose · 12 shared". */
  summary: string;
}

export interface RemotesVm {
  remoteCount: number;
  rows: TreeTableRow<RemoteRowVm>[];
  detail: RemoteDetailVm | null;
  /** Capture-boundary statement — what this list cannot enumerate. */
  boundaryNote: string;
  /** Honest empty note; null while the list has rows. */
  emptyNote: string | null;
}

/**
 * A remote whose entry fetch/parse failed leaves no registry trace at all —
 * "absent" and "never initialized" are indistinguishable in passive data,
 * so the claim is a capture boundary, never an error (spec 2.3).
 */
export const REMOTES_BOUNDARY_NOTE =
  'a remote whose entry never loaded leaves no registry trace — this list cannot enumerate what the capture cannot see';

export function buildRemotesVm(
  model: FederationModel,
  derived: DerivedFederation,
  ui: RemotesUiState,
): RemotesVm {
  const rows: TreeTableRow<RemoteRowVm>[] = model.remotes.map((remote) => {
    const sharedCount = derived.sharedRowFacts.filter(
      (facts) => facts.row.participant === remote.name,
    ).length;
    const exposeCount = remote.exposes.length;
    return {
      id: remote.name,
      depth: 0,
      expandable: false,
      expanded: false,
      payload: {
        kind: 'remote',
        name: remote.name,
        host: remote.isHost,
        summary: `${exposeCount} ${exposeCount === 1 ? 'expose' : 'exposes'} · ${sharedCount} shared`,
      },
    };
  });

  return {
    remoteCount: model.remotes.length,
    rows,
    detail: buildRemoteDetail(model, derived, ui.selectedName),
    boundaryNote: REMOTES_BOUNDARY_NOTE,
    emptyNote: rows.length === 0 ? 'no remotes in this capture' : null,
  };
}
